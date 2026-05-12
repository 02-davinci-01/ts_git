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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentBranch = exports.cMerge = exports.merge = exports.checkout = exports.branch = exports.status = exports.log = exports.commit = exports.add = exports.init = void 0;
const fs = __importStar(require("fs"));
const picocolors_1 = __importDefault(require("picocolors"));
const files_1 = require("./files");
const config_1 = require("./config");
const objects_1 = require("./objects");
const index_1 = require("./index");
const path = __importStar(require("node:path"));
const refs_js_1 = require("./refs.js");
const merge_js_1 = require("./merge.js");
const status_js_1 = require("./status.js");
//making the relevant directories
//objects -- refs/heads and the HEAD
const init = () => {
    const currentDir = process.cwd();
    if ((0, files_1.isInRepo)()) {
        throw Error("You are already in a repo");
    }
    fs.mkdirSync(".tsgit/objects", { recursive: true });
    fs.mkdirSync(".tsgit/refs/heads", { recursive: true });
    (0, files_1.write)(".tsgit/HEAD", "ref: refs/heads/main");
    (0, config_1.writeConfig)({ core: { bare: "false" } });
    console.log(picocolors_1.default.green("✓") +
        " Initialized empty ts_git repository in " +
        picocolors_1.default.bold(path.join(currentDir, ".tsgit")));
};
exports.init = init;
const add = (filePath) => {
    if (!(0, files_1.isInRepo)()) {
        throw Error("not a ts_git repository");
    }
    if (!filePath) {
        throw Error("add expects a file path");
    }
    const index = (0, index_1.readIndex)(); //index is filepath -> filehash mapping
    if (filePath === ".") {
        const blobsWorking = (0, index_1.workingCopytoc)();
        //creating objecs for everything
        Object.entries(blobsWorking).forEach(([filePath, blobHash]) => {
            const objFilePath = (0, files_1.tsGitPath)("objects", blobHash.slice(0, 2), blobHash.slice(2));
            (0, files_1.write)(objFilePath, (0, files_1.read)(filePath));
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
        (0, index_1.writeIndex)(index);
        console.log(picocolors_1.default.green("✓") + " All files staged");
        return;
    }
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
        throw Error(`pathspec '${filePath}' did not match any files`);
    }
    const relativePath = path
        .relative((0, files_1.workingCopyPath)(), absolutePath)
        .split("\\")
        .join("/");
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw Error(`path '${filePath}' is outside the repository`);
    }
    const content = fs.readFileSync(absolutePath, "utf-8");
    const blobHash = (0, objects_1.writeObject)(content); //hash created the 2 file structure made
    index[relativePath] = blobHash; //updating
    (0, index_1.writeIndex)(index); //putting it in the index file for changes
    console.log(picocolors_1.default.green("added: ") + relativePath);
};
exports.add = add;
const commit = (message) => {
    if (!(0, files_1.isInRepo)()) {
        throw Error("not a ts_git repository");
    }
    if (!message?.trim()) {
        throw Error("commit message is required");
    }
    const index = (0, index_1.readIndex)();
    if (Object.keys(index).length === 0) {
        throw Error("nothing to commit, working tree clean");
    }
    const treeHash = (0, objects_1.writeTree)((0, files_1.nestFlatTree)(index));
    const parentHash = (0, refs_js_1.hash)("HEAD");
    const commitHash = parentHash
        ? (0, objects_1.writeCommit)(treeHash, message, parentHash)
        : (0, objects_1.writeCommit)(treeHash, message);
    const ref = (0, refs_js_1.terminalRef)("HEAD"); //finding the terminal ref -- end ref
    (0, refs_js_1.writeRef)(ref, commitHash); //adding commit hash at the top -- there is only commit that is remaining so where does the other commit object go?
    console.log(picocolors_1.default.green("✓") +
        " Committed " +
        picocolors_1.default.yellow(commitHash.slice(0, 7)) +
        ": " +
        message);
};
exports.commit = commit;
const log = () => {
    let commitHash = (0, refs_js_1.hash)("HEAD");
    if (!commitHash) {
        console.log(picocolors_1.default.yellow("No commits yet."));
        return;
    }
    while (commitHash) {
        const content = (0, objects_1.readObject)(commitHash);
        const lines = content.split("\n");
        // message is everything after the blank line
        const blankIndex = lines.indexOf("");
        const message = lines.slice(blankIndex + 1).join("\n");
        // find parent line
        const parentLine = lines.find((l) => l.startsWith("parent "));
        const parentHash = parentLine ? parentLine.split(" ")[1] : undefined;
        console.log(picocolors_1.default.yellow(commitHash.slice(0, 7)) + " " + message);
        commitHash = parentHash; // walk to parent
    }
};
exports.log = log;
const status = () => {
    if (!(0, files_1.isInRepo)()) {
        throw Error("not a ts_git repository");
    }
    console.log((0, status_js_1.statusToString)());
};
exports.status = status;
const branch = (name) => {
    if (!(0, files_1.isInRepo)()) {
        throw Error("not a ts_git repository");
    }
    if (!name?.trim()) {
        throw Error("branch name is required");
    }
    const commitHash = (0, refs_js_1.hash)("HEAD");
    if (!commitHash) {
        throw Error("cannot create branch before first commit");
    }
    (0, refs_js_1.writeRef)("refs/heads/" + name, commitHash);
    console.log(picocolors_1.default.green("✓") + " Created branch '" + picocolors_1.default.bold(name) + "'");
};
exports.branch = branch;
const checkout = (branchName) => {
    if (!(0, files_1.isInRepo)()) {
        throw Error("not a ts_git repository");
    }
    if (!branchName?.trim()) {
        throw Error("branch name is required");
    }
    const targetHash = (0, refs_js_1.hash)("refs/heads/" + branchName);
    if (!targetHash) {
        throw Error("branch '" + branchName + "' not found");
    }
    const targetFiles = (0, objects_1.commitToc)(targetHash);
    const currentFiles = (0, index_1.toc)();
    // Step 1: Write target branch's files to disk
    for (const [filePath, blobHash] of Object.entries(targetFiles)) {
        (0, files_1.write)((0, files_1.workingCopyPath)(filePath), (0, objects_1.readObject)(blobHash));
    }
    // Step 2: Delete files that exist now but not in target
    for (const filePath of Object.keys(currentFiles)) {
        if (!(filePath in targetFiles)) {
            const fullPath = (0, files_1.workingCopyPath)(filePath);
            if (fs.existsSync(fullPath))
                fs.unlinkSync(fullPath);
        }
    }
    // Step 3: Update index to match target
    (0, index_1.writeIndex)(targetFiles);
    // Step 4: Point HEAD to new branch
    (0, files_1.write)((0, files_1.tsGitPath)("HEAD"), "ref: refs/heads/" + branchName);
    console.log(picocolors_1.default.green("✓") + " Switched to branch '" + picocolors_1.default.bold(branchName) + "'");
};
exports.checkout = checkout;
const merge = (branch, message) => {
    if (!(0, files_1.isInRepo)())
        throw Error("not a ts_git repository");
    if (!branch?.trim())
        throw Error("branch name is required");
    if (!message?.trim())
        throw Error("merge message is required");
    const branchHash = (0, refs_js_1.hash)("refs/heads/" + branch);
    if (!branchHash)
        throw Error("branch '" + branch + "' not found");
    const headHash = (0, refs_js_1.hash)("HEAD");
    if (!headHash)
        throw Error("nothing to merge — HEAD has no commits");
    if ((0, merge_js_1.canFastForward)(headHash, branchHash)) {
        (0, merge_js_1.writeFastForwardMerge)(branch);
        console.log(picocolors_1.default.green("✓") + " Fast-forward merged '" + picocolors_1.default.bold(branch) + "'");
    }
    else {
        (0, merge_js_1.writeNonFastForwardMerge)(branch, message);
    }
};
exports.merge = merge;
const cMerge = (branch) => {
    if (!(0, files_1.isInRepo)())
        throw Error("not a ts_git repository");
    if (!branch?.trim())
        throw Error("branch name is required");
    const branchHash = (0, refs_js_1.hash)("refs/heads/" + branch);
    if (!branchHash)
        throw Error("branch '" + branch + "' not found");
    const headHash = (0, refs_js_1.hash)("HEAD");
    if (!headHash)
        throw Error("nothing to merge — HEAD has no commits");
    if ((0, merge_js_1.canFastForward)(headHash, branchHash)) {
        console.log(picocolors_1.default.green("✓") +
            " Would fast-forward merge '" +
            picocolors_1.default.bold(branch) +
            "' — clean");
        return;
    }
    const baseHash = (0, merge_js_1.commonAncestor)(headHash, branchHash);
    if (!baseHash)
        throw Error("no common ancestor found");
    const tocA = (0, objects_1.commitToc)(headHash);
    const tocB = (0, objects_1.commitToc)(branchHash);
    const baseToc = (0, objects_1.commitToc)(baseHash);
    const diff = (0, merge_js_1.mergeDiff)(tocA, tocB, baseToc);
    const conflicts = Object.entries(diff).filter(([, entry]) => entry.mergeStatus === "CONFLICT");
    if (conflicts.length > 0) {
        console.log(picocolors_1.default.red("✗") + " Merge would have conflicts in:");
        for (const [file] of conflicts) {
            console.log("  " + picocolors_1.default.red(file));
        }
    }
    else {
        console.log(picocolors_1.default.green("✓") + " Merge would be clean — no conflicts");
    }
};
exports.cMerge = cMerge;
const currentBranch = () => {
    if (!(0, files_1.isInRepo)())
        throw Error("not a ts_git repository");
    if ((0, refs_js_1.isHeadDetached)()) {
        const commitHash = (0, refs_js_1.hash)("HEAD");
        console.log("HEAD detached at " + picocolors_1.default.yellow(commitHash?.slice(0, 7) ?? "unknown"));
    }
    else {
        const name = (0, refs_js_1.headBranchName)();
        console.log(picocolors_1.default.green("* " + name));
    }
};
exports.currentBranch = currentBranch;
