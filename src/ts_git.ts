import * as fs from "fs"
import { isInRepo, nestFlatTree, repoRoot, tsGitPath, workingCopyPath, write } from "./files";
import { writeConfig } from "./config";
import { commitToc, readObject, writeCommit, writeObject, writeTree } from "./objects";
import { readIndex, toc, workingCopytoc, writeIndex } from "./index";
import * as path  from "node:path";
import { hash as resolveRef, terminalRef, writeRef } from "./refs.js";

export const init = (): void =>{
    const currentDir:string = process.cwd();

    if (isInRepo()){
        throw Error("You are already in a repo");
    }

    const root = repoRoot(currentDir);
    fs.mkdirSync(".tsgit/objects", { recursive: true });
fs.mkdirSync(".tsgit/refs/heads", { recursive: true });
write(".tsgit/HEAD", "ref: refs/heads/main");
writeConfig({ core: { bare: "false" } });
}

export const add = (filePath:string)=>{
    if(!isInRepo()){
        throw Error("We are not in a repo");
    }

    const content = fs.readFileSync(filePath,"utf-8");
    const blobHash = writeObject(content);

    const index = readIndex();
    const relativePath = path.relative(workingCopyPath(), filePath).split("\\").join("/");
    index[relativePath]=blobHash;
    writeIndex(index);

}

export const commit = (message:string)=>{
    if(!isInRepo()){
        throw Error("Not a repo");
    }

    const index = readIndex();
    if (Object.keys(index).length === 0) {
    throw Error("nothing to commit");
}

    let treeHash = writeTree(nestFlatTree(index));
    let parentHash = resolveRef("HEAD");
    let commitHash = writeCommit(treeHash,message,parentHash);
    const ref = terminalRef("HEAD");
    writeRef(ref, commitHash);
}

export const log = ()=>{
    let commitHash = resolveRef("HEAD");

   while (commitHash) {
        const content = readObject(commitHash);
        const lines = content.split("\n");

        // message is everything after the blank line
        const blankIndex = lines.indexOf("");
        const message = lines.slice(blankIndex + 1).join("\n");

        // find parent line
        const parentLine = lines.find(l => l.startsWith("parent "));
        const parentHash = parentLine ? parentLine.split(" ")[1] : undefined;

        console.log(`${commitHash} ${message}`);

        commitHash = parentHash;                  // walk to parent
    }
}

export const status = ()=>{
   const index = toc();
    const working = workingCopytoc();

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
    const headHash = resolveRef("HEAD");
    const committed: Record<string, string> = headHash ? commitToc(headHash) : {};
    for (const file of Object.keys(index)) {
        if (!(file in committed) || index[file] !== committed[file]) {
            console.log("staged:    " + file);
        }
    }
}

export const branch = (name:string)=>{
    const commitHash = resolveRef("HEAD");
    writeRef("refs/heads/"+ name, commitHash!);
}

export const checkout=(branchName:string)=>{
    const targetHash = resolveRef("refs/heads/" + branchName);
    const targetFiles = commitToc(targetHash!);
    const currentFiles = toc();

    // Step 1: Write target branch's files to disk
    for (const [filePath, blobHash] of Object.entries(targetFiles)) {
        write(workingCopyPath(filePath), readObject(blobHash));
    }

    // Step 2: Delete files that exist now but not in target
    for (const filePath of Object.keys(currentFiles)) {
        if (!(filePath in targetFiles)) {
            fs.unlinkSync(workingCopyPath(filePath));
        }
    }

    // Step 3: Update index to match target
    writeIndex(targetFiles);

    // Step 4: Point HEAD to new branch
    write(tsGitPath("HEAD"), "ref: refs/heads/" + branchName);

}