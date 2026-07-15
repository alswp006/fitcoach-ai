import type {
  CreateSessionRequest,
  CreateSessionResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  SessionId,
} from "@/lib/types";
import {
  createSession,
  submitFeedback,
  generateReport,
  type ApiResult,
} from "@/lib/api/client";

// Result type for endpoint functions (different from ApiResult)
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "REMOTE_UNAVAILABLE" | "REMOTE_ERROR" };

function toResult<T>(apiResult: ApiResult<T>): Result<T> {
  if (apiResult.ok) {
    return { ok: true, value: apiResult.data };
  }
  const reason: "REMOTE_UNAVAILABLE" | "REMOTE_ERROR" =
    apiResult.error === "BASE_URL_MISSING"
      ? "REMOTE_UNAVAILABLE"
      : "REMOTE_ERROR";
  return { ok: false, reason };
}

export async function createRemoteSession(
  req: CreateSessionRequest
): Promise<Result<CreateSessionResponse>> {
  const apiResult = await createSession(req);
  return toResult(apiResult);
}

export async function submitRemoteFeedback(
  sessionId: SessionId,
  req: SubmitFeedbackRequest
): Promise<Result<SubmitFeedbackResponse>> {
  const apiResult = await submitFeedback(sessionId, req);
  return toResult(apiResult);
}

export async function generateRemoteReport(
  req: GenerateReportRequest
): Promise<Result<GenerateReportResponse>> {
  const apiResult = await generateReport(req);
  return toResult(apiResult);
}
