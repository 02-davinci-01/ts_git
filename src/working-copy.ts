import * as fs from "node:fs";
import { readObject } from "./objects.js";
import { write, workingCopyPath } from "./files.js";
import { MergeDiff } from "./types.js";

export const applyMergeDiff = (
  mergeDiff: MergeDiff,
  index: Record<string, string>,
): void => {
  Object.entries(mergeDiff).forEach(([it, mergeObj]) => {
    if (mergeObj.mergeStatus === "CONFLICT") {
      writeConflictMarkers(it, mergeObj.aHash, mergeObj.bHash);
    } else if (mergeObj.mergeStatus === "SAME") {
      // no change needed
    } else if (mergeObj.applyHash) {
      const content = readObject(mergeObj.applyHash);
      write(workingCopyPath(it), content);
      index[it] = mergeObj.applyHash;
    } else {
      // deletion — applyHash is undefined because the winning side deleted the file
      const fullPath = workingCopyPath(it);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      delete index[it];
    }
  });
};

export const writeConflictMarkers = (
  filePath: string,
  aHash: string | undefined,
  bHash: string | undefined,
): void => {
  const aContent = aHash ? readObject(aHash) : "";
  const bContent = bHash ? readObject(bHash) : "";

  const conflictContent = [
    "<<<<<<<",
    aContent,
    "=======",
    bContent,
    ">>>>>>>",
  ].join("\n");

  write(workingCopyPath(filePath), conflictContent);
};
