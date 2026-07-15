import type { AiDisclosureState } from '@/lib/types';
import type { StorageResult } from './storageResult';
import { STORAGE_KEY_AI_DISCLOSURE } from './keys';

export function loadAiDisclosure(): StorageResult<AiDisclosureState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_DISCLOSURE);
    if (!raw) {
      return { ok: false, error: 'NOT_FOUND' };
    }
    const data = JSON.parse(raw) as AiDisclosureState;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'PARSE_ERROR' };
  }
}

export function saveAiDisclosure(state: AiDisclosureState): void {
  localStorage.setItem(STORAGE_KEY_AI_DISCLOSURE, JSON.stringify(state));
}

export function deleteAiDisclosure(): void {
  localStorage.removeItem(STORAGE_KEY_AI_DISCLOSURE);
}
