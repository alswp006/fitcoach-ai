import type { ReactNode } from "react";

export interface UseAppToastResult {
  showToast: (message: string, durationMs?: number) => void;
}

// Stub — TDD red phase. Only satisfies types so `tsc` passes; behavior is
// intentionally incomplete until the Coder implements the real context-backed
// TDS Toast (default 2000ms auto-dismiss, see src/__tests__/packet-0011.test.ts).
export function AppToastProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useAppToast(): UseAppToastResult {
  return {
    showToast: () => {},
  };
}
