import * as fs from "fs"
import { isInRepo, nestFlatTree, read, repoRoot, tsGitPath, workingCopyPath, write } from "./files";
import { writeConfig } from "./config";
import { commitToc, readObject, writeCommit, writeObject, writeTree } from "./objects";
import { readIndex, toc, workingCopytoc, writeIndex } from "./index";
import * as path  from "node:path";
import { hash as resolveRef, terminalRef, writeRef } from "./refs.js";

//making the relevant directories
//objects -- refs/heads and the HEAD
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
    console.log("Initialized empty ts_git repository in " + path.join(currentDir, ".tsgit"));
}

export const add = (filePath:string)=>{
    if(!isInRepo()){
        throw Error("not a ts_git repository");
    }

    if (!filePath) {
        throw Error("add expects a file path");
    }


    
    const index = readIndex(); //index is filepath -> filehash mapping
    if(filePath==="."){
        const blobsWorking:Record<string,string>=workingCopytoc();
        //creating objecs for everything
        Object.entries(blobsWorking).forEach(([filePath,blobHash])=>{
            const objFilePath = tsGitPath('objects', blobHash.slice(0,2), blobHash.slice(2))
            write(objFilePath,read(filePath));
        })
        
        for(const [workPath, workBlob] of Object.entries(blobsWorking)){
 
                index[workPath] = workBlob;
        }
        writeIndex(index);
        console.log("All files staged");
        return;
            
        
    }
    
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
        throw Error(`pathspec '${filePath}' did not match any files`);
    }
    
    const relativePath = path.relative(workingCopyPath(), absolutePath).split("\\").join("/");
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw Error(`path '${filePath}' is outside the repository`);
    }
    
    const content = fs.readFileSync(absolutePath,"utf-8");
    const blobHash = writeObject(content); //hash created the 2 file structure made
    
    index[relativePath]=blobHash; //updating
    writeIndex(index); //putting it in the index file for changes
    console.log("added: " + relativePath);
}



export const commit = (message:string)=>{
    if(!isInRepo()){
        throw Error("not a ts_git repository");
    }

    if (!message?.trim()) {
        throw Error("commit message is required");
    }

    const index = readIndex();
    if (Object.keys(index).length === 0) {
        throw Error("nothing to commit, working tree clean");
    }

    let treeHash = writeTree(nestFlatTree(index)); //resolve in the index into a nested object -- treeHash
    let parentHash = resolveRef("HEAD"); //find the hash of the ref pointer -- the latest commit hash
    let commitHash = writeCommit(treeHash,message,parentHash); //creation of the commit obj
    const ref = terminalRef("HEAD"); //finding the terminal ref -- end ref
    writeRef(ref, commitHash);//adding commit hash at the top -- there is only commit that is remaining so where does the other commit object go?
    console.log("Committed " + commitHash.slice(0, 7) + ": " + message);
     
}

export const log = ()=>{
    let commitHash = resolveRef("HEAD");

    if (!commitHash) {
        console.log("No commits yet.");
        return;
    }

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
    if(!isInRepo()){
        throw Error("not a ts_git repository");
    }

    const index = toc();
    const working = workingCopytoc();
    const untracked: string[] = [];
    const modified: string[] = [];
    const staged: string[] = [];

    // files on disk but not staged
    for (const file of Object.keys(working)) {
        if (!(file in index)) {
            untracked.push(file);
        }
    }

    // files staged but changed on disk since
    for (const file of Object.keys(working)) {
        if (file in index && working[file] !== index[file]) {
            modified.push(file);
        }
    }

    // files in the index that differ from last commit (staged for commit)
    const headHash = resolveRef("HEAD");
    const committed: Record<string, string> = headHash ? commitToc(headHash) : {};
    for (const file of Object.keys(index)) {
        if (!(file in committed) || index[file] !== committed[file]) {
            staged.push(file);
        }
    }

    untracked.sort((a, b) => a.localeCompare(b));
    modified.sort((a, b) => a.localeCompare(b));
    staged.sort((a, b) => a.localeCompare(b));

    if (staged.length === 0 && modified.length === 0 && untracked.length === 0) {
        console.log("nothing to commit, working tree clean");
        return;
    }

    if (staged.length > 0) {
        console.log("Changes to be committed:");
        for (const file of staged) {
            console.log("  staged:    " + file);
        }
    }

    if (modified.length > 0) {
        if (staged.length > 0) {
            console.log("");
        }
        console.log("Changes not staged for commit:");
        for (const file of modified) {
            console.log("  modified:  " + file);
        }
    }

    if (untracked.length > 0) {
        if (staged.length > 0 || modified.length > 0) {
            console.log("");
        }
        console.log("Untracked files:");
        for (const file of untracked) {
            console.log("  untracked: " + file);
        }
    }
}

export const branch = (name:string)=>{
    if(!isInRepo()){
        throw Error("not a ts_git repository");
    }

    if (!name?.trim()) {
        throw Error("branch name is required");
    }

    const commitHash = resolveRef("HEAD");
    if (!commitHash) {
        throw Error("cannot create branch before first commit");
    }

    writeRef("refs/heads/"+ name, commitHash);
    console.log("Created branch '" + name + "'");
}

export const checkout=(branchName:string)=>{
    if(!isInRepo()){
        throw Error("not a ts_git repository");
    }

    if (!branchName?.trim()) {
        throw Error("branch name is required");
    }

    const targetHash = resolveRef("refs/heads/" + branchName);
    if (!targetHash) {
        throw Error("branch '" + branchName + "' not found");
    }

    const targetFiles = commitToc(targetHash);
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
    console.log("Switched to branch '" + branchName + "'");

}