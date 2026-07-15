# TASK

## Epic 1. TypeScript types + interfaces (src/lib/types.ts)
### Task 1.1 `types.ts`에 전 엔티티/요청응답/RouteState 타입 정의
- Description:
  - `src/lib/types.ts`에 SPEC의 Data Models(프로필/세션/리포트/프리미엄/프로모션/AI 고지), API 스펙 타입, 페이지네이션 타입을 **런타임 코드 없이** 정의한다.
  - **RouteState 타입을 반드시 포함**하고, 페이지들이 `location.state as RouteState['/path']`로 캐스팅 가능한 계약을 만든다.
- DoD:
  - `src/lib/types.ts`에 아래가 모두 export 된다(런타임 코드 없음):
    - `FitnessGoal`, `FitnessLevel`, `WorkoutId`, `WorkoutDefinition`
    - `UserProfile`, `AiDisclosureState`, `PremiumState`, `PromotionState`
    - `PoseFeedbackEvent`, `SessionRecord`, `SessionId`, `Session`, `WorkoutSession`
    - `ReportId`, `Report`
    - `PageRequest`, `PageResult<T>`, `GetSessionsPage`
    - API 타입: `ApiError`, `CreateSessionRequest/Response`, `SubmitFeedbackRequest/Response`, `GenerateReportRequest/Response`
    - **`RouteState`**가 아래 키를 포함한다(키 문자열 정확히 일치):
      - `'/'`: `undefined | { toast?: 'saved' | 'premium' }`
      - `'/profile'`: `undefined | { from?: 'home' | 'premium' }`
      - `'/workouts/:workoutId'`: `undefined | { workoutId: string }`
      - `'/coach'`: `{ workoutId: WorkoutId; sessionId: string }`
      - `'/session/summary'`: `{ sessionId: string }`
      - `'/report'`: `{ sessionId: string }`
      - `'/history'`: `undefined`
      - `'/premium'`: `undefined | { from?: 'home' | 'report' }`
  - `npm run typecheck`(또는 `vite build`)가 타입 에러 없이 통과한다.
- Covers: []
- Files:
  - `src/lib/types.ts`
- Depends on: none

**Risk Analysis (Epic 1)**
- Complexity: Low
- Risk factors: RouteState 키/shape 누락 시 페이지 간 state 불일치로 런타임 오류
- Mitigation: RouteState를 먼저 고정해 이후 모든 페이지가 동일 계약을 import하도록 선행 정의

---

## Epic 2. Data layer (src/lib/storage helpers, state management)

### Task 2.1 안전 JSON 파싱/쓰기 유틸 + 에러 타입(Quota/Parse) 구축
- Description:
  - localStorage 접근에서 필요한 공통 유틸(안전 parse, quota 감지, Result 타입)을 만든다.
  - **console.error를 호출하지 않는다.**
- DoD:
  - 아래 유틸이 구현되고 export 된다:
    - `safeJsonParse<T>(raw: string): { ok: true; value: T } | { ok: false; error: 'PARSE_ERROR' }`
    - `safeSetItem(key: string, value: string): { ok: true } | { ok: false; error: 'QUOTA_EXCEEDED' | 'UNKNOWN' }`
      - QuotaExceededError(또는 동등 에러 name/code) 발생 시 `QUOTA_EXCEEDED`로 매핑
    - `safeGetItem(key: string): string | null` (예외 발생 시 null 반환)
  - `safeSetItem`은 예외를 rethrow 하지 않는다.
  - 앱이 컴파일된다.
- Covers: [F7-AC-6]
- Files:
  - `src/lib/storage/safeStorage.ts`
- Depends on: Task 1.1

### Task 2.2 Singleton 스토리지 CRUD (UserProfile / Premium / AiDisclosure / Promotion)
- Description:
  - 프로필/프리미엄/AI고지/프로모션을 각각 키 단위로 읽기/쓰기/삭제하는 헬퍼를 만든다.
  - Premium은 “만료 시 비프리미엄 간주”를 **읽기/판정 단계에서** 처리한다(파싱 실패 포함).
