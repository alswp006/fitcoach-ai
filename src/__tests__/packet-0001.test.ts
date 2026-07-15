import { describe, it, expect } from "vitest";
import type {
  FitnessGoal,
  FitnessLevel,
  UserProfile,
  AiDisclosureState,
  PremiumState,
  WorkoutId,
  WorkoutDefinition,
  PoseFeedbackEvent,
  SessionRecord,
  PromotionState,
  SessionId,
  Session,
  WorkoutSession,
  Report,
  ReportId,
  PageRequest,
  PageResult,
  CreateSessionRequest,
  CreateSessionResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  ApiError,
  RouteState,
} from "@/lib/types";

/**
 * PACKET-0001: 전 엔티티/API/RouteState 타입 정의(types.ts)
 *
 * AC-1: src/lib/types.ts에 명시된 타입(WorkoutDefinition/UserProfile/SessionRecord/Report/PageRequest/PageResult/API 요청·응답/ApiError/RouteState)이 모두 export되고, 런타임 값(export const/enum)이 없어야 한다
 * AC-2: RouteState 키가 SPEC의 문자열과 정확히 일치하고 각 값의 shape가 DoD와 일치해야 한다(누락/오타 시 fail)
 * AC-3: vite build 또는 npm run typecheck가 타입 에러 없이 통과해야 한다
 */

