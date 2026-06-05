import { db } from "~/server/clients/db";
import type { ReconstructedMessage } from "../types";

// Memory flush is disabled in stateless automation mode.
// User-added memories are managed manually via the Settings UI.

interface MemoryFlushParams {
  instanceId: string;
  anthropicModel: string;
  messages: ReconstructedMessage[];
  compactionCount: number;
}

interface MemoryFlushResult {
  memoriesSaved: number;
}

export async function runMemoryFlush(
  _params: MemoryFlushParams,
): Promise<MemoryFlushResult> {
  // No-op: memory flush disabled. Manual memories are added via Settings UI.
  void db;
  return { memoriesSaved: 0 };
}
