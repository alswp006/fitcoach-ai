import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds } from "@/__tests__/__helpers__/mocks";

mockTds();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

import { ScreenScaffold } from "@/components/ScreenScaffold";
import { AppToastProvider, useAppToast } from "@/components/AppToastProvider";
import { EmptySection, ErrorSection } from "@/components/StateSections";

describe("공용 UI: ScreenScaffold + AppToastProvider + Empty/Error 섹션", () => {
  it("AC-1[P0]: ScreenScaffold renders top/content/bottom slots together and is exported", () => {
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ScreenScaffold, {
          top: React.createElement("nav", { "aria-label": "top-slot" }, "상단"),
          bottom: React.createElement("div", { "data-testid": "bottom-slot" }, "하단 CTA"),
          children: React.createElement("p", null, "본문 콘텐츠"),
        }),
      ),
    );

    expect(screen.getByText("상단")).toBeInTheDocument();
    expect(screen.getByText("본문 콘텐츠")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-slot")).toBeInTheDocument();
  });

  it("AC-1: ScreenScaffold renders children without crashing when top/bottom are omitted", () => {
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ScreenScaffold, null, React.createElement("p", null, "단독 본문")),
      ),
    );

    expect(screen.getByText("단독 본문")).toBeInTheDocument();
    expect(screen.queryByTestId("bottom-slot")).not.toBeInTheDocument();
  });

  it("AC-2[P0]: useAppToast().showToast(message) displays the toast with default 2000ms duration", () => {
    function Trigger() {
      const { showToast } = useAppToast();
      return React.createElement(
        "button",
        { onClick: () => showToast("저장되었어요") },
        "trigger",
      );
    }

    render(React.createElement(AppToastProvider, null, React.createElement(Trigger)));

    fireEvent.click(screen.getByText("trigger"));

    expect(screen.getByText("저장되었어요")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("저장되었어요");
  });

  it("AC-2[P0]: default-duration toast auto-dismisses at 2000ms ± 100ms", () => {
    vi.useFakeTimers();

    function Trigger() {
      const { showToast } = useAppToast();
      return React.createElement(
        "button",
        { onClick: () => showToast("저장되었어요") },
        "trigger",
      );
    }

    render(React.createElement(AppToastProvider, null, React.createElement(Trigger)));

    act(() => {
      fireEvent.click(screen.getByText("trigger"));
    });
    expect(screen.getByText("저장되었어요")).toBeInTheDocument();

    // Still visible just before the 2000ms default window closes (2000 - 100 = 1900ms).
    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(screen.getByText("저장되었어요")).toBeInTheDocument();

    // Dismissed within 2000ms + 100ms tolerance.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText("저장되었어요")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("AC-2: showToast(message, durationMs) respects a custom duration (500ms ± 100ms)", () => {
    vi.useFakeTimers();

    function Trigger() {
      const { showToast } = useAppToast();
      return React.createElement(
        "button",
        { onClick: () => showToast("커스텀 토스트", 500) },
        "trigger",
      );
    }

    render(React.createElement(AppToastProvider, null, React.createElement(Trigger)));

    act(() => {
      fireEvent.click(screen.getByText("trigger"));
    });
    expect(screen.getByText("커스텀 토스트")).toBeInTheDocument();

    // Still visible well within tolerance (500 - 100 = 400ms).
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByText("커스텀 토스트")).toBeInTheDocument();

    // Dismissed by 500ms + 100ms tolerance.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText("커스텀 토스트")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("AC-3: ErrorSection uses TDS Spacing for gaps, not raw inline margin/padding on text elements", () => {
    const onAction = vi.fn();
    const { container } = render(
      React.createElement(ErrorSection, {
        title: "문제가 발생했어요",
        description: "잠시 후 다시 시도해주세요",
        actionLabel: "다시 시도",
        onAction,
        testId: "error-section",
      }),
    );

    // At least one TDS Spacing stand-in must be present to create the gap
    // between title/description/action instead of hand-rolled margin.
    const spacers = container.querySelectorAll("[data-spacing]");
    expect(spacers.length).toBeGreaterThanOrEqual(1);

    // No text/button element should carry an inline margin/padding override.
    const textAndButtonEls = container.querySelectorAll("span, button, p, h1, h2, h3");
    textAndButtonEls.forEach((el) => {
      const style = el.getAttribute("style") ?? "";
      expect(style).not.toMatch(/margin|padding/);
    });

    fireEvent.click(screen.getByText("다시 시도"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("AC-3: EmptySection renders title/description/action and uses TDS Spacing for gaps", () => {
    const onAction = vi.fn();
    const { container } = render(
      React.createElement(EmptySection, {
        title: "아직 기록이 없어요",
        description: "첫 운동을 시작해보세요",
        actionLabel: "운동 보러가기",
        onAction,
        testId: "empty-section",
      }),
    );

    expect(screen.getByTestId("empty-section")).toBeInTheDocument();
    expect(screen.getByText("아직 기록이 없어요")).toBeInTheDocument();
    expect(screen.getByText("첫 운동을 시작해보세요")).toBeInTheDocument();

    const spacers = container.querySelectorAll("[data-spacing]");
    expect(spacers.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByText("운동 보러가기"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
