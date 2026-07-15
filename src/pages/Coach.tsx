import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Top, Paragraph, Spacing } from '@toss/tds-mobile';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { Card } from '@/components/Card';
import { SubmitFooter } from '@/components/BottomCTA';
import { ErrorSection } from '@/components/StateSections';
import { useAppToast } from '@/components/AppToastProvider';
import * as sessionsStorage from '@/lib/storage/sessionsStorage';
import { getWorkoutById } from '@/lib/workouts';
import type { PoseFeedbackEvent, RouteState, Session, WorkoutId } from '@/lib/types';

type CameraState = 'loading' | 'ready' | 'denied';

const SAMPLE_FEEDBACKS: Array<Pick<PoseFeedbackEvent, 'code' | 'messageKo' | 'severity'>> = [
  { code: 'KNEE_MORE_BEND', messageKo: '무릎을 더 굽히세요', severity: 2 },
  { code: 'BACK_STRAIGHT', messageKo: '허리를 곧게 펴세요', severity: 2 },
  { code: 'ELBOWS_IN', messageKo: '팔꿈치를 몸쪽으로 붙이세요', severity: 1 },
];

async function requestCameraReady(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return true;
  }
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  stream.getTracks().forEach((track) => track.stop());
  return true;
}

export default function Coach() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useAppToast();
  const routeState = (location.state as RouteState | null) ?? null;
  const workoutId = routeState?.workoutId ?? null;
  const sessionId = routeState?.sessionId ?? null;

  const [cameraState, setCameraState] = useState<CameraState>('loading');
  const [retryToken, setRetryToken] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    startedAtRef.current = Date.now();
    setCameraState('loading');

    requestCameraReady()
      .then((ready) => {
        if (!cancelled) setCameraState(ready ? 'ready' : 'denied');
      })
      .catch(() => {
        if (!cancelled) setCameraState('denied');
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, retryToken]);

  const appendFeedback = useCallback(
    (event: PoseFeedbackEvent) => {
      if (!sessionId) return;
      const loaded = sessionsStorage.load();
      const sessions = Array.isArray(loaded) ? loaded : [];
      const current = sessions.find((s) => s.id === sessionId);
      if (!current) return;

      const nextSample = [...current.feedbackEventsSample, event].slice(-20);
      const updated: Session = {
        ...current,
        feedbackCount: current.feedbackCount + 1,
        feedbackEventsSample: nextSample,
        updatedAt: Date.now(),
      };

      const result = sessionsStorage.update(updated);
      if (!result.ok && result.error === 'QUOTA_EXCEEDED') {
        showToast('저장 공간이 부족해요. 오래된 기록을 정리해주세요');
      }
    },
    [sessionId, showToast],
  );

  useEffect(() => {
    if (cameraState !== 'ready' || !sessionId) return;
    let idx = 0;

    function emitFeedback() {
      const sample = SAMPLE_FEEDBACKS[idx % SAMPLE_FEEDBACKS.length];
      idx += 1;
      const event: PoseFeedbackEvent = { t: Date.now() - startedAtRef.current, ...sample };
      setFeedback(event.messageKo);
      appendFeedback(event);
    }

    emitFeedback();
    const timer = setInterval(emitFeedback, 5000);
    return () => clearInterval(timer);
  }, [cameraState, sessionId, appendFeedback]);

  function handleEnd() {
    if (!sessionId) return;
    const loaded = sessionsStorage.load();
    const sessions = Array.isArray(loaded) ? loaded : [];
    const current = sessions.find((s) => s.id === sessionId);
    if (current) {
      const endedAt = Date.now();
      const durationSec = Math.max(1, Math.round((endedAt - current.startedAt) / 1000));
      sessionsStorage.update({ ...current, endedAt, durationSec, updatedAt: endedAt });
    }
    navigate('/session/summary', { state: { sessionId } as RouteState });
  }

  const top = <Top title={<Top.TitleParagraph>실시간 코칭</Top.TitleParagraph>} />;

  if (!sessionId || !workoutId) {
    return (
      <ScreenScaffold top={top}>
        <ErrorSection
          title="세션 정보를 불러오지 못했어요"
          actionLabel="홈으로"
          onAction={() => navigate('/')}
          testId="coach-no-session-section"
        />
      </ScreenScaffold>
    );
  }

  const workout = getWorkoutById(workoutId as WorkoutId);

  return (
    <ScreenScaffold top={top} bottom={<SubmitFooter label="세션 종료" onClick={handleEnd} />}>
      <div
        style={{
          aspectRatio: '3 / 4',
          borderRadius: 16,
          backgroundColor: 'var(--adaptiveLayeredBackground)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cameraState === 'loading' ? (
          <Paragraph.Text typography="t6">카메라 준비 중</Paragraph.Text>
        ) : cameraState === 'ready' ? (
          <Paragraph.Text typography="st13">{workout?.title ?? ''} 진행 중</Paragraph.Text>
        ) : null}
      </div>

      {cameraState === 'denied' ? (
        <>
          <Spacing size={16} />
          <ErrorSection
            title="카메라 권한이 필요해요"
            actionLabel="다시 시도"
            onAction={() => setRetryToken((t) => t + 1)}
            testId="coach-camera-denied-section"
          />
        </>
      ) : null}

      <Spacing size={16} />
      <Card testId="live-feedback-card">
        <Paragraph.Text typography="t5">실시간 피드백</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="st13">{feedback ?? '자세를 분석하고 있어요'}</Paragraph.Text>
      </Card>

      <Spacing size={24} />
    </ScreenScaffold>
  );
}
