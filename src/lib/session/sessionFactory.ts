import type { SessionRecord, WorkoutId } from "@/lib/types";

/**
 * Generates a unique session ID.
 * @returns Non-empty unique session identifier string
 */
export function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Builds an initial SessionRecord for a new workout session.
 * @param opts.workoutId - The workout type (squat, pushup, plank)
 * @param opts.now - Timestamp for createdAt/updatedAt (defaults to Date.now() if omitted)
 * @returns Fully populated SessionRecord with required fields initialized
 */
export function buildInitialSessionRecord(opts: {
  workoutId: WorkoutId;
  now?: number;
}): SessionRecord {
  const now = opts.now ?? Date.now();
  const sessionId = createSessionId();

  return {
    version: 1,
    sessionId,
    id: sessionId,
    workoutId: opts.workoutId,
    startedAt: now,
    feedbackCount: 0,
    feedbackEventsSample: [],
    createdAt: now,
    updatedAt: now,
  };
}
