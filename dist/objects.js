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
exports.commitToc = exports.fileTree = exports.writeCommit = exports.writeTree = exports.type = exports.exists = exports.readObject = exports.writeObject = void 0;
// src/objects.ts
const files_js_1 = require("./files.js");
const util_js_1 = require("./util.js");
const fs = __importStar(require("node:fs"));
const writeObject = (content) => {
    const hashCon = (0, util_js_1.hash)(content);
    const objDir = hashCon.slice(0, 2);
    const fileName = hashCon.slice(2);
    const objFilePath = (0, files_js_1.tsGitPath)('objects', objDir, fileName);
    (0, files_js_1.write)(objFilePath, content);
    return hashCon;
};
exports.writeObject = writeObject;
const readObject = (objectHash) => {
    const objFilePath = (0, files_js_1.tsGitPath)("objects", objectHash.slice(0, 2), objectHash.slice(2));
    const content = (0, files_js_1.read)(objFilePath);
    return content;
};
exports.readObject = readObject;
const exists = (objectHash) => {
    return fs.existsSync((0, files_js_1.tsGitPath)("objects", objectHash.slice(0, 2), objectHash.slice(2)));
};
exports.exists = exists;
const type = (objectHash) => {
    return (0, exports.readObject)(objectHash).split("\n")[0].split(" ")[0];
};
exports.type = type;
const writeTree = (tree) => {
    let treeLines = [];
    Object.entries(tree).forEach(([it, value]) => {
        if (typeof (value) === 'string') {
            treeLines.push(`blob ${it} ${value}`);
        }
        else {
            const subTreeHash = (0, exports.writeTree)(value);
            treeLines.push(`tree ${it} ${subTreeHash}`);
        }
    });
    return (0, exports.writeObject)(treeLines.join("\n"));
};
exports.writeTree = writeTree;
const writeCommit = (treeHash, message, parentHash) => {
    const parts = ["commit", "tree " + treeHash];
    if (parentHash)
        parts.push("parent " + parentHash);
    parts.push(""); // ← always: blank line separator
    parts.push(message);
    // if parentHash exists, push "parent " + parentHash
    // push empty string (blank line separator)
    // push message
    return (0, exports.writeObject)(parts.join("\n"));
};
exports.writeCommit = writeCommit;
const fileTree = (hash) => {
    let content = (0, exports.readObject)(hash);
    if ((0, exports.type)(hash) === 'commit') {
        const treeHash = content.split("\n")
            .find(line => line.startsWith("tree ")) // find the line
            ?.split(" ")[1];
        return (0, exports.fileTree)(treeHash); // extract the hash
    }
    let result = {};
    content.split('\n').filter(Boolean).forEach((line) => {
        const [entryType, name, entryHash] = line.split(" ");
        if (entryType === "blob") {
            result[name] = entryHash;
        }
        if (entryType === "tree") {
            result[name] = (0, exports.fileTree)(entryHash);
        }
    });
    return result;
};
exports.fileTree = fileTree;
const commitToc = function (hash) {
    return (0, files_js_1.flattenNestedTree)((0, exports.fileTree)(hash));
};
exports.commitToc = commitToc;
