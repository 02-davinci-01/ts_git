import { Diff, DiffEntry, FileStatus } from "./types.js";

export const tocDiff = (
  receiver: Record<string, string>,
  giver: Record<string, string>,
): Diff => {
  const diffRecord: Diff = {};

  // Collect all unique file paths from both sides
  const allFiles = new Set([...Object.keys(receiver), ...Object.keys(giver)]);

  for (const file of allFiles) {
    const inReceiver = Object.hasOwn(receiver, file);
    const inGiver = Object.hasOwn(giver, file);

    if (inReceiver && !inGiver) {
      // Exists in receiver but not in giver → Deleted
      diffRecord[file] = {
        status: "D",
        receiver: receiver[file],
        giver: undefined,
      };
    } else if (!inReceiver && inGiver) {
      // Exists in giver but not in receiver → Added
      diffRecord[file] = {
        status: "A",
        receiver: undefined,
        giver: giver[file],
      };
    } else if (receiver[file] !== giver[file]) {
      // Exists in both but hashes differ → Modified
      diffRecord[file] = {
        status: "M",
        receiver: receiver[file],
        giver: giver[file],
      };
    } else {
      // Exists in both with same hash → Same (unchanged)
      diffRecord[file] = {
        status: "SAME",
        receiver: receiver[file],
        giver: giver[file],
      };
    }
  }

  return diffRecord;
};
