"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBare = exports.writeConfig = exports.readConfig = exports.objToStr = exports.strToObj = void 0;
// src/config.ts
const files_js_1 = require("./files.js");
const util_js_1 = require("./util.js");
const strToObj = (str) => {
    const result = {};
    let currentSection = [];
    for (const line of (0, util_js_1.lines)(str)) {
        const subsectionMatch = line.match(/^\[(\w+)\s+"([^"]+)"\]$/);
        const sectionMatch = line.match(/^\[(\w+)\]$/);
        const kvMatch = line.match(/^\s*(\w+)\s*=\s*(.+)$/);
        if (subsectionMatch) {
            currentSection = [subsectionMatch[1], subsectionMatch[2]];
        }
        else if (sectionMatch) {
            currentSection = [sectionMatch[1]];
        }
        else if (kvMatch) {
            (0, util_js_1.setIn)(result, [...currentSection, kvMatch[1], kvMatch[2].trim()]);
        }
    }
    return result;
};
exports.strToObj = strToObj;
const objToStr = (obj) => {
    const lines = [];
    for (const [section, sectionVal] of Object.entries(obj)) {
        const hasSubsections = Object.values(sectionVal).some(v => typeof v === "object");
        if (hasSubsections) {
            for (const [sub, subVal] of Object.entries(sectionVal)) {
                lines.push(`[${section} "${sub}"]`);
                for (const [k, v] of Object.entries(subVal)) {
                    lines.push(`    ${k} = ${v}`);
                }
            }
        }
        else {
            lines.push(`[${section}]`);
            for (const [k, v] of Object.entries(sectionVal)) {
                lines.push(`    ${k} = ${v}`);
            }
        }
    }
    return lines.join("\n");
};
exports.objToStr = objToStr;
const readConfig = () => {
    const tsDir = (0, files_js_1.tsGitPath)("config");
    const content = (0, files_js_1.read)(tsDir);
    return (0, exports.strToObj)(content);
};
exports.readConfig = readConfig;
const writeConfig = (config) => {
    const tsDir = (0, files_js_1.tsGitPath)("config");
    const contentConfig = (0, exports.objToStr)(config);
    (0, files_js_1.write)(tsDir, contentConfig);
    /* write .tsgit/config */ 
};
exports.writeConfig = writeConfig;
const isBare = () => {
    return (0, exports.readConfig)().core?.bare === "true";
};
exports.isBare = isBare;
