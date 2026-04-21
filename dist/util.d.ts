export declare const hash: (content: string) => string;
export declare const setIn: (obj: Record<string, any>, path: [...string[], unknown]) => Record<string, any>;
export declare const lines: (str: string) => string[];
export declare const flatten: <T>(arr: (T | T[])[]) => T[];
export declare const unique: <T>(arr: T[]) => T[];
export declare const intersection: <T>(a: T[], b: T[]) => T[];