- DoD:
  - 키 상수 export(오타 방지):
    - `fitcoach.userProfile.v1`, `fitcoach.premium.v1`, `fitcoach.aiDisclosure.v1`, `fitcoach.promo.v1`
  - 아래 함수들이 export 된다:
    - `loadUserProfile(): { ok:true; value: UserProfile|null } | { ok:false; error:'PARSE_ERROR' }`
    - `saveUserProfile(profile: UserProfile): { ok:true } | { ok:false; error:'QUOTA_EXCEEDED'|'UNKNOWN' }`
    - `removeUserProfile(): void`
    - `loadPremiumState(): { ok:true; value: PremiumState } | { ok:false; error:'PARSE_ERROR' }`
    - `loadPremiumStateSafe(): PremiumState`
      - 파싱 실패/키 없음이면 `{version:1,id:'me',isPremium:false,createdAt:now,updatedAt:now}` 형태로 반환
      - 이 함수 내부에서 `console.error`를 호출하면 fail
    - `getIsPremiumActive(premium: PremiumState, now=Date.now()): boolean` (expiresAt 과거면 false)
    - `savePremiumState(state: PremiumState): { ok:true } | { ok:false; error:'QUOTA_EXCEEDED'|'UNKNOWN' }`
    - `loadAiDisclosureState(): { ok:true; value: AiDisclosureState } | { ok:false; error:'PARSE_ERROR' }`
    - `saveAiDisclosureState(state: AiDisclosureState): { ok:true } | { ok:false; error:'QUOTA_EXCEEDED'|'UNKNOWN' }`
    - `loadPromotionState(): { ok:true; value: PromotionState } | { ok:false; error:'PARSE_ERROR' }`
    - `savePromotionState(state: PromotionState): { ok:true } | { ok:false; error:'QUOTA_EXCEEDED'|'UNKNOWN' }`
  - 앱이 컴파일된다.
- Covers: [S8-AC-S8-5, F6-AC-5]
- Files:
  - `src/lib/storage/keys.ts`
  - `src/lib/storage/profileStorage.ts`
  - `src/lib/storage/premiumStorage.ts`
  - `src/lib/storage/aiDisclosureStorage.ts`
  - `src/lib/storage/promoStorage.ts`
- Depends on: Task 2.1

### Task 2.3 Sessions/Reports 스토리지 CRUD + 페이지네이션(GetSessionsPage) + orphan GC
- Description:
  - 세션 리스트(`fitcoach.sessions.v1`)와 리포트 리스트(`fitcoach.reports.v1`)에 대한 CRUD를 제공한다.
  - History 페이지용 페이지네이션 계약(`GetSessionsPage`)을 구현한다.
  - orphan report GC 함수를 제공한다.
- DoD:
  - 아래 함수들이 export 된다:
    - `loadSessions(): { ok:true; value:{version:1; items: SessionRecord[]} } | { ok:false; error:'PARSE_ERROR' }`
    - `saveSessions(container): { ok:true } | { ok:false; error:'QUOTA_EXCEEDED'|'UNKNOWN' }`
    - `prependSession(newSession: SessionRecord): { ok:true } | { ok:false; error:'QUOTA_EXCEEDED'|'UNKNOWN' }`
    - `updateSession(sessionId, updater): { ok:true } | { ok:false; error:'NOT_FOUND'|'QUOTA_EXCEEDED'|'UNKNOWN'|'PARSE_ERROR' }`
    - `getSessionsPage(req: PageRequest): PageResult<SessionRecord>`
    - `dedupeBySessionId(prev: SessionRecord[], next: SessionRecord[]): SessionRecord[]` (동일 sessionId 중복 제거)
    - `removeSessionsKey(): void`
    - `loadReports() / saveReports() / upsertReport(report)`
    - `findReportBySessionId(sessionId): Report | null` (세션 없으면 orphan 취급으로 null 가능)
    - `garbageCollectOrphanReports(existingSessionIds: Set<string>): { ok:true } | { ok:false; error:'QUOTA_EXCEEDED'|'UNKNOWN'|'PARSE_ERROR' }`
  - 앱이 컴파일된다.
- Covers: [S7-AC-S7-4, S7-AC-S7-5, S7-AC-S7-7]
- Files:
  - `src/lib/storage/sessionsStorage.ts`
  - `src/lib/storage/reportsStorage.ts`
  - `src/lib/storage/pagination.ts`
- Depends on: Task 1.1, Task 2.1

### Task 2.4 번들 WorkoutDefinition 상수(3종) + 조회 유틸
- Description:
  - 스쿼트/푸쉬업/플랭크 3종 운동 정의를 번들 상수로 제공하고, id로 조회하는 유틸을 만든다.
  - `plank.premiumOnly=true`를 반영한다.
