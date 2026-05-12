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
exports.workingCopytoc = exports.hasFile = exports.toc = exports.writeIndex = exports.readIndex = void 0;
// src/index.ts
const fs = __importStar(require("node:fs"));
const files_js_1 = require("./files.js");
const util_js_1 = require("./util.js");
const path = __importStar(require("node:path"));
const readIndex = () => {
    if (!fs.existsSync((0, files_js_1.tsGitPath)("index")))
        return {};
    const content = (0, files_js_1.read)((0, files_js_1.tsGitPath)("index"));
    const result = {};
    for (const line of content.split("\n").filter(Boolean)) {
        const [filePath, fileHash] = line.split(" ");
        if (!filePath || !fileHash) {
            continue;
        }
        result[filePath] = fileHash;
    }
    return result;
};
exports.readIndex = readIndex;
const writeIndex = (index) => {
    const output = Object.entries(index).map(([p, h]) => p + " " + h).join("\n");
    (0, files_js_1.write)((0, files_js_1.tsGitPath)("index"), output);
};
exports.writeIndex = writeIndex;
//table of content: a flat map of key value ie filePath to fileHash.
const toc = () => {
    return (0, exports.readIndex)();
};
exports.toc = toc;
//simple hasFileChecks.
const hasFile = function (filePath) {
    const mapIndex = (0, exports.readIndex)();
    return Object.hasOwn(mapIndex, filePath);
};
exports.hasFile = hasFile;
const workingCopytoc = () => {
    const files = (0, files_js_1.lsRecursive)((0, files_js_1.workingCopyPath)());
    let result = {};
    files.forEach((file) => {
        if (file.includes(".tsgit")) {
            return;
        }
        let relativePath = path.relative((0, files_js_1.workingCopyPath)(), file).split("\\").join("/");
        result[relativePath] = (0, util_js_1.hash)((0, files_js_1.read)(file));
    });
    return result;
};
exports.workingCopytoc = workingCopytoc;
