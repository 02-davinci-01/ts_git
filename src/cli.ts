#!/usr/bin/env node
import {
  init,
  add,
  commit,
  log,
  status,
  branch,
  checkout,
  merge,
  cMerge,
  currentBranch,
} from "./ts_git.js";

const [, , command, ...args] = process.argv;

const parseFlag = (
  args: string[],
  flag: string,
): { value: string | undefined; rest: string[] } => {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    const value = args[idx + 1];
    const rest = [...args.slice(0, idx), ...args.slice(idx + 2)];
    return { value, rest };
  }
  return { value: undefined, rest: args };
};

const usage = [
  "Usage:",
  "  ts-git init",
  "  ts-git add <path>",
  '  ts-git commit -m "message"',
  "  ts-git log",
  "  ts-git status",
  "  ts-git branch <name>",
  "  ts-git checkout <name>",
  '  ts-git merge <branch> -m "message"',
  "  ts-git c-merge <branch>",
  "  ts-git curr-branch",
].join("\n");

try {
  switch (command) {
    case "init":
      init();
      break;
    case "add":
      if (!args[0]) {
        throw Error("file path is required. Use: ts-git add <path>.");
      }
      add(args[0]);
      break;
    case "commit": {
      const { value: flagMsg, rest } = parseFlag(args, "-m");
      const message = flagMsg ?? rest[0];
      if (!message) {
        throw Error(
          'commit message is required. Use: ts-git commit -m "message".',
        );
      }
      commit(message);
      break;
    }
    case "log":
      log();
      break;
    case "status":
      status();
      break;
    case "branch":
      if (!args[0]) {
        throw Error("branch name is required. Use: ts-git branch <name>.");
      }
      branch(args[0]);
      break;
    case "checkout":
      if (!args[0]) {
        throw Error("branch name is required. Use: ts-git checkout <name>.");
      }
      checkout(args[0]);
      break;
    case "merge": {
      const { value: flagMsg, rest } = parseFlag(args, "-m");
      const branchName = rest[0];
      const message = flagMsg ?? rest[1];
      if (!branchName) {
        throw Error(
          'branch name is required. Use: ts-git merge <branch> -m "message".',
        );
      }
      if (!message) {
        throw Error(
          'merge message is required. Use: ts-git merge <branch> -m "message".',
        );
      }
      merge(branchName, message);
      break;
    }
    case "c-merge":
      if (!args[0]) {
        throw Error("branch name is required. Use: ts-git c-merge <branch>.");
      }
      cMerge(args[0]);
      break;
    case "curr-branch":
      currentBranch();
      break;
    default:
      throw Error("unknown command: " + (command ?? "") + "\n\n" + usage);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("fatal: " + message);
  process.exitCode = 1;
}