- DoD:
  - `WORKOUTS: WorkoutDefinition[]`가 **정확히 3개**를 포함한다.
  - 각 title 텍스트가 정확히 `"스쿼트"`, `"푸쉬업"`, `"플랭크"`이다.
  - `getWorkoutById(id: string): WorkoutDefinition | null` 제공
  - 앱이 컴파일된다.
- Covers: [S1-AC-S1-1, F2-AC-1]
- Files:
  - `src/lib/workouts.ts`
- Depends on: Task 1.1

### Task 2.5 State management: AppStore(Context)로 로딩/갱신/에러 상태 표준화
- Description:
  - 페이지들이 공통으로 쓰는 도메인 상태(프로필, 프리미엄, AI 고지, 프로모션)를 Context로 제공한다.
  - 파싱 실패를 페이지에서 처리할 수 있도록 상태를 노출한다.
- DoD:
  - `AppStoreProvider`와 hooks가 export 된다:
    - `useAppProfile()` → `{ status:'loading'|'ready'|'parse_error'; profile: UserProfile|null; reload():void; save(profile: UserProfile): Promise<{ok:true}|{ok:false;error:string}>; remove():void }`
    - `useAppPremium()` → `{ premium: PremiumState; isPremiumActive: boolean; reload():void; savePurchase30d(now=Date.now()): Promise<{ok:true}|{ok:false;error:string}> }`
    - `useAiDisclosure()` → `{ state: AiDisclosureState; reload():void; acknowledge(now?:number): Promise<{ok:true}|{ok:false;error:string}> }`
    - `usePromotion()` → `{ state: PromotionState; reload():void; markFirstGranted(now?:number): Promise<{ok:true}|{ok:false;error:string}> }`
  - Provider를 앱에 아직 연결하지 않아도(라우팅 미연결 상태) 앱이 컴파일된다.
- Covers: [F6-AC-5, S8-AC-S8-5]
- Files:
  - `src/lib/store/AppStore.tsx`
- Depends on: Task 2.2

**Risk Analysis (Epic 2)**
- Complexity: Medium
- Risk factors:
  - localStorage 5MB/QuotaExceededError 처리 누락 시 크래시
  - 파싱 실패 시 화면별 Error UI 요구사항 불충족
  - Premium 만료/파싱 실패 판정 누락 시 잠금 로직 어긋남
- Mitigation:
  - safeStorage → entity CRUD → sessions/reports/pagination → store 순서로 “실패 케이스”를 먼저 표준화한 뒤 UI에서 호출

---

## Epic 3. Core UI pages (src/pages/) — ONE page per task

### Task 3.0 공용 UI: ScreenScaffold + AppToastProvider(2초 토스트) + 공용 Empty/Error 섹션
- Description:
  - “Raw div로 전체 페이지 골격 구성 금지”를 만족하기 위해 모든 페이지가 감쌀 수 있는 `ScreenScaffold`를 제공한다.
  - 토스트를 페이지별로 중복 구현하지 않도록 `AppToastProvider`/`useAppToast()`를 만든다(기본 2초).
- DoD:
  - `ScreenScaffold`가 export 되고, `Top`을 포함한 기본 레이아웃 슬롯(예: content / bottom)을 제공한다.
  - `AppToastProvider` + `useAppToast()` 제공:
    - `showToast(message: string, durationMs=2000)` 호출 시 `Toast`가 렌더되고, `durationMs±100ms` 범위 내로 자동 dismiss 된다.
  - 간격은 `@toss/tds-mobile`의 `Spacing`만 사용한다.
  - 앱이 컴파일된다.
- Covers: [F7-AC-6]
- Files:
  - `src/components/ScreenScaffold.tsx`
  - `src/components/AppToastProvider.tsx`
- Depends on: Task 1.1

---

### Task 3.1 S1 홈 페이지(`/`) 구현
- Description:
  - 운동 3종 리스트, 오늘 플랜 카드(프로필 유무에 따른 Empty), 파싱 실패 Error UI/초기화, 하단 탭 이동, 배너 광고 배치를 구현한다.
  - `/profile` 저장 성공 후 돌아올 때 `location.state.toast==='saved'`면 토스트를 표시한다.
