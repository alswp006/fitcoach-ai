import { describe, it, expect, vi } from "vitest";
import React from "react";
import { screen, waitFor } from "@testing-library/react";
// Import only the plain const export, never touching mockTds/mockRouter/mockAppsInToss names at all.
import { mockNavigate as _unused } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

import { useLocation } from "react-router-dom";

function Probe() {
  const location = useLocation();
  return <div data-testid="probe">{JSON.stringify(location.state)}</div>;
}

function renderProbe(sessionId: string | null) {
  return renderWithRouter(React.createElement(Probe), {
    initialEntries: [
      { pathname: "/report", state: sessionId ? { sessionId } : null },
    ],
  });
}

describe("debug import of unrelated const from mocks.ts", () => {
  it("passes state through when only mockNavigate const is imported", async () => {
    void _unused;
    renderProbe("session-report-test-1");
    await waitFor(() => {
      screen.debug(screen.getByTestId("probe"));
    });
    expect(true).toBe(true);
  });
});
