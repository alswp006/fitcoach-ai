/**
 * Shared render + mock utilities for Toss Mini App tests.
 *
 * Usage:
 *   import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
 *
 *   it("renders home page", () => {
 *     renderWithRouter(<Home />);
 *   });
 *
 * For AppState/AppStore mocking, import mockAppState from the dedicated
 * app-state-mock.ts file instead (see that file's docstring for why).
 */

import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { vi } from "vitest";

// ── Render with MemoryRouter ──
export function renderWithRouter(
  ui: ReactElement,
  routerOptions?: MemoryRouterProps,
  renderOptions?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) =>
      React.createElement(MemoryRouter, routerOptions, children),
    ...renderOptions,
  });
}

// ── AppStore / AppState mock factory ──
// Moved to app-state-mock.ts (NOT re-exported here — re-exporting would still
// import that module and re-trigger its hoisted vi.mock() on every test that
// uses renderWithRouter). Import mockAppState directly from that file:
//   import { mockAppState } from "@/__tests__/__helpers__/app-state-mock";

// ── Fake timers helper for rAF-driven code (animations, countups) ──
export async function advanceTimers(ms: number) {
  vi.useFakeTimers();
  vi.advanceTimersByTime(ms);
  await vi.runAllTimersAsync();
  vi.useRealTimers();
}

// ── localStorage seeding helper ──
export function seedLocalStorage(entries: Record<string, unknown>) {
  for (const [key, value] of Object.entries(entries)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// ── fetch mock helper ──
export function mockFetchOnce(response: unknown, options?: { status?: number; ok?: boolean }) {
  const fetchMock = vi.fn().mockResolvedValueOnce({
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => response,
    text: async () => (typeof response === "string" ? response : JSON.stringify(response)),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}
