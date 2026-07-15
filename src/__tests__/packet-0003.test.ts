import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  UserProfile,
  PremiumState,
  AiDisclosureState,
  PromotionState,
} from '@/lib/types';

// ============================================================================
// AC1: Storage Keys Constants
// ============================================================================

describe('AC1: Storage keys constants should exist and export correct values', () => {
  it('AC1: should export all storage key constants', async () => {
    // Import will fail if keys don't exist — this proves they're exported
    const keys = await import('@/lib/storage/keys');
    expect(keys.STORAGE_KEY_USER_PROFILE).toBe('fitcoach.userProfile.v1');
    expect(keys.STORAGE_KEY_PREMIUM).toBe('fitcoach.premium.v1');
    expect(keys.STORAGE_KEY_AI_DISCLOSURE).toBe('fitcoach.aiDisclosure.v1');
    expect(keys.STORAGE_KEY_PROMO).toBe('fitcoach.promo.v1');
  });
});

// ============================================================================
// AC2: Storage CRUD functions with error handling
// ============================================================================

describe('AC2: Profile storage CRUD with PARSE_ERROR on malformed JSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('AC2[profileStorage]: should export load/save/delete functions', async () => {
    const module = await import('@/lib/storage/profileStorage');
    expect(typeof module.loadProfile).toBe('function');
    expect(typeof module.saveProfile).toBe('function');
    expect(typeof module.deleteProfile).toBe('function');
  });

  it('AC2[profileStorage]: loadProfile() should return {ok:false,error:"PARSE_ERROR"} on malformed JSON', async () => {
    const { loadProfile } = await import('@/lib/storage/profileStorage');
    const key = 'fitcoach.userProfile.v1';
    localStorage.setItem(key, 'not-valid-json{]');

    const result = loadProfile();
    expect(result.ok).toBe(false);
    expect(result.error).toBe('PARSE_ERROR');
    expect(result.data).toBeUndefined();
  });

  it('AC2[profileStorage]: loadProfile() should return valid profile when stored', async () => {
    const { loadProfile, saveProfile } = await import('@/lib/storage/profileStorage');
    const profile: UserProfile = {
      version: 1,
      id: 'me',
      heightCm: 170,
      weightKg: 65,
      goal: '자세교정',
      level: '초급',
      voiceFeedbackEnabled: true,
      createdAt: 1000,
      updatedAt: 1000,
    };

    saveProfile(profile);
    const result = loadProfile();

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(profile);
    expect(result.error).toBeUndefined();
  });

  it('AC2[profileStorage]: deleteProfile() should remove key from localStorage', async () => {
    const { saveProfile, deleteProfile } = await import('@/lib/storage/profileStorage');
    const profile: UserProfile = {
      version: 1,
      id: 'me',
      heightCm: 170,
      weightKg: 65,
      goal: '근력증가',
      level: '중급',
      voiceFeedbackEnabled: false,
      createdAt: 2000,
      updatedAt: 2000,
    };

    saveProfile(profile);
    deleteProfile();

    const stored = localStorage.getItem('fitcoach.userProfile.v1');
    expect(stored).toBeNull();
  });
});

describe('AC2: Premium storage CRUD with PARSE_ERROR on malformed JSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('AC2[premiumStorage]: should export load/save/delete functions', async () => {
    const module = await import('@/lib/storage/premiumStorage');
    expect(typeof module.loadPremiumState).toBe('function');
    expect(typeof module.savePremiumState).toBe('function');
    expect(typeof module.deletePremiumState).toBe('function');
    expect(typeof module.loadPremiumStateSafe).toBe('function');
    expect(typeof module.getIsPremiumActive).toBe('function');
  });

  it('AC2[premiumStorage]: loadPremiumState() should return {ok:false,error:"PARSE_ERROR"} on malformed JSON', async () => {
    const { loadPremiumState } = await import('@/lib/storage/premiumStorage');
    const key = 'fitcoach.premium.v1';
    localStorage.setItem(key, '{invalid json}');

    const result = loadPremiumState();
    expect(result.ok).toBe(false);
    expect(result.error).toBe('PARSE_ERROR');
    expect(result.data).toBeUndefined();
  });

  it('AC2[premiumStorage]: loadPremiumState() should return valid premium state when stored', async () => {
    const { loadPremiumState, savePremiumState } = await import('@/lib/storage/premiumStorage');
    const futureTime = Date.now() + 86400000; // 1 day from now
    const state: PremiumState = {
      version: 1,
      id: 'me',
      isPremium: true,
      expiresAt: futureTime,
      lastPurchaseAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    savePremiumState(state);
    const result = loadPremiumState();

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(state);
    expect(result.error).toBeUndefined();
  });
});