- DoD:
  - 운동 목록 `ListRow`가 **정확히 3개** 렌더링되고 각 텍스트 `"스쿼트"`, `"푸쉬업"`, `"플랭크"`가 존재한다.
  - 프로필 없으면 `Asset.ContentIcon`과 `"프로필을 설정하면 플랜이 생성돼요"` 텍스트가 존재한다.
  - `fitcoach.userProfile.v1="not-json"`이면 `"데이터를 불러오지 못했어요"` + `"초기화"` 버튼이 보이며:
    - 탭 시 `localStorage.removeItem('fitcoach.userProfile.v1')`로 해당 키가 **존재하지 않아야** 한다
    - 같은 동작 이후에도 `localStorage['fitcoach.sessions.v1']`가 삭제/변경되면 fail(코드에서 해당 키 write 금지)
  - `"스쿼트"` 행 탭 시 라우트가 `/workouts/squat`가 된다.
  - 하단 탭 `"기록"` 탭 시 라우트가 `/history`가 된다.
  - `data-testid="today-plan-card"` 요소가 존재한다.
  - `<AdSlot .../>`가 운동 목록 섹션 하단에 렌더링되며, 광고 영역에 `position: fixed` 스타일을 부여하지 않는다.
  - **incoming toast 처리**:
    - `location.state as RouteState['/']`로 캐스팅한다.
    - `location.state?.toast === 'saved'`인 경우 토스트 `"저장했어요"`가 **2초(±0.5초)** 표시된다.
- Covers:
  - [S1-AC-S1-1, S1-AC-S1-2, S1-AC-S1-3, S1-AC-S1-4, S1-AC-S1-5]
  - [F2-AC-1, F2-AC-2, F2-AC-6]
  - [F1-AC-1]
  - [F7-AC-1]
- Files:
  - `src/pages/HomePage.tsx`
- Depends on: Task 2.4, Task 3.0, Task 1.1

### Task 3.2 S2 프로필(`/profile`) 구현
- Description:
  - 키/몸무게 입력(TextField), 목표/난이도(Chip), 음성 토글(Switch) 입력 및 검증, 로딩 disabled, 파싱 실패 Error UI + 초기화, 저장 성공 시 홈 이동(state toast='saved')를 구현한다.
- DoD:
  - 최초 렌더 로딩 상태 동안 `TextField` 2개가 `disabled=true`이고 `"불러오는 중"` 텍스트가 존재한다.
  - 유효 값(키 120~220, 몸무게 30~200, goal/level 선택) 입력 후 `"저장"` 탭:
    - `fitcoach.userProfile.v1`가 유효 JSON으로 저장되고(`version:1` 포함)
    - `navigate('/', { state: { toast: 'saved' } })`를 호출하여 라우트가 `/`가 된다
  - `heightCm=90` 저장 시:
    - `"키는 120~220cm로 입력해주세요"` 에러 텍스트가 DOM에 존재해야 한다
    - `localStorage['fitcoach.userProfile.v1']` 값이 변경되면 fail
  - `weightKg=250` 저장 시:
    - `"몸무게는 30~200kg로 입력해주세요"` 에러 텍스트가 DOM에 존재해야 한다
    - `localStorage['fitcoach.userProfile.v1']` 값이 변경되면 fail
  - `voiceFeedbackEnabled` OFF 후 저장 시 저장된 값이 `false`여야 한다.
  - `fitcoach.userProfile.v1="not-json"`로 진입 시:
    - `"데이터를 불러오지 못했어요"` 텍스트 + `"초기화"` 버튼이 존재
    - 탭 시 `fitcoach.userProfile.v1` 키가 삭제되어야 한다
  - `location.state as RouteState['/profile']` 캐스팅을 수행한다.
- Covers:
  - [S2-AC-S2-1, S2-AC-S2-2, S2-AC-S2-3, S2-AC-S2-4, S2-AC-S2-5]
  - [F1-AC-1, F1-AC-2, F1-AC-3, F1-AC-4, F1-AC-6]
- Files:
  - `src/pages/ProfilePage.tsx`
- Depends on: Task 2.2, Task 3.0, Task 1.1

### Task 3.3 S3 운동 상세(`/workouts/:workoutId`) 구현
- Description:
  - 운동 상세 카드 렌더, unknown workout 방어, “세션 시작”으로 세션 레코드 생성 후 `/coach` 이동,
  - 프리미엄 전용 운동 접근 차단(만료 포함),
  - QuotaExceededError 처리(토스트+네비 차단)를 구현한다.
