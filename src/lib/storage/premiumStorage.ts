import type { PremiumState } from '@/lib/types';
import type { StorageResult } from './storageResult';
import { STORAGE_KEY_PREMIUM } from './keys';

export function loadPremiumState(): StorageResult<PremiumState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREMIUM);
    if (!raw) {
      return { ok: false, error: 'NOT_FOUND' };
    }
    const data = JSON.parse(raw) as PremiumState;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'PARSE_ERROR' };
  }
}

export function savePremiumState(state: PremiumState): void {
  localStorage.setItem(STORAGE_KEY_PREMIUM, JSON.stringify(state));
}

export function deletePremiumState(): void {
  localStorage.removeItem(STORAGE_KEY_PREMIUM);
}

export function loadPremiumStateSafe(): PremiumState {
  const result = loadPremiumState();
  if (result.ok && result.data) {
    return result.data;
  }
  return {
    version: 1,
    id: 'me',
    isPremium: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function getIsPremiumActive(): boolean {
  const premium = loadPremiumStateSafe();
  if (!premium.isPremium) {
    return false;
  }
  if (!premium.expiresAt) {
    return false;
  }
  return premium.expiresAt > Date.now();
}
