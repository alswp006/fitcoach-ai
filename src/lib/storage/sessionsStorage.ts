import type { Session } from '@/lib/types';
import { STORAGE_KEY_SESSIONS } from '@/lib/storage/keys';
import { safeJsonParse, safeSetItem, safeGetItem } from '@/lib/storage/safeStorage';

export function load(): Session[] | { ok: false; error: 'PARSE_ERROR' } {
  const raw = safeGetItem(STORAGE_KEY_SESSIONS);
  if (raw === null) return [];
  const parsed = safeJsonParse<Session[]>(raw);
  if (!parsed.ok) return { ok: false, error: 'PARSE_ERROR' };
  return parsed.value;
}

export function save(sessions: Session[]): { ok: true } | { ok: false; error: 'QUOTA_EXCEEDED' } {
  const result = safeSetItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  if (!result.ok) {
    return { ok: false, error: 'QUOTA_EXCEEDED' };
  }
  return { ok: true };
}

export function prepend(session: Session): { ok: true } | { ok: false; error: 'QUOTA_EXCEEDED' } {
  const loaded = load();
  const current = Array.isArray(loaded) ? loaded : [];
  return save([session, ...current]);
}

export function update(
  session: Session
): { ok: true } | { ok: false; error: 'NOT_FOUND' | 'QUOTA_EXCEEDED' } {
  const loaded = load();
  const current = Array.isArray(loaded) ? loaded : [];
  const index = current.findIndex((s) => s.id === session.id);
  if (index === -1) {
    return { ok: false, error: 'NOT_FOUND' };
  }
  const next = [...current];
  next[index] = session;
  return save(next);
}

export function removeSessionsKey(): void {
  localStorage.removeItem(STORAGE_KEY_SESSIONS);
}

export function dedupeBySessionId(sessions: Session[]): Session[] {
  const kept = new Map<string, Session>();
  for (const session of sessions) {
    const existing = kept.get(session.id);
    if (!existing || session.updatedAt >= existing.updatedAt) {
      kept.set(session.id, session);
    }
  }
  return Array.from(kept.values());
}
