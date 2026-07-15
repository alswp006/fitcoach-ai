/**
 * AppState/AppStore mock factory — kept in its OWN file (not test-utils.ts).
 *
 * vi.mock() calls are hoisted to the top of whatever file they appear in,
 * regardless of the enclosing function — so if this lived in test-utils.ts
 * (imported by nearly every test for `renderWithRouter`), simply importing
 * that file would silently register this stub for @/lib/store/AppStore and
 * @/state/AppStateContext for EVERY test, clobbering any test-local vi.mock
 * for the same path. Keeping it isolated means it only applies to test files
 * that explicitly import + call mockAppState().
 *
 * Usage:
 *   import { mockAppState } from "@/__tests__/__helpers__/app-state-mock";
 *   mockAppState({ input: { salary: 50000000 } });
 */

import React from "react";
import { vi } from "vitest";

export interface AppStateMock {
  input: Record<string, unknown>;
  applyPreset: ReturnType<typeof vi.fn>;
  updateField: ReturnType<typeof vi.fn>;
  setInput: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  isLoading: boolean;
  error: string | null;
}

// ── AppStore / AppState mock factory ──
// Projects use either @/state/AppStateContext or @/lib/store/AppStore — try both.
// If the project's actual path differs, override with vi.mock in the test file.
export function mockAppState(overrides: Partial<AppStateMock> = {}) {
  const defaultState: AppStateMock = {
    input: {},
    applyPreset: vi.fn(),
    updateField: vi.fn(),
    setInput: vi.fn(),
    reset: vi.fn(),
    isLoading: false,
    error: null,
    ...overrides,
  };

  // Mock both common paths — whichever the project uses will be picked up
  vi.mock("@/state/AppStateContext", () => ({
    useAppState: () => defaultState,
    AppStateProvider: ({ children }: { children: React.ReactNode }) => children,
  }));

  vi.mock("@/lib/store/AppStore", () => ({
    useAppStore: () => defaultState,
    AppStoreProvider: ({ children }: { children: React.ReactNode }) => children,
  }));

  return defaultState;
}
