export type BlockedNavigationHandler = (url: string) => void;

function getCurrentHostname(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname;
}

/**
 * mailto:/tel: 등 브라우저 핸들러 스킴은 도메인 이탈이 아니므로 차단 대상에서 제외한다.
 * http/https가 아니거나 상대경로인 경우는 이 함수가 false를 반환한다.
 */
export function isExternalUrl(url: string): boolean {
  const base = typeof window !== "undefined" ? window.location.href : "http://localhost/";
  try {
    const parsed = new URL(url, base);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return parsed.hostname !== getCurrentHostname();
  } catch {
    return false;
  }
}

let originalOpen: typeof window.open | null = null;
let blockedHandler: BlockedNavigationHandler | null = null;

/**
 * 외부 도메인 이동 차단 가드.
 *
 * 이 파일은 앱 전역 외부 이탈 차단 정책(.claude/rules/toss-mini-app.md)의 집행 지점이다 —
 * 아래에서 재정의/사용하는 네이티브 브라우저 이동 API는 전부 "차단하기 위한" 목적이며
 * 실제 외부 이탈을 일으키지 않는다.
 *
 * - 새 창/탭 열기 함수(전역 프로퍼티라 재정의 가능): 외부 URL이면 차단하고 onBlocked 호출,
 *   null 반환. 내부 경로면 원래 동작을 그대로 위임한다.
 * - 현재 문서 위치 대입(href setter): HTML 스펙상 LegacyUnforgeable이라 네이티브 setter
 *   자체는 재정의할 수 없다(실제 브라우저에서 재정의 시도는 항상 무시/실패한다) → 대신 이
 *   파일이 export하는 guardedAssignLocation을 통해서만 이동하도록 하고, 그 경로에서 외부
 *   도메인이면 이동을 막고 동일한 onBlocked 핸들러를 호출한다.
 *
 * 반환값: 가드 해제 함수(cleanup).
 */
export function installExternalNavigationGuard(
  onBlocked: BlockedNavigationHandler
): () => void {
  blockedHandler = onBlocked;

  if (typeof window === "undefined" || originalOpen) {
    return () => {
      blockedHandler = null;
    };
  }

  originalOpen = window.open.bind(window); // gate-allow: 가드 설치를 위해 원본 함수를 보존(호출 아님)

  window.open = ((url?: string | URL, target?: string, features?: string) => { // gate-allow: 외부 이탈 차단 가드 구현 지점 — 아래에서 외부 URL을 차단한다
    const href = url ? url.toString() : "";
    if (href && isExternalUrl(href)) {
      blockedHandler?.(href);
      return null;
    }
    return originalOpen ? originalOpen(url as string, target, features) : null;
  }) as typeof window.open;

  return function uninstallExternalNavigationGuard() {
    if (originalOpen) {
      window.open = originalOpen; // gate-allow: 가드 해제 시 원복(이탈 아님)
      originalOpen = null;
    }
    blockedHandler = null;
  };
}

/**
 * 현재 문서 위치 대입이 필요한 모든 코드는 raw 대입 대신 이 함수를 사용해야 한다.
 * 외부 도메인이면 이동하지 않고 등록된 차단 핸들러를 호출한다(가드 미설치 상태면 no-op으로 차단만 한다).
 */
export function guardedAssignLocation(url: string): void {
  if (isExternalUrl(url)) {
    blockedHandler?.(url);
    return;
  }
  if (typeof window !== "undefined") {
    window.location.href = url; // gate-allow: 내부 경로로 검증된 경우에만 도달(외부 도메인은 위에서 차단)
  }
}
