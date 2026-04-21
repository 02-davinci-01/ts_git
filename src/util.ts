import { createHash } from "node:crypto";  

//sha-1 hash
export const hash = (content: string): string => { return createHash("sha1").update(content).digest("hex");};

//probably the most important function: setIn -- 
//it makes nested objects from path arrays: 
export const setIn = (obj: Record<string, any>, path: [...string[],unknown]): Record<string, any> => { 
    
    if(path.length===2){
        obj[path[0] as string ]= path[1];
        return obj;
    }
    obj[path[0] as any] = setIn(obj[path[0] as any] ?? {}, path.slice(1) as any)
    return obj


}

//the line function --- we split lines  at every new line
export const lines = (str: string): string[] => { return str.split(/\r?\n/).filter(Boolean)};

//flatten an object -- also writing a recursive version of it
export const flatten = <T>(arr: (T | T[])[]): T[] => { /* ... */ 
    return arr.flat(Infinity) as T[];
};



export const unique = <T>(arr: T[]): T[] => { 
    const a: Set<T>=new Set(arr)
    return [...a];
 };

export const intersection = <T>(a: T[], b: T[]): T[] => { 
    const a_set:Set<T> = new Set(a);
    const b_set:Set<T> = new Set(b);

    const intersection_arr:T[] = [...a_set].filter((it:T)=>b_set.has(it));
    return intersection_arr;
}

//intersection -- finding items that exist in both. We have two arrays. We can make new sets  

//the set in function is basically 
//okay we have the path and we need to recursively create an object -- where we keep nesting
