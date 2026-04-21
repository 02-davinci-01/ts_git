"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intersection = exports.unique = exports.flatten = exports.lines = exports.setIn = exports.hash = void 0;
const node_crypto_1 = require("node:crypto");
const hash = (content) => { return (0, node_crypto_1.createHash)("sha1").update(content).digest("hex"); };
exports.hash = hash;
const setIn = (obj, path) => {
    if (path.length === 2) {
        obj[path[0]] = path[1];
        return obj;
    }
    obj[path[0]] = (0, exports.setIn)(obj[path[0]] ?? {}, path.slice(1));
    return obj;
};
exports.setIn = setIn;
const lines = (str) => { return str.split(/\r?\n/).filter(Boolean); };
exports.lines = lines;
const flatten = (arr) => {
    return arr.flat(Infinity);
};
exports.flatten = flatten;
const unique = (arr) => {
    const a = new Set(arr);
    return [...a];
};
exports.unique = unique;
const intersection = (a, b) => {
    const a_set = new Set(a);
    const b_set = new Set(b);
    const intersection_arr = [...a_set].filter((it) => b_set.has(it));
    return intersection_arr;
};
exports.intersection = intersection;
//intersection -- finding items that exist in both. We have two arrays. We can make new sets  
//the set in function is basically 
//okay we have the path and we need to recursively create an object -- where we keep nesting
