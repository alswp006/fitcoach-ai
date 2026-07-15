import { describe, it, expect, vi } from "vitest";

/**
 * Regression guard for the vitest.setup.ts Storage polyfill (see packet 0014).
 * Both spy styles must work: vi.spyOn(localStorage, "setItem") (used by packet 0002's
 * tests) and vi.spyOn(Storage.prototype, "setItem") (used by packet 0014's tests).
 */
describe("Storage polyfill spy compatibility", () => {
  it("supports spying on the localStorage instance directly", () => {
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("boom");
    });
    expect(() => localStorage.setItem("x", "y")).toThrow();
    spy.mockRestore();
  });

  it("supports spying on Storage.prototype", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("boom-proto");
    });
    expect(() => localStorage.setItem("x", "y")).toThrow();
    spy.mockRestore();
  });
});
