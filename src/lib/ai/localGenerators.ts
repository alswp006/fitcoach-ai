// 네트워크 없이 동작하는 로컬 더미 생성 로직 (VITE_AI_API_BASE_URL 미설정 시 폴백)
// 텍스트는 한국어 해요체로 고정, 외부 앱 설치/다운로드 유도 문구 및 외부 링크 금지

export interface LocalReportInput {
  input?: unknown;
  [key: string]: unknown;
}

export interface LocalReport {
  type: 'local';
  aiGenerated: true;
  label: 'AI가 생성한 결과입니다';
  summary: string;
  content: string;
  text?: string;
  report?: string;
  score: number;
  improvementsKo: string[];
  recommendationsKo: string[];
}

const PLAN_TEMPLATES = [
  '오늘은 무리하지 말고 기본 동작부터 차근차근 시작해요.',
  '꾸준함이 가장 중요해요. 짧게라도 매일 움직여봐요.',
  '몸 상태를 살피면서 강도를 천천히 올려가요.',
];

const FEEDBACK_TEMPLATES = [
  '자세가 점점 안정되고 있어요. 이 흐름을 유지해요.',
  '무릎과 허리 정렬에 조금 더 신경 써보면 좋겠어요.',
  '호흡을 일정하게 유지하면서 동작을 이어가요.',
];

const REPORT_SUMMARY_TEMPLATES = [
  '오늘 운동을 잘 마쳤어요. 전반적으로 안정적인 자세를 유지했어요.',
  '이번 세션에서는 꾸준한 리듬으로 운동을 이어갔어요.',
];

const IMPROVEMENTS = [
  '무릎 정렬을 조금 더 신경 써보면 좋겠어요.',
  '허리를 곧게 펴는 연습을 함께 해봐요.',
];

const RECOMMENDATIONS = [
  '다음에는 강도를 조금씩 올려봐요.',
  '충분한 휴식과 수분 섭취를 함께 해요.',
];

function pickTemplate(templates: string[], seedText: string): string {
  const index = templates.length > 0 ? seedText.length % templates.length : 0;
  return templates[index] ?? templates[0] ?? '';
}

function toSafeText(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input === null || input === undefined) return '';
  try {
    return JSON.stringify(input);
  } catch {
    return '';
  }
}

export function generateLocalPlanSummary(input: string | null | undefined): string {
  const seedText = toSafeText(input);
  const template = pickTemplate(PLAN_TEMPLATES, seedText);
  return `${template} 오늘도 좋은 하루 보내요.`;
}

export function generateLocalFeedback(input: string | null | undefined): string {
  const seedText = toSafeText(input);
  const template = pickTemplate(FEEDBACK_TEMPLATES, seedText);
  return `${template} 다음 동작도 함께 이어가봐요.`;
}

export function generateLocalReport(input: LocalReportInput | null | undefined): LocalReport {
  const seedText = toSafeText(input);
  const summary = pickTemplate(REPORT_SUMMARY_TEMPLATES, seedText);
  const content = `${summary} 개선할 점과 다음 추천도 함께 확인해봐요.`;

  return {
    type: 'local',
    aiGenerated: true,
    label: 'AI가 생성한 결과입니다',
    summary,
    content,
    score: 70,
    improvementsKo: IMPROVEMENTS,
    recommendationsKo: RECOMMENDATIONS,
  };
}
