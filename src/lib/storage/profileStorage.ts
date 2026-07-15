import type { UserProfile } from '@/lib/types';
import type { StorageResult } from './storageResult';
import { STORAGE_KEY_USER_PROFILE } from './keys';

export function loadProfile(): StorageResult<UserProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (!raw) {
      return { ok: false, error: 'NOT_FOUND' };
    }
    const data = JSON.parse(raw) as UserProfile;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'PARSE_ERROR' };
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
}

export function deleteProfile(): void {
  localStorage.removeItem(STORAGE_KEY_USER_PROFILE);
}
