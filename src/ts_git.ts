import * as fs from "fs";
import pc from "picocolors";
import {
  isInRepo,
  nestFlatTree,
  read,
  tsGitPath,
  workingCopyPath,
  write,
} from "./files";
import { writeConfig } from "./config";
import {
  commitToc,
  readObject,
  writeCommit,
  writeObject,
  writeTree,
} from "./objects";
import { readIndex, toc, workingCopytoc, writeIndex } from "./index";
import * as path from "node:path";
import {
  hash as resolveRef,
  terminalRef,
  writeRef,
  headBranchName,
  isHeadDetached,
} from "./refs.js";
import {
  canFastForward,
  commonAncestor,
  mergeDiff,
  writeFastForwardMerge,
  writeNonFastForwardMerge,
} from "./merge.js";
import { statusToString } from "./status.js";

//making the relevant directories
//objects -- refs/heads and the HEAD
export const init = (): void => {
  const currentDir: string = process.cwd();

  if (isInRepo()) {
    throw Error("You are already in a repo");
  }

  fs.mkdirSync(".tsgit/objects", { recursive: true });
  fs.mkdirSync(".tsgit/refs/heads", { recursive: true });
  write(".tsgit/HEAD", "ref: refs/heads/main");
  writeConfig({ core: { bare: "false" } });
  console.log(
    pc.green("✓") +
      " Initialized empty ts_git repository in " +
      pc.bold(path.join(currentDir, ".tsgit")),
  );
};

export const add = (filePath: string) => {
  if (!isInRepo()) {
    throw Error("not a ts_git repository");
  }

  if (!filePath) {
    throw Error("add expects a file path");
  }

  const index = readIndex(); //index is filepath -> filehash mapping
  if (filePath === ".") {
    const blobsWorking: Record<string, string> = workingCopytoc();
    //creating objecs for everything
    Object.entries(blobsWorking).forEach(([filePath, blobHash]) => {
      const objFilePath = tsGitPath(
        "objects",
        blobHash.slice(0, 2),
        blobHash.slice(2),
      );
      write(objFilePath, read(filePath));
    });

    // Remove index entries for files that no longer exist on disk
    for (const indexPath of Object.keys(index)) {
      if (!(indexPath in blobsWorking)) {
        delete index[indexPath];
      }
    }

    for (const [workPath, workBlob] of Object.entries(blobsWorking)) {
      index[workPath] = workBlob;
    }
    writeIndex(index);
    console.log(pc.green("✓") + " All files staged");
    return;
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    throw Error(`pathspec '${filePath}' did not match any files`);
  }

  const relativePath = path
    .relative(workingCopyPath(), absolutePath)
    .split("\\")
    .join("/");
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw Error(`path '${filePath}' is outside the repository`);
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const blobHash = writeObject(content); //hash created the 2 file structure made

  index[relativePath] = blobHash; //updating
  writeIndex(index); //putting it in the index file for changes
  console.log(pc.green("added: ") + relativePath);
};

export const commit = (message: string) => {
  if (!isInRepo()) {
    throw Error("not a ts_git repository");
  }

  if (!message?.trim()) {
    throw Error("commit message is required");
  }

  const index = readIndex();
  if (Object.keys(index).length === 0) {
    throw Error("nothing to commit, working tree clean");
  }

  const treeHash = writeTree(nestFlatTree(index));
  const parentHash = resolveRef("HEAD");
  const commitHash = parentHash
    ? writeCommit(treeHash, message, parentHash)
    : writeCommit(treeHash, message);
  const ref = terminalRef("HEAD"); //finding the terminal ref -- end ref
  writeRef(ref, commitHash); //adding commit hash at the top -- there is only commit that is remaining so where does the other commit object go?
  console.log(
    pc.green("✓") +
      " Committed " +
      pc.yellow(commitHash.slice(0, 7)) +
      ": " +
      message,
  );
};

