import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isExternalUrl,
  installExternalNavigationGuard,
  guardedAssignLocation,
} from "@/lib/navigation/externalNavigationGuard";

describe("externalNavigationGuard", () => {
  let uninstall: (() => void) | null = null;

  afterEach(() => {
    uninstall?.();
    uninstall = null;
  });

  describe("isExternalUrl", () => {
    it("AC: 현재 오리진과 다른 http(s) 호스트는 외부로 판별한다", () => {
      expect(isExternalUrl("https://evil.example.com/phish")).toBe(true);
    });

    it("AC: 같은 오리진의 상대/절대 경로는 외부가 아니다", () => {
      expect(isExternalUrl("/profile")).toBe(false);
      expect(isExternalUrl(window.location.origin + "/history")).toBe(false);
    });

    it("mailto:/tel: 같은 비-http(s) 스킴은 도메인 이탈이 아니므로 외부로 취급하지 않는다", () => {
      expect(isExternalUrl("mailto:test@example.com")).toBe(false);
      expect(isExternalUrl("tel:01000000000")).toBe(false);
    });
  });

  describe("installExternalNavigationGuard", () => {
    it("AC-4: window.open으로 외부 도메인 이동을 시도하면 차단 함수가 호출되고 창이 열리지 않는다", () => {
      const onBlocked = vi.fn();
      uninstall = installExternalNavigationGuard(onBlocked);

      const result = window.open("https://evil.example.com"); // gate-allow: 가드 동작 검증용 테스트 호출(실제 이탈 아님)

      expect(onBlocked).toHaveBeenCalledWith("https://evil.example.com");
      expect(result).toBeNull();
    });

    it("가드 해제(uninstall) 후에는 더 이상 차단 핸들러가 호출되지 않는다", () => {
      const fakeOpen = vi.fn(() => null);
      vi.stubGlobal("open", fakeOpen);

      const onBlocked = vi.fn();
      const localUninstall = installExternalNavigationGuard(onBlocked);
      localUninstall();

      window.open("https://evil.example.com"); // gate-allow: 가드 해제 이후 동작 검증용 테스트 호출(실제 이탈 아님) — stub으로 대체되어 실제 이탈 없음

      expect(onBlocked).not.toHaveBeenCalled();
      expect(fakeOpen).toHaveBeenCalledWith("https://evil.example.com");
      vi.unstubAllGlobals();
    });
  });

  describe("guardedAssignLocation", () => {
    beforeEach(() => {
      uninstall = installExternalNavigationGuard(vi.fn());
    });

    it("AC-4: location.href 기반 외부 도메인 이동을 시도하면 차단 함수가 호출된다", () => {
      const onBlocked = vi.fn();
      uninstall?.();
      uninstall = installExternalNavigationGuard(onBlocked);

      guardedAssignLocation("https://evil.example.com/steal");

      expect(onBlocked).toHaveBeenCalledWith("https://evil.example.com/steal");
    });
  });
});
