import type {
  CreateSessionRequest,
  CreateSessionResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  ApiError,
  SessionId,
} from "@/lib/types";

export type ApiClientError =
  | ApiError
  | "BASE_URL_MISSING"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiClientError };

function getBaseUrl(): string | undefined {
  const baseUrl = import.meta.env.VITE_AI_API_BASE_URL as string | undefined;
  return baseUrl ? baseUrl : undefined;
}

async function request<TReq, TRes>(
  path: string,
  body: TReq
): Promise<ApiResult<TRes>> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return { ok: false, error: "BASE_URL_MISSING" };
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "NETWORK_ERROR" };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { ok: false, error: "PARSE_ERROR" };
  }

  if (response.ok && response.status >= 200 && response.status < 300) {
    return { ok: true, data: json as TRes };
  }

  return { ok: false, error: json as ApiError };
}

export function createSession(
  req: CreateSessionRequest
): Promise<ApiResult<CreateSessionResponse>> {
  return request<CreateSessionRequest, CreateSessionResponse>(
    "/v1/sessions",
    req
  );
}

export function submitFeedback(
  sessionId: SessionId,
  req: SubmitFeedbackRequest
): Promise<ApiResult<SubmitFeedbackResponse>> {
  return request<SubmitFeedbackRequest, SubmitFeedbackResponse>(
    `/v1/sessions/${sessionId}/feedback`,
    req
  );
}

export function generateReport(
  req: GenerateReportRequest
): Promise<ApiResult<GenerateReportResponse>> {
  return request<GenerateReportRequest, GenerateReportResponse>(
    "/v1/reports",
    req
  );
}
