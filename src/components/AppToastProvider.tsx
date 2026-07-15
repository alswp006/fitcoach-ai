import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toast } from "@toss/tds-mobile";

export interface UseAppToastResult {
  showToast: (message: string, durationMs?: number) => void;
}

const DEFAULT_DURATION_MS = 2000;

const AppToastContext = createContext<UseAppToastResult | null>(null);

/**
 * 앱 전역 토스트 프로바이더 — TDS Toast를 감싸 showToast(message, durationMs?) API를 제공한다.
 * durationMs 기본값 2000ms 후 자동 dismiss.
 */
export function AppToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, durationMs: number = DEFAULT_DURATION_MS) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setText(message);
    timerRef.current = setTimeout(() => setText(null), durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AppToastContext.Provider value={{ showToast }}>
      {children}
      <Toast open={text !== null} text={text ?? ""} position="bottom" onClose={() => setText(null)} />
    </AppToastContext.Provider>
  );
}

export function useAppToast(): UseAppToastResult {
  const ctx = useContext(AppToastContext);
  if (!ctx) {
    throw new Error("useAppToast must be used within an AppToastProvider");
  }
  return ctx;
}
