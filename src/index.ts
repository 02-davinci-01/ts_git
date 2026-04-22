// src/index.ts
import * as fs from "node:fs";
import { tsGitPath, read, write, lsRecursive, workingCopyPath } from "./files.js";
import { hash } from "./util.js";
import { skip } from "node:test";
import * as path from "node:path";

export const readIndex=()=>{
    if (!fs.existsSync(tsGitPath("index"))) return {};
    const content = read(tsGitPath("index"));
    const result: Record<string, string> = {};
for (const line of content.split("\n")) {
    const [filePath, fileHash] = line.split(" ");
    result[filePath] = fileHash;
}
return result;
}

export const writeIndex = (index:Record<string,string>)=>{
  const output = Object.entries(index).map(([p, h]) => p + " " + h).join("\n");
write(tsGitPath("index"), output);

}

//table of content: a flat map of key value ie filePath to fileHash.
export const toc = ()=>{
    return readIndex();
}

//simple hasFileChecks.
export const hasFile=function (filePath:string):Boolean{
    const mapIndex:Record<string,string> = readIndex();
    return Object.hasOwn(mapIndex,filePath);
}

export const workingCopytoc=()=>{
    const files = lsRecursive(workingCopyPath());
    let result:Record<string,string> = {};
    files.forEach((file)=>{
        if(file.includes(".tsgit")){
           return
        } 
        let relativePath = path.relative(workingCopyPath(), file).split("\\").join("/");
         result[relativePath] = hash(read(file))
    })

    return result;
}