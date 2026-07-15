import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { mockTds, mockAppsInToss, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import type { UserProfile } from "@/lib/types";

mockTds();
mockAppsInToss();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const STORAGE_KEY = "fitcoach.userProfile.v1";

const DEFAULT_PROFILE: UserProfile = {
  version: 1,
  id: "me",
  heightCm: 170,
  weightKg: 65,
  goal: "체중감량",
  level: "중급",
  voiceFeedbackEnabled: true,
  createdAt: 1000,
  updatedAt: 1000,
};

let mockStatus: "loading" | "ready" | "parse_error" = "ready";
let mockProfile: UserProfile | null = DEFAULT_PROFILE;

const mockSave = vi.fn(async (profile: UserProfile) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return { ok: true as const };
});

vi.mock("@/lib/store/AppStore", () => ({
  useAppProfile: () => ({
    status: mockStatus,
    profile: mockProfile,
    reload: vi.fn(),
    save: mockSave,
    remove: vi.fn(),
  }),
}));

import Profile from "@/pages/Profile";

describe("S2 프로필('/profile') 페이지 구현(검증/저장/키보드)", () => {
  beforeEach(() => {
    mockStatus = "ready";
    mockProfile = DEFAULT_PROFILE;
    mockSave.mockClear();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it("AC-S2-1[P0]: 최초 진입 로딩 상태에서 키/몸무게 TextField가 둘 다 disabled=true다", () => {
    mockStatus = "loading";
    mockProfile = null;

    renderWithRouter(React.createElement(Profile));

    const heightInput = screen.getByPlaceholderText(/키/) as HTMLInputElement;
    const weightInput = screen.getByPlaceholderText(/몸무게/) as HTMLInputElement;

    expect(heightInput.disabled).toBe(true);
    expect(weightInput.disabled).toBe(true);
  });

  it("AC-S2-2[P0]: 유효 값 입력 후 저장 탭 시 fitcoach.userProfile.v1이 유효 JSON으로 저장되고 /로 이동한다", async () => {
    renderWithRouter(React.createElement(Profile));

    fireEvent.change(screen.getByPlaceholderText(/키/), { target: { value: "175" } });
    fireEvent.change(screen.getByPlaceholderText(/몸무게/), { target: { value: "68" } });
    fireEvent.click(screen.getByRole("button", { name: /저장/ }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.heightCm).toBe(175);
    expect(parsed.weightKg).toBe(68);
    expect(parsed.version).toBe(1);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
  });

  it("AC-S2-3[P0]: 키=90 입력 후 저장 탭 시 범위 오류 메시지가 표시되고 localStorage는 변경되지 않는다", async () => {
    renderWithRouter(React.createElement(Profile));

    fireEvent.change(screen.getByPlaceholderText(/키/), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: /저장/ }));

    expect(await screen.findByText("키는 120~220cm로 입력해주세요")).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("AC-S2-4[P0]: 몸무게=250 입력 후 저장 탭 시 범위 오류 메시지가 표시되고 localStorage는 변경되지 않는다", async () => {
    renderWithRouter(React.createElement(Profile));

    fireEvent.change(screen.getByPlaceholderText(/몸무게/), { target: { value: "250" } });
    fireEvent.click(screen.getByRole("button", { name: /저장/ }));

    expect(await screen.findByText("몸무게는 30~200kg로 입력해주세요")).toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("AC-S2-5[P0]: Switch(voiceFeedbackEnabled)를 OFF로 변경 후 저장하면 저장된 값이 false다", async () => {
    renderWithRouter(React.createElement(Profile));

    const voiceSwitch = screen.getByRole("switch") as HTMLInputElement;
    expect(voiceSwitch.checked).toBe(true);

    fireEvent.click(voiceSwitch);
    fireEvent.click(screen.getByRole("button", { name: /저장/ }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(stored as string);
    expect(parsed.voiceFeedbackEnabled).toBe(false);
    expect(mockSave.mock.calls[0][0].voiceFeedbackEnabled).toBe(false);
  });
});
