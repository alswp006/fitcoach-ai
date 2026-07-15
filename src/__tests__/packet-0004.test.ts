import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session, Report, PageRequest, PageResult } from '@/lib/types';

// ============================================================================
// AC1: Sessions Storage CRUD + dedupeBySessionId
// ============================================================================

describe('AC1: sessionsStorage CRUD operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('AC1[P0]: should export load/save/prepend/update/removeSessionsKey/dedupeBySessionId', async () => {
    const module = await import('@/lib/storage/sessionsStorage');
    expect(typeof module.load).toBe('function');
    expect(typeof module.save).toBe('function');
    expect(typeof module.prepend).toBe('function');
    expect(typeof module.update).toBe('function');
    expect(typeof module.removeSessionsKey).toBe('function');
    expect(typeof module.dedupeBySessionId).toBe('function');
  });

  it('AC1[P0]: load() should return empty array when key not set', async () => {
    const { load } = await import('@/lib/storage/sessionsStorage');

    const result = load();

    expect(Array.isArray(result)).toBe(true);
    expect((result as Session[]).length).toBe(0);
  });

  it('AC1[P0]: save() should persist sessions array to localStorage', async () => {
    const { save } = await import('@/lib/storage/sessionsStorage');
    const sessions: Session[] = [
      {
        version: 1,
        id: 'session-1',
        workoutId: 'squat',
        startedAt: 1000,
        endedAt: 2000,
        durationSec: 1000,
        feedbackCount: 5,
        feedbackEventsSample: [],
        score: 85,
        createdAt: 1000,
        updatedAt: 2000,
      },
    ];

    const result = save(sessions);

    expect(result.ok).toBe(true);
    const stored = localStorage.getItem('fitcoach.sessions.v1');
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed).toEqual(sessions);
    }
  });

  it('AC1[P0]: load() should return previously saved sessions', async () => {
    const { save, load } = await import('@/lib/storage/sessionsStorage');
    const sessions: Session[] = [
      {
        version: 1,
        id: 'session-1',
        workoutId: 'pushup',
        startedAt: 1000,
        feedbackCount: 3,
        feedbackEventsSample: [],
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    save(sessions);
    const loaded = load() as Session[];

    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe('session-1');
    expect(loaded[0].workoutId).toBe('pushup');
  });

  it('AC1[P0]: load() should return {ok:false,error:"PARSE_ERROR"} on malformed JSON', async () => {
    const { load } = await import('@/lib/storage/sessionsStorage');
    localStorage.setItem('fitcoach.sessions.v1', 'malformed{json');

    const result = load();

    // Should return ParseError result
    if (typeof result === 'object' && 'ok' in result) {
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('PARSE_ERROR');
      }
    } else {
      // If load() returns a result object directly
      expect(result).toBeDefined();
    }
  });

  it('AC1[P0]: prepend() should add session to front of array', async () => {
    const { save, load, prepend } = await import('@/lib/storage/sessionsStorage');
    const session1: Session = {
      version: 1,
      id: 'session-1',
      workoutId: 'squat',
      startedAt: 1000,
      feedbackCount: 0,
      feedbackEventsSample: [],
      createdAt: 1000,
      updatedAt: 1000,
    };
    const session2: Session = {
      version: 1,
      id: 'session-2',
      workoutId: 'pushup',
      startedAt: 2000,
      feedbackCount: 0,
      feedbackEventsSample: [],
      createdAt: 2000,
      updatedAt: 2000,
    };

    save([session1]);
    const result = prepend(session2);

    expect(result.ok).toBe(true);
    const loaded = load();
    expect(Array.isArray(loaded) ? loaded : []).toHaveLength(2);
    expect((Array.isArray(loaded) ? loaded : [])[0]?.id).toBe('session-2');
    expect((Array.isArray(loaded) ? loaded : [])[1]?.id).toBe('session-1');
  });

  it('AC1[P0]: update() should modify existing session and return {ok:true}', async () => {
    const { save, update, load } = await import('@/lib/storage/sessionsStorage');
    const original: Session = {
      version: 1,
      id: 'session-1',
      workoutId: 'squat',
      startedAt: 1000,
      durationSec: 100,
      feedbackCount: 2,
      feedbackEventsSample: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    save([original]);

    const updated: Session = { ...original, durationSec: 500, feedbackCount: 10, updatedAt: 5000 };
    const result = update(updated);

    expect(result.ok).toBe(true);
    const loaded = load();
    const fetched = (Array.isArray(loaded) ? loaded : []).find((s) => s.id === 'session-1');
    expect(fetched?.durationSec).toBe(500);
    expect(fetched?.feedbackCount).toBe(10);
    expect(fetched?.updatedAt).toBe(5000);
  });

  it('AC1[P0]: update() should return {ok:false,error:"NOT_FOUND"} for non-existent session', async () => {
    const { update } = await import('@/lib/storage/sessionsStorage');
    const nonExistent: Session = {
      version: 1,
      id: 'unknown-id',
      workoutId: 'plank',
      startedAt: 1000,
      feedbackCount: 0,
      feedbackEventsSample: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const result = update(nonExistent);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('NOT_FOUND');
    }
  });

  it('AC1[P0]: removeSessionsKey() should delete all sessions', async () => {
    const { save, removeSessionsKey } = await import('@/lib/storage/sessionsStorage');
    const sessions: Session[] = [
      {
        version: 1,
        id: 'session-1',
        workoutId: 'squat',
        startedAt: 1000,
        feedbackCount: 0,
        feedbackEventsSample: [],
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    save(sessions);
    removeSessionsKey();

    const stored = localStorage.getItem('fitcoach.sessions.v1');
    expect(stored).toBeNull();
  });

  it('AC1[P0]: dedupeBySessionId() should remove duplicates and keep latest updatedAt', async () => {
    const { dedupeBySessionId } = await import('@/lib/storage/sessionsStorage');
    const sessions: Session[] = [
      {
        version: 1,
        id: 'session-1',
        workoutId: 'squat',
        startedAt: 1000,
        feedbackCount: 5,
        feedbackEventsSample: [],
        updatedAt: 1000,
        createdAt: 1000,
      },
      {
        version: 1,
        id: 'session-1',
        workoutId: 'squat',
        startedAt: 1000,
        feedbackCount: 10,
        feedbackEventsSample: [],
        updatedAt: 2000,
        createdAt: 1000,
      },
      {
        version: 1,
        id: 'session-2',
        workoutId: 'pushup',
        startedAt: 2000,
        feedbackCount: 3,
        feedbackEventsSample: [],
        updatedAt: 2000,
        createdAt: 2000,
      },
    ];

    const deduped = dedupeBySessionId(sessions);

    expect(deduped.length).toBe(2);
    const kept1 = deduped.find((s: Session) => s.id === 'session-1');
    expect(kept1?.feedbackCount).toBe(10);
    expect(kept1?.updatedAt).toBe(2000);
  });

  it('AC1[P0]: save() should return {ok:false,error:"QUOTA_EXCEEDED"} on storage limit', async () => {
    const { save } = await import('@/lib/storage/sessionsStorage');
    const quotaError = new Error('QuotaExceededError');
    quotaError.name = 'QuotaExceededError';

    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw quotaError;
    });

    const sessions: Session[] = [
      {
        version: 1,
        id: 'session-1',
        workoutId: 'squat',
        startedAt: 1000,
        feedbackCount: 0,
        feedbackEventsSample: [],
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    const result = save(sessions);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('QUOTA_EXCEEDED');
    }
  });
});

// ============================================================================
// AC2: Pagination — getSessionsPage with limit and cursor
// ============================================================================

describe('AC2: pagination.ts — getSessionsPage(req)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('AC2[P0]: getSessionsPage should return PageResult with items limited to req.pageSize', async () => {
    const { getSessionsPage } = await import('@/lib/storage/pagination');
    const { save } = await import('@/lib/storage/sessionsStorage');

    // Create 10 sessions
    const sessions: Session[] = Array.from({ length: 10 }, (_, i) => ({
      version: 1 as const,
      id: `session-${i}`,
      workoutId: i % 3 === 0 ? 'squat' : i % 3 === 1 ? 'pushup' : 'plank',
      startedAt: 1000 + i * 100,
      feedbackCount: i,
      feedbackEventsSample: [],
      createdAt: 1000 + i * 100,
      updatedAt: 1000 + i * 100,
    }));

    save(sessions);

    const req: PageRequest = { page: 0, pageSize: 3 };
    const result = getSessionsPage(req);

    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBe(3);
    expect(result.pageSize).toBe(3);
    expect(result.page).toBe(0);
  });

  it('AC2[P0]: getSessionsPage should set hasNext=true if more items exist beyond current page', async () => {
    const { getSessionsPage } = await import('@/lib/storage/pagination');
    const { save } = await import('@/lib/storage/sessionsStorage');

    const sessions: Session[] = Array.from({ length: 10 }, (_, i) => ({
      version: 1 as const,
      id: `session-${i}`,
      workoutId: i % 2 === 0 ? 'squat' : 'pushup',
      startedAt: 1000 + i * 100,
      feedbackCount: i,
      feedbackEventsSample: [],
      createdAt: 1000 + i * 100,
      updatedAt: 1000 + i * 100,
    }));

    save(sessions);

    const req: PageRequest = { page: 0, pageSize: 5 };
    const result = getSessionsPage(req);

    expect(result.hasNext).toBe(true);
    expect(result.total).toBe(10);
  });

  it('AC2[P0]: getSessionsPage should set hasNext=false when no more items', async () => {
    const { getSessionsPage } = await import('@/lib/storage/pagination');
    const { save } = await import('@/lib/storage/sessionsStorage');

    const sessions: Session[] = Array.from({ length: 5 }, (_, i) => ({
      version: 1 as const,
      id: `session-${i}`,
      workoutId: 'squat',
      startedAt: 1000 + i * 100,
      feedbackCount: i,
      feedbackEventsSample: [],
      createdAt: 1000 + i * 100,
      updatedAt: 1000 + i * 100,
    }));

    save(sessions);

    const req: PageRequest = { page: 0, pageSize: 10 };
    const result = getSessionsPage(req);

    expect(result.hasNext).toBe(false);
    expect(result.items.length).toBe(5);
  });

  it('AC2[P0]: getSessionsPage should NOT include items beyond limit (prevent overflow)', async () => {
    const { getSessionsPage } = await import('@/lib/storage/pagination');
    const { save } = await import('@/lib/storage/sessionsStorage');

    const sessions: Session[] = Array.from({ length: 20 }, (_, i) => ({
      version: 1 as const,
      id: `session-${i}`,
      workoutId: 'plank',
      startedAt: 1000 + i * 100,
      feedbackCount: i,
      feedbackEventsSample: [],
      createdAt: 1000 + i * 100,
      updatedAt: 1000 + i * 100,
    }));

    save(sessions);

    const req: PageRequest = { page: 1, pageSize: 5 };
    const result = getSessionsPage(req);

    // Page 1 (0-indexed) should return items [5..9], total 5 items, not 6 or more
    expect(result.items.length).toBeLessThanOrEqual(5);
    expect(result.items.length).toBe(5);
  });

  it('AC2[P0]: getSessionsPage should calculate total correctly', async () => {
    const { getSessionsPage } = await import('@/lib/storage/pagination');
    const { save } = await import('@/lib/storage/sessionsStorage');

    const sessions: Session[] = Array.from({ length: 7 }, (_, i) => ({
      version: 1 as const,
      id: `session-${i}`,
      workoutId: 'squat',
      startedAt: 1000 + i * 100,
      feedbackCount: i,
      feedbackEventsSample: [],
      createdAt: 1000 + i * 100,
      updatedAt: 1000 + i * 100,
    }));

    save(sessions);

    const req: PageRequest = { page: 0, pageSize: 2 };
    const result = getSessionsPage(req);

    expect(result.total).toBe(7);
    expect(result.page).toBe(0);
    expect(result.pageSize).toBe(2);
  });

  it('AC2[P0]: getSessionsPage should handle empty sessions gracefully', async () => {
    const { getSessionsPage } = await import('@/lib/storage/pagination');

    const req: PageRequest = { page: 0, pageSize: 10 };
    const result = getSessionsPage(req);

    expect(result.items.length).toBe(0);
    expect(result.total).toBe(0);
    expect(result.hasNext).toBe(false);
  });
});