- DoD:
  - `/workouts/squat` 렌더 시 `data-testid="workout-detail-card"`가 **정확히 1개** 존재한다.
  - `/workouts/unknown` 진입 시 `"운동을 찾을 수 없어요"` + `"홈으로"` 버튼, 탭 시 라우트 `/`.
  - `"세션 시작"` 탭 시:
    - 세션 1개 prepend 저장되어 `fitcoach.sessions.v1.items.length`가 **1 증가**
    - `/coach`로 이동하며 state `{ workoutId, sessionId }`에서 `sessionId`는 빈 문자열이 아니다.
  - 프리미엄 전용 운동(`premiumOnly=true`)에서:
    - `isPremiumActive=false`이고 **만료가 아닌 경우**: 토스트 `"프리미엄에서 이용할 수 있어요"` 표시 후 `/premium`으로 이동
    - **만료 케이스(expiresAt < now)**: 토스트 `"프리미엄이 만료되었어요"` 표시 후 `navigate('/premium', { state: { from: 'home' } })` 호출
    - 위 케이스들에서 `/coach`로 이동하면 fail(코드상 이동 금지)
  - 세션 생성 저장 시 `QuotaExceededError` 발생하면:
    - 토스트 `"저장 공간이 부족해요. 오래된 기록을 정리해주세요"`가 **2초(±0.5초)** 표시
    - `/coach` 네비게이션이 발생하지 않음
    - items 길이가 증가하지 않음
  - `location.state as RouteState['/workouts/:workoutId']` 캐스팅을 수행하되, workoutId 결정은 URL param을 우선한다.
- Covers:
  - [S3-AC-S3-1, S3-AC-S3-2, S3-AC-S3-3, S3-AC-S3-4, S3-AC-S3-5]
  - [F2-AC-2, F2-AC-3, F2-AC-4, F2-AC-5]
  - [F6-AC-4]
- Files:
  - `src/pages/WorkoutDetailPage.tsx`
- Depends on: Task 2.3, Task 2.4, Task 2.2, Task 3.0, Task 1.1

### Task 3.4 S4 실시간 코칭(`/coach`) 구현 (카메라 + 피드백 저장 + 음성 토글 반영)
- Description:
  - state 누락 방어, 카메라 권한 요청/로딩/거부 UI,
  - 피드백 카드(1개) 및 샘플 20개 제한 저장,
  - 음성 피드백(지원/미지원/비활성화) 처리,
  - 세션 종료 저장 후 요약 이동을 구현한다.
- DoD:
  - `location.state` 없이 직접 진입 시 `"세션 정보를 불러오지 못했어요"` + `"홈으로"` 버튼, 탭 시 `/`.
  - 카메라 준비 전 `"카메라 준비 중"` 표시, 준비 완료 후 **1초 이내** DOM에서 제거.
  - 권한 거부 시 `"카메라 권한이 필요해요"` + `"다시 시도"` 버튼 존재, 탭 시 권한 요청 로직이 다시 실행된다.
  - `data-testid="live-feedback-card"`를 가진 `Card`가 **정확히 1개** 존재.
  - 피드백 이벤트 발생 시(테스트를 위해 버튼/타이머 등 어떤 방식이든 내부적으로 “피드백 발생”을 트리거 가능해야 함):
    - 해당 세션의 `feedbackCount`는 항상 1 증가
    - `feedbackEventsSample.length`는 최대 20 유지(19→20, 20→20)
  - 피드백 저장 중 `QuotaExceededError` 발생 시:
    - 앱이 크래시/리로드되지 않는다
    - 토스트 `"저장 공간이 부족해요. 오래된 기록을 정리해주세요"`가 **2초(±0.5초)** 표시된다
  - 음성 피드백:
    - 프로필 `voiceFeedbackEnabled=false`면 `speechSynthesis.speak`가 호출되면 fail(코드상 호출 금지)
    - 음성 API 미지원이면 텍스트 피드백만 제공 + 토스트 `"이 기기에서는 음성 안내가 지원되지 않아요"` 표시
  - `"세션 종료"` 탭 시:
    - 해당 세션 `endedAt` 저장(number)
    - `durationSec`가 **1 이상 정수**
    - `/session/summary`로 이동(state `{sessionId}`)
  - `location.state as RouteState['/coach']` 캐스팅을 수행한다.
- Covers:
  - [S4-AC-S4-1, S4-AC-S4-2, S4-AC-S4-3, S4-AC-S4-4, S4-AC-S4-5, S4-AC-S4-6]
  - [F3-AC-1, F3-AC-2, F3-AC-3, F3-AC-4, F3-AC-5, F3-AC-6]
  - [F4-AC-1]
  - [F7-AC-7]
- Files:
  - `src/pages/CoachPage.tsx`
- Depends on: Task 2.3, Task 2.2, Task 3.0, Task 1.1

