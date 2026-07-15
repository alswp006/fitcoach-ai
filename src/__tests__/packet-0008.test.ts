import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  GenerateReportRequest,
  GenerateReportResponse,
} from "@/lib/types";

// Mock the client module
vi.mock("@/lib/api/client", () => ({
  createSession: vi.fn(),
  submitFeedback: vi.fn(),
  generateReport: vi.fn(),
}));

// Import mocked client
import * as clientModule from "@/lib/api/client";
const mockClientModule = clientModule as any;

// Import endpoints module
import * as endpointsModule from "@/lib/api/endpoints";

describe("packet-0008: AI API Endpoint Functions (createRemoteSession/submitRemoteFeedback/generateRemoteReport)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // AC-1: Export functions with Request/Response types, return {ok:true,value}
  // ============================================================================

  describe("AC-1: createRemoteSession exports and returns {ok:true,value} on success", () => {
    it("should return {ok:true,value} with CreateSessionResponse when client succeeds", async () => {
      if (!endpoints?.createRemoteSession) {
        expect.fail("createRemoteSession not implemented");
      }

      const mockRequest: CreateSessionRequest = {
        workoutId: "squat",
        startedAt: 1000,
        profile: {
          heightCm: 180,
          weightKg: 75,
          goal: "체중감량",
          level: "중급",
        },
      };

      const mockResponse: CreateSessionResponse = {
        session: {
          version: 1,
          id: "session-123",
          workoutId: "squat",
          startedAt: 1000,
          feedbackCount: 0,
          feedbackEventsSample: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: true,
        data: mockResponse,
      });

      const result = await endpoints.createRemoteSession(mockRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResponse);
        expect(result.value.session.id).toBe("session-123");
        expect(result.value.session.workoutId).toBe("squat");
      }
    });

    it("should be a function export from endpoints module", async () => {
      expect(endpoints?.createRemoteSession).toBeDefined();
      expect(typeof endpoints?.createRemoteSession).toBe("function");
    });
  });

  describe("AC-1: submitRemoteFeedback exports and returns {ok:true,value} on success", () => {
    it("should return {ok:true,value} with SubmitFeedbackResponse when client succeeds", async () => {
      if (!endpoints?.submitRemoteFeedback) {
        expect.fail("submitRemoteFeedback not implemented");
      }

      const sessionId = "session-123";
      const mockRequest: SubmitFeedbackRequest = {
        t: 5000,
        pose: {
          landmarks: [
            { x: 0.5, y: 0.3, score: 0.9 },
            { x: 0.4, y: 0.4, score: 0.85 },
          ],
        },
      };

      const mockResponse: SubmitFeedbackResponse = {
        feedback: {
          t: 5000,
          code: "KNEE_MORE_BEND",
          messageKo: "무릎을 더 굽히세요",
          severity: 2,
        },
      };

      mockClientModule.submitFeedback.mockResolvedValueOnce({
        ok: true,
        data: mockResponse,
      });

      const result = await endpoints.submitRemoteFeedback(sessionId, mockRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResponse);
        expect(result.value.feedback?.code).toBe("KNEE_MORE_BEND");
        expect(result.value.feedback?.severity).toBe(2);
      }
    });

    it("should be a function export from endpoints module", async () => {
      expect(endpoints?.submitRemoteFeedback).toBeDefined();
      expect(typeof endpoints?.submitRemoteFeedback).toBe("function");
    });
  });

  describe("AC-1: generateRemoteReport exports and returns {ok:true,value} on success", () => {
    it("should return {ok:true,value} with GenerateReportResponse when client succeeds", async () => {
      if (!endpoints?.generateRemoteReport) {
        expect.fail("generateRemoteReport not implemented");
      }

      const mockRequest: GenerateReportRequest = {
        sessionId: "session-123",
        workoutId: "squat",
        startedAt: 1000,
        endedAt: 2000,
        durationSec: 60,
        feedbackEventsSample: [
          {
            t: 500,
            code: "KNEE_MORE_BEND",
            messageKo: "무릎을 더 굽히세요",
            severity: 2,
          },
        ],
        profile: {
          heightCm: 180,
          weightKg: 75,
          goal: "체중감량",
          level: "중급",
        },
      };

      const mockResponse: GenerateReportResponse = {
        report: {
          version: 1,
          id: "report-123",
          sessionId: "session-123",
          generatedBy: "AI",
          language: "ko-KR",
          score: 78,
          summaryKo: "좋은 자세입니다",
          improvementsKo: ["무릎을 더 굽히세요", "등을 더 펴세요"],
          recommendationsKo: ["더 많은 연습이 필요합니다"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      mockClientModule.generateReport.mockResolvedValueOnce({
        ok: true,
        data: mockResponse,
      });

      const result = await endpoints.generateRemoteReport(mockRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResponse);
        expect(result.value.report.id).toBe("report-123");
        expect(result.value.report.score).toBe(78);
        expect(result.value.report.generatedBy).toBe("AI");
      }
    });

    it("should be a function export from endpoints module", async () => {
      expect(endpoints?.generateRemoteReport).toBeDefined();
      expect(typeof endpoints?.generateRemoteReport).toBe("function");
    });
  });

  // ============================================================================
  // AC-2: Handle unavailable/error cases with {ok:false,reason}
  // ============================================================================

  describe("AC-2: createRemoteSession returns {ok:false,reason} when client fails", () => {
    it("should return {ok:false,reason:'REMOTE_UNAVAILABLE'} when BASE_URL is missing", async () => {
      if (!endpoints?.createRemoteSession) {
        expect.fail("createRemoteSession not implemented");
      }

      const mockRequest: CreateSessionRequest = {
        workoutId: "squat",
        startedAt: 1000,
      };

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: false,
        error: "BASE_URL_MISSING",
      });

      const result = await endpoints.createRemoteSession(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("REMOTE_UNAVAILABLE");
      }
    });

    it("should return {ok:false,reason:'REMOTE_ERROR'} when client has network error", async () => {
      if (!endpoints?.createRemoteSession) {
        expect.fail("createRemoteSession not implemented");
      }

      const mockRequest: CreateSessionRequest = {
        workoutId: "squat",
        startedAt: 1000,
      };

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: false,
        error: "NETWORK_ERROR",
      });

      const result = await endpoints.createRemoteSession(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("REMOTE_ERROR");
      }
    });

    it("should return {ok:false,reason:'REMOTE_ERROR'} when client has parse error", async () => {
      if (!endpoints?.createRemoteSession) {
        expect.fail("createRemoteSession not implemented");
      }

      const mockRequest: CreateSessionRequest = {
        workoutId: "squat",
        startedAt: 1000,
      };

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: false,
        error: "PARSE_ERROR",
      });

      const result = await endpoints.createRemoteSession(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("REMOTE_ERROR");
      }
    });

    it("should return {ok:false,reason:'REMOTE_ERROR'} when client returns API error", async () => {
      if (!endpoints?.createRemoteSession) {
        expect.fail("createRemoteSession not implemented");
      }

      const mockRequest: CreateSessionRequest = {
        workoutId: "squat",
        startedAt: 1000,
      };

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: false,
        error: {
          error: {
            code: "INTERNAL",
            message: "Server error",
          },
        },
      });

      const result = await endpoints.createRemoteSession(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("REMOTE_ERROR");
      }
    });

    it("should NOT throw when client fails", async () => {
      if (!endpoints?.createRemoteSession) {
        expect.fail("createRemoteSession not implemented");
      }

      const mockRequest: CreateSessionRequest = {
        workoutId: "squat",
        startedAt: 1000,
      };

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: false,
        error: "NETWORK_ERROR",
      });

      // This should not throw
      const result = await endpoints.createRemoteSession(mockRequest);
      expect(result).toBeDefined();
      expect(result.ok).toBe(false);
    });
  });

  describe("AC-2: submitRemoteFeedback returns {ok:false,reason} when client fails", () => {
    it("should return {ok:false,reason:'REMOTE_UNAVAILABLE'} when BASE_URL is missing", async () => {
      if (!endpoints?.submitRemoteFeedback) {
        expect.fail("submitRemoteFeedback not implemented");
      }

      const sessionId = "session-123";
      const mockRequest: SubmitFeedbackRequest = {
        t: 5000,
        pose: { landmarks: [] },
      };

      mockClientModule.submitFeedback.mockResolvedValueOnce({
        ok: false,
        error: "BASE_URL_MISSING",
      });

      const result = await endpoints.submitRemoteFeedback(sessionId, mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("REMOTE_UNAVAILABLE");
      }
    });

    it("should return {ok:false,reason:'REMOTE_ERROR'} when client has error", async () => {
      if (!endpoints?.submitRemoteFeedback) {
        expect.fail("submitRemoteFeedback not implemented");
      }

      const sessionId = "session-123";
      const mockRequest: SubmitFeedbackRequest = {
        t: 5000,
        pose: { landmarks: [] },
      };

      mockClientModule.submitFeedback.mockResolvedValueOnce({
        ok: false,
        error: "NETWORK_ERROR",
      });

      const result = await endpoints.submitRemoteFeedback(sessionId, mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("REMOTE_ERROR");
      }
    });

    it("should NOT throw when client fails", async () => {
      if (!endpoints?.submitRemoteFeedback) {
        expect.fail("submitRemoteFeedback not implemented");
      }

      const sessionId = "session-123";
      const mockRequest: SubmitFeedbackRequest = {
        t: 5000,
        pose: { landmarks: [] },
      };

      mockClientModule.submitFeedback.mockResolvedValueOnce({
        ok: false,
        error: "NETWORK_ERROR",
      });

      const result = await endpoints.submitRemoteFeedback(sessionId, mockRequest);
      expect(result).toBeDefined();
      expect(result.ok).toBe(false);
    });
  });

  describe("AC-2: generateRemoteReport returns {ok:false,reason} when client fails", () => {
    it("should return {ok:false,reason:'REMOTE_UNAVAILABLE'} when BASE_URL is missing", async () => {
      if (!endpoints?.generateRemoteReport) {
        expect.fail("generateRemoteReport not implemented");
      }

      const mockRequest: GenerateReportRequest = {
        sessionId: "session-123",
        workoutId: "squat",
        startedAt: 1000,
        endedAt: 2000,
        durationSec: 60,
        feedbackEventsSample: [],
      };

      mockClientModule.generateReport.mockResolvedValueOnce({
        ok: false,
        error: "BASE_URL_MISSING",
      });

      const result = await endpoints.generateRemoteReport(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("REMOTE_UNAVAILABLE");
      }
    });

    it("should return {ok:false,reason:'REMOTE_ERROR'} when client has error", async () => {
      if (!endpoints?.generateRemoteReport) {
        expect.fail("generateRemoteReport not implemented");
      }

      const mockRequest: GenerateReportRequest = {
        sessionId: "session-123",
        workoutId: "squat",
        startedAt: 1000,
        endedAt: 2000,
        durationSec: 60,
        feedbackEventsSample: [],
      };

      mockClientModule.generateReport.mockResolvedValueOnce({
        ok: false,
        error: "NETWORK_ERROR",
      });

      const result = await endpoints.generateRemoteReport(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("REMOTE_ERROR");
      }
    });

    it("should NOT throw when client fails", async () => {
      if (!endpoints?.generateRemoteReport) {
        expect.fail("generateRemoteReport not implemented");
      }

      const mockRequest: GenerateReportRequest = {
        sessionId: "session-123",
        workoutId: "squat",
        startedAt: 1000,
        endedAt: 2000,
        durationSec: 60,
        feedbackEventsSample: [],
      };

      mockClientModule.generateReport.mockResolvedValueOnce({
        ok: false,
        error: "NETWORK_ERROR",
      });

      const result = await endpoints.generateRemoteReport(mockRequest);
      expect(result).toBeDefined();
      expect(result.ok).toBe(false);
    });
  });

  // ============================================================================
  // AC-3: No window.open/location.href navigation
  // ============================================================================

  describe("AC-3: Functions do not call window.open or window.location.href", () => {
    it("createRemoteSession should not navigate externally on success", async () => {
      if (!endpoints?.createRemoteSession) {
        expect.fail("createRemoteSession not implemented");
      }

      const windowOpenSpy = vi.spyOn(window, "open").mockImplementation();
      const originalHref = window.location.href;

      const mockRequest: CreateSessionRequest = {
        workoutId: "squat",
        startedAt: 1000,
      };

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: true,
        data: {
          session: {
            version: 1,
            id: "session-123",
            workoutId: "squat",
            startedAt: 1000,
            feedbackCount: 0,
            feedbackEventsSample: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
      });

      await endpoints.createRemoteSession(mockRequest);

      expect(windowOpenSpy).not.toHaveBeenCalled();
      expect(window.location.href).toBe(originalHref);

      windowOpenSpy.mockRestore();
    });

    it("functions should not navigate externally on error", async () => {
      if (!endpoints?.createRemoteSession) {
        expect.fail("createRemoteSession not implemented");
      }

      const windowOpenSpy = vi.spyOn(window, "open").mockImplementation();
      const originalHref = window.location.href;

      const mockRequest: CreateSessionRequest = {
        workoutId: "squat",
        startedAt: 1000,
      };

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: false,
        error: "NETWORK_ERROR",
      });

      await endpoints.createRemoteSession(mockRequest);

      expect(windowOpenSpy).not.toHaveBeenCalled();
      expect(window.location.href).toBe(originalHref);

      windowOpenSpy.mockRestore();
    });
  });

  // ============================================================================
  // Integration: All three functions have consistent error handling
  // ============================================================================

  describe("Integration: Consistent error handling across all functions", () => {
    it("all functions should return {ok:false,reason:'REMOTE_UNAVAILABLE'} for BASE_URL_MISSING", async () => {
      if (!endpoints?.createRemoteSession || !endpoints?.submitRemoteFeedback || !endpoints?.generateRemoteReport) {
        expect.fail("One or more endpoint functions not implemented");
      }

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: false,
        error: "BASE_URL_MISSING",
      });
      mockClientModule.submitFeedback.mockResolvedValueOnce({
        ok: false,
        error: "BASE_URL_MISSING",
      });
      mockClientModule.generateReport.mockResolvedValueOnce({
        ok: false,
        error: "BASE_URL_MISSING",
      });

      const result1 = await endpoints.createRemoteSession({
        workoutId: "squat",
        startedAt: 1000,
      });
      const result2 = await endpoints.submitRemoteFeedback("session-123", {
        t: 5000,
        pose: { landmarks: [] },
      });
      const result3 = await endpoints.generateRemoteReport({
        sessionId: "session-123",
        workoutId: "squat",
        startedAt: 1000,
        endedAt: 2000,
        durationSec: 60,
        feedbackEventsSample: [],
      });

      expect(result1.ok).toBe(false);
      expect(result2.ok).toBe(false);
      expect(result3.ok).toBe(false);

      if (!result1.ok && !result2.ok && !result3.ok) {
        expect(result1.reason).toBe("REMOTE_UNAVAILABLE");
        expect(result2.reason).toBe("REMOTE_UNAVAILABLE");
        expect(result3.reason).toBe("REMOTE_UNAVAILABLE");
      }
    });

    it("all functions should return {ok:false,reason:'REMOTE_ERROR'} for network errors", async () => {
      if (!endpoints?.createRemoteSession || !endpoints?.submitRemoteFeedback || !endpoints?.generateRemoteReport) {
        expect.fail("One or more endpoint functions not implemented");
      }

      mockClientModule.createSession.mockResolvedValueOnce({
        ok: false,
        error: "NETWORK_ERROR",
      });
      mockClientModule.submitFeedback.mockResolvedValueOnce({
        ok: false,
        error: "PARSE_ERROR",
      });
      mockClientModule.generateReport.mockResolvedValueOnce({
        ok: false,
        error: "UNKNOWN",
      });

      const result1 = await endpoints.createRemoteSession({
        workoutId: "squat",
        startedAt: 1000,
      });
      const result2 = await endpoints.submitRemoteFeedback("session-123", {
        t: 5000,
        pose: { landmarks: [] },
      });
      const result3 = await endpoints.generateRemoteReport({
        sessionId: "session-123",
        workoutId: "squat",
        startedAt: 1000,
        endedAt: 2000,
        durationSec: 60,
        feedbackEventsSample: [],
      });

      expect(result1.ok).toBe(false);
      expect(result2.ok).toBe(false);
      expect(result3.ok).toBe(false);

      if (!result1.ok && !result2.ok && !result3.ok) {
        expect(result1.reason).toBe("REMOTE_ERROR");
        expect(result2.reason).toBe("REMOTE_ERROR");
        expect(result3.reason).toBe("REMOTE_ERROR");
      }
    });
  });
});
