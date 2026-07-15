import type { WorkoutDefinition, WorkoutId } from "@/lib/types";

export const WORKOUTS: WorkoutDefinition[] = [
  {
    id: "squat",
    title: "스쿼트",
    description: "하체와 엉덩이 근력을 강화하는 기본 운동입니다.",
    targetMinutes: 5,
    premiumOnly: false,
  },
  {
    id: "pushup",
    title: "푸쉬업",
    description: "가슴, 어깨, 팔 삼두근을 강화하는 상체 운동입니다.",
    targetMinutes: 5,
    premiumOnly: false,
  },
  {
    id: "plank",
    title: "플랭크",
    description: "코어 근력과 자세 안정성을 강화하는 프리미엄 운동입니다.",
    targetMinutes: 3,
    premiumOnly: true,
  },
];

export function getWorkoutById(id: WorkoutId): WorkoutDefinition | null {
  return WORKOUTS.find((workout) => workout.id === id) ?? null;
}
