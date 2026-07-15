import { describe, it, expect, vi } from "vitest";
// Only import renderWithRouter, never call mockAppState
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";

vi.mock("@/lib/store/AppStore", () => ({
  useAppProfile: () => ({ status: "ready" }),
}));

import { useAppProfile } from "@/lib/store/AppStore";

describe("debug", () => {
  it("checks which mock wins", () => {
    console.log("renderWithRouter is", typeof renderWithRouter);
    console.log("useAppProfile()", JSON.stringify(useAppProfile()));
  });
});
