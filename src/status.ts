// src/status.ts — Human-readable repo status output
import pc from "picocolors";
import { commitToc } from "./objects.js";
import { toc, workingCopytoc } from "./index.js";
import { hash as resolveRef, headBranchName, isHeadDetached } from "./refs.js";

export const statusToString = (): string => {
  const branchName = headBranchName();
  const header = isHeadDetached()
    ? "HEAD detached at " + pc.yellow(resolveRef("HEAD")?.slice(0, 7) ?? "unknown")
    : "On branch " + pc.bold(branchName ?? "unknown");

  const index = toc();
  const working = workingCopytoc();
  const untracked: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];
  const staged: string[] = [];

  // files on disk but not staged
  for (const file of Object.keys(working)) {
    if (!(file in index)) {
      untracked.push(file);
    }
  }

  // files staged but changed on disk since
  for (const file of Object.keys(index)) {
    if (!(file in working)) {
      deleted.push(file);
    } else if (working[file] !== index[file]) {
      modified.push(file);
    }
  }

  // files in the index that differ from last commit (staged for commit)
  const headHash = resolveRef("HEAD");
  const committed: Record<string, string> = headHash ? commitToc(headHash) : {};
  for (const file of Object.keys(index)) {
    if (!(file in committed) || index[file] !== committed[file]) {
      staged.push(file);
    }
  }
  // files committed but removed from index (staged deletions)
  for (const file of Object.keys(committed)) {
    if (!(file in index)) {
      staged.push(file);
    }
  }

  untracked.sort((a, b) => a.localeCompare(b));
  modified.sort((a, b) => a.localeCompare(b));
  deleted.sort((a, b) => a.localeCompare(b));
  staged.sort((a, b) => a.localeCompare(b));

  if (staged.length === 0 && modified.length === 0 && deleted.length === 0 && untracked.length === 0) {
    return header + "\n" + pc.green("nothing to commit, working tree clean");
  }

  const lines: string[] = [header];

  if (staged.length > 0) {
    lines.push(pc.bold("Changes to be committed:"));
    for (const file of staged) {
      lines.push("  " + pc.green("staged:    ") + file);
    }
  }

  if (modified.length > 0 || deleted.length > 0) {
    if (staged.length > 0) lines.push("");
    lines.push(pc.bold("Changes not staged for commit:"));
    for (const file of modified) {
      lines.push("  " + pc.yellow("modified:  ") + file);
    }
    for (const file of deleted) {
      lines.push("  " + pc.red("deleted:   ") + file);
    }
  }

  if (untracked.length > 0) {
    if (staged.length > 0 || modified.length > 0 || deleted.length > 0) lines.push("");
    lines.push(pc.bold("Untracked files:"));
    for (const file of untracked) {
      lines.push("  " + pc.red("untracked: ") + file);
    }
  }

  return lines.join("\n");
};