### Task 3.5 S5 세션 요약(`/session/summary`) 구현 (보상형 광고 게이트 + 프로모션 지급)
- Description:
  - sessionId 검증/로딩/empty 처리, 요약 카드(2개 이상) 렌더,
  - 보상형 광고 완료 후 `/report` 이동(실패 시 토스트),
  - 배너 광고 배치,
  - 첫 세션 완료 프로모션 지급(중복/한도 방지)을 구현한다.
- DoD:
  - `location.state` 없거나 sessionId가 세션 목록에 없으면 `"세션을 찾을 수 없어요"` + `"홈으로"`(탭 시 `/`).
  - 조회 중 `"세션 결과 불러오는 중"` 표시 후 완료 시 DOM에서 제거된다.
  - 요약 성공 렌더 시:
    - `data-testid="summary-metrics-card"`가 **1개 이상** 존재
    - 요약 지표는 `Card` **총 2개 이상**으로 구성
  - `"AI 리포트 보기"` 버튼은 `TossRewardAd`로 감싸져 있고:
    - 광고 완료 시에만 `/report`로 이동하며 state에 `{sessionId}` 포함
    - 광고 실패/중단 시 `/report`로 이동하면 fail(코드상 navigate 금지)
    - 광고 실패/중단 시 토스트 `"광고를 완료하면 리포트를 볼 수 있어요"`가 **2초(±0.5초)** 표시
  - 프로모션 지급:
    - `promotionCode = import.meta.env.VITE_PROMOTION_CODE`로 읽는다(없으면 지급 시도 자체를 하지 않음)
    - `amount = Number(import.meta.env.VITE_PROMOTION_REWARD_AMOUNT ?? 1000)`로 계산한다
    - `fitcoach.promo.v1.firstSessionRewardGranted=false`이고 promotionCode가 존재하며 amount가 **1~5000**이면:
      - `grantPromotionReward({ promotionCode, amount })`가 **1회** 호출된다
      - 이후 `fitcoach.promo.v1.firstSessionRewardGranted=true`로 저장된다
    - amount가 **5000 초과(예: 6000)** 이면:
      - `grantPromotionReward`가 호출되면 fail(코드상 호출 금지)
      - 토스트 `"프로모션 보상 금액이 올바르지 않아요"` 표시
    - 이미 granted=true면 이후 세션에서도 호출되면 fail(코드상 호출 금지)
  - 배너 `<AdSlot/>`는 요약 섹션 하단에 렌더(요약 카드와 버튼 사이를 덮지 않음, fixed 금지).
  - `location.state as RouteState['/session/summary']` 캐스팅을 수행한다.
- Covers:
  - [S5-AC-S5-1, S5-AC-S5-2, S5-AC-S5-3, S5-AC-S5-4, S5-AC-S5-5]
  - [F4-AC-2, F4-AC-3, F4-AC-4, F4-AC-5]
  - [F7-AC-2, F7-AC-3, F7-AC-4]
- Files:
  - `src/pages/SessionSummaryPage.tsx`
- Depends on: Task 2.3, Task 2.2, Task 3.0, Task 1.1

### Task 3.6 S6 AI 리포트(`/report`) 구현 (AI 고지 1회 + 라벨 고정 + 재시도)
- Description:
  - sessionId state 누락 empty 처리, 로딩/에러/재시도,
  - `VITE_AI_API_BASE_URL`이 있으면 `POST /v1/reports` 호출을 시도하고, 없으면 로컬 더미 리포트 생성 로직으로 동작(크래시 금지),
  - AI 라벨/배지 고정,
  - 첫 이용 1회 AlertDialog 저장을 구현한다.
- DoD:
  - 화면 최상단에 `data-testid="ai-generated-badge"`가 존재하고 텍스트가 정확히 `"AI가 생성한 결과입니다"`.
  - 로딩 중 `"AI 리포트 생성 중"` 텍스트 표시.
  - `location.state` 없으면 `"리포트가 없어요"` + `"홈으로"`(탭 시 `/`).
  - 에러 상태에서 `"다시 시도"` 탭 시:
    - `"AI 리포트 생성 중"`이 다시 표시되고
    - 성공 시 `data-testid="report-card"`를 가진 Card가 **최소 2개** 렌더.
  - AI 고지(첫 이용 1회):
    - `fitcoach.aiDisclosure.v1` 없거나 `acknowledged=false`면 진입 시 `AlertDialog`에 `"이 서비스는 생성형 AI를 활용합니다"` 표시
    - `"확인"` 탭 시 `acknowledged=true`가 저장되어야 한다
    - 저장 실패 시(Quota 등) 다이얼로그가 닫히면 fail(코드상 닫기 금지)
  - 배너 `<AdSlot/>` 리포트 하단 렌더.
  - `location.state as RouteState['/report']` 캐스팅을 수행한다.