export const log = () => {
  let commitHash = resolveRef("HEAD");

  if (!commitHash) {
    console.log(pc.yellow("No commits yet."));
    return;
  }

  while (commitHash) {
    const content = readObject(commitHash);
    const lines = content.split("\n");

    // message is everything after the blank line
    const blankIndex = lines.indexOf("");
    const message = lines.slice(blankIndex + 1).join("\n");

    // find parent line
    const parentLine = lines.find((l) => l.startsWith("parent "));
    const parentHash = parentLine ? parentLine.split(" ")[1] : undefined;

    console.log(pc.yellow(commitHash.slice(0, 7)) + " " + message);

    commitHash = parentHash; // walk to parent
  }
};

export const status = () => {
  if (!isInRepo()) {
    throw Error("not a ts_git repository");
  }

  console.log(statusToString());
};

export const branch = (name: string) => {
  if (!isInRepo()) {
    throw Error("not a ts_git repository");
  }

  if (!name?.trim()) {
    throw Error("branch name is required");
  }

  const commitHash = resolveRef("HEAD");
  if (!commitHash) {
    throw Error("cannot create branch before first commit");
  }

  writeRef("refs/heads/" + name, commitHash);
  console.log(pc.green("✓") + " Created branch '" + pc.bold(name) + "'");
};

export const checkout = (branchName: string) => {
  if (!isInRepo()) {
    throw Error("not a ts_git repository");
  }

  if (!branchName?.trim()) {
    throw Error("branch name is required");
  }

  const targetHash = resolveRef("refs/heads/" + branchName);
  if (!targetHash) {
    throw Error("branch '" + branchName + "' not found");
  }

  const targetFiles = commitToc(targetHash);
  const currentFiles = toc();

  // Step 1: Write target branch's files to disk
  for (const [filePath, blobHash] of Object.entries(targetFiles)) {
    write(workingCopyPath(filePath), readObject(blobHash));
  }

  // Step 2: Delete files that exist now but not in target
  for (const filePath of Object.keys(currentFiles)) {
    if (!(filePath in targetFiles)) {
      const fullPath = workingCopyPath(filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
  }

  // Step 3: Update index to match target
  writeIndex(targetFiles);

  // Step 4: Point HEAD to new branch
  write(tsGitPath("HEAD"), "ref: refs/heads/" + branchName);
  console.log(
    pc.green("✓") + " Switched to branch '" + pc.bold(branchName) + "'",
  );
};

export const merge = (branch: string, message: string): void => {
  if (!isInRepo()) throw Error("not a ts_git repository");
  if (!branch?.trim()) throw Error("branch name is required");
  if (!message?.trim()) throw Error("merge message is required");

  const branchHash = resolveRef("refs/heads/" + branch);
  if (!branchHash) throw Error("branch '" + branch + "' not found");

  const headHash = resolveRef("HEAD");
  if (!headHash) throw Error("nothing to merge — HEAD has no commits");

  if (canFastForward(headHash, branchHash)) {
    writeFastForwardMerge(branch);
    console.log(
      pc.green("✓") + " Fast-forward merged '" + pc.bold(branch) + "'",
    );
  } else {
    writeNonFastForwardMerge(branch, message);
  }
};

export const cMerge = (branch: string): void => {
  if (!isInRepo()) throw Error("not a ts_git repository");
  if (!branch?.trim()) throw Error("branch name is required");

  const branchHash = resolveRef("refs/heads/" + branch);
  if (!branchHash) throw Error("branch '" + branch + "' not found");

  const headHash = resolveRef("HEAD");
  if (!headHash) throw Error("nothing to merge — HEAD has no commits");

  if (canFastForward(headHash, branchHash)) {
    console.log(
      pc.green("✓") +
        " Would fast-forward merge '" +
        pc.bold(branch) +
        "' — clean",
    );
    return;
  }

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
    console.log(pc.red("✗") + " Merge would have conflicts in:");
    for (const [file] of conflicts) {
      console.log("  " + pc.red(file));
    }
  } else {
    console.log(pc.green("✓") + " Merge would be clean — no conflicts");
  }
};

export const currentBranch = (): void => {
  if (!isInRepo()) throw Error("not a ts_git repository");

  if (isHeadDetached()) {
    const commitHash = resolveRef("HEAD");
    console.log("HEAD detached at " + pc.yellow(commitHash?.slice(0, 7) ?? "unknown"));
  } else {
    const name = headBranchName();
    console.log(pc.green("* " + name));
  }
};
