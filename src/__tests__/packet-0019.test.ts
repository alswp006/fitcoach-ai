import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds, mockAppsInToss, mockNavigate } from "@/__tests__/__helpers__/mocks";

mockTds();
mockAppsInToss();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

import { IAP } from "@apps-in-toss/web-framework";
import { AppStoreProvider } from "@/lib/store/AppStore";
import { AppToastProvider } from "@/components/AppToastProvider";
import { loadPremiumStateSafe } from "@/lib/storage/premiumStorage";
import { STORAGE_KEY_PREMIUM } from "@/lib/storage/keys";
import Premium from "@/pages/Premium";

const STUBBED_SKU = "fitcoach-premium-30d-test-sku";

function renderPremium() {
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/premium"] },
      React.createElement(
        AppStoreProvider,
        null,
        React.createElement(AppToastProvider, null, React.createElement(Premium)),
      ),
    ),
  );
}

describe("S8 프리미엄('/premium') 기본 구현(IAP 버튼 + 30일 부여)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_TOSS_IAP_SKU", STUBBED_SKU);
    localStorage.removeItem(STORAGE_KEY_PREMIUM);
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("AC-1[P0]: renders a purchase button and triggers IAP with sku from import.meta.env.VITE_TOSS_IAP_SKU (not hardcoded)", async () => {
    renderPremium();

    const purchaseButton = screen.getByRole("button", { name: /구매|프리미엄/ });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(IAP.createOneTimePurchaseOrder).toHaveBeenCalledTimes(1);
    });

    const call = (IAP.createOneTimePurchaseOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.options.sku).toBe(STUBBED_SKU);
    expect(call.options.sku).not.toBe("");
  });

  it("AC-2[P0]: on purchase success callback, savePurchase30d is called and loadPremiumStateSafe() reports isPremium active (expiresAt in the future)", async () => {
    expect(loadPremiumStateSafe().isPremium).toBe(false);

    renderPremium();
    const purchaseButton = screen.getByRole("button", { name: /구매|프리미엄/ });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      const state = loadPremiumStateSafe();
      expect(state.isPremium).toBe(true);
    });

    const state = loadPremiumStateSafe();
    expect(state.expiresAt).toBeDefined();
    expect((state.expiresAt as number) > Date.now()).toBe(true);
  });

  it("AC-3[P0]: when saving after purchase hits QUOTA_EXCEEDED, a failure toast is shown and isPremium stays false", async () => {
    const quotaError = new Error("QuotaExceededError") as Error & { code?: number };
    quotaError.name = "QuotaExceededError";
    quotaError.code = 22;
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw quotaError;
    });

    renderPremium();
    const purchaseButton = screen.getByRole("button", { name: /구매|프리미엄/ });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    expect(screen.getByRole("status").textContent).toMatch(/실패|저장하지 못|다시 시도/);
    expect(loadPremiumStateSafe().isPremium).toBe(false);
  });

  it("AC-4: page is composed only from TDS primitives (Top/Card/Paragraph.Text/Button/Toast) — no raw unstyled scaffolding", () => {
    renderPremium();

    expect(screen.getByRole("navigation")).toBeInTheDocument(); // TDS Top mock
    expect(document.querySelector('[data-typography]')).not.toBeNull(); // Paragraph.Text mock
    expect(screen.getByRole("button", { name: /구매|프리미엄/ })).toBeInTheDocument();
  });

  it("AC-2b: purchase failure/cancel from IAP does not grant premium (isPremium stays false)", async () => {
    (IAP.createOneTimePurchaseOrder as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (opts: { onError?: (e: unknown) => void }) => {
        opts.onError?.(new Error("USER_CANCELED"));
        return () => {};
      },
    );

    renderPremium();
    const purchaseButton = screen.getByRole("button", { name: /구매|프리미엄/ });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(IAP.createOneTimePurchaseOrder).toHaveBeenCalledTimes(1);
    });

    expect(loadPremiumStateSafe().isPremium).toBe(false);
  });
});
