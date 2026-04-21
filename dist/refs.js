"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hash = exports.localHeads = exports.terminalRef = exports.headBranchName = exports.isHeadDetached = exports.writeRef = void 0;
// src/refs.ts
const fs = __importStar(require("node:fs"));
const files_js_1 = require("./files.js");
// Resolve a ref name or hash to a commit hash
// Write a value to a ref file
const writeRef = (ref, content) => { (0, files_js_1.write)((0, files_js_1.tsGitPath)(ref), content); };
exports.writeRef = writeRef;
// Is HEAD pointing to a branch name (not a hash)?
const isHeadDetached = () => { return !(0, files_js_1.read)((0, files_js_1.tsGitPath)("HEAD")).startsWith("ref: "); };
exports.isHeadDetached = isHeadDetached;
// Get the branch name HEAD points to (e.g. "main")
const headBranchName = () => {
    const content = (0, files_js_1.read)((0, files_js_1.tsGitPath)("HEAD"));
    if (content.startsWith("ref")) {
        const branchName = content.replace("ref: refs/heads/", "").trim();
        return branchName;
    }
    return undefined;
};
exports.headBranchName = headBranchName;
// Follow a ref chain to the final ref path
const terminalRef = (ref) => {
    if (fs.existsSync((0, files_js_1.tsGitPath)(ref))) {
        const content = (0, files_js_1.read)((0, files_js_1.tsGitPath)(ref)).trim();
        if (content.startsWith("ref: ")) {
            return (0, exports.terminalRef)(content.replace("ref: ", "")); // follow the chain
        }
    }
    return ref;
};
exports.terminalRef = terminalRef;
// List all local branch names
const localHeads = () => {
    const refContent = fs.readdirSync((0, files_js_1.tsGitPath)("refs/heads"));
    if (refContent === null) {
        throw Error("Not found");
    }
    return refContent;
};
exports.localHeads = localHeads;
const hash = (refOrHash) => {
    if (/^[0-9a-f]{40}$/.test(refOrHash))
        return refOrHash;
    const ref = (0, exports.terminalRef)(refOrHash);
    if (fs.existsSync((0, files_js_1.tsGitPath)(ref)))
        return (0, files_js_1.read)((0, files_js_1.tsGitPath)(ref)).trim();
    return undefined;
};
exports.hash = hash;
