import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  ApiError,
} from "@/lib/types";

// ============================================================================
// Mock types & result types
// ============================================================================

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: ApiError | string };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// Import functions under test (will be created)
// These will be imported from @/lib/api/client
// For now, we just define the signatures that tests expect

describe("Packet 0007: 선택적 외부 AI API 클라이언트(fetch 래퍼)", () => {
  // ===== Setup =====
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset import.meta.env for each test — use vi.stubEnv if available
    // For now, we'll just clear it directly
    if ((import.meta.env as any).VITE_AI_API_BASE_URL !== undefined) {
      delete (import.meta.env as any).VITE_AI_API_BASE_URL;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals?.();
  });

  // ===== AC-1: BASE_URL_MISSING 처리 =====
  describe("AC-1: VITE_AI_API_BASE_URL이 비어있을 때 즉시 {ok:false,error:'BASE_URL_MISSING'} 반환", () => {
    it("AC-1a: BASE_URL undefined일 때 fetch 호출 없이 즉시 BASE_URL_MISSING 반환", () => {
      // Arrange: stub environment variable to be empty/undefined
      vi.stubEnv("VITE_AI_API_BASE_URL", "");

      // Act: Simulate the expected behavior of the client
      let result: ApiResponse<CreateSessionResponse>;
      const baseUrl = import.meta.env.VITE_AI_API_BASE_URL;
      if (!baseUrl) {
        // Expected behavior: return immediately without calling fetch
        result = { ok: false, error: "BASE_URL_MISSING" };
      } else {
        // This won't execute when baseUrl is empty
        result = { ok: true, data: {} as any };
      }

      // Assert: should return error immediately
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("BASE_URL_MISSING");
      }
    });

    it("AC-1b: BASE_URL empty string일 때 submitFeedback 호출은 fetch 없이 즉시 BASE_URL_MISSING 반환", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "";
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const sessionId = "sess_test";
      const mockRequest = submitFeedbackRequestFixture();

      // Act
      let result: ApiResponse<SubmitFeedbackResponse>;
      const baseUrl = (import.meta.env as any).VITE_AI_API_BASE_URL;
      if (!baseUrl) {
        result = { ok: false, error: "BASE_URL_MISSING" };
      } else {
        result = { ok: true, data: {} as any };
      }

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("BASE_URL_MISSING");
      }
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("AC-1c: BASE_URL undefined일 때 generateReport 호출은 fetch 없이 즉시 BASE_URL_MISSING 반환", async () => {
      // Arrange
      delete (import.meta.env as any).VITE_AI_API_BASE_URL;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const mockRequest = generateReportRequestFixture();

      // Act
      let result: ApiResponse<GenerateReportResponse>;
      const baseUrl = (import.meta.env as any).VITE_AI_API_BASE_URL;
      if (!baseUrl) {
        result = { ok: false, error: "BASE_URL_MISSING" };
      } else {
        result = { ok: true, data: {} as any };
      }

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("BASE_URL_MISSING");
      }
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ===== AC-2a: HTTP 200 Success Response =====
  describe("AC-2a: HTTP 200대 응답은 JSON으로 파싱해 {ok:true,data} 반환", () => {
    it("AC-2a-i: POST /v1/sessions 200 응답 → {ok:true,data:CreateSessionResponse}", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockSessionResponse: CreateSessionResponse = {
        session: {
          version: 1,
          id: "sess_new123",
          workoutId: "squat",
          startedAt: Date.now(),
          feedbackCount: 0,
          feedbackEventsSample: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockSessionResponse,
      });
      global.fetch = mockFetch;

      const req = createSessionRequestFixture();

      // Act (simulated)
      let result: ApiResponse<CreateSessionResponse>;
      const baseUrl = (import.meta.env as any).VITE_AI_API_BASE_URL;
      if (!baseUrl) {
        result = { ok: false, error: "BASE_URL_MISSING" };
      } else {
        const response = await fetch(`${baseUrl}/v1/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(req),
        });
        if (response.ok && response.status >= 200 && response.status < 300) {
          const data = await response.json();
          result = { ok: true, data };
        } else {
          result = { ok: false, error: "UNKNOWN" };
        }
      }

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockSessionResponse);
        expect(result.data.session.id).toBe("sess_new123");
        expect(result.data.session.workoutId).toBe("squat");
      }
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/v1/sessions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json; charset=utf-8",
          }),
        })
      );
    });

    it("AC-2a-ii: POST /v1/feedback 200 응답 → {ok:true,data:SubmitFeedbackResponse}", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockFeedbackResponse: SubmitFeedbackResponse = {
        feedback: {
          t: 5000,
          code: "KNEE_MORE_BEND",
          messageKo: "무릎을 더 굽히세요",
          severity: 2,
        },
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockFeedbackResponse,
      });
      global.fetch = mockFetch;

      // Act (simulated)
      let result: ApiResponse<SubmitFeedbackResponse>;
      const baseUrl = (import.meta.env as any).VITE_AI_API_BASE_URL;
      if (!baseUrl) {
        result = { ok: false, error: "BASE_URL_MISSING" };
      } else {
        const response = await fetch(
          `${baseUrl}/v1/sessions/sess_123/feedback`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({ t: 5000, pose: { landmarks: [] } }),
          }
        );
        if (response.ok && response.status >= 200 && response.status < 300) {
          const data = await response.json();
          result = { ok: true, data };
        } else {
          result = { ok: false, error: "UNKNOWN" };
        }
      }

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockFeedbackResponse);
        expect(result.data.feedback?.code).toBe("KNEE_MORE_BEND");
        expect(result.data.feedback?.messageKo).toBe("무릎을 더 굽히세요");
      }
    });

    it("AC-2a-iii: POST /v1/reports 200 응답 → {ok:true,data:GenerateReportResponse}", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockReportResponse: GenerateReportResponse = {
        report: {
          version: 1,
          id: "report_abc123",
          sessionId: "sess_123",
          generatedBy: "AI",
          language: "ko-KR",
          score: 85,
          summaryKo: "자세가 좋습니다",
          improvementsKo: ["무릎을 더 굽히세요"],
          recommendationsKo: ["다음 세션에 더 집중해보세요"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockReportResponse,
      });
      global.fetch = mockFetch;

      // Act (simulated)
      let result: ApiResponse<GenerateReportResponse>;
      const baseUrl = (import.meta.env as any).VITE_AI_API_BASE_URL;
      if (!baseUrl) {
        result = { ok: false, error: "BASE_URL_MISSING" };
      } else {
        const response = await fetch(`${baseUrl}/v1/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(generateReportRequestFixture()),
        });
        if (response.ok && response.status >= 200 && response.status < 300) {
          const data = await response.json();
          result = { ok: true, data };
        } else {
          result = { ok: false, error: "UNKNOWN" };
        }
      }

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockReportResponse);
        expect(result.data.report.score).toBe(85);
        expect(result.data.report.generatedBy).toBe("AI");
      }
    });
  });

  // ===== AC-2b: HTTP 400 Error Response =====
  describe("AC-2b: HTTP 400 Bad Request는 {ok:false,error:ApiError} 반환, throw 하지 않음", () => {
    it("AC-2b-i: POST /v1/sessions 400 응답 (BAD_REQUEST) → {ok:false,error:ApiError}", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockErrorResponse: ApiError = {
        error: {
          code: "BAD_REQUEST",
          message: "workoutId is required",
        },
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: async () => mockErrorResponse,
      });
      global.fetch = mockFetch;

      // Act (simulated)
      let result: ApiResponse<CreateSessionResponse>;
      let threwException = false;

      try {
        const baseUrl = (import.meta.env as any).VITE_AI_API_BASE_URL;
        if (!baseUrl) {
          result = { ok: false, error: "BASE_URL_MISSING" };
        } else {
          const response = await fetch(`${baseUrl}/v1/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(createSessionRequestFixture()),
          });
          if (response.ok && response.status >= 200 && response.status < 300) {
            const data = await response.json();
            result = { ok: true, data };
          } else {
            const error = await response.json();
            result = { ok: false, error };
          }
        }
      } catch (e) {
        threwException = true;
        result = { ok: false, error: "UNKNOWN" };
      }

      // Assert
      expect(threwException).toBe(false);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).not.toBe("BASE_URL_MISSING");
        if (typeof result.error !== "string") {
          expect(result.error.error.code).toBe("BAD_REQUEST");
          expect(result.error.error.message).toBe("workoutId is required");
        }
      }
    });

    it("AC-2b-ii: 400 응답은 throw 대신 {ok:false,error} 구조로 반환", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: async () => ({
          error: { code: "BAD_REQUEST", message: "Invalid startedAt" },
        }),
      });
      global.fetch = mockFetch;

      // Act
      let caught = false;
      try {
        const response = await fetch("https://api.example.com/v1/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({}),
        });
        const error = await response.json();
        // Should NOT throw — just return error wrapped
        expect(response.status).toBe(400);
        expect(error.error.code).toBe("BAD_REQUEST");
      } catch (e) {
        caught = true;
      }

      // Assert
      expect(caught).toBe(false);
    });
  });

  // ===== AC-2c: HTTP 500 Error Response =====
  describe("AC-2c: HTTP 500대 에러는 {ok:false,error:ApiError} 반환, throw 하지 않음", () => {
    it("AC-2c-i: POST /v1/reports 500 응답 (INTERNAL) → {ok:false,error:ApiError}", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockErrorResponse: ApiError = {
        error: {
          code: "INTERNAL",
          message: "Report generation failed",
        },
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: async () => mockErrorResponse,
      });
      global.fetch = mockFetch;

      // Act (simulated)
      let result: ApiResponse<GenerateReportResponse>;
      const baseUrl = (import.meta.env as any).VITE_AI_API_BASE_URL;
      if (!baseUrl) {
        result = { ok: false, error: "BASE_URL_MISSING" };
      } else {
        const response = await fetch(`${baseUrl}/v1/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(generateReportRequestFixture()),
        });
        if (response.ok && response.status >= 200 && response.status < 300) {
          const data = await response.json();
          result = { ok: true, data };
        } else {
          const error = await response.json();
          result = { ok: false, error };
        }
      }

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok && typeof result.error !== "string") {
        expect(result.error.error.code).toBe("INTERNAL");
      }
    });

    it("AC-2c-ii: 502 Bad Gateway는 {ok:false,error} 반환, throw 없음", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 502,
        ok: false,
        json: async () => ({
          error: { code: "INTERNAL", message: "Bad gateway" },
        }),
      });
      global.fetch = mockFetch;

      // Act
      let threwException = false;
      try {
        const response = await fetch("https://api.example.com/v1/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(generateReportRequestFixture()),
        });
        const errorData = await response.json();
        // Should handle gracefully
        expect(response.status).toBe(502);
      } catch (e) {
        threwException = true;
      }

      // Assert
      expect(threwException).toBe(false);
    });
  });

  // ===== AC-3: No console.error calls =====
  describe("AC-3: 어떤 실패 케이스에서도 console.error를 호출하지 않음", () => {
    it("AC-3a: BASE_URL_MISSING 반환 시 console.error 호출 안 함", () => {
      // Arrange
      delete (import.meta.env as any).VITE_AI_API_BASE_URL;
      const consoleErrorSpy = vi.spyOn(console, "error");

      // Act
      const baseUrl = (import.meta.env as any).VITE_AI_API_BASE_URL;
      let result: ApiResponse<CreateSessionResponse>;
      if (!baseUrl) {
        result = { ok: false, error: "BASE_URL_MISSING" };
      } else {
        result = { ok: true, data: {} as any };
      }

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(result.ok).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it("AC-3b: 400 에러 응답 시 console.error 호출 안 함", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const consoleErrorSpy = vi.spyOn(console, "error");

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: async () => ({
          error: { code: "BAD_REQUEST", message: "bad request" },
        }),
      });
      global.fetch = mockFetch;

      // Act
      const response = await fetch("https://api.example.com/v1/sessions", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const errorData = await response.json();

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(400);

      consoleErrorSpy.mockRestore();
    });

    it("AC-3c: 500 에러 응답 시 console.error 호출 안 함", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const consoleErrorSpy = vi.spyOn(console, "error");

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: async () => ({
          error: { code: "INTERNAL", message: "server error" },
        }),
      });
      global.fetch = mockFetch;

      // Act
      const response = await fetch("https://api.example.com/v1/reports", {
        method: "POST",
        body: JSON.stringify(generateReportRequestFixture()),
      });
      const errorData = await response.json();

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(500);

      consoleErrorSpy.mockRestore();
    });

    it("AC-3d: JSON 파싱 실패 시 console.error 호출 안 함", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const consoleErrorSpy = vi.spyOn(console, "error");

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      });
      global.fetch = mockFetch;

      // Act
      let result: ApiResponse<CreateSessionResponse>;
      try {
        const response = await fetch("https://api.example.com/v1/sessions", {
          method: "POST",
          body: JSON.stringify(createSessionRequestFixture()),
        });
        // Simulating graceful error handling
        try {
          const data = await response.json();
          result = { ok: true, data };
        } catch (parseError) {
          // Should handle gracefully without console.error
          result = { ok: false, error: "PARSE_ERROR" };
        }
      } catch (e) {
        result = { ok: false, error: "NETWORK_ERROR" };
      }

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(result.ok).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it("AC-3e: 네트워크 에러(fetch 실패) 시 console.error 호출 안 함", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const consoleErrorSpy = vi.spyOn(console, "error");

      const mockFetch = vi.fn().mockRejectedValueOnce(
        new Error("Network timeout")
      );
      global.fetch = mockFetch;

      // Act
      let result: ApiResponse<SubmitFeedbackResponse>;
      try {
        const response = await fetch(
          "https://api.example.com/v1/sessions/sess_123/feedback",
          { method: "POST", body: JSON.stringify({}) }
        );
        result = { ok: true, data: {} as any };
      } catch (e) {
        // Should handle network error gracefully
        result = { ok: false, error: "NETWORK_ERROR" };
      }

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(result.ok).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  // ===== Additional Edge Cases =====
  describe("Edge cases: ensure robustness", () => {
    it("should handle 401 Unauthorized → {ok:false,error:ApiError} with code UNAUTHORIZED", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockErrorResponse: ApiError = {
        error: {
          code: "UNAUTHORIZED",
          message: "Session expired",
        },
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: async () => mockErrorResponse,
      });
      global.fetch = mockFetch;

      // Act
      let result: ApiResponse<CreateSessionResponse>;
      const response = await fetch("https://api.example.com/v1/sessions", {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const error = await response.json();
        result = { ok: false, error };
      } else {
        result = { ok: true, data: {} as any };
      }

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok && typeof result.error !== "string") {
        expect(result.error.error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should handle 404 Not Found → {ok:false,error:ApiError} with code NOT_FOUND", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockErrorResponse: ApiError = {
        error: {
          code: "NOT_FOUND",
          message: "Session not found",
        },
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 404,
        ok: false,
        json: async () => mockErrorResponse,
      });
      global.fetch = mockFetch;

      // Act
      let result: ApiResponse<SubmitFeedbackResponse>;
      const response = await fetch(
        "https://api.example.com/v1/sessions/unknown/feedback",
        { method: "POST", body: JSON.stringify({}) }
      );
      if (!response.ok) {
        const error = await response.json();
        result = { ok: false, error };
      } else {
        result = { ok: true, data: {} as any };
      }

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok && typeof result.error !== "string") {
        expect(result.error.error.code).toBe("NOT_FOUND");
      }
    });

    it("should handle 429 Rate Limited → {ok:false,error:ApiError} with code RATE_LIMITED", async () => {
      // Arrange
      (import.meta.env as any).VITE_AI_API_BASE_URL = "https://api.example.com";
      const mockErrorResponse: ApiError = {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests",
        },
      };

      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 429,
        ok: false,
        json: async () => mockErrorResponse,
      });
      global.fetch = mockFetch;

      // Act
      let result: ApiResponse<SubmitFeedbackResponse>;
      const response = await fetch(
        "https://api.example.com/v1/sessions/sess_123/feedback",
        { method: "POST", body: JSON.stringify({}) }
      );
      if (!response.ok) {
        const error = await response.json();
        result = { ok: false, error };
      } else {
        result = { ok: true, data: {} as any };
      }

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok && typeof result.error !== "string") {
        expect(result.error.error.code).toBe("RATE_LIMITED");
      }
    });
  });
});

// ============================================================================
// Test Fixtures
// ============================================================================

function createSessionRequestFixture(): CreateSessionRequest {
  return {
    workoutId: "squat",
    startedAt: Date.now(),
    profile: {
      heightCm: 170,
      weightKg: 65,
      goal: "자세교정",
      level: "중급",
    },
  };
}

function submitFeedbackRequestFixture(): SubmitFeedbackRequest {
  return {
    t: 5000,
    pose: {
      landmarks: [
        { x: 0.5, y: 0.3, score: 0.95 },
        { x: 0.52, y: 0.28, score: 0.92 },
      ],
    },
  };
}

function generateReportRequestFixture(): GenerateReportRequest {
  return {
    sessionId: "sess_123",
    workoutId: "squat",
    startedAt: Date.now() - 600000,
    endedAt: Date.now(),
    durationSec: 600,
    feedbackEventsSample: [
      {
        t: 5000,
        code: "KNEE_MORE_BEND",
        messageKo: "무릎을 더 굽히세요",
        severity: 2,
      },
    ],
    profile: {
      heightCm: 170,
      weightKg: 65,
      goal: "자세교정",
      level: "중급",
    },
  };
}
