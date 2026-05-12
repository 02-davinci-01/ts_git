// src/types.ts — Shared interfaces and type definitions

export type FileStatus = "A" | "D" | "M" | "SAME";

export interface DiffEntry {
  status: FileStatus;
  receiver: string | undefined;
  giver: string | undefined;
}

export type Diff = Record<string, DiffEntry>;

export type MergeStatus = "SAME" | "A" | "B" | "CONFLICT";

export interface MergeEntry {
  mergeStatus: MergeStatus;
  aHash: string | undefined;
  bHash: string | undefined;
  baseHash: string | undefined;
  applyHash: string | undefined;
}

export type MergeDiff = Record<string, MergeEntry>;
