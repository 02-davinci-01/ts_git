// src/refs.ts
import * as fs from "node:fs";
import { tsGitPath, read, write } from "./files.js";

// Resolve a ref name or hash to a commit hash

// Write a value to a ref file
export const writeRef = (ref: string, content: string): void => { write(tsGitPath(ref), content); };

// Is HEAD pointing to a branch name (not a hash)?
export const isHeadDetached = (): boolean => { return !read(tsGitPath("HEAD")).startsWith("ref: ");};

// Get the branch name HEAD points to (e.g. "main")
export const headBranchName = (): string | undefined => { 
    const content = read(tsGitPath("HEAD"));

    if(content.startsWith("ref")){
        const branchName = content.replace("ref: refs/heads/","").trim();
        return branchName;
    }

    return undefined;
};

// Follow a ref chain to the final ref path
export const terminalRef = (ref: string): string => { 
     if (fs.existsSync(tsGitPath(ref))) {
        const content = read(tsGitPath(ref)).trim();
        if (content.startsWith("ref: ")) {
            return terminalRef(content.replace("ref: ", ""));  // follow the chain
        }
    }
    return ref; 

    
 };

// List all local branch names
export const localHeads = (): string[] => { 
    const refContent= fs.readdirSync(tsGitPath("refs/heads"));
    if(refContent===null){
        throw Error("Not found");
    }
    return refContent;


 };

 export const hash = (refOrHash: string): string | undefined => {
    if (/^[0-9a-f]{40}$/.test(refOrHash)) return refOrHash;

    const ref = terminalRef(refOrHash);
    if (fs.existsSync(tsGitPath(ref))) return read(tsGitPath(ref)).trim();
    return undefined;
};