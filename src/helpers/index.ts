//creating helper function for merge entries

import { MergeStatus } from "../types.js";

export const mergeEntryObj = (
  mergeStatus: MergeStatus,
  aHash: string | undefined,
  bHash: string | undefined,
  baseHash: string | undefined,
) => {
  let applyHash: string | undefined;
  if (mergeStatus === "A") applyHash = aHash;
  else if (mergeStatus === "B") applyHash = bHash;
  else if (mergeStatus === "SAME") applyHash = aHash;
  else applyHash = undefined; // CONFLICT

  return {
    mergeStatus,
    aHash,
    bHash,
    baseHash,
    applyHash,
  };
};
