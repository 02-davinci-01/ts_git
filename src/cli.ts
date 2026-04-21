#!/usr/bin/env node
import { init, add, commit, log, status, branch, checkout } from "./ts_git.js";

const [,, command, ...args] = process.argv;

switch (command) {
    case "init":     init(); break;
    case "add":      add(args[0]); break;
    case "commit":   commit(args[0]); break;
    case "log":      log(); break;
    case "status":   status(); break;
    case "branch":   branch(args[0]); break;
    case "checkout": checkout(args[0]); break;
    default:         console.log("Unknown command: " + command);
}