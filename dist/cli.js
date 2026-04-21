#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_git_js_1 = require("./ts_git.js");
const [, , command, ...args] = process.argv;
switch (command) {
    case "init":
        (0, ts_git_js_1.init)();
        break;
    case "add":
        (0, ts_git_js_1.add)(args[0]);
        break;
    case "commit":
        (0, ts_git_js_1.commit)(args[0]);
        break;
    case "log":
        (0, ts_git_js_1.log)();
        break;
    case "status":
        (0, ts_git_js_1.status)();
        break;
    case "branch":
        (0, ts_git_js_1.branch)(args[0]);
        break;
    case "checkout":
        (0, ts_git_js_1.checkout)(args[0]);
        break;
    default: console.log("Unknown command: " + command);
}
