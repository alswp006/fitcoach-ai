import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds, mockAppsInToss, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { STORAGE_KEY_SESSIONS } from "@/lib/storage/keys";
import type { Session } from "@/lib/types";

mockTds();
mockAppsInToss();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { AppToastProvider } from "@/components/AppToastProvider";
import History from "@/pages/History";

const NOW = 1_700_000_000_000;

function makeSession(id: string, index: number): Session {
  return {
    version: 1,
    id,
    workoutId: "squat",
    startedAt: NOW - index * 60_000,
    endedAt: NOW - index * 60_000 + 30_000,
    durationSec: 30,
    feedbackCount: 0,
    feedbackEventsSample: [],
    createdAt: NOW - index * 60_000,
    updatedAt: NOW - index * 60_000,
  };
}

function seedSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
}

function renderHistory() {
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/history"] },
      React.createElement(AppToastProvider, null, React.createElement(History)),
    ),
  );
}

describe("S7 기록('/history') 기본 구현(20개 페이지네이션 + 더 보기)", () => {
  it("AC-1[P0]-a: 세션이 25개일 때 초기 렌더는 20개만 렌더하고 '더 보기' 버튼이 노출된다", () => {
    const sessions = Array.from({ length: 25 }, (_, i) => makeSession(`s${i}`, i));
    seedSessions(sessions);

    renderHistory();

    expect(screen.getAllByTestId("history-session-item")).toHaveLength(20);
    expect(screen.getByRole("button", { name: /더 보기/ })).toBeInTheDocument();
  });

  it("AC-1[P0]-b: 세션이 15개(20개 이하)일 때는 15개 모두 렌더되고 '더 보기' 버튼은 노출되지 않는다", () => {
    const sessions = Array.from({ length: 15 }, (_, i) => makeSession(`s${i}`, i));
    seedSessions(sessions);

    renderHistory();

    expect(screen.getAllByTestId("history-session-item")).toHaveLength(15);
    expect(screen.queryByRole("button", { name: /더 보기/ })).not.toBeInTheDocument();
  });

  it("AC-2[P0]-a: '더 보기' 탭 시 다음 페이지가 append되어 총 렌더 수가 23개로 증가한다(중복 sessionId 1건은 dedupe)", () => {
    // 24 sessions: index 20 deliberately reuses id "s5" (duplicate across page 1/2 boundary)
    const sessions = Array.from({ length: 24 }, (_, i) => makeSession(`s${i}`, i));
    sessions[20] = makeSession("s5", 20);
    seedSessions(sessions);

    renderHistory();
    expect(screen.getAllByTestId("history-session-item")).toHaveLength(20);

    fireEvent.click(screen.getByRole("button", { name: /더 보기/ }));

    // 20 (page 1) + 4 (page 2) - 1 duplicate ("s5") = 23
    expect(screen.getAllByTestId("history-session-item")).toHaveLength(23);
  });

  it("AC-2[P0]-b: dedupe된 세션 id는 DOM에 정확히 1번만 나타난다", () => {
    const sessions = Array.from({ length: 24 }, (_, i) => makeSession(`s${i}`, i));
    sessions[20] = makeSession("s5", 20);
    seedSessions(sessions);

    const { container } = renderHistory();
    fireEvent.click(screen.getByRole("button", { name: /더 보기/ }));

    const dupNodes = container.querySelectorAll('[data-session-id="s5"]');
    expect(dupNodes.length).toBe(1);
    expect(screen.getAllByTestId("history-session-item")).toHaveLength(23);
  });

  it("AC-3[P0]-a: localStorage 파싱 실패 시 Error UI가 렌더되고 세션 아이템은 렌더되지 않는다", () => {
    localStorage.setItem(STORAGE_KEY_SESSIONS, "{not-valid-json");

    renderHistory();

    expect(screen.getByTestId("history-error")).toBeInTheDocument();
    expect(screen.queryAllByTestId("history-session-item")).toHaveLength(0);
    expect(screen.getByRole("button", { name: /초기화/ })).toBeInTheDocument();
  });

  it("AC-3[P0]-b: '초기화' 탭 시 sessions 키가 localStorage에서 제거된다", () => {
    localStorage.setItem(STORAGE_KEY_SESSIONS, "{not-valid-json");

    renderHistory();
    fireEvent.click(screen.getByRole("button", { name: /초기화/ }));

    expect(localStorage.getItem(STORAGE_KEY_SESSIONS)).toBeNull();
    expect(screen.queryByTestId("history-error")).not.toBeInTheDocument();
  });

  it("AC-4[P0]-a: '더 보기' 로드 중 파싱 실패가 발생하면 기존 20개 리스트가 그대로 유지된다(추가 append 없음)", () => {
    const sessions = Array.from({ length: 24 }, (_, i) => makeSession(`s${i}`, i));
    seedSessions(sessions);

    renderHistory();
    expect(screen.getAllByTestId("history-session-item")).toHaveLength(20);

    // Corrupt storage right before requesting the next page, simulating a
    // load failure mid-pagination (distinct from the initial-mount PARSE_ERROR
    // case in AC-3, which shows a full-page Error UI instead).
    localStorage.setItem(STORAGE_KEY_SESSIONS, "{not-valid-json");
    fireEvent.click(screen.getByRole("button", { name: /더 보기/ }));

    expect(screen.getAllByTestId("history-session-item")).toHaveLength(20);
    expect(screen.queryByTestId("history-error")).not.toBeInTheDocument();
  });

  it("AC-4[P0]-b: '더 보기' 로드 실패 시 토스트가 표시된다", () => {
    const sessions = Array.from({ length: 24 }, (_, i) => makeSession(`s${i}`, i));
    seedSessions(sessions);

    renderHistory();
    localStorage.setItem(STORAGE_KEY_SESSIONS, "{not-valid-json");
    fireEvent.click(screen.getByRole("button", { name: /더 보기/ }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