- Covers:
  - [S6-AC-S6-1, S6-AC-S6-2, S6-AC-S6-3, S6-AC-S6-4, S6-AC-S6-5]
  - [F1-AC-5]
  - [F4-AC-6, F4-AC-7]
- Files:
  - `src/pages/ReportPage.tsx`
- Depends on: Task 2.3, Task 2.2, Task 3.0, Task 1.1

### Task 3.7 S7 기록(`/history`) 구현 (20개 페이지네이션 + 파싱 실패/초기화 + 더 보기 실패 유지)
- Description:
  - 세션 목록 로딩/empty/error, 20개씩 “더 보기”로 append, 마지막 페이지 처리,
  - 행 탭 시 요약 이동,
  - 파싱 실패 시 초기화,
  - “더 보기 로드 실패 시 현재 리스트 유지+토스트”를 구현한다.
- DoD:
  - 로딩 중 `"기록 불러오는 중"` 표시.
  - items=0이면 `"첫 운동을 시작해보세요"` + `"운동 보러가기"`(탭 시 `/`).
  - 행 렌더: `data-testid="history-row-{sessionId}"` 부여.
  - `history-row-sess_100` 탭 시 `/session/summary` 이동 + state `{sessionId:'sess_100'}`.
  - 페이지네이션:
    - 초기 20개 렌더
    - `"더 보기"` 1회 탭 시 렌더된 `ListRow`가 정확히 40개
    - 총 45개에서 2회 탭 후 `"더 보기"`는 숨김 또는 `disabled=true`
    - append 시 동일 `sessionId` 중복 렌더링이 발생하면 fail(코드상 dedupe 적용)
  - 파싱 실패(`fitcoach.sessions.v1="not-json"`) 시 `"기록을 불러오지 못했어요"` + `"초기화"` 탭 시 해당 키 삭제.
  - “더 보기” 탭 시점에 다음 페이지 로드 로직이 예외 throw 하면:
    - 기존 렌더된 행 개수(예: 20)가 변하면 fail(코드상 유지)
    - 토스트 `"더 불러오지 못했어요. 다시 시도해주세요"` **2초(±0.5초)** 표시
  - `location.state as RouteState['/history']` 캐스팅을 수행한다(항상 undefined).
- Covers:
  - [S7-AC-S7-1, S7-AC-S7-2, S7-AC-S7-3, S7-AC-S7-4, S7-AC-S7-5, S7-AC-S7-6, S7-AC-S7-7]
  - [F5-AC-1, F5-AC-2, F5-AC-3, F5-AC-4, F5-AC-5]
- Files:
  - `src/pages/HistoryPage.tsx`
- Depends on: Task 2.3, Task 3.0, Task 1.1

### Task 3.8 S8 프리미엄(`/premium`) 구현 (IAP + 30일 부여 + 로딩/실패)
- Description:
  - 혜택 카드 + 구매 CTA 1개(test id),
  - `TossPurchase` 콜백으로 30일 프리미엄 저장 후 홈 이동,
  - 로딩 중 비활성,
  - 실패 토스트 및 저장 변화 없음,
  - 만료 처리 로직(읽기에서 비프리미엄 간주)을 구현한다.
- DoD:
  - `data-testid="premium-purchase-cta"` 요소가 항상 존재.
  - 결제 로딩 상태에서 `"결제 진행 중"` 텍스트 표시 + CTA `disabled=true`.
  - `onPurchased` 호출 시:
    - `fitcoach.premium.v1.isPremium=true`
    - `expiresAt >= Date.now() + 30*24*60*60*1000`
    - 라우트가 `/`로 이동한다(`navigate('/', { state: { toast: 'premium' } })` 허용)
  - 결제 실패 콜백 시:
    - 토스트 `"결제에 실패했어요. 다시 시도해주세요"`가 **2초(±0.5초)** 표시
    - `fitcoach.premium.v1`가 변경되면 fail(코드상 save 금지)
  - 만료된 프리미엄(`expiresAt < now`)은 `isPremium=false`로 간주되도록 `loadPremiumStateSafe/getIsPremiumActive`를 사용한다.
  - `location.state as RouteState['/premium']` 캐스팅을 수행한다.
