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
exports.checkout = exports.branch = exports.status = exports.log = exports.commit = exports.add = exports.init = void 0;
const fs = __importStar(require("fs"));
const files_1 = require("./files");
const config_1 = require("./config");
const objects_1 = require("./objects");
const index_1 = require("./index");
const path = __importStar(require("node:path"));
const refs_js_1 = require("./refs.js");
const init = () => {
    const currentDir = process.cwd();
    if ((0, files_1.isInRepo)()) {
        throw Error("You are already in a repo");
    }
    const root = (0, files_1.repoRoot)(currentDir);
    fs.mkdirSync(".tsgit/objects", { recursive: true });
    fs.mkdirSync(".tsgit/refs/heads", { recursive: true });
    (0, files_1.write)(".tsgit/HEAD", "ref: refs/heads/main");
    (0, config_1.writeConfig)({ core: { bare: "false" } });
};
exports.init = init;
const add = (filePath) => {
    if (!(0, files_1.isInRepo)()) {
        throw Error("We are not in a repo");
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const blobHash = (0, objects_1.writeObject)(content);
    const index = (0, index_1.readIndex)();
    const relativePath = path.relative((0, files_1.workingCopyPath)(), filePath).split("\\").join("/");
    index[relativePath] = blobHash;
    (0, index_1.writeIndex)(index);
};
exports.add = add;
const commit = (message) => {
    if (!(0, files_1.isInRepo)()) {
        throw Error("Not a repo");
    }
    const index = (0, index_1.readIndex)();
    if (Object.keys(index).length === 0) {
        throw Error("nothing to commit");
    }
    let treeHash = (0, objects_1.writeTree)((0, files_1.nestFlatTree)(index));
    let parentHash = (0, refs_js_1.hash)("HEAD");
    let commitHash = (0, objects_1.writeCommit)(treeHash, message, parentHash);
    const ref = (0, refs_js_1.terminalRef)("HEAD");
    (0, refs_js_1.writeRef)(ref, commitHash);
};
exports.commit = commit;
const log = () => {
    let commitHash = (0, refs_js_1.hash)("HEAD");
    while (commitHash) {
        const content = (0, objects_1.readObject)(commitHash);
        const lines = content.split("\n");
        // message is everything after the blank line
        const blankIndex = lines.indexOf("");
        const message = lines.slice(blankIndex + 1).join("\n");
        // find parent line
        const parentLine = lines.find(l => l.startsWith("parent "));
        const parentHash = parentLine ? parentLine.split(" ")[1] : undefined;
        console.log(`${commitHash} ${message}`);
        commitHash = parentHash; // walk to parent
    }
};
exports.log = log;
const status = () => {
    const index = (0, index_1.toc)();
    const working = (0, index_1.workingCopytoc)();
    // files on disk but not staged
    for (const file of Object.keys(working)) {
        if (!(file in index)) {
            console.log("untracked: " + file);
        }
    }
    // files staged but changed on disk since
    for (const file of Object.keys(working)) {
        if (file in index && working[file] !== index[file]) {
            console.log("modified:  " + file);
        }
    }
    // files in the index that differ from last commit (staged for commit)
    const headHash = (0, refs_js_1.hash)("HEAD");
    const committed = headHash ? (0, objects_1.commitToc)(headHash) : {};
    for (const file of Object.keys(index)) {
        if (!(file in committed) || index[file] !== committed[file]) {
            console.log("staged:    " + file);
        }
    }
};
exports.status = status;
const branch = (name) => {
    const commitHash = (0, refs_js_1.hash)("HEAD");
    (0, refs_js_1.writeRef)("refs/heads/" + name, commitHash);
};
exports.branch = branch;
const checkout = (branchName) => {
    const targetHash = (0, refs_js_1.hash)("refs/heads/" + branchName);
    const targetFiles = (0, objects_1.commitToc)(targetHash);
    const currentFiles = (0, index_1.toc)();
    // Step 1: Write target branch's files to disk
    for (const [filePath, blobHash] of Object.entries(targetFiles)) {
        (0, files_1.write)((0, files_1.workingCopyPath)(filePath), (0, objects_1.readObject)(blobHash));
    }
    // Step 2: Delete files that exist now but not in target
    for (const filePath of Object.keys(currentFiles)) {
        if (!(filePath in targetFiles)) {
            fs.unlinkSync((0, files_1.workingCopyPath)(filePath));
        }
    }
    // Step 3: Update index to match target
    (0, index_1.writeIndex)(targetFiles);
    // Step 4: Point HEAD to new branch
    (0, files_1.write)((0, files_1.tsGitPath)("HEAD"), "ref: refs/heads/" + branchName);
};
exports.checkout = checkout;
