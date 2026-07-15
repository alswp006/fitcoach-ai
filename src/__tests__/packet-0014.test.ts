import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { mockTds, mockAppsInToss, mockNavigate } from "@/__tests__/__helpers__/mocks";
import * as sessionsStorage from "@/lib/storage/sessionsStorage";
import { STORAGE_KEY_SESSIONS } from "@/lib/storage/keys";

mockTds();
mockAppsInToss();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

let mockIsPremiumActive = false;

vi.mock("@/lib/store/AppStore", () => ({
  useAppPremium: () => ({
    premium: { version: 1, id: "me", isPremium: mockIsPremiumActive, createdAt: 0, updatedAt: 0 },
    isPremiumActive: mockIsPremiumActive,
    reload: vi.fn(),
    savePurchase30d: vi.fn(async () => ({ ok: true as const })),
  }),
}));

import { AppToastProvider } from "@/components/AppToastProvider";
import WorkoutDetail from "@/pages/WorkoutDetail";

function renderWorkoutDetail(path: string) {
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(
        AppToastProvider,
        null,
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: "/workouts/:workoutId",
            element: React.createElement(WorkoutDetail),
          }),
        ),
      ),
    ),
  );
}

function loadSessionsCount(): number {
  const loaded = sessionsStorage.load();
  return Array.isArray(loaded) ? loaded.length : 0;
}

describe("S3 운동 상세('/workouts/:workoutId') 페이지 구현(세션 시작/프리미엄 잠금)", () => {
  beforeEach(() => {
    mockIsPremiumActive = false;
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it("AC-S3-1[P0]: /workouts/squat 렌더 시 data-testid='workout-detail-card' 요소가 정확히 1개 존재한다", () => {
    renderWorkoutDetail("/workouts/squat");

    const cards = screen.getAllByTestId("workout-detail-card");
    expect(cards.length).toBe(1);
    expect(screen.getByText("스쿼트")).toBeInTheDocument();
  });

  it("AC-S3-2[P0]: /workouts/unknown 진입 시 '운동을 찾을 수 없어요'가 보이고 '홈으로' 탭 시 /로 이동한다", () => {
    renderWorkoutDetail("/workouts/unknown");

    expect(screen.getByText("운동을 찾을 수 없어요")).toBeInTheDocument();
    expect(screen.queryByTestId("workout-detail-card")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /홈으로/ }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("AC-S3-3[P0]: 세션 시작 탭 시 sessions items 길이가 1 증가하고 navigate('/coach')의 sessionId가 비어있지 않다", () => {
    renderWorkoutDetail("/workouts/squat");

    const beforeCount = loadSessionsCount();

    fireEvent.click(screen.getByRole("button", { name: /세션 시작/ }));

    expect(loadSessionsCount()).toBe(beforeCount + 1);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const [targetPath, options] = mockNavigate.mock.calls[0];
    expect(targetPath).toBe("/coach");
    expect(options?.state?.workoutId).toBe("squat");
    expect(typeof options?.state?.sessionId).toBe("string");
    expect(options?.state?.sessionId).not.toBe("");
  });

  it("AC-S3-4[P0]: premiumOnly 운동에서 isPremiumActive=false일 때 세션 시작 탭 시 /premium으로 이동하고 세션은 생성되지 않는다", () => {
    mockIsPremiumActive = false;
    renderWorkoutDetail("/workouts/plank");

    const beforeCount = loadSessionsCount();

    fireEvent.click(screen.getByRole("button", { name: /세션 시작/ }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate.mock.calls[0][0]).toBe("/premium");
    expect(mockNavigate).not.toHaveBeenCalledWith("/coach", expect.anything());
    expect(loadSessionsCount()).toBe(beforeCount);
  });

  it("AC-S3-4b: premiumOnly 운동이라도 isPremiumActive=true면 세션 시작 탭 시 정상적으로 /coach로 이동한다", () => {
    mockIsPremiumActive = true;
    renderWorkoutDetail("/workouts/plank");

    const beforeCount = loadSessionsCount();

    fireEvent.click(screen.getByRole("button", { name: /세션 시작/ }));

    expect(loadSessionsCount()).toBe(beforeCount + 1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const [targetPath, options] = mockNavigate.mock.calls[0];
    expect(targetPath).toBe("/coach");
    expect(options?.state?.workoutId).toBe("plank");
  });

  it("AC-S3-5: 세션 저장 중 QuotaExceededError가 발생하면 토스트가 2초(±0.5초) 동안 표시된다", () => {
    vi.useFakeTimers();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string) => {
      if (key === STORAGE_KEY_SESSIONS) {
        const err = new Error("quota exceeded");
        err.name = "QuotaExceededError";
        throw err;
      }
    });

    renderWorkoutDetail("/workouts/squat");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /세션 시작/ }));
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith("/coach", expect.anything());

    // Still visible below the lower tolerance bound (2000 - 500 = 1500ms).
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Dismissed beyond the upper tolerance bound (2000 + 500 = 2500ms).
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    setItemSpy.mockRestore();
    vi.useRealTimers();
  });
});
