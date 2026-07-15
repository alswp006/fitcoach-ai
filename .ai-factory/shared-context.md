# Shared Context (auto-generated — do NOT modify)


## Shared Types Contract (IMPORT these, do NOT redefine)
```typescript
// ============================================================================
// DOMAIN TYPES — All types for fitcoach app
// ============================================================================

// ============================================================================
// Enums as Literal Types
// ============================================================================

export type FitnessGoal = '체중감량' | '근력증가' | '자세교정';
export type FitnessLevel = '초급' | '중급' | '상급';
export type WorkoutId = 'squat' | 'pushup' | 'plank';
export type SessionId = string;
export type ReportId = string;

// ============================================================================
// User Profile
// ============================================================================

export interface UserProfile {
  version: 1;
  id: 'me';
  heightCm: number;
  weightKg: number;
  goal: FitnessGoal;
  level: FitnessLevel;
  voiceFeedbackEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// AI Disclosure State
// ============================================================================

export interface AiDisclosureState {
  version: 1;
  id: 'me';
  acknowledged: boolean;
  acknowledgedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Premium State
// ============================================================================

export interface PremiumState {
  version: 1;
  id: 'me';
  isPremium: boolean;
  expiresAt?: number;
  lastPurchaseAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Workout Definition
// ============================================================================

export interface WorkoutDefinition {
  id: WorkoutId;
  title: string;
  description: string;
  targetMinutes: number;
  premiumOnly: boolean;
}

// ============================================================================
// Pose Feedback Event
// ============================================================================

export interface PoseFeedbackEvent {
  t: number;
  code: 'KNEE_MORE_BEND' | 'BACK_STRAIGHT' | 'ELBOWS_IN';
  messageKo: string;
  severity: 1 | 2 | 3;
}

// ============================================================================
// Session Record (localStorage model)
// ============================================================================

export interface SessionRecord {
  version: 1;
  sessionId: string;
  id: string;
  workoutId: WorkoutId;
  startedAt: number;
  endedAt?: number;
  durationSec?: number;
  feedbackCount: number;
  feedbackEventsSample: PoseFeedbackEvent[];
  score?: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Promotion State
// ========================
// ...truncated
```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  App.tsx
  components/
    AdSlot.tsx
    Amount.tsx
    BottomCTA.tsx
    Card.tsx
    CountUp.tsx
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    ScreenScaffold.tsx
    Sparkline.tsx
    StateView.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
  hooks/
  lib/
    ai/
    api/
    session/
    storage/
    storage.ts
    types.ts
    utils.ts
    workouts.ts
  main.tsx
  pages/
    Home.tsx
    __TdsGallery.tsx
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- ai/localGenerators.ts: export interface LocalReportInput; export interface LocalReport; export function generateLocalPlanSummary(input: string | null | undefined): string; export function generateLocalFeedback(input: string | null | undefined): string; export function generateLocalReport(input: LocalReportInput | null | undefined): LocalReport
- api/client.ts: export type ApiClientError = | ApiError | "BASE_URL_MISSING" | "NETWORK_ERROR" | "PARSE_ERROR" | "UNKNOWN"; export type ApiResult<T> = |; export function createSession( req: CreateSessionRequest ): Promise<ApiResult<CreateSessionResponse>>; export function submitFeedback( sessionId: SessionId, req: SubmitFeedbackRequest ): Promise<ApiResult<SubmitFeedbackResp; export function generateReport( req: GenerateReportRequest ): Promise<ApiResult<GenerateReportResponse>>
- api/endpoints.ts: export type Result<T> = |; export async function createRemoteSession( req: CreateSessionRequest ): Promise<Result<CreateSessionResponse>>; export async function submitRemoteFeedback( sessionId: SessionId, req: SubmitFeedbackRequest ): Promise<Result<SubmitFee; export async function generateRemoteReport( req: GenerateReportRequest ): Promise<Result<GenerateReportResponse>>
- session/sessionFactory.ts: export function createSessionId(): string; export function buildInitialSessionRecord(opts:
- storage/aiDisclosureStorage.ts: export function loadAiDisclosure(): StorageResult<AiDisclosureState>; export function saveAiDisclosure(state: AiDisclosureState): void; export function deleteAiDisclosure(): void
- storage/keys.ts: export const STORAGE_KEY_USER_PROFILE = 'fitcoach.userProfile.v1'; export const STORAGE_KEY_PREMIUM = 'fitcoach.premium.v1'; export const STORAGE_KEY_AI_DISCLOSURE = 'fitcoach.aiDisclosure.v1'; export const STORAGE_KEY_PROMO = 'fitcoach.promo.v1'; export const STORAGE_KEY_SESSIONS = 'fitcoach.sessions.v1'; export const STORAGE_KEY_REPORTS = 'fitcoach.reports.v1'
- storage/pagination.ts: export function getSessionsPage(req: PageRequest): PageResult<Session>
- storage/premiumStorage.ts: export function loadPremiumState(): StorageResult<PremiumState>; export function savePremiumState(state: PremiumState): void; export function deletePremiumState(): void; export function loadPremiumStateSafe(): PremiumState; export function getIsPremiumActive(): boolean
- storage/profileStorage.ts: export function loadProfile(): StorageResult<UserProfile>; export function saveProfile(profile: UserProfile): void; export function deleteProfile(): void
- storage/promoStorage.ts: export function loadPromoState(): StorageResult<PromotionState>; export function savePromoState(state: PromotionState): void; export function deletePromoState(): void
- storage/reportsStorage.ts: export function upsert( report: Report ):; export function findReportBySessionId(sessionId: SessionId): Report | null; export function garbageCollectOrphanReports():
- storage/safeStorage.ts: export function safeJsonParse<T = unknown>( raw: string ):; export function safeSetItem( key: string, value: string ):; export function safeGetItem(key: string): string | null
- storage/sessionsStorage.ts: export function load(): Session[] |; export function save(sessions: Session[]):; export function prepend(session: Session):; export function update( session: Session ):; export function removeSessionsKey(): void; export function dedupeBySessionId(sessions: Session[]): Session[]
- storage/storageResult.ts: export interface StorageResult<T>
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
- types.ts: export type FitnessGoal = '체중감량' | '근력증가' | '자세교정'; export type FitnessLevel = '초급' | '중급' | '상급'; export type WorkoutId = 'squat' | 'pushup' | 'plank'; export type SessionId = string; export type ReportId = string; export interface UserProfile; export interface AiDisclosureState; export interface PremiumState
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string
- workouts.ts: export const WORKOUTS: WorkoutDefinition[] = [; export function getWorkoutById(id: WorkoutId): WorkoutDefinition | null

### Components (src/components/)
- AdSlot.tsx: Ad...
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0001: 전 엔티티/API/RouteState 타입 정의(types.ts) (files: src/lib/types.ts)
- 0002: safeStorage: localStorage 안전 parse/쓰기(Quota) 유틸 (files: src/lib/storage/safeStorage.ts)
- 0005: 번들 운동 정의 3종 상수 + 조회 유틸 (files: src/lib/workouts.ts)
- 0007: 선택적 외부 AI API 클라이언트(fetch 래퍼) (files: src/lib/api/client.ts)
- 0004: Sessions/Reports CRUD + 페이지네이션 + orphan GC (files: src/lib/storage/sessionsStorage.ts, src/lib/storage/reportsStorage.ts, src/lib/storage/pagination.ts)
- 0008: AI API 엔드포인트 함수(세션/피드백/리포트) + 로컬 폴백 인터페이스 (files: src/lib/api/endpoints.ts)
- 0006: AppStore(Context)로 프로필/프리미엄/AI고지/프로모션 상태 제공 (files: src/lib/store/AppStore.tsx)
- 0009: 로컬 더미 생성 로직(플랜/피드백/리포트 템플릿) (files: src/lib/ai/localGenerators.ts)
- 0010: 세션 생성 유틸(세션ID/초기 SessionRecord 빌더) (files: src/lib/session/sessionFactory.ts)
- 0011: 공용 UI: ScreenScaffold + AppToastProvider + Empty/Error 섹션 (files: src/components/ScreenScaffold.tsx, src/components/AppToastProvider.tsx, src/components/StateSections.tsx)
- 0013: S2 프로필('/profile') 페이지 구현(검증/저장/키보드) (files: src/pages/Profile.tsx)