// src/merge.ts
import * as fs from "node:fs";
import pc from "picocolors";
import { MergeDiff, MergeStatus } from "./types.js";
import { readObject, commitToc, writeCommit, writeTree } from "./objects.js";
import { mergeEntryObj } from "./helpers/index.js";
import { hash as resolveRef, terminalRef, writeRef } from "./refs.js";
import { readIndex, writeIndex } from "./index.js";
import { applyMergeDiff } from "./working-copy.js";
import { nestFlatTree, workingCopyPath, write } from "./files.js";

export const ancestors = (commitHash: string): Set<string> => {
  const result = new Set<string>();
  let current: string | undefined = commitHash;

  while (current) {
    result.add(current);
    const content = readObject(current); //reading the hash
    const parentLine = content.split("\n").find((l) => l.startsWith("parent "));
    //the logic is to split at every new line -- find the l, and the one that starts with parent
    current = parentLine ? parentLine.split(" ")[1] : undefined;
    //if the parent line exists --> the first index would be the commit hash so in a way we have a sequence
  }

  return result;
};

export const commonAncestor = (
  commitA: string,
  commitB: string,
): string | undefined => {
  //now we need the ancestor function and then compare what is the common point of contactn -- the set contains elements in an order
  //now do we run a for loop? or how to do it efficiently? maybe a n^2 for loop would be the way to go. or a linear one better
  const parentA = ancestors(commitA);
  const parentB = ancestors(commitB);

  //man JS has such cool functions 😭
  //i will just use the find itself -- remember to use find when finding something lol
  for (let it of parentA) {
    if (parentB.has(it)) {
      return it;
    }
  }
  return undefined;
};

//the idea is that if commitB is an ancestor of A then all we need is to fast-forward A
export const canFastForward = (commitA: string, commitB: string): boolean => {
  return ancestors(commitB).has(commitA);
};

export const mergeDiff = (
  tocA: Record<string, string>,
  tocB: Record<string, string>,
  baseToc: Record<string, string>,
): MergeDiff => {
  // Collect all unique file paths across all three TOCs
  const uniqueKey = new Set<string>();
  for (const key in tocA) uniqueKey.add(key);
  for (const key in tocB) uniqueKey.add(key);
  for (const key in baseToc) uniqueKey.add(key);

  const mergeEntry: MergeDiff = {};

  for (const it of uniqueKey) {
    const aHash = tocA[it];
    const bHash = tocB[it];
    const baseHash = baseToc[it];

    if (aHash === bHash) {
      // Same in both branches — no conflict
      mergeEntry[it] = mergeEntryObj("SAME", aHash, bHash, baseHash);
    } else if (baseHash === undefined) {
      // File didn't exist in base — both branches added it
      if (aHash === undefined) {
        // Only B has it
        mergeEntry[it] = mergeEntryObj("B", aHash, bHash, baseHash);
      } else if (bHash === undefined) {
        // Only A has it
        mergeEntry[it] = mergeEntryObj("A", aHash, bHash, baseHash);
      } else {
        // Both added it but with different content → CONFLICT
        mergeEntry[it] = mergeEntryObj("CONFLICT", aHash, bHash, baseHash);
      }
    } else if (aHash === undefined) {
      // File existed in base but was deleted in A
      if (bHash === baseHash) {
        // B didn't change it — take A's deletion
        mergeEntry[it] = mergeEntryObj("A", aHash, bHash, baseHash);
      } else {
        // B modified it while A deleted it → CONFLICT
        mergeEntry[it] = mergeEntryObj("CONFLICT", aHash, bHash, baseHash);
      }
    } else if (bHash === undefined) {
      // File existed in base but was deleted in B
      if (aHash === baseHash) {
        // A didn't change it — take B's deletion
        mergeEntry[it] = mergeEntryObj("B", aHash, bHash, baseHash);
      } else {
        // A modified it while B deleted it → CONFLICT
        mergeEntry[it] = mergeEntryObj("CONFLICT", aHash, bHash, baseHash);
      }
    } else if (aHash === baseHash) {
      // A didn't change it, B did — take B's version
      mergeEntry[it] = mergeEntryObj("B", aHash, bHash, baseHash);
    } else if (bHash === baseHash) {
      // B didn't change it, A did — take A's version
      mergeEntry[it] = mergeEntryObj("A", aHash, bHash, baseHash);
    } else {
      // Both changed it differently from base → CONFLICT
      mergeEntry[it] = mergeEntryObj("CONFLICT", aHash, bHash, baseHash);
    }
  }

  return mergeEntry;
};

export const writeFastForwardMerge = (branch: string): void => {
  const commitHash = resolveRef("refs/heads/" + branch);
  if (!commitHash) {
    throw Error("branch '" + branch + "' not found");
  }

  const currentIndex = readIndex();
  const targetFiles = commitToc(commitHash);

  // Write all target files to disk
  for (const [filePath, blobHash] of Object.entries(targetFiles)) {
    const content = readObject(blobHash);
    write(workingCopyPath(filePath), content);
  }

  // Delete files that exist in current but not in target
  for (const filePath of Object.keys(currentIndex)) {
    if (!(filePath in targetFiles)) {
      const fullPath = workingCopyPath(filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
  }

  // Update index to match target
  writeIndex(targetFiles);

  // Update ref
  const ref = terminalRef("HEAD");
  writeRef(ref, commitHash);
};

export const writeNonFastForwardMerge = (
  branch: string,
  message: string,
): void => {
  const branchHash = resolveRef("refs/heads/" + branch);
  if (!branchHash) throw Error("branch '" + branch + "' not found");

  const headHash = resolveRef("HEAD");
  if (!headHash) throw Error("nothing to merge — HEAD has no commits");

  const baseHash = commonAncestor(headHash, branchHash);
  if (!baseHash) throw Error("no common ancestor found");

  const tocA = commitToc(headHash);
  const tocB = commitToc(branchHash);
  const baseToc = commitToc(baseHash);

  const diff = mergeDiff(tocA, tocB, baseToc);

  const conflicts = Object.entries(diff).filter(
    ([, entry]) => entry.mergeStatus === "CONFLICT",
  );
  if (conflicts.length > 0) {
    throw Error("Merge conflict in: " + conflicts.map(([f]) => f).join(", "));
  }

  const index = readIndex();
  applyMergeDiff(diff, index);
  writeIndex(index);

  const treeHash = writeTree(nestFlatTree(index));
  const mergeCommitHash = writeCommit(treeHash, message, headHash, branchHash);

  const ref = terminalRef("HEAD");
  writeRef(ref, mergeCommitHash);

  console.log(pc.green("✓") + " Merged branch '" + pc.bold(branch) + "'");
};
