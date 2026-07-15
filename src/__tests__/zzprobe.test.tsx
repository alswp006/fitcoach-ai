import { describe, it, expect } from "vitest";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { useLocation } from "react-router-dom";

function Probe() {
  const location = useLocation();
  return <div data-testid="probe">{JSON.stringify(location.state)}</div>;
}

describe("probe raw", () => {
  it("passes state with no mocks at all", () => {
    renderWithRouter(React.createElement(Probe), {
      initialEntries: [{ pathname: "/report", state: { sessionId: "abc" } }],
    });
    screen.debug(screen.getByTestId("probe"));
  });
});