- Covers:
  - [S8-AC-S8-1, S8-AC-S8-2, S8-AC-S8-3, S8-AC-S8-4, S8-AC-S8-5]
  - [F6-AC-1, F6-AC-2, F6-AC-3]
- Files:
  - `src/pages/PremiumPage.tsx`
- Depends on: Task 2.2, Task 3.0, Task 1.1

**Risk Analysis (Epic 3)**
- Complexity: High
- Risk factors:
  - 화면별 AC(문구/testid/상태) 누락 위험
  - 카메라 권한/미지원/거부 케이스에서 크래시 위험
  - 보상형 광고 성공/실패 분기 누락 시 네비게이션 정책 위반
- Mitigation:
  - 공용 scaffold/toast를 먼저 만들고, 화면을 “1 task = 1 page”로 쪼개 각 task 완료 시 컴파일/동작 확인 가능

---

## Epic 4. Integration + polish (routing wiring, ad placement, final UX)

### Task 4.1 외부 도메인 이동 가드 유틸 구현(모듈만)
- Description:
  - 정책상 외부 도메인 이동이 금지되므로 `window.open`, `window.location.assign`, `window.location.replace`를 가로채 외부 URL이면 no-op + 콜백 실행(showToast)을 지원하는 유틸을 만든다.
  - (설치는 다음 Task에서 수행)
- DoD:
  - `installExternalNavigationGuard`가 export 된다:
    - 시그니처 예: `installExternalNavigationGuard(opts: { showToast: (msg: string) => void; message?: string }): () => void`
    - 설치 후 `window.open('https://example.com')` 호출 시:
      - 원래 open이 실행되지 않는다(원래 함수를 호출하면 fail)
      - `showToast("앱 밖으로 이동할 수 없어요")`가 1회 호출된다(기본 message)
    - `window.location.assign/replace('https://example.com')`도 동일 동작
    - same-origin(relative URL 또는 현재 origin) 호출은 차단하지 않는다
  - 구현 내에서 `window.location.href = ...`를 사용하지 않는다.
  - 앱이 컴파일된다.
- Covers: []
- Files:
  - `src/lib/policy/externalNavigationGuard.ts`
- Depends on: Task 3.0

### Task 4.2 라우팅 연결 + Provider 래핑 + 외부 이동 가드 설치
- Description:
  - App 엔트리에서 라우트를 실제로 연결하고, 전역 Provider(AppStore/Toast)를 감싼다.
  - 앱 시작 시 외부 이동 가드를 1회 설치한다(Toast 사용).
- DoD:
  - `src/App.tsx`에서 아래 라우트들이 실제 렌더링된다:
    - `/` → `HomePage`
    - `/profile` → `ProfilePage`
    - `/workouts/:workoutId` → `WorkoutDetailPage`
    - `/coach` → `CoachPage`
    - `/session/summary` → `SessionSummaryPage`
    - `/report` → `ReportPage`
    - `/history` → `HistoryPage`
    - `/premium` → `PremiumPage`
  - `AppToastProvider`가 라우터 상단에 **1회만** 존재한다.
  - `AppStoreProvider`가 라우터 상단에 **1회만** 존재한다.
  - 정의되지 않은 route 접근 시 `/`로 이동하거나 NotFound를 명시 렌더한다(빈 화면 금지).
  - 외부 이동 가드 설치:
    - App mount 시 `installExternalNavigationGuard({ showToast })`를 **1회 호출**한다.
    - 이후 코드 경로에서 `window.open("https://example.com")` 또는 `window.location.assign("https://example.com")`가 호출되면:
      - 실제 외부 이동이 발생하면 fail
      - 토스트 `"앱 밖으로 이동할 수 없어요"`가 표시된다.
  - (정책) `console.error`를 추가로 호출하는 코드가 포함되면 fail.
- Covers: [F7-AC-5, F7-AC-6]
- Files:
  - `src/App.tsx`
- Depends on: Task 3.1 ~ Task 3.8, Task 2.5, Task 4.1

**Risk Analysis (Epic 4)**
- Complexity: Medium
- Risk factors:
  - 라우팅 연결 누락 시 플로우 검증 불가
  - 외부 이동 가드가 과도 차단하면 내부 라우팅/SDK 동작 방해 가능
- Mitigation:
  - 라우팅/Provider를 한 곳(App.tsx)에서 고정하고, 외부 이동은 “외부 도메인만” origin 체크로 제한적으로 차단

---

## AC Coverage
- Total ACs in SPEC: 85
- Covered by tasks: 85  
- Uncovered: 0