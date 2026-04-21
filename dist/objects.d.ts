export declare const writeObject: (content: string) => string;
export declare const readObject: (objectHash: string) => string;
export declare const exists: (objectHash: string) => boolean;
export declare const type: (objectHash: string) => string;
export declare const writeTree: (tree: Record<string, any>) => string;
export declare const writeCommit: (treeHash: string, message: string, parentHash?: string) => string;
export declare const fileTree: (hash: string) => Record<string, any>;
export declare const commitToc: (hash: string) => Record<string, string>;
