import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  UserProfile,
  PremiumState,
  AiDisclosureState,
  PromotionState,
} from "@/lib/types";
import {
  STORAGE_KEY_USER_PROFILE,
  STORAGE_KEY_PREMIUM,
  STORAGE_KEY_AI_DISCLOSURE,
  STORAGE_KEY_PROMO,
} from "@/lib/storage/keys";
import { loadProfile, deleteProfile } from "@/lib/storage/profileStorage";
import { loadPremiumStateSafe } from "@/lib/storage/premiumStorage";
import { loadAiDisclosure } from "@/lib/storage/aiDisclosureStorage";
import { loadPromoState } from "@/lib/storage/promoStorage";
import { safeSetItem } from "@/lib/storage/safeStorage";

type WriteResult = { ok: true } | { ok: false; error: string };
type ProfileStatus = "loading" | "ready" | "parse_error";

interface AppProfileHook {
  status: ProfileStatus;
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

interface ProfileState {
  status: ProfileStatus;
  profile: UserProfile | null;
}

interface StoreValue {
  profileState: ProfileState;
  reloadProfile: () => void;
  saveProfile: (profile: UserProfile) => Promise<WriteResult>;
  removeProfile: () => void;

  premium: PremiumState;
  reloadPremium: () => void;
  savePurchase30d: (now?: number) => Promise<WriteResult>;

  ai: AiDisclosureState;
  reloadAi: () => void;
  acknowledge: (now?: number) => Promise<WriteResult>;

  promo: PromotionState;
  reloadPromo: () => void;
  markFirstGranted: (now?: number) => Promise<WriteResult>;
}

function computeProfileState(): ProfileState {
  const result = loadProfile();
  if (result.ok) {
    return { status: "ready", profile: result.data ?? null };
  }
  if (result.error === "PARSE_ERROR") {
    return { status: "parse_error", profile: null };
  }
  return { status: "ready", profile: null };
}

function defaultAiState(now: number): AiDisclosureState {
  return { version: 1, id: "me", acknowledged: false, createdAt: now, updatedAt: now };
}

function loadAiSafe(): AiDisclosureState {
  const result = loadAiDisclosure();
  if (result.ok && result.data) {
    return result.data;
  }
  return defaultAiState(Date.now());
}

function defaultPromoState(now: number): PromotionState {
  return { version: 1, id: "me", firstSessionRewardGranted: false, createdAt: now, updatedAt: now };
}

function loadPromoSafe(): PromotionState {
  const result = loadPromoState();
  if (result.ok && result.data) {
    return result.data;
  }
  return defaultPromoState(Date.now());
}

const AppStoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [profileState, setProfileState] = useState<ProfileState>(() => computeProfileState());
  const [premium, setPremium] = useState<PremiumState>(() => loadPremiumStateSafe());
  const [ai, setAi] = useState<AiDisclosureState>(() => loadAiSafe());
  const [promo, setPromo] = useState<PromotionState>(() => loadPromoSafe());

  const reloadProfile = useCallback(() => setProfileState(computeProfileState()), []);
  const reloadPremium = useCallback(() => setPremium(loadPremiumStateSafe()), []);
  const reloadAi = useCallback(() => setAi(loadAiSafe()), []);
  const reloadPromo = useCallback(() => setPromo(loadPromoSafe()), []);

  const saveProfile = useCallback(async (profile: UserProfile): Promise<WriteResult> => {
    const res = safeSetItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
    if (!res.ok) {
      return { ok: false, error: res.error };
    }
    setProfileState({ status: "ready", profile });
    return { ok: true };
  }, []);

  const removeProfile = useCallback(() => {
    deleteProfile();
    setProfileState({ status: "ready", profile: null });
  }, []);

  const savePurchase30d = useCallback(async (now: number = Date.now()): Promise<WriteResult> => {
    const current = loadPremiumStateSafe();
    const next: PremiumState = {
      ...current,
      isPremium: true,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
      lastPurchaseAt: now,
      updatedAt: now,
    };
    const res = safeSetItem(STORAGE_KEY_PREMIUM, JSON.stringify(next));
    if (!res.ok) {
      return { ok: false, error: res.error };
    }
    setPremium(next);
    return { ok: true };
  }, []);

  const acknowledge = useCallback(async (now: number = Date.now()): Promise<WriteResult> => {
    const current = loadAiSafe();
    const next: AiDisclosureState = {
      ...current,
      acknowledged: true,
      acknowledgedAt: now,
      updatedAt: now,
    };
    const res = safeSetItem(STORAGE_KEY_AI_DISCLOSURE, JSON.stringify(next));
    if (!res.ok) {
      return { ok: false, error: res.error };
    }
    setAi(next);
    return { ok: true };
  }, []);

  const markFirstGranted = useCallback(async (now: number = Date.now()): Promise<WriteResult> => {
    const current = loadPromoSafe();
    const next: PromotionState = {
      ...current,
      firstSessionRewardGranted: true,
      grantedAt: now,
      updatedAt: now,
    };
    const res = safeSetItem(STORAGE_KEY_PROMO, JSON.stringify(next));
    if (!res.ok) {
      return { ok: false, error: res.error };
    }
    setPromo(next);
    return { ok: true };
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      profileState,
      reloadProfile,
      saveProfile,
      removeProfile,
      premium,
      reloadPremium,
      savePurchase30d,
      ai,
      reloadAi,
      acknowledge,
      promo,
      reloadPromo,
      markFirstGranted,
    }),
    [
      profileState,
      reloadProfile,
      saveProfile,
      removeProfile,
      premium,
      reloadPremium,
      savePurchase30d,
      ai,
      reloadAi,
      acknowledge,
      promo,
      reloadPromo,
      markFirstGranted,
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

function useStore(): StoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("AppStore hooks must be used within an AppStoreProvider");
  }
  return ctx;
}

export function useAppProfile(): AppProfileHook {
  const store = useStore();
  return {
    status: store.profileState.status,
    profile: store.profileState.profile,
    reload: store.reloadProfile,
    save: store.saveProfile,
    remove: store.removeProfile,
  };
}

export function useAppPremium(): AppPremiumHook {
  const store = useStore();
  const isPremiumActive =
    store.premium.isPremium && !!store.premium.expiresAt && store.premium.expiresAt > Date.now();
  return {
    premium: store.premium,
    isPremiumActive,
    reload: store.reloadPremium,
    savePurchase30d: store.savePurchase30d,
  };
}

export function useAiDisclosure(): AiDisclosureHook {
  const store = useStore();
  return {
    state: store.ai,
    reload: store.reloadAi,
    acknowledge: store.acknowledge,
  };
}

export function usePromotion(): PromotionHook {
  const store = useStore();
  return {
    state: store.promo,
    reload: store.reloadPromo,
    markFirstGranted: store.markFirstGranted,
  };
}
