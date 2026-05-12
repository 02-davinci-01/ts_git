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
exports.flattenNestedTree = exports.nestFlatTree = exports.lsRecursive = exports.workingCopyPath = exports.tsGitPath = exports.isInRepo = exports.repoRoot = exports.write = exports.read = void 0;
// src/files.ts
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const util_js_1 = require("./util.js");
//blocking read operation
const read = (filePath) => { /* ... */ return fs.readFileSync(filePath, "utf-8"); };
exports.read = read;
const write = (filePath, content) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
};
exports.write = write;
//a simple dfs idea
const repoRoot = (dir) => {
    let current = process.cwd();
    while (current !== path.dirname(current)) {
        if (fs.existsSync(path.join(current, ".tsgit"))) {
            return current;
        }
        current = path.dirname(current);
    }
    return undefined;
};
exports.repoRoot = repoRoot;
//If not in repo then it stays undefined
const isInRepo = () => { /* ... */ return (0, exports.repoRoot)() !== undefined; };
exports.isInRepo = isInRepo;
//easy access to the .tsgit repo
const tsGitPath = (...parts) => {
    const root = (0, exports.repoRoot)();
    if (root === undefined)
        throw new Error("Not in a ts_git repository");
    return path.join(root, ".tsgit", ...parts);
};
exports.tsGitPath = tsGitPath;
const workingCopyPath = (...parts) => {
    const root = (0, exports.repoRoot)();
    if (root === undefined)
        throw new Error("Not in a ts_git repository");
    return path.join((0, exports.repoRoot)(), ...parts);
};
exports.workingCopyPath = workingCopyPath;
//a flat lit of all file paths
const lsRecursive = (dirPath) => {
    let results = [];
    fs.readdirSync(dirPath, { withFileTypes: true }).forEach((it) => {
        let fullPath = path.join(dirPath, it.name);
        if (it.isFile()) {
            results.push(fullPath);
        }
        if (it.isDirectory()) {
            results.push(...(0, exports.lsRecursive)(fullPath));
        }
    });
    return results;
};
exports.lsRecursive = lsRecursive;
//nesting the flat-tree using our previous setIn function
const nestFlatTree = (flatTree) => {
    let result = {};
    Object.entries(flatTree).forEach(([filePath, value]) => {
        (0, util_js_1.setIn)(result, [...filePath.split("/"), value]);
    });
    return result;
};
exports.nestFlatTree = nestFlatTree;
//the polar opposite of the nestFlatTree. 
const flattenNestedTree = (tree, prefix) => {
    //flatten a nested tree would be to recursively extract values from each node
    let result = {};
    Object.entries(tree).forEach(([key, value]) => {
        let fullKey = prefix ? prefix + "/" + key : key;
        if (typeof (value) === 'string') {
            result[fullKey] = value;
        }
        if (typeof (value) === 'object') {
            Object.assign(result, (0, exports.flattenNestedTree)(value, fullKey));
        }
    });
    return result;
};
exports.flattenNestedTree = flattenNestedTree;