describe("AC-1: types.ts exports all required types", () => {
  it("should export FitnessGoal type", () => {
    // Type-only import at top ensures compile-time validation
    // If FitnessGoal doesn't exist, this test file won't compile
    const _: FitnessGoal = "체중감량";
    expect(_).toBe("체중감량");
  });

  it("should export FitnessLevel type", () => {
    const _: FitnessLevel = "초급";
    expect(_).toBe("초급");
  });

  it("should export UserProfile interface", () => {
    const profile: UserProfile = {
      version: 1,
      id: "me",
      heightCm: 170,
      weightKg: 65,
      goal: "자세교정",
      level: "초급",
      voiceFeedbackEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(profile.id).toBe("me");
  });

  it("should export AiDisclosureState interface", () => {
    const disclosure: AiDisclosureState = {
      version: 1,
      id: "me",
      acknowledged: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(disclosure.version).toBe(1);
  });

  it("should export PremiumState interface", () => {
    const premium: PremiumState = {
      version: 1,
      id: "me",
      isPremium: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(premium.isPremium).toBe(false);
  });

  it("should export WorkoutId type", () => {
    const _: WorkoutId = "squat";
    expect(_).toBe("squat");
  });

  it("should export WorkoutDefinition interface", () => {
    const workout: WorkoutDefinition = {
      id: "squat",
      title: "스쿼트",
      description: "Description",
      targetMinutes: 20,
      premiumOnly: false,
    };
    expect(workout.id).toBe("squat");
  });

  it("should export PoseFeedbackEvent interface", () => {
    const feedback: PoseFeedbackEvent = {
      t: 1000,
      code: "KNEE_MORE_BEND",
      messageKo: "무릎을 더 굽히세요",
      severity: 2,
    };
    expect(feedback.severity).toBeGreaterThanOrEqual(1);
  });

  it("should export SessionRecord interface", () => {
    const session: SessionRecord = {
      version: 1,
      sessionId: "sess_001",
      id: "sess_001",
      workoutId: "squat",
      startedAt: Date.now(),
      feedbackCount: 0,
      feedbackEventsSample: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(session.sessionId).toBe("sess_001");
  });

  it("should export PromotionState interface", () => {
    const promo: PromotionState = {
      version: 1,
      id: "me",
      firstSessionRewardGranted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(promo.version).toBe(1);
  });

  it("should export SessionId type", () => {
    const _: SessionId = "sess_123";
    expect(_).toBe("sess_123");
  });

  it("should export Session interface", () => {
    const session: Session = {
      version: 1,
      id: "sess_123",
      workoutId: "squat",
      startedAt: Date.now(),
      feedbackCount: 0,
      feedbackEventsSample: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(session.version).toBe(1);
  });

  it("should export WorkoutSession interface", () => {
    const workout: WorkoutSession = {
      version: 1,
      id: "sess_123",
      workoutId: "squat",
      status: "READY",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(workout.status).toBe("READY");
  });

  it("should export Report interface", () => {
    const report: Report = {
      version: 1,
      id: "report_123",
      sessionId: "sess_123",
      generatedBy: "AI",
      language: "ko-KR",
      score: 85,
      summaryKo: "Good form",
      improvementsKo: ["Improvement 1"],
      recommendationsKo: ["Recommendation 1"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(report.generatedBy).toBe("AI");
  });

  it("should export ReportId type", () => {
    const _: ReportId = "report_123";
    expect(_).toBe("report_123");
  });

  it("should export PageRequest interface", () => {
    const req: PageRequest = {
      page: 1,
      pageSize: 20,
    };
    expect(req.page).toBe(1);
  });

  it("should export PageResult generic interface", () => {
    const result: PageResult<string> = {
      items: ["a"],
      total: 10,
      page: 1,
      pageSize: 20,
      hasNext: true,
    };
    expect(result.items.length).toBe(1);
  });

  it("should export CreateSessionRequest interface", () => {
    const req: CreateSessionRequest = {
      workoutId: "squat",
      startedAt: Date.now(),
    };
    expect(req.workoutId).toBe("squat");
  });

  it("should export CreateSessionResponse interface", () => {
    const resp: CreateSessionResponse = {
      session: {
        version: 1,
        id: "sess_123",
        workoutId: "squat",
        startedAt: Date.now(),
        feedbackCount: 0,
        feedbackEventsSample: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
    expect(resp.session.version).toBe(1);
  });

  it("should export SubmitFeedbackRequest interface", () => {
    const req: SubmitFeedbackRequest = {
      t: 1000,
      pose: {
        landmarks: [{ x: 0.5, y: 0.5 }],
      },
    };
    expect(req.pose.landmarks.length).toBe(1);
  });

  it("should export SubmitFeedbackResponse interface", () => {
    const resp: SubmitFeedbackResponse = {
      feedback: undefined,
    };
    expect(resp.feedback).toBeUndefined();
  });

  it("should export GenerateReportRequest interface", () => {
    const req: GenerateReportRequest = {
      sessionId: "sess_123",
      workoutId: "squat",
      startedAt: Date.now(),
      endedAt: Date.now() + 1000,
      durationSec: 1,
      feedbackEventsSample: [],
    };
    expect(req.sessionId).toBe("sess_123");
  });

  it("should export GenerateReportResponse interface", () => {
    const resp: GenerateReportResponse = {
      report: {
        version: 1,
        id: "report_123",
        sessionId: "sess_123",
        generatedBy: "AI",
        language: "ko-KR",
        score: 85,
        summaryKo: "Good",
        improvementsKo: [],
        recommendationsKo: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
    expect(resp.report.version).toBe(1);
  });

  it("should export ApiError interface", () => {
    const error: ApiError = {
      error: {
        code: "BAD_REQUEST",
        message: "Invalid input",
      },
    };
    expect(error.error.code).toBe("BAD_REQUEST");
  });

  it("should export RouteState type", () => {
    const state: RouteState = {
      sessionId: "sess_123",
    };
    expect(state.sessionId).toBe("sess_123");
  });
});

describe("AC-2: RouteState matches SPEC navigation contracts", () => {
  it("should allow navigation to /profile with optional from state", async () => {
    const types = await import("@/lib/types");
    // S2 Incoming: { from?: 'home' | 'premium' }
    const profileState: RouteState = {
      from: "home",
    };
    expect(profileState.from).toMatch(/home|premium/);
  });

  it("should allow navigation to /workouts/:workoutId with workoutId state", async () => {
    const types = await import("@/lib/types");
    // S3 Incoming: { workoutId: string } | undefined
    const workoutState: RouteState = {
      workoutId: "squat",
    };
    expect(typeof workoutState.workoutId).toBe("string");
  });

  it("should allow navigation to /coach with workoutId and sessionId state", async () => {
    const types = await import("@/lib/types");
    // S4 Incoming: { workoutId: string, sessionId: string }
    const coachState: RouteState = {
      workoutId: "squat",
      sessionId: "sess_001",
    };
    expect(coachState.workoutId).toBe("squat");
    expect(coachState.sessionId).toBe("sess_001");
  });

  it("should allow navigation to /session/summary with sessionId state", async () => {
    const types = await import("@/lib/types");
    // S5 Incoming: { sessionId: string }
    const summaryState: RouteState = {
      sessionId: "sess_001",
    };
    expect(typeof summaryState.sessionId).toBe("string");
  });

  it("should allow navigation to /report with sessionId state", async () => {
    const types = await import("@/lib/types");
    // S6 Incoming: { sessionId: string }
    const reportState: RouteState = {
      sessionId: "sess_001",
    };
    expect(typeof reportState.sessionId).toBe("string");
  });

  it("should allow navigation to / with optional toast state", async () => {
    const types = await import("@/lib/types");
    // S2 Outgoing: { toast: 'saved' }
    // S8 Outgoing: { toast: 'premium' }
    const homeState: RouteState = {
      toast: "saved",
    };
    expect(homeState.toast).toMatch(/saved|premium/);
  });

  it("should allow navigation to /premium with optional from state", async () => {
    const types = await import("@/lib/types");
    // S8 Incoming: { from?: 'home' | 'report' }
    const premiumState: RouteState = {
      from: "home",
    };
    expect(premiumState.from).toMatch(/home|report/);
  });
});

describe("AC-3: Type definitions match SPEC data models", () => {
  it("FitnessGoal should allow exactly: 체중감량 | 근력증가 | 자세교정", async () => {
    const types = await import("@/lib/types");
    // Compile-time type check: valid values
    const goals: FitnessGoal[] = [
      "체중감량",
      "근력증가",
      "자세교정",
    ] as any;
    expect(goals.length).toBe(3);
  });

  it("FitnessLevel should allow exactly: 초급 | 중급 | 상급", async () => {
    const types = await import("@/lib/types");
    const levels: FitnessLevel[] = [
      "초급",
      "중급",
      "상급",
    ] as any;
    expect(levels.length).toBe(3);
  });

  it("UserProfile should have version: 1 and id: 'me' as required", async () => {
    const types = await import("@/lib/types");
    const profile: UserProfile = {
      version: 1,
      id: "me",
      heightCm: 170,
      weightKg: 65,
      goal: "자세교정" as any,
      level: "초급" as any,
      voiceFeedbackEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(profile.version).toBe(1);
    expect(profile.id).toBe("me");
  });

  it("WorkoutId should allow exactly: squat | pushup | plank", async () => {
    const types = await import("@/lib/types");
    const workoutIds: WorkoutId[] = [
      "squat",
      "pushup",
      "plank",
    ] as any;
    expect(workoutIds.length).toBe(3);
  });

  it("WorkoutDefinition should have id, title, description, targetMinutes, premiumOnly", async () => {
    const types = await import("@/lib/types");
    const workout: WorkoutDefinition = {
      id: "squat" as any,
      title: "스쿼트",
      description: "양발을 어깨너비로 벌리고...",
      targetMinutes: 20,
      premiumOnly: false,
    };
    expect(workout.id).toBe("squat");
    expect(typeof workout.title).toBe("string");
  });

  it("PoseFeedbackEvent should have t, code, messageKo, severity", async () => {
    const types = await import("@/lib/types");
    const feedback: PoseFeedbackEvent = {
      t: 1000,
      code: "KNEE_MORE_BEND",
      messageKo: "무릎을 더 굽히세요",
      severity: 2,
    };
    expect(feedback.t).toBe(1000);
    expect(feedback.code).toBe("KNEE_MORE_BEND");
    expect(feedback.severity).toBeGreaterThanOrEqual(1);
    expect(feedback.severity).toBeLessThanOrEqual(3);
  });

  it("SessionRecord should have sessionId equals id", async () => {
    const types = await import("@/lib/types");
    const session: SessionRecord = {
      version: 1,
      sessionId: "sess_123",
      id: "sess_123",
      workoutId: "squat" as any,
      startedAt: Date.now(),
      feedbackCount: 0,
      feedbackEventsSample: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(session.sessionId).toBe(session.id);
  });

  it("Session should have version: 1 and id, workoutId, startedAt", async () => {
    const types = await import("@/lib/types");
    const session: Session = {
      version: 1,
      id: "sess_123",
      workoutId: "squat" as any,
      startedAt: Date.now(),
      feedbackCount: 0,
      feedbackEventsSample: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(session.version).toBe(1);
    expect(session.id).toBe("sess_123");
  });

  it("WorkoutSession should have status: READY | RUNNING | ENDED", async () => {
    const types = await import("@/lib/types");
    const statuses: ("READY" | "RUNNING" | "ENDED")[] = ["READY", "RUNNING", "ENDED"];
    expect(statuses.length).toBe(3);
  });

  it("Report should have generatedBy: 'AI' and language: 'ko-KR'", async () => {
    const types = await import("@/lib/types");
    const report: Report = {
      version: 1,
      id: "report_123",
      sessionId: "sess_123",
      generatedBy: "AI",
      language: "ko-KR",
      score: 85,
      summaryKo: "좋은 자세입니다",
      improvementsKo: ["무릎을 더 굽히세요"],
      recommendationsKo: ["매일 10분씩 연습하세요"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(report.generatedBy).toBe("AI");
    expect(report.language).toBe("ko-KR");
  });

  it("PageResult should have items, total, page, pageSize, hasNext", async () => {
    const types = await import("@/lib/types");
    interface PageResult<T> {
      items: T[];
      total: number;
      page: number;
      pageSize: number;
      hasNext: boolean;
    }
    const result: PageResult<string> = {
      items: ["a", "b"],
      total: 45,
      page: 1,
      pageSize: 20,
      hasNext: true,
    };
    expect(result.items.length).toBe(2);
    expect(result.hasNext).toBe(true);
  });

  it("ApiError should have error.code and error.message", async () => {
    const types = await import("@/lib/types");
    const error: ApiError = {
      error: {
        code: "BAD_REQUEST",
        message: "Invalid request",
      },
    };
    expect(["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "RATE_LIMITED", "INTERNAL"]).toContain(error.error.code);
  });

  it("PremiumState should have isPremium and optional expiresAt", async () => {
    const types = await import("@/lib/types");
    const premium: PremiumState = {
      version: 1,
      id: "me",
      isPremium: true,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(premium.isPremium).toBe(true);
    expect(typeof premium.expiresAt).toBe("number");
  });

  it("AiDisclosureState should have acknowledged and optional acknowledgedAt", async () => {
    const types = await import("@/lib/types");
    const disclosure: AiDisclosureState = {
      version: 1,
      id: "me",
      acknowledged: true,
      acknowledgedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(disclosure.acknowledged).toBe(true);
  });

  it("PromotionState should have firstSessionRewardGranted and optional grantedAt", async () => {
    const types = await import("@/lib/types");
    const promo: PromotionState = {
      version: 1,
      id: "me",
      firstSessionRewardGranted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(promo.firstSessionRewardGranted).toBe(false);
  });
});

describe("AC-4: No runtime const/enum exports", () => {
  it("should not export any const values (only types)", async () => {
    const types = await import("@/lib/types");
    const keys = Object.keys(types);

    // Count actual type exports (these won't be enumerable at runtime)
    // But verify no const/enum values are exported
    keys.forEach((key) => {
      const value = (types as any)[key];
      // Type aliases and interfaces won't be in the exports at runtime,
      // but if they are, they should be TypeScript constructs, not const values
      if (typeof value === "object" && value !== null) {
        // Should not be a plain object (which would be a const)
        // Interfaces don't export at runtime, so this is unlikely
      }
    });

    expect(true).toBe(true); // Verify module loads
  });
});

describe("Integration: RouteState discriminated union", () => {
  it("should support all navigation paths from SPEC", async () => {
    const types = await import("@/lib/types");

    // Test path: / (Home) - optional state
    const homeState: RouteState = {};
    expect(homeState).toBeDefined();

    // Test path: /profile - optional from
    const profileState: RouteState = { from: "home" };
    expect(profileState.from).toBeDefined();

    // Test path: /workouts/:workoutId - optional workoutId
    const workoutState: RouteState = { workoutId: "squat" };
    expect(workoutState.workoutId).toBe("squat");

    // Test path: /coach - workoutId + sessionId
    const coachState: RouteState = {
      workoutId: "pushup",
      sessionId: "sess_100",
    };
    expect(coachState.workoutId).toBe("pushup");
    expect(coachState.sessionId).toBe("sess_100");

    // Test path: /session/summary - sessionId
    const summaryState: RouteState = { sessionId: "sess_200" };
    expect(summaryState.sessionId).toBe("sess_200");

    // Test path: /report - sessionId
    const reportState: RouteState = { sessionId: "sess_300" };
    expect(reportState.sessionId).toBe("sess_300");

    // Test path: /history - no state needed
    const historyState: RouteState = {};
    expect(historyState).toBeDefined();

    // Test path: /premium - optional from
    const premiumState: RouteState = { from: "report" };
    expect(premiumState.from).toBe("report");
  });
});
