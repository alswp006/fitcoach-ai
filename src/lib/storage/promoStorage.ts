import type { PromotionState } from '@/lib/types';
import type { StorageResult } from './storageResult';
import { STORAGE_KEY_PROMO } from './keys';

export function loadPromoState(): StorageResult<PromotionState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROMO);
    if (!raw) {
      return { ok: false, error: 'NOT_FOUND' };
    }
    const data = JSON.parse(raw) as PromotionState;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'PARSE_ERROR' };
  }
}

export function savePromoState(state: PromotionState): void {
  localStorage.setItem(STORAGE_KEY_PROMO, JSON.stringify(state));
}

export function deletePromoState(): void {
  localStorage.removeItem(STORAGE_KEY_PROMO);
}
