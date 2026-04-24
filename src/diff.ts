import { diff } from 'node:util';
import { status } from './ts_git';

//there are basically 4 categories
//A: giver -- can be remembered by append
//D: receiving
//M: modified
//Same -- that which stays same. 

type FileStatus = "A" | "D" | "M" | "SAME";

interface DiffEntry{
    status: FileStatus;
    receiver: string | undefined;
    giver: string | undefined;
}

type Diff = Record<string, DiffEntry>;

export const tocDiff= (receiver: Record<string,string>,giver:Record<string,string>)=>{
    const diffRecord:Diff ={};
    
    //now the idea is to classify. 
    // and the type should be of diffEntry ie it should be an object with these 3 things.
    //classifying only in giver
    Object.entries(giver).forEach(([item,value])=>{
       if( Object.hasOwn(receiver,item) ){
            diffRecord[item]={
                "status": "M",
                "receiver":giver[item],
                "giver": value
                
            }
       } 
    })
}



