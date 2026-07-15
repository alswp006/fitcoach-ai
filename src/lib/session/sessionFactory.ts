import type { SessionRecord, WorkoutId } from "@/lib/types";

/**
 * Generates a unique session ID.
 * @returns Non-empty unique session identifier string
 */
export function createSessionId(): string {
  throw new Error("Not implemented");
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
  throw new Error("Not implemented");
}