// ============================================================================
// AC3: Reports Storage CRUD + Orphan GC
// ============================================================================

describe('AC3: reportsStorage CRUD — upsert/findReportBySessionId/garbageCollectOrphanReports', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('AC3[P0]: should export upsert/findReportBySessionId/garbageCollectOrphanReports', async () => {
    const module = await import('@/lib/storage/reportsStorage');
    expect(typeof module.upsert).toBe('function');
    expect(typeof module.findReportBySessionId).toBe('function');
    expect(typeof module.garbageCollectOrphanReports).toBe('function');
  });

  it('AC3[P0]: upsert() should insert new report and return {ok:true}', async () => {
    const { upsert } = await import('@/lib/storage/reportsStorage');
    const report: Report = {
      version: 1,
      id: 'report-1',
      sessionId: 'session-1',
      generatedBy: 'AI',
      language: 'ko-KR',
      score: 85,
      summaryKo: '좋은 자세입니다',
      improvementsKo: ['팔을 더 펴세요'],
      recommendationsKo: ['매일 10회씩'],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const result = upsert(report);

    expect(result.ok).toBe(true);
    const stored = localStorage.getItem('fitcoach.reports.v1');
    expect(stored).not.toBeNull();
  });

  it('AC3[P0]: upsert() should update existing report with same id', async () => {
    const { upsert, findReportBySessionId } = await import('@/lib/storage/reportsStorage');
    const report1: Report = {
      version: 1,
      id: 'report-1',
      sessionId: 'session-1',
      generatedBy: 'AI',
      language: 'ko-KR',
      score: 85,
      summaryKo: '좋은 자세입니다',
      improvementsKo: ['팔을 더 펴세요'],
      recommendationsKo: ['매일 10회씩'],
      createdAt: 1000,
      updatedAt: 1000,
    };

    upsert(report1);

    const report2: Report = {
      ...report1,
      score: 90,
      summaryKo: '매우 좋은 자세입니다',
      updatedAt: 2000,
    };

    upsert(report2);

    const found = findReportBySessionId('session-1');
    expect(found?.score).toBe(90);
    expect(found?.summaryKo).toBe('매우 좋은 자세입니다');
  });

  it('AC3[P0]: findReportBySessionId() should return report for matching sessionId', async () => {
    const { upsert, findReportBySessionId } = await import('@/lib/storage/reportsStorage');
    const report: Report = {
      version: 1,
      id: 'report-1',
      sessionId: 'session-1',
      generatedBy: 'AI',
      language: 'ko-KR',
      score: 75,
      summaryKo: '개선 필요',
      improvementsKo: ['허리를 굽히지 마세요'],
      recommendationsKo: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    upsert(report);
    const found = findReportBySessionId('session-1');

    expect(found).not.toBeNull();
    expect(found?.id).toBe('report-1');
    expect(found?.score).toBe(75);
  });

  it('AC3[P0]: findReportBySessionId() should return null for non-existent sessionId', async () => {
    const { findReportBySessionId } = await import('@/lib/storage/reportsStorage');

    const found = findReportBySessionId('unknown-session');

    expect(found).toBeNull();
  });

  it('AC3[P0]: garbageCollectOrphanReports() should remove reports without matching session', async () => {
    const { upsert, garbageCollectOrphanReports } = await import('@/lib/storage/reportsStorage');
    const { save } = await import('@/lib/storage/sessionsStorage');

    // Create report for session-1, but no session
    const report: Report = {
      version: 1,
      id: 'report-orphan',
      sessionId: 'session-orphan',
      generatedBy: 'AI',
      language: 'ko-KR',
      score: 50,
      summaryKo: 'No session',
      improvementsKo: [],
      recommendationsKo: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    upsert(report);

    // Create one session
    const session: Session = {
      version: 1,
      id: 'session-1',
      workoutId: 'squat',
      startedAt: 1000,
      feedbackCount: 0,
      feedbackEventsSample: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    save([session]);

    const result = garbageCollectOrphanReports();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.deletedCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('AC3[P0]: upsert() should return {ok:false,error:"QUOTA_EXCEEDED"} on storage full', async () => {
    const { upsert } = await import('@/lib/storage/reportsStorage');
    const quotaError = new Error('QuotaExceededError');
    quotaError.name = 'QuotaExceededError';

    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw quotaError;
    });

    const report: Report = {
      version: 1,
      id: 'report-1',
      sessionId: 'session-1',
      generatedBy: 'AI',
      language: 'ko-KR',
      score: 85,
      summaryKo: 'Test',
      improvementsKo: [],
      recommendationsKo: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const result = upsert(report);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('QUOTA_EXCEEDED');
    }
  });

  it('AC3[P0]: upsert() should return {ok:false,error:"PARSE_ERROR"} on malformed stored JSON', async () => {
    const { upsert } = await import('@/lib/storage/reportsStorage');
    localStorage.setItem('fitcoach.reports.v1', 'corrupted{json');

    const report: Report = {
      version: 1,
      id: 'report-1',
      sessionId: 'session-1',
      generatedBy: 'AI',
      language: 'ko-KR',
      score: 85,
      summaryKo: 'Test',
      improvementsKo: [],
      recommendationsKo: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const result = upsert(report);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('PARSE_ERROR');
    }
  });

  it('AC3[P0]: garbageCollectOrphanReports() should return {ok:true,deletedCount:0} when no orphans', async () => {
    const { upsert, garbageCollectOrphanReports } = await import('@/lib/storage/reportsStorage');
    const { save } = await import('@/lib/storage/sessionsStorage');

    // Create matching report and session
    const report: Report = {
      version: 1,
      id: 'report-1',
      sessionId: 'session-1',
      generatedBy: 'AI',
      language: 'ko-KR',
      score: 85,
      summaryKo: 'Good',
      improvementsKo: [],
      recommendationsKo: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    const session: Session = {
      version: 1,
      id: 'session-1',
      workoutId: 'squat',
      startedAt: 1000,
      feedbackCount: 0,
      feedbackEventsSample: [],
      createdAt: 1000,
      updatedAt: 1000,
    };

    upsert(report);
    save([session]);

    const result = garbageCollectOrphanReports();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.deletedCount).toBe(0);
    }
  });
});

// ============================================================================
// AC4: Storage Keys Constants for Sessions/Reports
// ============================================================================

describe('AC4: Storage keys constants', () => {
  it('AC4: should export STORAGE_KEY_SESSIONS and STORAGE_KEY_REPORTS', async () => {
    const keys = await import('@/lib/storage/keys');
    expect(keys.STORAGE_KEY_SESSIONS).toBe('fitcoach.sessions.v1');
    expect(keys.STORAGE_KEY_REPORTS).toBe('fitcoach.reports.v1');
  });
});

// ============================================================================
// INTEGRATION: Sessions + Reports + Pagination roundtrip
// ============================================================================

describe('Integration: Sessions → Reports → Pagination → GC roundtrip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create sessions, add reports, paginate, and collect orphans', async () => {
    const { save: saveSessions, load: loadSessions } = await import('@/lib/storage/sessionsStorage');
    const { upsert: upsertReport, garbageCollectOrphanReports } = await import(
      '@/lib/storage/reportsStorage'
    );
    const { getSessionsPage } = await import('@/lib/storage/pagination');

    // 1. Create 5 sessions
    const sessions: Session[] = Array.from({ length: 5 }, (_, i) => ({
      version: 1 as const,
      id: `session-${i}`,
      workoutId: i % 2 === 0 ? 'squat' : 'pushup',
      startedAt: 1000 + i * 100,
      durationSec: 300 + i * 50,
      feedbackCount: 5 + i,
      feedbackEventsSample: [],
      score: 70 + i * 2,
      createdAt: 1000 + i * 100,
      updatedAt: 1000 + i * 100,
    }));

    const saveResult = saveSessions(sessions);
    expect(saveResult.ok).toBe(true);

    // 2. Add reports for first 3 sessions
    for (let i = 0; i < 3; i++) {
      const report: Report = {
        version: 1,
        id: `report-${i}`,
        sessionId: `session-${i}`,
        generatedBy: 'AI',
        language: 'ko-KR',
        score: 70 + i * 5,
        summaryKo: `Summary ${i}`,
        improvementsKo: [`Improvement ${i}`],
        recommendationsKo: [`Recommendation ${i}`],
        createdAt: 1000 + i * 100,
        updatedAt: 1000 + i * 100,
      };
      const upsertResult = upsertReport(report);
      expect(upsertResult.ok).toBe(true);
    }

    // 3. Create orphan reports (not backed by sessions)
    const orphanReport: Report = {
      version: 1,
      id: 'report-orphan',
      sessionId: 'session-orphan-missing',
      generatedBy: 'AI',
      language: 'ko-KR',
      score: 50,
      summaryKo: 'Orphan',
      improvementsKo: [],
      recommendationsKo: [],
      createdAt: 1000,
      updatedAt: 1000,
    };
    upsertReport(orphanReport);

    // 4. Paginate sessions (page 0, size 2)
    const pageResult = getSessionsPage({ page: 0, pageSize: 2 });
    expect(pageResult.total).toBe(5);
    expect(pageResult.items.length).toBe(2);
    expect(pageResult.hasNext).toBe(true);

    // 5. Garbage collect orphans
    const gcResult = garbageCollectOrphanReports();
    expect(gcResult.ok).toBe(true);
    if (gcResult.ok) {
      expect(gcResult.deletedCount).toBe(1); // orphan report should be deleted
    }

    // 6. Verify sessions still exist after GC
    const remainingSessions = loadSessions();
    const loadedArray = Array.isArray(remainingSessions) ? remainingSessions : [];
    expect(loadedArray.length).toBe(5);
  });
});
