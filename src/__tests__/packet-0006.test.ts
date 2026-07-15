import { describe, it, expect, vi } from "vitest";
import React from "react";
import { act, renderHook } from "@testing-library/react";

import {
  AppStoreProvider,
  useAppProfile,
  useAppPremium,
  useAiDisclosure,
  usePromotion,
} from "@/lib/store/AppStore";
import {
  STORAGE_KEY_USER_PROFILE,
} from "@/lib/storage/keys";
import { loadPremiumStateSafe } from "@/lib/storage/premiumStorage";
import { loadAiDisclosure } from "@/lib/storage/aiDisclosureStorage";
import { loadPromoState } from "@/lib/storage/promoStorage";
import type { UserProfile } from "@/lib/types";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AppStoreProvider, null, children);

function useAllStores() {
  return {
    profile: useAppProfile(),
    premium: useAppPremium(),
    ai: useAiDisclosure(),
    promo: usePromotion(),
  };
}

const VALID_PROFILE: UserProfile = {
  version: 1,
  id: "me",
  heightCm: 175,
  weightKg: 70,
  goal: "체중감량",
  level: "중급",
  voiceFeedbackEnabled: true,
  createdAt: 1000,
  updatedAt: 1000,
};

describe("AppStore(Context)로 프로필/프리미엄/AI고지/프로모션 상태 제공", () => {
  it("AC-1[P0]: exports AppStoreProvider and 4 hooks with DoD-shaped return values", async () => {
    const { result } = renderHook(() => useAllStores(), { wrapper });

    // useAppProfile shape
    expect(typeof result.current.profile.save).toBe("function");
    expect(typeof result.current.profile.remove).toBe("function");
    expect(typeof result.current.profile.reload).toBe("function");
    expect(["loading", "ready", "parse_error"]).toContain(result.current.profile.status);

    // useAppPremium shape
    expect(typeof result.current.premium.savePurchase30d).toBe("function");
    expect(typeof result.current.premium.reload).toBe("function");
    expect(typeof result.current.premium.isPremiumActive).toBe("boolean");

    // useAiDisclosure shape
    expect(typeof result.current.ai.acknowledge).toBe("function");
    expect(typeof result.current.ai.reload).toBe("function");
    expect(result.current.ai.state).toHaveProperty("acknowledged");

    // usePromotion shape
    expect(typeof result.current.promo.markFirstGranted).toBe("function");
    expect(typeof result.current.promo.reload).toBe("function");
    expect(result.current.promo.state).toHaveProperty("firstSessionRewardGranted");
  });

  it("AC-2[P0]: useAppProfile status is 'ready' with matching profile when localStorage has valid data", async () => {
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(VALID_PROFILE));

    const { result } = renderHook(() => useAppProfile(), { wrapper });

    await act(async () => {});

    expect(result.current.status).toBe("ready");
    expect(result.current.profile).toEqual(VALID_PROFILE);
  });

  it("AC-2[P0]: useAppProfile status is 'parse_error' with profile null when localStorage data is malformed", async () => {
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, "{not-valid-json");

    const { result } = renderHook(() => useAppProfile(), { wrapper });

    await act(async () => {});

    expect(result.current.status).toBe("parse_error");
    expect(result.current.profile).toBeNull();
  });

  it("AC-3[P0]: savePurchase30d resolves {ok:true} and persists a 30-day premium window without throwing", async () => {
    const { result } = renderHook(() => useAppPremium(), { wrapper });
    const now = 1_000_000;
    let res: { ok: boolean; error?: string } | undefined;

    await act(async () => {
      res = await result.current.savePurchase30d(now);
    });

    expect(res).toEqual({ ok: true });
    const stored = loadPremiumStateSafe();
    expect(stored.isPremium).toBe(true);
    expect(stored.expiresAt).toBe(now + 30 * 24 * 60 * 60 * 1000);
  });

  it("AC-3[P0]: savePurchase30d resolves {ok:false, error} without throwing when localStorage write fails", async () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderHook(() => useAppPremium(), { wrapper });
    let res: { ok: boolean; error?: string } | undefined;
    let threw = false;

    await act(async () => {
      try {
        res = await result.current.savePurchase30d(1_000_000);
      } catch {
        threw = true;
      }
    });

    expect(threw).toBe(false);
    expect(res?.ok).toBe(false);
    expect(typeof res?.error).toBe("string");
  });

  it("AC-3[P0]: acknowledge and markFirstGranted resolve {ok:true} without throwing and persist to localStorage", async () => {
    const { result } = renderHook(() => useAllStores(), { wrapper });

    let ackRes: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      ackRes = await result.current.ai.acknowledge(2_000_000);
    });
    expect(ackRes).toEqual({ ok: true });
    const storedAi = loadAiDisclosure();
    expect(storedAi.ok).toBe(true);
    expect(storedAi.data?.acknowledged).toBe(true);

    let promoRes: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      promoRes = await result.current.promo.markFirstGranted(3_000_000);
    });
    expect(promoRes).toEqual({ ok: true });
    const storedPromo = loadPromoState();
    expect(storedPromo.ok).toBe(true);
    expect(storedPromo.data?.firstSessionRewardGranted).toBe(true);
  });
});
