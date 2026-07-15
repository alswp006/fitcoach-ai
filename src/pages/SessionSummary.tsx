import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Top, Paragraph, Spacing } from '@toss/tds-mobile';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { Card } from '@/components/Card';
import { SummaryHero } from '@/components/SummaryHero';
import { CountUp } from '@/components/CountUp';
import { SubmitFooter } from '@/components/BottomCTA';
import { ErrorSection } from '@/components/StateSections';
import * as sessionsStorage from '@/lib/storage/sessionsStorage';
import { getWorkoutById } from '@/lib/workouts';
import type { RouteState, Session } from '@/lib/types';

function findSession(sessionId: string): Session | null {
  const loaded = sessionsStorage.load();
  const sessions = Array.isArray(loaded) ? loaded : [];
  return sessions.find((s) => s.id === sessionId) ?? null;
}

export default function SessionSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as RouteState | null) ?? null;
  const sessionId = routeState?.sessionId ?? null;

  const session = useMemo(() => (sessionId ? findSession(sessionId) : null), [sessionId]);

  const top = <Top title={<Top.TitleParagraph>세션 요약</Top.TitleParagraph>} />;

  if (!sessionId || !session) {
    return (
      <ScreenScaffold top={top}>
        <ErrorSection
          title="세션을 찾을 수 없어요"
          actionLabel="홈으로"
          onAction={() => navigate('/')}
          testId="session-summary-not-found-section"
        />
      </ScreenScaffold>
    );
  }

  const workout = getWorkoutById(session.workoutId);
  const minutes = session.durationSec ? Math.round(session.durationSec / 60) : 0;

  return (
    <ScreenScaffold
      top={top}
      bottom={
        <SubmitFooter
          label="AI 리포트 보기"
          onClick={() => navigate('/report', { state: { sessionId } as RouteState })}
        />
      }
    >
      <SummaryHero
        label={workout?.title ?? '운동'}
        value={<CountUp value={session.feedbackCount} unit="회" typography="t1" />}
        caption="피드백 횟수"
        testId="summary-metrics-card"
      />

      <Spacing size={16} />

      <Card testId="summary-duration-card">
        <Paragraph.Text typography="t5">운동 시간</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="st13">{minutes}분</Paragraph.Text>
      </Card>

      <Spacing size={24} />
    </ScreenScaffold>
  );
}
