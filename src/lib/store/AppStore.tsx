import type { ReactNode } from "react";
import type {
  UserProfile,
  PremiumState,
  AiDisclosureState,
  PromotionState,
} from "@/lib/types";

type WriteResult = { ok: true } | { ok: false; error: string };

interface AppProfileHook {
  status: "loading" | "ready" | "parse_error";
  profile: UserProfile | null;
  reload: () => void;
  save: (profile: UserProfile) => Promise<WriteResult>;
  remove: () => void;
}

interface AppPremiumHook {
  premium: PremiumState;
  isPremiumActive: boolean;
  reload: () => void;
  savePurchase30d: (now?: number) => Promise<WriteResult>;
}

interface AiDisclosureHook {
  state: AiDisclosureState;
  reload: () => void;
  acknowledge: (now?: number) => Promise<WriteResult>;
}

interface PromotionHook {
  state: PromotionState;
  reload: () => void;
  markFirstGranted: (now?: number) => Promise<WriteResult>;
}

// Stub — TDD red phase. Only satisfies types so `tsc` passes; behavior is
// intentionally incomplete until the Coder implements the real Context/state.
export function AppStoreProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useAppProfile(): AppProfileHook {
  return {
    status: "loading",
    profile: null,
    reload: () => {},
    save: async () => ({ ok: true }),
    remove: () => {},
  };
}

export function useAppPremium(): AppPremiumHook {
  return {
    premium: {
      version: 1,
      id: "me",
      isPremium: false,
      createdAt: 0,
      updatedAt: 0,
    },
    isPremiumActive: false,
    reload: () => {},
    savePurchase30d: async () => ({ ok: true }),
  };
}

export function useAiDisclosure(): AiDisclosureHook {
  return {
    state: {
      version: 1,
      id: "me",
      acknowledged: false,
      createdAt: 0,
      updatedAt: 0,
    },
    reload: () => {},
    acknowledge: async () => ({ ok: true }),
  };
}

export function usePromotion(): PromotionHook {
  return {
    state: {
      version: 1,
      id: "me",
      firstSessionRewardGranted: false,
      createdAt: 0,
      updatedAt: 0,
    },
    reload: () => {},
    markFirstGranted: async () => ({ ok: true }),
  };
}
