import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Top, Paragraph, Spacing } from '@toss/tds-mobile';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { Card } from '@/components/Card';
import { SubmitFooter } from '@/components/BottomCTA';
import { ErrorSection } from '@/components/StateSections';
import { useAppPremium } from '@/lib/store/AppStore';
import { useAppToast } from '@/components/AppToastProvider';
import { getWorkoutById } from '@/lib/workouts';
import { buildInitialSessionRecord } from '@/lib/session/sessionFactory';
import * as sessionsStorage from '@/lib/storage/sessionsStorage';
import type { WorkoutId, RouteState } from '@/lib/types';

export default function WorkoutDetail() {
  const navigate = useNavigate();
  const params = useParams<{ workoutId: string }>();
  const { isPremiumActive } = useAppPremium();
  const { showToast } = useAppToast();

  const workout = useMemo(
    () => getWorkoutById((params.workoutId ?? '') as WorkoutId),
    [params.workoutId],
  );

  if (!workout) {
    return (
      <ScreenScaffold top={<Top title={<Top.TitleParagraph>운동 상세</Top.TitleParagraph>} />}>
        <ErrorSection
          title="운동을 찾을 수 없어요"
          actionLabel="홈으로"
          onAction={() => navigate('/')}
        />
      </ScreenScaffold>
    );
  }

  function handleStart() {
    if (!workout) return;

    if (workout.premiumOnly && !isPremiumActive) {
      navigate('/premium');
      return;
    }

    const session = buildInitialSessionRecord({ workoutId: workout.id });
    const result = sessionsStorage.prepend(session);
    if (!result.ok) {
      showToast('세션을 저장하지 못했어요. 잠시 후 다시 시도해주세요');
      return;
    }

    navigate('/coach', {
      state: { workoutId: workout.id, sessionId: session.sessionId } as RouteState,
    });
  }

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>운동 상세</Top.TitleParagraph>} />}
      bottom={<SubmitFooter label="세션 시작" onClick={handleStart} />}
    >
      <Card testId="workout-detail-card">
        <Paragraph.Text typography="t2">{workout.title}</Paragraph.Text>
        <Spacing size={8} />
        {workout.premiumOnly ? (
          <Paragraph.Text typography="st13">프리미엄 전용</Paragraph.Text>
        ) : null}
        <Spacing size={12} />
        <Paragraph.Text typography="t6">{workout.description}</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="st13">목표 시간: {workout.targetMinutes}분</Paragraph.Text>
      </Card>

      <Spacing size={24} />
    </ScreenScaffold>
  );
}
