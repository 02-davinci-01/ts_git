// src/objects.ts
import {
  tsGitPath,
  read,
  write,
  nestFlatTree,
  flattenNestedTree,
  lsRecursive,
} from "./files.js";
import { hash } from "./util.js";
import * as fs from "node:fs";

export const writeObject = (content: string): string => {
  /* hash content, store it, return hash */
  const hashCon = hash(content);
  const objDir = hashCon.slice(0, 2);
  const fileName = hashCon.slice(2);
  const objFilePath = tsGitPath("objects", objDir, fileName);
  write(objFilePath, content);
  return hashCon;
};

//standard readObj function.
export const readObject = (objectHash: string): string => {
  /* read object by hash */
  const objFilePath = tsGitPath(
    "objects",
    objectHash.slice(0, 2),
    objectHash.slice(2),
  );
  const content = read(objFilePath);
  return content;
};

export const exists = (objectHash: string): boolean => {
  /* does this object exist? */
  return fs.existsSync(
    tsGitPath("objects", objectHash.slice(0, 2), objectHash.slice(2)),
  );
};
export const type = (objectHash: string): string => {
  return readObject(objectHash).split("\n")[0].split(" ")[0];
};

export const writeTree = (tree: Record<string, any>): string => {
  let treeLines: string[] = [];
  Object.entries(tree).forEach(([it, value]) => {
    if (typeof value === "string") {
      treeLines.push(`blob ${it} ${value}`);
    } else {
      const subTreeHash = writeTree(value);
      treeLines.push(`tree ${it} ${subTreeHash}`);
    }
  });

  return writeObject(treeLines.join("\n"));
};

export const writeCommit = (
  treeHash: string,
  message: string,
  ...parentHashes: string[]
): string => {
  const parts = ["commit", "tree " + treeHash];
  for (const parentHash of parentHashes) {
    parts.push("parent " + parentHash);
  }
  parts.push(""); // ← always: blank line separator
  parts.push(message);

  return writeObject(parts.join("\n"));
};

export const fileTree = (hash: string): Record<string, any> => {
  let content = readObject(hash);

  if (type(hash) === "commit") {
    const treeHash = content
      .split("\n")
      .find((line) => line.startsWith("tree ")) // find the line
      ?.split(" ")[1];

    return fileTree(treeHash!); // extract the hash
  }

  let result: Record<string, any> = {};

  content
    .split("\n")
    .filter(Boolean)
    .forEach((line) => {
      const [entryType, name, entryHash] = line.split(" ");

      if (entryType === "blob") {
        result[name] = entryHash;
      }

      if (entryType === "tree") {
        result[name] = fileTree(entryHash);
      }
    });
  return result;
};

export const commitToc = function (hash: string) {
  return flattenNestedTree(fileTree(hash));
};
