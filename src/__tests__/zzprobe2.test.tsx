import { describe, it, expect, vi } from "vitest";
import React from "react";
import { screen } from "@testing-library/react";
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

describe("probe with override", () => {
  it("passes state with useNavigate override mock", () => {
    renderWithRouter(React.createElement(Probe), {
      initialEntries: [{ pathname: "/report", state: { sessionId: "abc" } }],
    });
    screen.debug(screen.getByTestId("probe"));
  });
});
