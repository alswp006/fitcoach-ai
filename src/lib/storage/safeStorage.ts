export function safeJsonParse<T = unknown>(
  raw: string
): { ok: true; value: T } | { ok: false; error: "PARSE_ERROR" } {
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return { ok: false, error: "PARSE_ERROR" };
  }
}

function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    (error as Error & { code?: number }).code === 22
  );
}

export function safeSetItem(
  key: string,
  value: string
): { ok: true } | { ok: false; error: string } {
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (error) {
    if (isQuotaExceededError(error)) {
      return { ok: false, error: "QUOTA_EXCEEDED" };
    }
    return { ok: false, error: "SET_ERROR" };
  }
}

export function safeGetItem(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? raw : null;
  } catch {
    return null;
  }
}
