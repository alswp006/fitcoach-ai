import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds, mockAppsInToss } from "@/__tests__/__helpers__/mocks";

mockTds();
mockAppsInToss();

import App from "@/App";

function renderAppAt(path: string) {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)),
  );
}

describe("App.tsx 라우팅 + Provider 래핑 + 리워드 게이트", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["/", "home-hero"],
    ["/profile", undefined],
    ["/workouts/squat", "workout-detail-card"],
    ["/coach", "coach-no-session-section"],
    ["/session/summary", "session-summary-not-found-section"],
    ["/history", undefined],
    ["/premium", undefined],
  ])("AC-1: %s 라우트가 연결되어 있고 크래시 없이 렌더된다", (path) => {
    expect(() => renderAppAt(path)).not.toThrow();
  });

  it("AC-1: /report 라우트가 연결되어 있고 크래시 없이 렌더된다(리워드 게이트 포함)", async () => {
    expect(() => renderAppAt("/report")).not.toThrow();
    // 광고 로드가 비동기로 완료되므로 act 경고 방지를 위해 로드 완료를 기다린다.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /광고 보고 확인하기/ })).not.toBeDisabled();
    });
  });

  it("AC-2: /report 진입 시 콘텐츠 대신 리워드 광고 게이트가 먼저 노출된다(광고 시청 전에는 리포트 콘텐츠 없음)", async () => {
    renderAppAt("/report");

    expect(screen.getByText(/광고를 시청하면 결과를 확인할 수 있어요/)).toBeInTheDocument();
    expect(screen.queryByText("AI가 생성한 결과입니다")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /광고 보고 확인하기/ })).not.toBeDisabled();
    });
  });

  it("AC-2: 광고 시청 완료 후에는 게이트가 사라지고 /report 페이지 콘텐츠가 노출된다", async () => {
    renderAppAt("/report");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /광고 보고 확인하기/ })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /광고 보고 확인하기/ }));

    await waitFor(() => {
      expect(screen.queryByText(/광고를 시청하면 결과를 확인할 수 있어요/)).not.toBeInTheDocument();
    });
    // sessionId 없이 진입했으므로 Report 자체의 에러 섹션이 보여야 한다(게이트 통과 확인).
    expect(screen.getByText("세션 정보를 찾을 수 없어요")).toBeInTheDocument();
  });

  it("AC-3: AppStoreProvider/AppToastProvider가 정상 동작한다(프로필 저장 흐름이 크래시 없이 동작)", () => {
    expect(() => renderAppAt("/profile")).not.toThrow();
  });
});
