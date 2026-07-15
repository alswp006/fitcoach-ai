import type { Session, PageRequest, PageResult } from '@/lib/types';
import { load } from '@/lib/storage/sessionsStorage';

export function getSessionsPage(req: PageRequest): PageResult<Session> {
  const loaded = load();
  const sessions = Array.isArray(loaded) ? loaded : [];
  const total = sessions.length;
  const start = req.page * req.pageSize;
  const items = sessions.slice(start, start + req.pageSize);
  const hasNext = start + items.length < total;

  return {
    items,
    total,
    page: req.page,
    pageSize: req.pageSize,
    hasNext,
  };
}
