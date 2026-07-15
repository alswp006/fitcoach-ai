import { describe, it, expect } from "vitest";
import type { WorkoutDefinition, WorkoutId } from "@/lib/types";
import { WORKOUTS, getWorkoutById } from "@/lib/workouts";

describe("Packet 0005: 번들 운동 정의 3종 상수 + 조회 유틸", () => {
  // ============================================================================
  // AC-1: WORKOUTS 배열 길이가 정확히 3이고 각 title이 정확한 텍스트 포함
  // ============================================================================

  it("AC-1[P0]: WORKOUTS 배열 길이는 정확히 3이다", () => {
    expect(Array.isArray(WORKOUTS)).toBe(true);
    expect(WORKOUTS.length).toBe(3);
  });

  it("AC-1[P0]: 첫 번째 운동 title이 '스쿼트'를 포함한다", () => {
    expect(WORKOUTS[0]).toBeDefined();
    expect(WORKOUTS[0].title).toContain("스쿼트");
  });

  it("AC-1[P0]: 두 번째 운동 title이 '푸쉬업'을 포함한다", () => {
    expect(WORKOUTS[1]).toBeDefined();
    expect(WORKOUTS[1].title).toContain("푸쉬업");
  });

  it("AC-1[P0]: 세 번째 운동 title이 '플랭크'를 포함한다", () => {
    expect(WORKOUTS[2]).toBeDefined();
    expect(WORKOUTS[2].title).toContain("플랭크");
  });

  // ============================================================================
  // AC-2: plank 항목의 premiumOnly가 true
  // ============================================================================

  it("AC-2[P0]: plank 항목의 premiumOnly는 true이다", () => {
    const plank = WORKOUTS.find((w: WorkoutDefinition) => w.id === "plank");
    expect(plank).toBeDefined();
    expect(plank?.premiumOnly).toBe(true);
  });

  // ============================================================================
  // AC-3: getWorkoutById(id) 존재하면 WorkoutDefinition, 없으면 null
  // ============================================================================

  it("AC-3[P0]: getWorkoutById('squat')는 스쿼트 정의를 반환한다", () => {
    const workout = getWorkoutById("squat");
    expect(workout).not.toBeNull();
    expect(workout?.id).toBe("squat");
    expect(workout?.title).toContain("스쿼트");
    expect(workout?.premiumOnly).toBe(false);
  });

  it("AC-3[P0]: getWorkoutById('pushup')는 푸쉬업 정의를 반환한다", () => {
    const workout = getWorkoutById("pushup");
    expect(workout).not.toBeNull();
    expect(workout?.id).toBe("pushup");
    expect(workout?.title).toContain("푸쉬업");
    expect(workout?.premiumOnly).toBe(false);
  });

  it("AC-3[P0]: getWorkoutById('plank')는 플랭크 정의를 반환한다 (premiumOnly=true)", () => {
    const workout = getWorkoutById("plank");
    expect(workout).not.toBeNull();
    expect(workout?.id).toBe("plank");
    expect(workout?.title).toContain("플랭크");
    expect(workout?.premiumOnly).toBe(true);
  });

  it("AC-3[P0]: getWorkoutById(invalidId)는 null을 반환한다", () => {
    const workout = getWorkoutById("invalid" as WorkoutId);
    expect(workout).toBeNull();
  });

  // ============================================================================
  // ADDITIONAL: WorkoutDefinition 구조 검증
  // ============================================================================

  it("each workout has all required fields", () => {
    WORKOUTS.forEach((workout: WorkoutDefinition) => {
      expect(workout.id).toBeDefined();
      expect(workout.title).toBeDefined();
      expect(workout.description).toBeDefined();
      expect(workout.targetMinutes).toBeDefined();
      expect(workout.premiumOnly).toBeDefined();
      expect(typeof workout.id).toBe("string");
      expect(typeof workout.title).toBe("string");
      expect(typeof workout.description).toBe("string");
      expect(typeof workout.targetMinutes).toBe("number");
      expect(typeof workout.premiumOnly).toBe("boolean");
    });
  });

  it("squat and pushup have premiumOnly=false", () => {
    const squat = WORKOUTS.find((w: WorkoutDefinition) => w.id === "squat");
    const pushup = WORKOUTS.find((w: WorkoutDefinition) => w.id === "pushup");
    expect(squat?.premiumOnly).toBe(false);
    expect(pushup?.premiumOnly).toBe(false);
  });

  it("all workouts have positive targetMinutes", () => {
    WORKOUTS.forEach((workout: WorkoutDefinition) => {
      expect(workout.targetMinutes).toBeGreaterThan(0);
    });
  });
});
