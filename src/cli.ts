#!/usr/bin/env node
import { init, add, commit, log, status, branch, checkout } from "./ts_git.js";

const [,, command, ...args] = process.argv;

const usage = [
    "Usage:",
    "  ts_git init",
    "  ts_git add <path>",
    "  ts_git commit <message>",
    "  ts_git log",
    "  ts_git status",
    "  ts_git branch <name>",
    "  ts_git checkout <name>",
].join("\n");

try {
    switch (command) {
        case "init":
            init();
            break;
        case "add":
            if (!args[0]) {
                throw Error("file path is required. Use: ts_git add <path>.");
            }
            add(args[0]);
            break;
        case "commit":
            if (!args[0]) {
                throw Error("commit message is required. Use: ts_git commit <message>.");
            }
            commit(args[0]);
            break;
        case "log":
            log();
            break;
        case "status":
            status();
            break;
        case "branch":
            if (!args[0]) {
                throw Error("branch name is required. Use: ts_git branch <name>.");
            }
            branch(args[0]);
            break;
        case "checkout":
            if (!args[0]) {
                throw Error("branch name is required. Use: ts_git checkout <name>.");
            }
            checkout(args[0]);
            break;
        default:
            throw Error("unknown command: " + (command ?? "") + "\n\n" + usage);
    }
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("fatal: " + message);
    process.exitCode = 1;
}