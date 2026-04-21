// src/files.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { setIn } from "./util.js";

//blocking read operation
export const read = (filePath: string): string => { /* ... */return fs.readFileSync(filePath, "utf-8")};
export const write = (filePath: string, content: string): void => { /* ... */ fs.mkdirSync(path.dirname(filePath),{recursive: true})
fs.writeFileSync(filePath, content)};

//a simple dfs idea
export const repoRoot = (dir?: string): string | undefined => { /* ... */
    let current = process.cwd();

    while (current!== path.dirname(current)){
        if (fs.existsSync(path.join(current,".tsgit"))){
            return current;
        }
        current = path.dirname(current);
    }
    return undefined

 };

 //If not in repo then it stays undefined
export const isInRepo = (): boolean => { /* ... */ return repoRoot()!==undefined};

//easy access to the .tsgit repo
export const tsGitPath = (...parts: string[]): string => { /* ... */
    const root = repoRoot();
if (root === undefined) throw new Error("Not in a ts_git repository");
return path.join(root, ".tsgit", ...parts);
 };

export const workingCopyPath = (...parts: string[]): string => {
    const root = repoRoot();
if (root === undefined) throw new Error("Not in a ts_git repository");
    return path.join(repoRoot()!,...parts) };

//a flat lit of all file paths
    export const lsRecursive = (dirPath: string): string[] => { /* ... */ 
    let results:string[]=[];
    
    fs.readdirSync(dirPath,{withFileTypes:true}).forEach((it)=>{
        let fullPath = path.join(dirPath,it.name);

        if(it.isFile()){
            results.push(fullPath);
        }

        if (it.isDirectory()){
           results.push(...lsRecursive(fullPath));
        }

    })
    return results;
};

//nesting the flat-tree using our previous setIn function
export const nestFlatTree = (flatTree: Record<string, string>): Record<string, any> => { /* ... */
    let result:Record<string,any>={}; 
    Object.entries(flatTree).forEach(([filePath,value])=>{

         setIn(result as any, [...filePath.split("/"),value] as any);
     })
     return result;
 };

 //the polar opposite of the nestFlatTree. 
export const flattenNestedTree = (tree: Record<string, any>, prefix?: string): Record<string, string> => { /* ... */ 
    //flatten a nested tree would be to recursively extract values from each node
    let result:Record<string,string>={};
    Object.entries(tree).forEach(([key,value])=>{
        let fullKey = prefix? prefix + "/" + key : key;

        if(typeof(value)==='string'){
            result[fullKey]=value;
        }
        if (typeof(value)==='object'){
           Object.assign(result, flattenNestedTree(value, fullKey));
        }
    })
    return result;
};