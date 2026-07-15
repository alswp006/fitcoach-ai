import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Top, Paragraph, Spacing } from "@toss/tds-mobile";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { Card } from "@/components/Card";
import { SummaryHero } from "@/components/SummaryHero";
import { CountUp } from "@/components/CountUp";
import { ErrorSection } from "@/components/StateSections";
import { LoadingState } from "@/components/StateView";
import * as sessionsStorage from "@/lib/storage/sessionsStorage";
import { generateRemoteReport } from "@/lib/api/endpoints";
import { generateLocalReport } from "@/lib/ai/localGenerators";
import type { RouteState, Session, GenerateReportRequest } from "@/lib/types";

interface ReportView {
  summaryKo: string;
  score: number;
  improvementsKo: string[];
  recommendationsKo: string[];
}

type LoadState =
  | { phase: "loading" }
  | { phase: "not-found" }
  | { phase: "error" }
  | { phase: "success"; report: ReportView };

function findSession(sessionId: string): Session | null {
  const loaded = sessionsStorage.load();
  const sessions = Array.isArray(loaded) ? loaded : [];
  return sessions.find((s) => s.id === sessionId) ?? null;
}

function buildReportRequest(session: Session): GenerateReportRequest {
  return {
    sessionId: session.id,
    workoutId: session.workoutId,
    startedAt: session.startedAt,
    endedAt: session.endedAt ?? session.startedAt,
    durationSec: session.durationSec ?? 0,
    feedbackEventsSample: session.feedbackEventsSample,
  };
}

async function loadReportForSession(session: Session): Promise<LoadState> {
  const remoteResult = await generateRemoteReport(buildReportRequest(session));

  if (remoteResult.ok) {
    const { report } = remoteResult.value;
    return {
      phase: "success",
      report: {
        summaryKo: report.summaryKo,
        score: report.score,
        improvementsKo: report.improvementsKo,
        recommendationsKo: report.recommendationsKo,
      },
    };
  }

  if (remoteResult.reason === "REMOTE_UNAVAILABLE") {
    const local = generateLocalReport({ input: session });
    return {
      phase: "success",
      report: {
        summaryKo: local.summary,
        score: local.score,
        improvementsKo: local.improvementsKo,
        recommendationsKo: local.recommendationsKo,
      },
    };
  }

  return { phase: "error" };
}

export default function Report() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as RouteState | null) ?? null;
  const sessionId = routeState?.sessionId ?? null;

  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setState({ phase: "loading" });

    const session = findSession(sessionId);
    if (!session) {
      setState({ phase: "not-found" });
      return;
    }

    loadReportForSession(session).then((result) => {
      if (!cancelled) setState(result);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId, retryToken]);

  const top = <Top title={<Top.TitleParagraph>AI 리포트</Top.TitleParagraph>} />;

  if (!sessionId) {
    return (
      <ScreenScaffold top={top}>
        <ErrorSection
          title="세션 정보를 찾을 수 없어요"
          description="운동을 먼저 완료해주세요"
          actionLabel="홈으로"
          onAction={() => navigate("/")}
          testId="report-no-session-section"
        />
      </ScreenScaffold>
    );
  }

  if (state.phase === "not-found") {
    return (
      <ScreenScaffold top={top}>
        <ErrorSection
          title="세션을 찾을 수 없어요"
          actionLabel="홈으로"
          onAction={() => navigate("/")}
          testId="report-not-found-section"
        />
      </ScreenScaffold>
    );
  }

  if (state.phase === "error") {
    return (
      <ScreenScaffold top={top}>
        <ErrorSection
          title="리포트를 생성하지 못했어요"
          description="잠시 후 다시 시도해주세요"
          actionLabel="다시 시도"
          onAction={() => setRetryToken((t) => t + 1)}
          testId="report-error-section"
        />
      </ScreenScaffold>
    );
  }

  if (state.phase === "loading") {
    return (
      <ScreenScaffold top={top}>
        <LoadingState rows={3} testId="report-loading" />
      </ScreenScaffold>
    );
  }

  const { report } = state;

  return (
    <ScreenScaffold top={top}>
      <SummaryHero
        label="오늘의 운동 점수"
        value={<CountUp value={report.score} unit="점" typography="t1" />}
        caption={report.summaryKo}
        ai
        testId="report-summary-hero"
      />
      <Spacing size={16} />
      <Card testId="report-detail-card">
        <Paragraph.Text typography="t5">개선할 점</Paragraph.Text>
        <Spacing size={8} />
        {report.improvementsKo.map((item) => (
          <div key={item}>
            <Paragraph.Text typography="st13">{item}</Paragraph.Text>
            <Spacing size={4} />
          </div>
        ))}
        <Spacing size={12} />
        <Paragraph.Text typography="t5">추천</Paragraph.Text>
        <Spacing size={8} />
        {report.recommendationsKo.map((item) => (
          <div key={item}>
            <Paragraph.Text typography="st13">{item}</Paragraph.Text>
            <Spacing size={4} />
          </div>
        ))}
      </Card>
      <Spacing size={24} />
    </ScreenScaffold>
  );
}