describe('AC2: AiDisclosure storage CRUD with PARSE_ERROR on malformed JSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('AC2[aiDisclosureStorage]: should export load/save/delete functions', async () => {
    const module = await import('@/lib/storage/aiDisclosureStorage');
    expect(typeof module.loadAiDisclosure).toBe('function');
    expect(typeof module.saveAiDisclosure).toBe('function');
    expect(typeof module.deleteAiDisclosure).toBe('function');
  });

  it('AC2[aiDisclosureStorage]: loadAiDisclosure() should return {ok:false,error:"PARSE_ERROR"} on malformed JSON', async () => {
    const { loadAiDisclosure } = await import('@/lib/storage/aiDisclosureStorage');
    const key = 'fitcoach.aiDisclosure.v1';
    localStorage.setItem(key, 'malformed');

    const result = loadAiDisclosure();
    expect(result.ok).toBe(false);
    expect(result.error).toBe('PARSE_ERROR');
  });

  it('AC2[aiDisclosureStorage]: loadAiDisclosure() should return valid state when stored', async () => {
    const { loadAiDisclosure, saveAiDisclosure } = await import('@/lib/storage/aiDisclosureStorage');
    const state: AiDisclosureState = {
      version: 1,
      id: 'me',
      acknowledged: true,
      acknowledgedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveAiDisclosure(state);
    const result = loadAiDisclosure();

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(state);
  });
});

describe('AC2: Promotion storage CRUD with PARSE_ERROR on malformed JSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('AC2[promoStorage]: should export load/save/delete functions', async () => {
    const module = await import('@/lib/storage/promoStorage');
    expect(typeof module.loadPromoState).toBe('function');
    expect(typeof module.savePromoState).toBe('function');
    expect(typeof module.deletePromoState).toBe('function');
  });

  it('AC2[promoStorage]: loadPromoState() should return {ok:false,error:"PARSE_ERROR"} on malformed JSON', async () => {
    const { loadPromoState } = await import('@/lib/storage/promoStorage');
    const key = 'fitcoach.promo.v1';
    localStorage.setItem(key, '(invalid)');

    const result = loadPromoState();
    expect(result.ok).toBe(false);
    expect(result.error).toBe('PARSE_ERROR');
  });

  it('AC2[promoStorage]: loadPromoState() should return valid state when stored', async () => {
    const { loadPromoState, savePromoState } = await import('@/lib/storage/promoStorage');
    const state: PromotionState = {
      version: 1,
      id: 'me',
      firstSessionRewardGranted: true,
      grantedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    savePromoState(state);
    const result = loadPromoState();

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(state);
  });
});

// ============================================================================
// AC3: loadPremiumStateSafe() returns default on missing key or parse error
// ============================================================================

describe('AC3: loadPremiumStateSafe() returns default state and no console.error', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('AC3[P0]: should return default PremiumState when key is missing', async () => {
    const { loadPremiumStateSafe } = await import('@/lib/storage/premiumStorage');
    // Key 'fitcoach.premium.v1' does not exist in localStorage

    const result = loadPremiumStateSafe();

    expect(result).toBeDefined();
    expect(result.version).toBe(1);
    expect(result.id).toBe('me');
    expect(result.isPremium).toBe(false);
    expect(result.createdAt).toBeGreaterThan(0);
    expect(result.updatedAt).toBeGreaterThan(0);
  });

  it('AC3[P0]: should return default PremiumState when JSON parse fails', async () => {
    const { loadPremiumStateSafe } = await import('@/lib/storage/premiumStorage');
    localStorage.setItem('fitcoach.premium.v1', 'corrupted-json{]');

    const result = loadPremiumStateSafe();

    expect(result).toBeDefined();
    expect(result.isPremium).toBe(false);
    expect(result.version).toBe(1);
    expect(result.id).toBe('me');
  });

  it('AC3: should NOT call console.error when falling back to default', async () => {
    const { loadPremiumStateSafe } = await import('@/lib/storage/premiumStorage');
    localStorage.setItem('fitcoach.premium.v1', 'bad-json');

    loadPremiumStateSafe();

    expect(console.error).not.toHaveBeenCalled();
  });

  it('AC3: should NOT call console.error when key is missing', async () => {
    const { loadPremiumStateSafe } = await import('@/lib/storage/premiumStorage');
    // No key set

    loadPremiumStateSafe();

    expect(console.error).not.toHaveBeenCalled();
  });

  it('AC3: getIsPremiumActive() should return false when expired', async () => {
    const { getIsPremiumActive, savePremiumState } = await import('@/lib/storage/premiumStorage');
    const pastTime = Date.now() - 1000; // 1 second ago (expired)
    const expiredState: PremiumState = {
      version: 1,
      id: 'me',
      isPremium: true,
      expiresAt: pastTime,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    savePremiumState(expiredState);
    const isActive = getIsPremiumActive();

    expect(isActive).toBe(false);
  });

  it('AC3: getIsPremiumActive() should return true when not expired', async () => {
    const { getIsPremiumActive, savePremiumState } = await import('@/lib/storage/premiumStorage');
    const futureTime = Date.now() + 86400000; // 1 day from now (not expired)
    const activeState: PremiumState = {
      version: 1,
      id: 'me',
      isPremium: true,
      expiresAt: futureTime,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    savePremiumState(activeState);
    const isActive = getIsPremiumActive();

    expect(isActive).toBe(true);
  });
});
