import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { mockTds, mockAppsInToss, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import * as sessionsStorage from "@/lib/storage/sessionsStorage";
import type { Session } from "@/lib/types";

mockTds();
mockAppsInToss();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import Report from "@/pages/Report";

const TEST_SESSION_ID = "session-report-test-1";
const NOW = 1_700_000_000_000;

function buildTestSession(sessionId: string): Session {
  return {
    version: 1,
    id: sessionId,
    workoutId: "squat",
    startedAt: NOW - 600_000,
    endedAt: NOW,
    durationSec: 600,
    feedbackCount: 2,
    feedbackEventsSample: [
      { t: 5000, code: "KNEE_MORE_BEND", messageKo: "무릎을 더 굽히세요", severity: 2 },
    ],
    score: 80,
    createdAt: NOW - 600_000,
    updatedAt: NOW,
  };
}

function renderReport(sessionId: string | null) {
  return renderWithRouter(React.createElement(Report), {
    initialEntries: [
      { pathname: "/report", state: sessionId ? { sessionId } : null },
    ],
  });
}

describe("S6 AI 리포트('/report') 기본 구현(원격 옵션 + 로컬 폴백 + AI 라벨)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("AC-1: sessionId 없이 /report 진입 시 Error 섹션이 보이고 '홈으로' 탭 시 /로 이동한다", () => {
    renderReport(null);

    expect(screen.queryByText("AI가 생성한 결과입니다")).not.toBeInTheDocument();

    const homeButton = screen.getByRole("button", { name: /홈으로/ });
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("AC-2: 리포트 생성 성공 후 결과 영역에 'AI가 생성한 결과입니다' 라벨이 노출된다", async () => {
    sessionsStorage.prepend(buildTestSession(TEST_SESSION_ID));

    renderReport(TEST_SESSION_ID);

    await waitFor(() => {
      expect(screen.getByText("AI가 생성한 결과입니다")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /홈으로/ })).not.toBeInTheDocument();
  });

  it("AC-3: VITE_AI_API_BASE_URL 미설정 시 리포트 생성 과정에서 fetch가 호출되지 않는다(로컬 폴백만 사용)", async () => {
    vi.stubEnv("VITE_AI_API_BASE_URL", "");
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    sessionsStorage.prepend(buildTestSession(TEST_SESSION_ID));

    renderReport(TEST_SESSION_ID);

    await waitFor(() => {
      expect(screen.getByText("AI가 생성한 결과입니다")).toBeInTheDocument();
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("AC-4: 원격 호출 실패/예외 상황에서도 크래시 없이 '다시 시도' 버튼으로 재시도할 수 있다", async () => {
    vi.stubEnv("VITE_AI_API_BASE_URL", "https://api.example.com");
    const fetchSpy = vi.fn().mockRejectedValue(new Error("network down"));
    global.fetch = fetchSpy as unknown as typeof fetch;

    sessionsStorage.prepend(buildTestSession(TEST_SESSION_ID));

    renderReport(TEST_SESSION_ID);

    const retryButton = await screen.findByRole("button", { name: /다시 시도/ });
    expect(retryButton).toBeInTheDocument();

    const callsBeforeRetry = fetchSpy.mock.calls.length;
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
    });
    expect(screen.getByRole("button", { name: /다시 시도/ })).toBeInTheDocument();
  });
});
