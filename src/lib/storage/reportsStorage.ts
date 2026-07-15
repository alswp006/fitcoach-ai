import type { Report, SessionId } from '@/lib/types';
import { STORAGE_KEY_REPORTS } from '@/lib/storage/keys';
import { safeJsonParse, safeSetItem, safeGetItem } from '@/lib/storage/safeStorage';
import { load as loadSessions } from '@/lib/storage/sessionsStorage';

function loadReports(): Report[] | { ok: false; error: 'PARSE_ERROR' } {
  const raw = safeGetItem(STORAGE_KEY_REPORTS);
  if (raw === null) return [];
  const parsed = safeJsonParse<Report[]>(raw);
  if (!parsed.ok) return { ok: false, error: 'PARSE_ERROR' };
  return parsed.value;
}

function saveReports(reports: Report[]): { ok: true } | { ok: false; error: 'QUOTA_EXCEEDED' } {
  const result = safeSetItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  if (!result.ok) {
    return { ok: false, error: 'QUOTA_EXCEEDED' };
  }
  return { ok: true };
}

export function upsert(
  report: Report
): { ok: true } | { ok: false; error: 'QUOTA_EXCEEDED' | 'PARSE_ERROR' } {
  const loaded = loadReports();
  if (!Array.isArray(loaded)) {
    return loaded;
  }
  const index = loaded.findIndex((r) => r.id === report.id);
  const next = [...loaded];
  if (index === -1) {
    next.push(report);
  } else {
    next[index] = report;
  }
  return saveReports(next);
}

export function findReportBySessionId(sessionId: SessionId): Report | null {
  const loaded = loadReports();
  const reports = Array.isArray(loaded) ? loaded : [];
  return reports.find((r) => r.sessionId === sessionId) ?? null;
}

export function garbageCollectOrphanReports(): { ok: true; deletedCount: number } {
  const loadedReports = loadReports();
  const reports = Array.isArray(loadedReports) ? loadedReports : [];
  const loadedSessions = loadSessions();
  const sessions = Array.isArray(loadedSessions) ? loadedSessions : [];
  const sessionIds = new Set(sessions.map((s) => s.id));

  const kept = reports.filter((r) => sessionIds.has(r.sessionId));
  const deletedCount = reports.length - kept.length;
  saveReports(kept);
  return { ok: true, deletedCount };
}
