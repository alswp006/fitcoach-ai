import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Top, ListRow, Button, Spacing } from '@toss/tds-mobile';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/StateView';
import { useAppToast } from '@/components/AppToastProvider';
import { getSessionsPage } from '@/lib/storage/pagination';
import { load as loadSessions, removeSessionsKey, dedupeBySessionId } from '@/lib/storage/sessionsStorage';
import { getWorkoutById } from '@/lib/workouts';
import type { Session } from '@/lib/types';

const PAGE_SIZE = 20;

interface HistoryState {
  parseError: boolean;
  sessions: Session[];
  nextPage: number;
  hasNext: boolean;
}

function loadInitialState(): HistoryState {
  const loaded = loadSessions();
  if (!Array.isArray(loaded)) {
    return { parseError: true, sessions: [], nextPage: 0, hasNext: false };
  }
  const result = getSessionsPage({ page: 0, pageSize: PAGE_SIZE });
  return {
    parseError: false,
    sessions: dedupeBySessionId(result.items),
    nextPage: 1,
    hasNext: result.hasNext,
  };
}

function formatSessionDate(startedAt: number): string {
  const d = new Date(startedAt);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function sessionSubtitle(session: Session): string {
  const minutes = session.durationSec ? Math.round(session.durationSec / 60) : 0;
  return `${formatSessionDate(session.startedAt)} · ${minutes}분`;
}

export default function History() {
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const [{ parseError, sessions, nextPage, hasNext }, setState] = useState<HistoryState>(loadInitialState);

  const handleLoadMore = useCallback(() => {
    const loaded = loadSessions();
    if (!Array.isArray(loaded)) {
      showToast('목록을 불러오지 못했어요');
      return;
    }
    setState((prev) => {
      const result = getSessionsPage({ page: prev.nextPage, pageSize: PAGE_SIZE });
      return {
        ...prev,
        sessions: dedupeBySessionId([...prev.sessions, ...result.items]),
        hasNext: result.hasNext,
        nextPage: prev.nextPage + 1,
      };
    });
  }, [showToast]);

  const handleReset = useCallback(() => {
    removeSessionsKey();
    setState({ parseError: false, sessions: [], nextPage: 0, hasNext: false });
  }, []);

  if (parseError) {
    return (
      <ScreenScaffold top={<Top title={<Top.TitleParagraph>기록</Top.TitleParagraph>} />}>
        <EmptyState
          testId="history-error"
          title="데이터를 불러오지 못했어요"
          description="기록을 표시할 수 없어요. 초기화 후 다시 시도해 주세요."
          action={
            <Button variant="weak" display="block" onClick={handleReset}>
              초기화
            </Button>
          }
        />
      </ScreenScaffold>
    );
  }

  if (sessions.length === 0) {
    return (
      <ScreenScaffold top={<Top title={<Top.TitleParagraph>기록</Top.TitleParagraph>} />}>
        <EmptyState
          testId="history-empty"
          title="아직 기록이 없어요"
          description="운동을 시작하면 기록이 이곳에 쌓여요"
          action={
            <Button variant="weak" display="block" onClick={() => navigate('/')}>
              운동하러 가기
            </Button>
          }
        />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>기록</Top.TitleParagraph>} />}>
      <Card testId="history-list-card">
        {sessions.map((session) => {
          const workout = getWorkoutById(session.workoutId);
          return (
            <ListRow
              key={session.id}
              data-testid="history-session-item"
              data-session-id={session.id}
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={workout?.title ?? session.workoutId}
                  bottom={sessionSubtitle(session)}
                />
              }
            />
          );
        })}
      </Card>

      <Spacing size={16} />
      {hasNext ? (
        <>
          <Button variant="weak" display="block" onClick={handleLoadMore}>
            더 보기
          </Button>
          <Spacing size={16} />
        </>
      ) : null}
    </ScreenScaffold>
  );
}
