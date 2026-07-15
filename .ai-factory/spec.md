# SPEC (FIXED)

## Common Principles

- **플랫폼/기술 고정**
  - Client: Vite + React + TypeScript
  - UI: **@toss/tds-mobile 컴포넌트만** 사용 (간격은 **TDS `Spacing`만**)
  - Routing: `react-router-dom`
  - Persistence: `localStorage` (총합 **5MB 이하**)
  - Ads/IAP: 템플릿 제공 컴포넌트만 사용  
    - 배너: `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`
    - 보상형: `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>{children}</TossRewardAd>`
    - 결제: `<TossPurchase sku={import.meta.env.VITE_TOSS_IAP_SKU} ... />`
  - 프로모션 보상: `grantPromotionReward({ promotionCode, amount })` 직접 호출 (1인당 **최대 5,000원**)

- **아키텍처 결정(명시)**
  - **기본 MVP는 백엔드 없이 동작**하며, 모든 영속 데이터는 `localStorage`에만 저장한다.
  - 단, 실시간 피드백/리포트 생성에 대해 **원격 연산이 필요한 모드**를 지원하기 위해, `VITE_AI_API_BASE_URL`이 설정된 경우에만 “선택적 외부 API”를 호출한다.
  - `VITE_AI_API_BASE_URL`이 **미설정**이면 네트워크 호출 없이 **로컬 더미/템플릿 생성 로직**으로 동작한다(크래시 금지).

- **AI 고지/라벨(생성형 AI 서비스 고지 의무 준수)**
  - AI 기능(자세 추정 기반 피드백/리포트/플랜)이 사용자에게 결과로 노출될 때:
    - 첫 이용 1회: “이 서비스는 생성형 AI를 활용합니다” 안내 다이얼로그 표시 후 확인 상태를 `localStorage`에 저장
    - 모든 AI 결과물: “AI가 생성한 결과입니다” 라벨/배지 표시

- **모바일 UX 원칙**
  - 모든 인터랙티브 요소 터치 타깃 **최소 44px**
  - 폼 입력은 모바일 키보드로 가려지지 않게 처리(포커스 시 스크롤/하단 고정 CTA 충돌 방지)
  - 리스트는 기본 스크롤, 길어질 경우 “더 보기(페이지네이션)”로 렌더링 개수를 제한(초기 20개)

- **로컬 저장소 실패/용량(5MB) 처리 원칙(명시)**
  - `localStorage.setItem(...)` 호출에서 `QuotaExceededError`(또는 동등 예외)가 발생하면:
    - 앱은 크래시하면 fail
    - 사용자에게 토스트를 표시하고(문구는 화면별 AC에 따름) 해당 쓰기 작업(세션 생성/업데이트/리포트 저장)을 **완료 처리하면 fail**
  - JSON parse 실패 시:
    - 해당 화면은 Error UI로 전환하고 “초기화” 버튼을 제공한다(화면별 정의/AC에 따름)
  - 리스트 페이지네이션(“더 보기”) 시:
    - 다음 페이지 로드 실패(파싱 실패/예외) 시 현재 렌더된 리스트를 유지하고, 토스트 표시 후 더 이상 append 하지 않는다(화면별 AC에 따름)

- **외부 이동/정책**
  - `window.location.href`, `window.open`로 **외부 도메인 이동 금지**(법률 고지 목적 링크가 필요해도 MVP에서는 외부 링크 미노출)
  - 외부 로깅 SDK(GA/Amplitude 등) 금지
  - HEX 색상 하드코딩 금지(`#fff` 등) — TDS/토큰만 사용
  - Android 7+, iOS 16+ 호환(최신 전용 API에 의존 금지)

---

## Screen Definitions (React Router)

아래 모든 화면은 **PageShell/ScreenScaffold(프로젝트 내 공용 스캐폴드 컴포넌트가 있다면 그 컴포넌트)** 로 감싼다. (Raw `div`로 전체 페이지 골격 구성 금지)

> **추가(검수/테스트용): Screen-level Acceptance Criteria**
>
> - 각 화면(S1~S8)은 최소 **4개 이상의 EARS 형식 AC**를 가진다.
> - 표기 규칙: `[U]`(Ubiquitous), `[E]`(Event-driven), `[S]`(State-driven), `[W]`(Unwanted)
> - 모든 AC는 **명확한 pass/fail 조건**을 포함한다.

---

### S1. 홈(플랜/운동) — `/`
- **목적**: 오늘의 추천 플랜 요약과 운동 목록에서 세션을 시작한다.
- **TDS 컴포넌트**
  - `Top`, `Tab`(콘텐츠 전환용, 선택), `ListRow`, `Button`, `Chip`, `Paragraph.Text`, `Spacing`, `Card`, `Toast`, `AlertDialog`
  - 하단 탭 네비게이션은 템플릿 `FloatingTabBar`
  - 배너 광고: `AdSlot`
- **상태**
  - Loading: 플랜 생성 중 스켈레톤(카드 자리) + “플랜 불러오는 중” 텍스트
  - Empty: 프로필 미설정 시 `Asset.ContentIcon` + “프로필을 설정하면 플랜이 생성돼요”
  - Error: localStorage 파싱 실패 시 “데이터를 불러오지 못했어요” + “초기화” 버튼
- **터치**
  - 운동 항목 `ListRow` 전체가 탭 가능(최소 44px)
  - 하단 1차 액션은 `Button`(block)로 제공
- **리스트/페이지네이션**
  - MVP 홈 운동 목록은 번들 상수 3개로 고정이므로 “더 보기(페이지네이션)”을 제공하지 않는다(렌더 개수는 항상 3).
- **Navigation state contract**
  - Outgoing
    - “프로필 설정” → `navigate('/profile')`
    - 운동 `ListRow` 탭 → `navigate('/workouts/:workoutId', { state: { workoutId: string } })`
    - “기록” 탭 → `navigate('/history')`
    - “프리미엄” 탭 → `navigate('/premium')`
  - Incoming
    - `location.state` 사용하지 않음 (`undefined`)
- **Layout/Presentation contract**
  - 상단: `Top` 고정
  - 핵심 요약은 `Card` 1개 이상으로 묶고 `data-testid="today-plan-card"` 부여
  - 카드 아래에 운동 목록 `ListRow` 나열, 섹션 간 간격은 `Spacing size={...}`만 사용
  - 배너 광고는 **콘텐츠 섹션 사이(목록 하단)** 에 배치, 콘텐츠와 겹치지 않음
- **초기화(리셋) 동작**
  - S1의 Error UI에 있는 “초기화”는 **`fitcoach.userProfile.v1`만 삭제**한다(세션/리포트는 보존). (관계/캐스케이드 규칙과 일치)

#### S1 Acceptance Criteria (EARS)
- **AC-S1-1 [U][P0]: 기본 운동 3개 항목은 항상 노출된다**
  - WHEN 사용자가 `/`에 진입했을 때  
  - THEN 운동 목록 `ListRow`가 **정확히 3개** 렌더링된다  
  - AND 각 행에 `"스쿼트"`, `"푸쉬업"`, `"플랭크"` 텍스트가 모두 존재해야 한다(누락 시 fail).
- **AC-S1-2 [S][P1]: 프로필 미설정 시 Empty UI가 노출된다**
  - GIVEN `localStorage['fitcoach.userProfile.v1']`가 존재하지 않을 때  
  - WHEN `/`가 렌더링되면  
  - THEN `"프로필을 설정하면 플랜이 생성돼요"` 텍스트가 화면에 존재해야 한다.
- **AC-S1-3 [W][P1]: 홈 데이터 파싱 실패 시 초기화로 복구한다(프로필만 삭제)**
  - GIVEN `localStorage['fitcoach.userProfile.v1']="not-json"` 일 때  
  - WHEN `/`가 렌더링되면  
  - THEN `"데이터를 불러오지 못했어요"`가 표시되어야 한다  
  - AND `"초기화"` 버튼 탭 시 `localStorage.removeItem('fitcoach.userProfile.v1')` 실행 결과 해당 키가 **존재하지 않아야 한다**  
  - AND 같은 동작 이후에도 `localStorage['fitcoach.sessions.v1']` 값이 삭제/변경되면 fail.
- **AC-S1-4 [E][P0]: 운동 항목 탭 시 상세로 이동한다**
  - GIVEN 사용자가 `/`에서 `"스쿼트"` 행을 탭할 때  
  - THEN 라우트가 `/workouts/squat`가 되어야 한다(브라우저 location 기준).
- **AC-S1-5 [E][P1]: 하단 탭으로 기록 화면 진입**
  - WHEN 사용자가 하단 탭 `"기록"`을 탭하면  
  - THEN 라우트가 `/history`가 되어야 한다.

---

### S2. 프로필/목표 설정 — `/profile`
- **목적**: 체력/목표를 입력해 플랜과 피드백 기준을 개인화한다.
- **TDS 컴포넌트**
  - `Top`, `TextField`, `Chip`, `Switch`, `Button`, `Paragraph.Text`, `Spacing`, `Toast`, `BottomSheet`(선택)
- **상태**
  - Loading: 기존 값 로딩 중 필드 disabled + “불러오는 중”
  - Empty: 기존 값 없으면 기본값 표시(예: 목표=“체중감량” 미선택)
  - Error: 저장 실패 시 토스트 “저장에 실패했어요. 다시 시도해주세요”
- **키보드**
  - `TextField` 포커스 시 해당 필드가 화면 중앙 이상으로 오도록 스크롤
  - 하단 고정 CTA가 있다면 키보드 오픈 시 CTA가 입력을 가리지 않도록 레이아웃 전환
- **Navigation state contract**
  - Outgoing: 저장 성공 → `navigate('/', { state: { toast: 'saved' } })`
  - Incoming: `location.state` 선택적 `{ from?: 'home' | 'premium' }`
- **Layout/Presentation contract**
  - 입력 폼은 `Card`로 섹션 분리
  - 제출 버튼은 `Button` `display="block"` 형태로 단일 1차 액션 제공

#### S2 Acceptance Criteria (EARS)
- **AC-S2-1 [S][P1]: 로딩 중 입력 불가**
  - GIVEN `/profile` 최초 진입 직후 프로필 로딩 상태일 때  
  - WHEN 화면이 렌더링되면  
  - THEN `TextField`(키/몸무게)가 **둘 다** `disabled=true`여야 한다.
- **AC-S2-2 [E][P0]: 저장 성공 시 로컬 저장 및 홈으로 이동**
  - WHEN 사용자가 유효한 값(키 120~220, 몸무게 30~200, goal/level 선택)을 입력하고 `"저장"` 버튼을 탭하면  
  - THEN `localStorage['fitcoach.userProfile.v1']`는 **유효한 JSON**이어야 한다  
  - AND `navigate('/')`가 호출되어 라우트가 `/`가 되어야 한다.
- **AC-S2-3 [W][P1]: 키 범위 오류 시 저장 차단**
  - WHEN 사용자가 `heightCm=90`을 입력하고 `"저장"`을 탭하면  
  - THEN `"키는 120~220cm로 입력해주세요"` 텍스트가 표시되어야 한다  
  - AND `localStorage['fitcoach.userProfile.v1']` 값이 변경되면 fail.
- **AC-S2-4 [W][P1]: 몸무게 범위 오류 시 저장 차단**
  - WHEN 사용자가 `weightKg=250`을 입력하고 `"저장"`을 탭하면  
  - THEN `"몸무게는 30~200kg로 입력해주세요"` 텍스트가 표시되어야 한다  
  - AND `localStorage['fitcoach.userProfile.v1']` 값이 변경되면 fail.
- **AC-S2-5 [E][P1]: 음성 피드백 토글 저장**
  - WHEN 사용자가 `Switch(voiceFeedbackEnabled)`를 OFF로 변경 후 저장하면  
  - THEN 저장된 `UserProfile.voiceFeedbackEnabled`가 **false**여야 한다.

---

### S3. 운동 상세/시작 — `/workouts/:workoutId`
- **목적**: 운동 설명을 보고 세션을 시작한다.
- **TDS 컴포넌트**
  - `Top`, `Card`, `Paragraph.Text`, `Button`, `Chip`, `Spacing`, `Toast`
- **상태**
  - Loading: workout 정의 로딩 중 “운동 정보를 불러오는 중”
  - Empty/Error: 존재하지 않는 `workoutId`면 “운동을 찾을 수 없어요” + “홈으로” 버튼
- **Navigation state contract**
  - Outgoing: “세션 시작” → `navigate('/coach', { state: { workoutId: string, sessionId: string } })`
  - Incoming: `location.state = { workoutId: string } | undefined` (URL param 우선)
- **Layout/Presentation contract**
  - 운동 설명/주의사항을 `Card`로 묶고 `data-testid="workout-detail-card"` 부여

#### S3 Acceptance Criteria (EARS)
- **AC-S3-1 [U][P0]: 상세 카드가 1개 이상 존재**
  - WHEN `/workouts/squat`이 렌더링되면  
  - THEN `data-testid="workout-detail-card"` 요소가 **정확히 1개** 존재해야 한다.
- **AC-S3-2 [W][P1]: 존재하지 않는 workoutId 방어**
  - WHEN `/workouts/unknown`으로 진입하면  
  - THEN `"운동을 찾을 수 없어요"` 텍스트가 표시되어야 한다  
  - AND `"홈으로"` 버튼 탭 시 라우트가 `/`가 되어야 한다.
- **AC-S3-3 [E][P0]: 세션 시작 시 세션 레코드 생성**
  - GIVEN `localStorage['fitcoach.sessions.v1']`가 비어 있거나 items가 0개일 때  
  - WHEN `"세션 시작"` 버튼을 탭하면  
  - THEN `fitcoach.sessions.v1.items.length`가 **1 증가**해야 한다  
  - AND `navigate('/coach', { state: { workoutId, sessionId } })`에서 `sessionId`는 빈 문자열이 아니어야 한다.
- **AC-S3-4 [S][P1]: 프리미엄 전용 운동은 시작 불가**
  - GIVEN `PremiumState.isPremium=false`이고 해당 운동이 `premiumOnly=true`일 때  
  - WHEN 사용자가 `"세션 시작"`을 탭하면  
  - THEN `/coach`로 이동하면 fail  
  - AND `/premium`으로 이동해야 한다(라우트 기준).
- **AC-S3-5 [W][P1]: 세션 생성 저장 중 로컬 저장소 용량 초과 시 생성 실패 처리**
  - GIVEN 세션 생성 시점에 `localStorage.setItem('fitcoach.sessions.v1', ...)`가 `QuotaExceededError`(또는 동등 예외)를 throw 할 때  
  - WHEN 사용자가 `"세션 시작"`을 탭하면  
  - THEN 토스트 `"저장 공간이 부족해요. 오래된 기록을 정리해주세요"`가 **2초(±0.5초)** 표시되어야 한다  
  - AND `/coach`로 네비게이션이 발생하면 fail  
  - AND `fitcoach.sessions.v1.items.length`가 증가하면 fail.

---

### S4. 실시간 코칭(카메라) — `/coach`
- **목적**: 카메라 입력을 통해 실시간 자세 피드백을 제공하고 세션을 기록한다.
- **TDS 컴포넌트**
  - `Top`, `Card`, `Paragraph.Text`, `Button`, `Switch`, `Chip`, `Spacing`, `Toast`, `AlertDialog`
- **상태**
  - Loading: 카메라 권한 요청/스트림 준비 중 “카메라 준비 중”
  - Error: 권한 거부 시 “카메라 권한이 필요해요” + “다시 시도” 버튼
  - Empty: 카메라 스트림이 없으면 프리뷰 영역에 안내 텍스트 표시
- **Navigation state contract**
  - Outgoing: “세션 종료” → `navigate('/session/summary', { state: { sessionId: string } })`
  - Incoming: `location.state = { workoutId: string, sessionId: string }`
- **Layout/Presentation contract**
  - 상단에 카메라 프리뷰 영역(커스텀 레이아웃 허용)
  - 피드백 텍스트는 `Card`로 묶고 `data-testid="live-feedback-card"` 부여
  - 하단 CTA(종료)는 `Button display="block"`로 제공

#### S4 Acceptance Criteria (EARS)
- **AC-S4-1 [W][P0]: 진입 state 누락 시 사용 불가**
  - GIVEN 사용자가 `/coach`에 `location.state` 없이 직접 진입했을 때  
  - WHEN 화면이 렌더링되면  
  - THEN `"세션 정보를 불러오지 못했어요"` 텍스트가 표시되어야 한다(없으면 fail)  
  - AND `"홈으로"` 버튼 탭 시 라우트가 `/`가 되어야 한다.
- **AC-S4-2 [S][P0]: 카메라 준비 중 로딩 표기**
  - WHEN 카메라 스트림 준비가 완료되기 전까지  
  - THEN `"카메라 준비 중"` 텍스트가 표시되어야 한다  
  - AND 스트림 준비 완료 후 **1초 이내**에 해당 텍스트가 DOM에서 제거되어야 한다.
- **AC-S4-3 [W][P1]: 권한 거부 시 에러 UI**
  - GIVEN 카메라 권한이 거부된 상태일 때  
  - WHEN `/coach`가 렌더링되면  
  - THEN `"카메라 권한이 필요해요"`가 표시되어야 한다  
  - AND `"다시 시도"` 버튼이 존재해야 한다.
- **AC-S4-4 [E][P0]: 세션 종료 시 요약으로 이동 + 종료정보 저장**
  - GIVEN 진행 중인 세션 레코드가 `fitcoach.sessions.v1`에 존재할 때  
  - WHEN `"세션 종료"` 버튼을 탭하면  
  - THEN 해당 세션의 `endedAt`이 number로 저장되어야 한다  
  - AND `durationSec`가 **1 이상 정수**여야 한다  
  - AND 라우트가 `/session/summary`로 이동해야 한다.
- **AC-S4-5 [U][P1]: 라이브 피드백 카드 존재**
  - WHEN `/coach`가 렌더링되면  
  - THEN `data-testid="live-feedback-card"`를 가진 `Card`가 **정확히 1개** 존재해야 한다.
- **AC-S4-6 [W][P1]: 세션 업데이트 저장 중 로컬 저장소 용량 초과 시 크래시 금지**
  - GIVEN `/coach`에서 피드백 이벤트를 저장하는 시점에 `localStorage.setItem('fitcoach.sessions.v1', ...)`가 `QuotaExceededError`(또는 동등 예외)를 throw 할 때  
  - WHEN 새 피드백이 발생한다  
  - THEN 앱이 크래시/리로드되면 fail  
  - AND 토스트 `"저장 공간이 부족해요. 오래된 기록을 정리해주세요"`가 **2초(±0.5초)** 표시되어야 한다.

---

### S5. 세션 요약 — `/session/summary`
- **목적**: 세션 결과 요약을 보여주고, 보상형 광고 후 상세 AI 리포트로 이동한다.
- **TDS 컴포넌트**
  - `Top`, `Card`, `Paragraph.Text`, `Button`, `Spacing`, `Toast`, `Chip`
  - 보상형 광고 게이트: `TossRewardAd`
  - 배너 광고: `AdSlot`(요약 카드 아래)
- **상태**
  - Loading: session 로딩 중 “세션 결과 불러오는 중”
  - Empty: sessionId가 유효하지 않으면 “세션을 찾을 수 없어요” + “홈으로”
  - Error: 리포트 생성 실패 시 “리포트를 생성할 수 없어요” + “다시 시도”
- **Navigation state contract**
  - Outgoing:
    - “AI 리포트 보기”(보상형 광고 완료 후) → `navigate('/report', { state: { sessionId: string } })`
  - Incoming: `location.state = { sessionId: string }`
- **Layout/Presentation contract**
  - 요약 지표는 `Card` 2개 이상으로 묶고 `data-testid="summary-metrics-card"` 포함
  - 배너 광고는 **요약 카드와 버튼 사이가 아닌**, 요약 섹션 하단(버튼 위 또는 아래) 고정 영역으로 배치하되 콘텐츠와 겹치지 않음

#### S5 Acceptance Criteria (EARS)
- **AC-S5-1 [W][P1]: sessionId 누락/무효 시 Empty 처리**
  - GIVEN `location.state`가 없거나 `sessionId`에 해당하는 세션이 `fitcoach.sessions.v1`에 없을 때  
  - WHEN `/session/summary`가 렌더링되면  
  - THEN `"세션을 찾을 수 없어요"`가 표시되어야 한다  
  - AND `"홈으로"` 버튼 탭 시 라우트가 `/`가 되어야 한다.
- **AC-S5-2 [S][P1]: 로딩 상태 문구 표시**
  - WHEN 세션 레코드를 조회 중일 때  
  - THEN `"세션 결과 불러오는 중"` 텍스트가 표시되어야 한다(조회 완료 후 사라져야 함).
- **AC-S5-3 [E][P0]: 보상형 광고 완료 후에만 리포트로 이동**
  - WHEN 사용자가 `TossRewardAd`로 감싼 `"AI 리포트 보기"` 버튼을 탭하고 **광고를 완료**하면  
  - THEN 라우트가 `/report`가 되어야 한다  
  - AND navigation state에 `sessionId`가 포함되어야 한다.
- **AC-S5-4 [W][P1]: 보상형 광고 실패/중단 시 이동 차단**
  - WHEN 광고 로드 실패 또는 사용자가 시청을 중단했을 때  
  - THEN 라우트가 `/report`로 변경되면 fail  
  - AND 토스트 `"광고를 완료하면 리포트를 볼 수 있어요"`가 **2초(±0.5초)** 표시되어야 한다.
- **AC-S5-5 [U][P1]: 요약 카드 최소 조건**
  - WHEN 요약이 성공적으로 렌더링되면  
  - THEN `data-testid="summary-metrics-card"` 요소가 **1개 이상** 존재해야 한다.

---

### S6. AI 리포트 — `/report`
- **목적**: 자세 개선점/점수/권장사항을 AI 결과물로 표시한다(라벨 필수).
- **TDS 컴포넌트**
  - `Top`, `Card`, `Paragraph.Text`, `Chip`(AI 라벨), `Button`, `Spacing`, `Toast`
  - 배너 광고: `AdSlot`(리포트 하단)
- **상태**
  - Loading: 리포트 생성 중 “AI 리포트 생성 중”
  - Empty: 리포트 데이터 없으면 “리포트가 없어요” + “홈으로”
  - Error: 생성 실패 시 “리포트를 불러오지 못했어요” + “다시 시도”
- **Navigation state contract**
  - Outgoing: “홈으로” → `navigate('/')`
  - Incoming: `location.state = { sessionId: string }`
- **Layout/Presentation contract**
  - 최상단에 `Chip` 또는 텍스트로 **“AI가 생성한 결과입니다”** 표시, `data-testid="ai-generated-badge"`
  - 핵심 결과 카드는 `data-testid="report-card"` 부여(최소 2개)

#### S6 Acceptance Criteria (EARS)
- **AC-S6-1 [U][P0]: AI 라벨은 항상 존재**
  - WHEN `/report` 화면이 렌더링되면  
  - THEN `data-testid="ai-generated-badge"`가 존재해야 한다  
  - AND 내부 텍스트가 정확히 `"AI가 생성한 결과입니다"`여야 한다.
- **AC-S6-2 [S][P1]: 생성 중 로딩 문구 표시**
  - WHEN 리포트 생성/로딩이 진행 중일 때  
  - THEN `"AI 리포트 생성 중"` 텍스트가 표시되어야 한다.
- **AC-S6-3 [W][P1]: sessionId 누락 시 Empty 처리**
  - GIVEN `location.state`가 없을 때  
  - WHEN `/report`가 렌더링되면  
  - THEN `"리포트가 없어요"`가 표시되어야 한다  
  - AND `"홈으로"` 버튼 탭 시 라우트가 `/`가 되어야 한다.
- **AC-S6-4 [E][P1]: 재시도 버튼은 동일 sessionId로 다시 생성 요청**
  - GIVEN 에러 상태에서 `"다시 시도"` 버튼이 보일 때  
  - WHEN 사용자가 `"다시 시도"`를 탭하면  
  - THEN 로딩 문구 `"AI 리포트 생성 중"`이 다시 표시되어야 한다  
  - AND 성공 시 `data-testid="report-card"`가 **최소 2개** 렌더링되어야 한다.
- **AC-S6-5 [E][P0]: AI 고지(첫 이용 1회)**
  - GIVEN `localStorage['fitcoach.aiDisclosure.v1']`가 없거나 `acknowledged=false`일 때  
  - WHEN 사용자가 `/report`에 진입하면  
  - THEN `AlertDialog`에 `"이 서비스는 생성형 AI를 활용합니다"` 문구가 표시되어야 한다  
  - AND `"확인"` 탭 시 `acknowledged=true`가 저장되어야 한다(저장 실패 시 fail).

---

### S7. 기록(히스토리) — `/history`
- **목적**: 과거 세션을 리스트로 보고 상세(요약/리포트)로 이동한다.
- **TDS 컴포넌트**
  - `Top`, `ListRow`, `Button`, `Paragraph.Text`, `Spacing`, `Card`, `Toast`
  - 배너 광고: `AdSlot`(리스트 하단)
- **상태**
  - Loading: 기록 로딩 중 “기록 불러오는 중”
  - Empty: 기록 0개면 `Asset.ContentIcon` + “첫 운동을 시작해보세요” + “운동 보러가기”
  - Error: localStorage 파싱 실패 시 “기록을 불러오지 못했어요” + “초기화”
- **리스트 스크롤**
  - 초기 20개 렌더, “더 보기” 버튼 탭 시 20개씩 추가 렌더(무한 스크롤 대신 명시적 페이지네이션)
- **Navigation state contract**
  - Outgoing: 항목 탭 → `navigate('/session/summary', { state: { sessionId: string } })`
  - Incoming: `location.state` 사용하지 않음
- **Layout/Presentation contract**
  - 각 세션은 `ListRow` 1개로 표현, `data-testid="history-row-{sessionId}"`

#### S7 Acceptance Criteria (EARS)
- **AC-S7-1 [S][P1]: 히스토리 로딩 문구 표시**
  - WHEN 세션 목록을 로딩 중일 때  
  - THEN `"기록 불러오는 중"` 텍스트가 표시되어야 한다.
- **AC-S7-2 [S][P1]: 히스토리 Empty 처리**
  - GIVEN `fitcoach.sessions.v1.items.length=0`일 때  
  - WHEN `/history`가 렌더링되면  
  - THEN `"첫 운동을 시작해보세요"` 텍스트가 표시되어야 한다  
  - AND `"운동 보러가기"` 버튼 탭 시 라우트가 `/`여야 한다.
- **AC-S7-3 [E][P0]: 행 탭 시 세션 요약으로 이동**
  - GIVEN `sessionId="sess_100"` 레코드가 존재할 때  
  - WHEN 사용자가 `data-testid="history-row-sess_100"`를 탭하면  
  - THEN 라우트가 `/session/summary`가 되어야 한다  
  - AND navigation state의 `sessionId`는 `"sess_100"`이어야 한다.
- **AC-S7-4 [E][P1]: 더 보기로 20개씩 증가**
  - GIVEN 총 45개 세션이 있고 초기 렌더가 20개일 때  
  - WHEN `"더 보기"` 버튼을 1회 탭하면  
  - THEN 렌더링된 `ListRow` 개수가 **정확히 40개**여야 한다.
- **AC-S7-5 [S][P1]: 마지막 페이지에서 더 보기 비활성**
  - GIVEN 총 45개 세션이고 사용자가 `"더 보기"`를 2회 탭해 45개가 모두 렌더링된 상태일 때  
  - THEN `"더 보기"` 버튼이 **렌더링되지 않거나**, 렌더링된다면 `disabled=true`여야 한다(둘 중 하나 만족).
- **AC-S7-6 [W][P1]: 파싱 실패 시 초기화로 복구**
  - GIVEN `localStorage['fitcoach.sessions.v1']="not-json"`일 때  
  - WHEN `/history`가 렌더링되면  
  - THEN `"기록을 불러오지 못했어요"`가 표시되어야 한다  
  - AND `"초기화"` 버튼 탭 시 `fitcoach.sessions.v1` 키가 삭제되어야 한다.
- **AC-S7-7 [W][P1]: “더 보기” 로드 실패 시 현재 리스트 유지**
  - GIVEN 총 45개 세션이 있고 초기 20개가 정상 렌더된 상태에서  
  - AND 사용자가 `"더 보기"`를 탭하는 순간 세션 페이지 조회 로직이 예외를 throw 하거나(예: 파싱 실패/예상치 못한 에러) 다음 페이지 로드에 실패할 때  
  - WHEN 화면이 에러를 처리하면  
  - THEN 이미 렌더링된 `ListRow` 개수가 **20개에서 변하면 fail**  
  - AND 토스트 `"더 불러오지 못했어요. 다시 시도해주세요"`가 **2초(±0.5초)** 표시되어야 한다.

---

### S8. 프리미엄 — `/premium`
- **목적**: 프리미엄 혜택을 안내하고 IAP로 구매한다(MVP: 1회 결제로 기간 부여).
- **TDS 컴포넌트**
  - `Top`, `Card`, `Paragraph.Text`, `Button`, `Chip`, `Spacing`, `Toast`, `AlertDialog`
  - 결제: `TossPurchase`
- **상태**
  - Loading: 구매 처리 중 “결제 진행 중” + 구매 버튼 disabled
  - Empty: 혜택 목록은 항상 표시(빈 상태 없음)
  - Error: 구매 실패 시 “결제에 실패했어요. 다시 시도해주세요”
- **Navigation state contract**
  - Outgoing: 구매 성공 → `navigate('/', { state: { toast: 'premium' } })`
  - Incoming: `location.state = { from?: 'home' | 'report' } | undefined`
- **Layout/Presentation contract**
  - 혜택은 `Card`로 묶고 구매 CTA는 `Button display="block"` 1개로 고정, `data-testid="premium-purchase-cta"`

#### S8 Acceptance Criteria (EARS)
- **AC-S8-1 [U][P0]: 구매 CTA는 항상 존재**
  - WHEN `/premium`이 렌더링되면  
  - THEN `data-testid="premium-purchase-cta"` 요소가 존재해야 한다.
- **AC-S8-2 [S][P1]: 결제 진행 중 CTA 비활성**
  - WHEN 결제 요청을 시작하여 로딩 상태일 때  
  - THEN `"결제 진행 중"` 텍스트가 표시되어야 한다  
  - AND 구매 CTA가 `disabled=true`여야 한다.
- **AC-S8-3 [E][P0]: 구매 성공 시 프리미엄 저장 + 홈 이동**
  - WHEN `TossPurchase`의 `onPurchased`가 호출되면  
  - THEN `localStorage['fitcoach.premium.v1']`의 `isPremium=true`여야 한다  
  - AND `expiresAt`이 `Date.now()`보다 미래여야 한다  
  - AND 라우트가 `/`로 이동해야 한다.
- **AC-S8-4 [W][P1]: 구매 실패 시 저장 변화 없음**
  - WHEN 결제 실패 콜백이 호출되면  
  - THEN 토스트 `"결제에 실패했어요. 다시 시도해주세요"`가 표시되어야 한다  
  - AND `localStorage['fitcoach.premium.v1']`가 변경되면 fail.
- **AC-S8-5 [S][P1]: 만료된 프리미엄은 비프리미엄으로 간주**
  - GIVEN `expiresAt < Date.now()`일 때  
  - WHEN 앱이 프리미엄 상태를 읽으면  
  - THEN 화면/로직에서 `isPremium=false`로 처리되어야 한다.

---

## Data Models

### UserProfile — fields, types, constraints

```ts
export type FitnessGoal = '체중감량' | '근력증가' | '자세교정';
export type FitnessLevel = '초급' | '중급' | '상급';

export interface UserProfile {
  version: 1;

  /**
   * 로컬 단일 프로필(singelton) 엔티티.
   * - 서버/계정 연동 없이 localStorage 1개 키에 저장되므로 id는 고정값을 사용한다.
   */
  id: 'me';

  heightCm: number; // 120~220
  weightKg: number; // 30~200
  goal: FitnessGoal; // required
  level: FitnessLevel; // required
  voiceFeedbackEnabled: boolean; // default true

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}
```

- **localStorage**
  - Key: `fitcoach.userProfile.v1`
  - Shape: `UserProfile`
- **Size estimation**
  - ~220 bytes/user

---

### AiDisclosureState — fields, types, constraints

```ts
export interface AiDisclosureState {
  version: 1;

  /**
   * 로컬 단일 상태(singelton) 엔티티.
   */
  id: 'me';

  acknowledged: boolean; // default false

  /**
   * acknowledged === true 인 경우에만 존재.
   */
  acknowledgedAt?: number; // epoch ms when acknowledged===true

  createdAt: number; // epoch ms (state first created)
  updatedAt: number; // epoch ms (last updated)
}
```

- **localStorage**
  - Key: `fitcoach.aiDisclosure.v1`
  - Shape: `AiDisclosureState`
- **Size estimation**
  - ~120 bytes/user

---

### PremiumState — fields, types, constraints

```ts
export interface PremiumState {
  version: 1;

  /**
   * 로컬 단일 상태(singelton) 엔티티.
   */
  id: 'me';

  isPremium: boolean;
  // MVP: 1회 결제로 기간 부여(예: 30일). 만료되면 isPremium=false로 간주.
  expiresAt?: number; // epoch ms
  lastPurchaseAt?: number; // epoch ms

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}
```

- **localStorage**
  - Key: `fitcoach.premium.v1`
  - Shape: `PremiumState`
- **Size estimation**
  - ~160 bytes/user

---

### WorkoutDefinition — fields, types, constraints

```ts
export type WorkoutId = 'squat' | 'pushup' | 'plank';

export interface WorkoutDefinition {
  id: WorkoutId;
  title: string; // e.g., "스쿼트"
  description: string;
  targetMinutes: number; // 1~60
  premiumOnly: boolean;
}
```

- **localStorage**
  - 저장하지 않음(MVP는 앱 번들에 상수로 포함)
- **Size estimation**
  - 번들 상수(로컬스토리지 사용량 0)

---

### SessionRecord — fields, types, constraints

```ts
export interface PoseFeedbackEvent {
  t: number; // session-relative ms
  code: 'KNEE_MORE_BEND' | 'BACK_STRAIGHT' | 'ELBOWS_IN';
  messageKo: string; // e.g., "무릎을 더 굽히세요"
  severity: 1 | 2 | 3;
}

export interface SessionRecord {
  version: 1;

  /**
   * 세션 고유 식별자(= id로도 사용 가능)
   */
  sessionId: string; // uuid-like string

  /**
   * 명시적 id 필드(탐색/관계 정의용). 값은 sessionId와 동일해야 한다.
   */
  id: string; // must equal sessionId

  workoutId: WorkoutId;

  startedAt: number; // epoch ms
  endedAt?: number; // epoch ms
  durationSec?: number; // endedAt-startedAt (rounded)

  feedbackCount: number; // >=0
  feedbackEventsSample: PoseFeedbackEvent[]; // max 20
  score?: number; // 0~100 (generated in summary/report)

  createdAt: number; // epoch ms (equals startedAt)
  updatedAt: number; // epoch ms (changes on feedback/end)
}
```

- **localStorage**
  - Key: `fitcoach.sessions.v1`
  - Shape: `{ version: 1; items: SessionRecord[] }` (최근 항목이 앞)
- **Size estimation**
  - 1 세션당 약 1~3KB (샘플 이벤트 20개 제한)
  - 500 세션 저장 시 최대 ~1.5MB 내외 (5MB 이하 유지)

---

### PromotionState — fields, types, constraints

```ts
export interface PromotionState {
  version: 1;

  /**
   * 로컬 단일 상태(singelton) 엔티티.
   */
  id: 'me';

  firstSessionRewardGranted: boolean;
  grantedAt?: number; // epoch ms

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}
```

- **localStorage**
  - Key: `fitcoach.promo.v1`
  - Shape: `PromotionState`
- **Size estimation**
  - ~140 bytes/user

---

## (FIX) Entity Schemas Referenced by ID in Navigation Contracts

> 아래 3개 엔티티는 내비게이션 state에서 ID로 참조되거나(S3~S7) 생성/조회 흐름에서 ID 기반 접근이 필요하므로 **완전한 타입 스키마**를 정의한다.  
> (기존 `SessionRecord`는 로컬 저장 모델이며, 아래 `Session`은 “엔티티 관점”의 정규 스키마로 동치/호환된다.)

### Session (정규 엔티티 스키마)

```ts
export type SessionId = string;

export interface Session {
  version: 1;
  id: SessionId; // equals SessionRecord.sessionId
  workoutId: WorkoutId;

  startedAt: number; // epoch ms
  endedAt?: number; // epoch ms
  durationSec?: number; // >= 1 when endedAt exists

  feedbackCount: number; // >=0
  feedbackEventsSample: PoseFeedbackEvent[]; // max 20

  score?: number; // 0~100

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}
```

- **Storage mapping (MVP/localStorage)**
  - `Session` ↔ `SessionRecord`는 1:1 매핑
  - 규칙: `Session.id === SessionRecord.sessionId === SessionRecord.id`

---

### WorkoutSession (진행 중 세션 런타임 스키마)

```ts
export interface WorkoutSession {
  version: 1;
  id: string; // runtime session id (must equal SessionId)
  workoutId: WorkoutId;

  /**
   * /coach 화면에서만 유효한 런타임 상태.
   * MVP에서는 localStorage에 저장하지 않는다(새로고침 시 복구 불가).
   */
  status: 'READY' | 'RUNNING' | 'ENDED';

  lastFeedback?: PoseFeedbackEvent;

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}
```

- **Persistence**
  - 저장하지 않음(in-memory)
  - 단, 종료 시점에 `SessionRecord` 업데이트로 영속화됨

---

### Report (AI 리포트 엔티티 스키마)

```ts
export type ReportId = string;

export interface Report {
  version: 1;
  id: ReportId;

  /**
   * 보고서가 귀속되는 세션
   */
  sessionId: SessionId;

  /**
   * AI 결과물 라벨을 강제하기 위한 메타.
   * - UI는 항상 "AI가 생성한 결과입니다"를 표시해야 한다.
   */
  generatedBy: 'AI';
  language: 'ko-KR';

  score: number; // 0~100
  summaryKo: string; // 1~500 chars 권장(검수/UX 목적)

  improvementsKo: string[]; // 1~10 items
  recommendationsKo: string[]; // 1~10 items

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}
```

- **localStorage**
  - Key: `fitcoach.reports.v1`
  - Shape: `{ version: 1; items: Report[] }`
  - 조회 규칙: `items.find(r => r.sessionId === sessionId)`
- **Size estimation**
  - 1 report당 ~1~4KB(텍스트 길이에 따라 변동)

---

## (FIX) Relationships & Cascade/Orphan Rules

- **관계(Parent/Child)**
  - `UserProfile(id='me')` **(논리적 부모)**  
    - 자식: `Session(id=sessionId)` 0..N  
    - 자식: `Report(id=reportId, sessionId FK)` 0..N
  - `WorkoutDefinition(id=WorkoutId)`은 번들 상수로, 엔티티 간 FK의 “타겟 타입” 역할만 한다.

- **FK 제약(클라이언트 레벨 규칙)**
  - `Session.workoutId`는 반드시 `WorkoutDefinition.id` 중 하나여야 한다. 불일치 시 해당 Session은 `/history`에서 “운동을 찾을 수 없어요”로 표시하고 상세 진입은 차단한다.
  - `Report.sessionId`는 반드시 존재하는 `Session.id`를 참조해야 한다. 세션이 없으면 해당 Report는 **orphan**으로 간주하여 화면에서 노출하지 않고, 다음 보고서 저장 시 정리(garbage collect) 대상이 된다.

- **Cascade / Orphan 동작**
  - **프로필 초기화(“초기화” 버튼이 프로필 키를 지우는 경우)**:
    - `fitcoach.userProfile.v1`만 삭제한다.
    - **세션 히스토리(`fitcoach.sessions.v1`)와 리포트(`fitcoach.reports.v1`)는 삭제하지 않는다.**
  - **히스토리 초기화(“초기화” 버튼이 세션 키를 지우는 경우)**:
    - `fitcoach.sessions.v1`만 삭제한다.
    - 이때 `fitcoach.reports.v1`는 FK가 끊긴 orphan이 될 수 있으므로, 다음 `/history` 진입 시 `Report.sessionId`가 존재하지 않는 항목은 자동 제거한다(또는 조회 시 무시).
  - **localStorage 전체가 사용자가 수동으로 삭제된 경우**
    - 모든 데이터는 사라지며, 앱은 Empty 상태로 동작해야 한다(크래시/console.error 없이).

---

## (FIX) History Pagination Typed Contract (localStorage slicing)

`/history`의 “더 보기(20개씩)” 동작은 아래 타입/계약으로 정의한다.

```ts
export interface PageRequest {
  page: number; // 1-based
  pageSize: number; // fixed 20 in MVP
}

export interface PageResult<T> {
  items: T[];
  total: number; // total items count in storage
  page: number; // echo
  pageSize: number; // echo
  hasNext: boolean; // (page * pageSize) < total
}

/**
 * localStorage('fitcoach.sessions.v1')의 items를 최신순으로 페이지 슬라이스한다.
 * - page=1 => 0..pageSize-1
 * - page=2 => pageSize..(2*pageSize-1)
 */
export type GetSessionsPage = (req: PageRequest) => PageResult<SessionRecord>;
```

- **UI 규칙(연동)**
  - `hasNext=false`이면 `"더 보기"` 버튼은 숨기거나 `disabled=true`로 둔다(S7 AC-S7-5 준수).
  - `"더 보기"` 탭은 `page`를 +1 증가시켜 `GetSessionsPage`를 다시 호출한 뒤 `items`를 append 렌더한다.
  - append 렌더 시 `sessionId`가 동일한 항목이 중복 렌더링되면 fail(중복 방지 필수).

---

## (FIX) External API Specification (AI computation; optional backend)

> **배경:** S4(실시간 자세 피드백), S6(리포트 생성/실패)에는 “실패 가능” 상태가 정의되어 있으므로, 실패 가능한 원격 연산을 **외부 API 서버**로 분리 정의한다.  
> 단, 기존 Assumptions(“MVP는 서버 없이 localStorage만”)을 유지하기 위해:
> - **MVP 기본 구현:** API 미구현 시 더미(로컬) 생성 로직으로 대체 가능
> - **API 사용 모드:** `VITE_AI_API_BASE_URL`이 설정된 경우에만 네트워크 호출

### API 공통
- Base URL: `import.meta.env.VITE_AI_API_BASE_URL` (예: `https://fitcoach-ai.up.railway.app`)
- Content-Type: `application/json; charset=utf-8`
- 인증(선택):
  - 토스 로그인 연동 서비스인 경우, 서버는 WebView 세션(쿠키 등)으로 사용자 식별을 할 수 있다.
  - 인증 실패 시 `401`을 반환한다(클라이언트는 로그인 UI를 제공하지 않고 에러 메시지만 노출).

### Error Response (공통)

```ts
export interface ApiError {
  error: {
    code:
      | 'BAD_REQUEST'
      | 'UNAUTHORIZED'
      | 'NOT_FOUND'
      | 'RATE_LIMITED'
      | 'INTERNAL';
    message: string; // human-readable
  };
}
```

---

### 1) Session Creation
- **Method/Path:** `POST /v1/sessions`
- **Purpose:** 세션 ID를 서버에서도 추적해야 하는 모드(서버 리포트 생성, 분석 집계 등)에 사용
- **Request**

```ts
export interface CreateSessionRequest {
  workoutId: WorkoutId;
  startedAt: number; // epoch ms
  profile?: {
    heightCm: number;
    weightKg: number;
    goal: FitnessGoal;
    level: FitnessLevel;
  };
}
```

- **Response (200)**

```ts
export interface CreateSessionResponse {
  session: Session; // includes id, createdAt/updatedAt
}
```

- **Errors**
  - `400`: workoutId 누락/유효하지 않음, startedAt 비정상
  - `401`: 인증 필요/세션 만료
  - `5xx`: 서버 오류

---

### 2) Live-feedback Submission (pose/feature input)
- **Method/Path:** `POST /v1/sessions/:sessionId/feedback`
- **Purpose:** 실시간 코칭에서 포즈 특징(또는 프레임 단위 추정 결과)을 보내고 피드백을 받는다.
- **Request**

```ts
export interface SubmitFeedbackRequest {
  t: number; // session-relative ms
  // MVP: 이미지 전송 금지(용량/개인정보 이슈). 대신 최소 특징값만 전송.
  pose: {
    // 0~1 normalized landmarks (example)
    landmarks: Array<{ x: number; y: number; score?: number }>; // length >= 0
  };
}
```

- **Response (200)**

```ts
export interface SubmitFeedbackResponse {
  feedback?: PoseFeedbackEvent; // 없을 수도 있음(= 변화 없음)
}
```

- **Errors**
  - `400`: sessionId 형식 오류, t 음수, landmarks 포맷 오류
  - `401`: 인증 필요/세션 만료
  - `404`: sessionId 없음
  - `429`: 과도 호출(서버 레이트리밋)
  - `5xx`: 서버 오류 (클라이언트는 S4 Error/Toast로 처리)

---

### 3) Report Generation
- **Method/Path:** `POST /v1/reports`
- **Purpose:** 세션 요약/피드백 샘플을 기반으로 AI 리포트 생성
- **Request**

```ts
export interface GenerateReportRequest {
  sessionId: SessionId;
  workoutId: WorkoutId;
  startedAt: number;
  endedAt: number;
  durationSec: number;

  feedbackEventsSample: PoseFeedbackEvent[]; // max 20

  profile?: {
    heightCm: number;
    weightKg: number;
    goal: FitnessGoal;
    level: FitnessLevel;
  };
}
```

- **Response (200)**

```ts
export interface GenerateReportResponse {
  report: Report;
}
```

- **Errors**
  - `400`: 세션 종료정보 누락(endedAt/durationSec), 샘플 배열 포맷 오류
  - `401`: 인증 필요/세션 만료
  - `404`: sessionId 없음(서버가 세션을 추적하는 모드인 경우)
  - `5xx`: 생성 실패/서버 오류  
    - 클라이언트는 S6 Error UI `"리포트를 불러오지 못했어요"` + `"다시 시도"`를 제공해야 한다.

---

## Feature List

### F1. 프로필/AI 고지/로컬 저장소 기반 개인화 베이스
- **Description:** 사용자의 키/몸무게/목표/난이도를 입력받아 홈과 코칭/리포트에 반영한다. AI 기능을 처음 사용하는 경우 1회 고지 다이얼로그를 표시하고 확인 상태를 저장한다. 모든 데이터는 localStorage에 저장되어 앱 재실행 후에도 유지된다.
- **Data:** `UserProfile`, `AiDisclosureState`
- **API:** N/A
- **Requirements:**
- **AC-1 [E][P0]: Scenario: 프로필 저장 성공**
  - Given 토스 로그인된 유저가 있고 `localStorage['fitcoach.userProfile.v1']`가 비어있을 때
  - When 사용자가 `/profile`에서 `{ heightCm: 170, weightKg: 65, goal: "자세교정", level: "초급", voiceFeedbackEnabled: true }`로 저장 버튼을 탭한다
  - Then `localStorage['fitcoach.userProfile.v1']`에 `version: 1` 포함 형태로 저장된다
  - And 토스트 메시지 `"저장했어요"`가 2초간 표시된다
- **AC-2 [W][P1]: Scenario: 키 입력 범위 오류**
  - Given 토스 로그인된 유저가 있을 때
  - When 사용자가 `/profile`에서 `heightCm`에 `90`을 입력하고 저장 버튼을 탭한다
  - Then 필드 하단 에러 텍스트로 `"키는 120~220cm로 입력해주세요"`가 표시된다
  - And `localStorage['fitcoach.userProfile.v1']` 값이 변경되지 않는다
- **AC-3 [W][P1]: Scenario: 몸무게 입력 범위 오류**
  - Given 토스 로그인된 유저가 있을 때
  - When 사용자가 `/profile`에서 `weightKg`에 `250`을 입력하고 저장 버튼을 탭한다
  - Then 필드 하단 에러 텍스트로 `"몸무게는 30~200kg로 입력해주세요"`가 표시된다
  - And `localStorage['fitcoach.userProfile.v1']` 값이 변경되지 않는다
- **AC-4 [S][P1]: Scenario: 프로필 로딩 상태**
  - Given `/profile` 진입 시 `localStorage['fitcoach.userProfile.v1']` 읽기 작업이 진행 중일 때
  - When 화면이 렌더링된다
  - Then `TextField` 2개가 `disabled=true`로 표시된다
  - And `"불러오는 중"` 텍스트가 표시된다
- **AC-5 [E][P0]: Scenario: AI 서비스 첫 이용 고지 1회 표시**
  - Given `localStorage['fitcoach.aiDisclosure.v1']`가 없거나 `{ acknowledged: false }`일 때
  - When 사용자가 AI 결과가 노출되는 화면인 `/report`에 처음 진입한다
  - Then `AlertDialog`로 `"이 서비스는 생성형 AI를 활용합니다"` 문구가 표시된다
  - And 사용자가 다이얼로그의 `"확인"` 버튼을 탭하면 `localStorage['fitcoach.aiDisclosure.v1'] = { version: 1, acknowledged: true }`로 저장된다
- **AC-6 [W][P1]: Scenario: localStorage 파싱 실패 처리**
  - Given `localStorage['fitcoach.userProfile.v1'] = "not-json"` 일 때
  - When 사용자가 `/profile`에 진입한다
  - Then 화면에 에러 텍스트 `"데이터를 불러오지 못했어요"`가 표시된다
  - And `"초기화"` 버튼 탭 시 `localStorage['fitcoach.userProfile.v1']`가 삭제된다

---

### F2. 운동 라이브러리(기본 3종) + 세션 시작 플로우
- **Description:** MVP에서는 기본 운동 3종(스쿼트/푸쉬업/플랭크)을 제공하고, 상세 화면에서 세션을 시작한다. 운동 접근은 프리미엄 상태에 따라 제한되며, 제한 시 프리미엄 화면으로 유도한다.
- **Data:** `WorkoutDefinition`, `PremiumState`, `SessionRecord`(세션 생성 시 최소 레코드 생성)
- **API:** N/A
- **Requirements:**
- **AC-1 [U][P0]: Scenario: 홈에 기본 운동 3종 표시**
  - Given 앱이 `/`로 진입했고 초기 번들에 운동 정의가 `{ "squat", "pushup", "plank" }` 3개 있을 때
  - When 화면이 렌더링된다
  - Then `ListRow`가 정확히 3개 렌더링된다
  - And 각 `ListRow`에 제목 `"스쿼트"`, `"푸쉬업"`, `"플랭크"`가 표시된다
- **AC-2 [E][P0]: Scenario: 운동 상세 진입**
  - Given 사용자가 `/`에서 `"스쿼트"` `ListRow`를 탭할 때
  - When 라우팅이 발생한다
  - Then `/workouts/squat`로 이동한다
  - And `/workouts/:workoutId` 화면의 `data-testid="workout-detail-card"`가 존재한다
- **AC-3 [E][P0]: Scenario: 세션 시작 시 레코드 생성**
  - Given 사용자가 `/workouts/squat`에 있고 `localStorage['fitcoach.sessions.v1']`가 비어있을 때
  - When 사용자가 `"세션 시작"` 버튼을 탭한다
  - Then `localStorage['fitcoach.sessions.v1']`에 `sessionId`가 포함된 `SessionRecord` 1개가 저장된다
  - And `navigate('/coach', { state: { workoutId: "squat", sessionId: "<non-empty>" } })`가 호출된다
- **AC-4 [W][P1]: Scenario: 존재하지 않는 workoutId 처리**
  - Given 사용자가 URL로 `/workouts/unknown`에 진입했을 때
  - When 화면이 렌더링된다
  - Then `"운동을 찾을 수 없어요"` 텍스트가 표시된다
  - And `"홈으로"` 버튼 탭 시 `/`로 이동한다
- **AC-5 [W][P1]: Scenario: 프리미엄 전용 운동 접근 차단**
  - Given `PremiumState.isPremium=false`이고 `plank`가 `premiumOnly=true`일 때
  - When 사용자가 `/workouts/plank`에서 `"세션 시작"` 버튼을 탭한다
  - Then 토스트 `"프리미엄에서 이용할 수 있어요"`가 표시된다
  - And `navigate('/premium', { state: { from: "report" } })` 또는 `{ from: "home" }` 중 하나로 이동한다
- **AC-6 [S][P1]: Scenario: 홈 플랜 카드 빈 상태**
  - Given `localStorage['fitcoach.userProfile.v1']`가 없을 때
  - When 사용자가 `/`에 진입한다
  - Then `Asset.ContentIcon`이 표시된다
  - And `"프로필을 설정하면 플랜이 생성돼요"` 텍스트가 표시된다

---

### F3. 실시간 자세 코칭(카메라 입력) + 음성 피드백 토글
- **Description:** `/coach`에서 카메라 스트림을 요청하고, 실시간 피드백 텍스트를 카드로 표시한다. 사용자가 음성 피드백을 켜면(프로필 설정 기반) 동일한 피드백 문구를 음성으로도 안내한다(웹 SpeechSynthesis 사용 가능 범위 내).
- **Data:** `SessionRecord`, `PoseFeedbackEvent`, `UserProfile`
- **API:** N/A
- **Requirements:**
- **AC-1 [E][P0]: Scenario: 카메라 권한 요청 및 로딩 표시**
  - Given 사용자가 `navigate('/coach', { state: { workoutId: "squat", sessionId: "sess_001" } })`로 진입했을 때
  - When 카메라 스트림 준비가 완료되기 전까지
  - Then `"카메라 준비 중"` 텍스트가 표시된다
  - And 준비 완료 후 `"카메라 준비 중"` 텍스트가 사라진다
- **AC-2 [W][P1]: Scenario: 카메라 권한 거부 처리**
  - Given 브라우저 카메라 권한이 거부된 상태일 때
  - When 사용자가 `/coach`에 진입한다
  - Then `"카메라 권한이 필요해요"` 텍스트가 표시된다
  - And `"다시 시도"` 버튼 탭 시 권한 요청 플로우가 다시 실행된다
- **AC-3 [E][P0]: Scenario: 피드백 이벤트 기록(샘플 제한 20)**
  - Given 사용자가 `/coach`에서 세션 `sessionId="sess_001"`로 진행 중이고 저장된 `feedbackEventsSample.length=19`일 때
  - When 새로운 피드백 `{ code: "BACK_STRAIGHT", messageKo: "등을 곧게 펴세요", severity: 2 }`가 발생한다
  - Then `fitcoach.sessions.v1`의 해당 세션 `feedbackCount`가 1 증가한다
  - And `feedbackEventsSample.length`가 20이 된다
- **AC-4 [W][P1]: Scenario: 피드백 이벤트 샘플 20개 초과 방지**
  - Given 사용자가 `/coach`에서 `feedbackEventsSample.length=20`일 때
  - When 새로운 피드백 `{ code: "KNEE_MORE_BEND", messageKo: "무릎을 더 굽히세요", severity: 3 }`가 추가로 발생한다
  - Then `feedbackCount`는 1 증가한다
  - And `feedbackEventsSample.length`는 20을 유지한다
- **AC-5 [S][P1]: Scenario: 라이브 피드백 카드 레이아웃 계약**
  - Given 사용자가 `/coach` 화면에 있을 때
  - When 화면이 렌더링된다
  - Then `data-testid="live-feedback-card"`를 가진 `Card`가 정확히 1개 존재한다
  - And 카드 내부에 마지막 피드백 문구 텍스트(예: `"무릎을 더 굽히세요"`)가 표시된다
- **AC-6 [W][P1]: Scenario: 음성 피드백 비활성화 시 음성 출력 금지**
  - Given `localStorage['fitcoach.userProfile.v1'].voiceFeedbackEnabled=false`일 때
  - When `/coach`에서 피드백 `"무릎을 더 굽히세요"`가 발생한다
  - Then `speechSynthesis.speak`가 호출되지 않는다

---

### F4. 세션 종료/요약 + 보상형 광고 게이트 후 AI 리포트 생성
- **Description:** 세션을 종료하면 `/session/summary`에서 요약 지표를 보여주고, “AI 리포트 보기”는 보상형 광고 시청 완료 후에만 `/report`로 이동한다. `/report`에서는 개선점/점수/권장사항을 AI 결과물로 표시하며 AI 라벨을 항상 노출한다.
- **Data:** `SessionRecord`
- **API:** N/A
- **Requirements:**
- **AC-1 [E][P0]: Scenario: 세션 종료 시 종료 시간/지속시간 저장**
  - Given 사용자가 `/coach`에서 `sessionId="sess_002"` 세션을 진행 중일 때
  - When 사용자가 `"세션 종료"` 버튼을 탭한다
  - Then `fitcoach.sessions.v1`의 `sess_002` 레코드에 `endedAt`이 숫자(epoch ms)로 저장된다
  - And `durationSec`가 `1` 이상 정수로 저장된다
- **AC-2 [S][P1]: Scenario: 세션 요약 로딩 상태**
  - Given 사용자가 `navigate('/session/summary', { state: { sessionId: "sess_002" } })`로 진입했을 때
  - When 로컬 세션 레코드를 조회 중일 때
  - Then `"세션 결과 불러오는 중"` 텍스트가 표시된다
- **AC-3 [W][P1]: Scenario: 요약 화면에서 sessionId 누락 처리**
  - Given 사용자가 `/session/summary`에 `location.state` 없이 직접 진입했을 때
  - When 화면이 렌더링된다
  - Then `"세션을 찾을 수 없어요"` 텍스트가 표시된다
  - And `"홈으로"` 버튼 탭 시 `/`로 이동한다
- **AC-4 [E][P0]: Scenario: 보상형 광고 시청 완료 후 리포트 화면 이동**
  - Given 사용자가 `/session/summary`에서 `sessionId="sess_002"`를 보고 있을 때
  - When 사용자가 `TossRewardAd`로 감싼 `"AI 리포트 보기"` 버튼을 탭하고 광고 시청을 완료한다
  - Then `navigate('/report', { state: { sessionId: "sess_002" } })`가 호출된다
- **AC-5 [W][P1]: Scenario: 보상형 광고 실패 시 리포트 이동 차단**
  - Given 사용자가 `/session/summary`에서 `"AI 리포트 보기"`를 탭했을 때
  - When 보상형 광고가 로드 실패하거나 사용자가 시청을 중단한다
  - Then `/report`로의 네비게이션이 발생하지 않는다
  - And 토스트 `"광고를 완료하면 리포트를 볼 수 있어요"`가 2초간 표시된다
- **AC-6 [U][P0]: Scenario: AI 결과물 라벨 표시**
  - Given AI 리포트 결과가 `/report` 화면에 표시될 때
  - When 화면이 렌더링된다
  - Then `data-testid="ai-generated-badge"` 요소에 `"AI가 생성한 결과입니다"` 텍스트가 표시된다
- **AC-7 [S][P1]: Scenario: 리포트 화면 레이아웃 계약(카드 개수)**
  - Given 사용자가 `/report`에 `sessionId="sess_002"`로 진입했을 때
  - When 리포트 생성이 완료되어 화면이 렌더링된다
  - Then `data-testid="report-card"`를 가진 `Card`가 **최소 2개** 존재한다

---

### F5. 기록(히스토리) 리스트 + 더 보기 페이지네이션
- **Description:** 사용자의 세션 기록을 `/history`에서 리스트로 제공하고, 항목 탭 시 해당 세션의 요약 화면으로 이동한다. 기록이 많아져도 렌더링 비용이 폭증하지 않도록 초기 20개만 렌더링하고 “더 보기”로 점진 로딩한다.
- **Data:** `SessionRecord`
- **API:** N/A
- **Requirements:**
- **AC-1 [E][P0]: Scenario: 히스토리 항목 탭으로 요약 이동**
  - Given `fitcoach.sessions.v1`에 `sessionId="sess_100"` 레코드가 있을 때
  - When 사용자가 `/history`에서 `data-testid="history-row-sess_100"` 행을 탭한다
  - Then `navigate('/session/summary', { state: { sessionId: "sess_100" } })`가 호출된다
- **AC-2 [S][P1]: Scenario: 히스토리 빈 상태**
  - Given `fitcoach.sessions.v1.items.length=0`일 때
  - When 사용자가 `/history`에 진입한다
  - Then `"첫 운동을 시작해보세요"` 텍스트가 표시된다
  - And `"운동 보러가기"` 버튼 탭 시 `/`로 이동한다
- **AC-3 [S][P1]: Scenario: 히스토리 로딩 상태**
  - Given `/history` 진입 직후 세션 목록을 로드 중일 때
  - When 화면이 렌더링된다
  - Then `"기록 불러오는 중"` 텍스트가 표시된다
- **AC-4 [E][P1]: Scenario: 더 보기로 20개씩 추가 렌더**
  - Given `fitcoach.sessions.v1.items.length=45`이고 `/history` 초기 렌더 상태일 때
  - When 사용자가 `"더 보기"` 버튼을 1회 탭한다
  - Then 렌더링된 `ListRow` 개수가 `20`에서 `40`으로 증가한다
- **AC-5 [W][P1]: Scenario: localStorage 파싱 실패 시 초기화 제공**
  - Given `localStorage['fitcoach.sessions.v1']="not-json"`일 때
  - When 사용자가 `/history`에 진입한다
  - Then `"기록을 불러오지 못했어요"` 텍스트가 표시된다
  - And `"초기화"` 버튼 탭 시 `localStorage['fitcoach.sessions.v1']`가 삭제된다

---

### F6. 프리미엄 구매(IAP) + 기능 잠금 해제(MVP: 기간 부여)
- **Description:** 프리미엄 화면에서 혜택을 안내하고 `TossPurchase`로 결제를 진행한다. 구매 성공 시 프리미엄 만료일을 로컬에 저장하고, 프리미엄 전용 운동/리포트 확장 콘텐츠 접근을 허용한다.
- **Data:** `PremiumState`
- **API:** N/A
- **Requirements:**
- **AC-1 [E][P0]: Scenario: 구매 성공 시 프리미엄 30일 부여**
  - Given `PremiumState.isPremium=false`이고 사용자가 `/premium`에 있을 때
  - When 사용자가 `TossPurchase` 구매를 완료하여 `onPurchased` 콜백이 호출된다
  - Then `localStorage['fitcoach.premium.v1']`에 `{ isPremium: true }`가 저장된다
  - And `expiresAt`가 `Date.now() + 30*24*60*60*1000` 이상 값으로 저장된다
- **AC-2 [W][P1]: Scenario: 구매 실패 토스트**
  - Given 사용자가 `/premium`에 있을 때
  - When 결제가 실패하여 `TossPurchase` 에러 콜백이 호출된다
  - Then 토스트 `"결제에 실패했어요. 다시 시도해주세요"`가 2초간 표시된다
  - And `localStorage['fitcoach.premium.v1']` 값이 변경되지 않는다
- **AC-3 [S][P1]: Scenario: 결제 진행 중 로딩 상태**
  - Given 사용자가 `/premium`에서 결제 요청을 시작했을 때
  - When 결제 완료 전까지
  - Then `"결제 진행 중"` 텍스트가 표시된다
  - And 구매 CTA(`data-testid="premium-purchase-cta"`)가 `disabled=true` 상태다
- **AC-4 [W][P1]: Scenario: 프리미엄 만료 시 접근 차단**
  - Given `localStorage['fitcoach.premium.v1'] = { isPremium: true, expiresAt: 1700000000000 }`이고 현재 시간이 `1700000000000 + 1`일 때
  - When 사용자가 프리미엄 전용 운동을 시작하려고 `"세션 시작"`을 탭한다
  - Then 토스트 `"프리미엄이 만료되었어요"`가 표시된다
  - And `navigate('/premium', { state: { from: "home" } })`가 호출된다
- **AC-5 [W][P1]: Scenario: localStorage 파싱 실패 시 프리미엄 비활성으로 처리**
  - Given `localStorage['fitcoach.premium.v1']="not-json"`일 때
  - When 앱이 프리미엄 여부를 확인한다
  - Then 프리미엄은 `isPremium=false`로 간주된다
  - And 콘솔에 `console.error`가 출력되지 않는다

---

### F7. 광고/프로모션 보상/정책 준수 가드레일
- **Description:** 배너 광고는 콘텐츠를 가리지 않는 위치에만 배치하고, 결과/리포트처럼 가치가 높은 화면 진입은 보상형 광고로 게이트한다. 첫 세션 완료 시 프로모션 보상을 지급할 수 있으며(캠페인 유입), 정책 위반(외부 이탈/외부 로깅/색상 하드코딩 등)을 방지한다.
- **Data:** `PromotionState`
- **API:** N/A (프로모션: `grantPromotionReward`는 SDK 함수 호출)
- **Requirements:**
- **AC-1 [U][P1]: Scenario: 배너 광고가 콘텐츠를 가리지 않는 배치**
  - Given 사용자가 `/` 화면에 있을 때
  - When 화면이 렌더링된다
  - Then `<AdSlot ... />`는 운동 목록 섹션 하단에 위치한다
  - And 광고 영역이 `position: fixed`로 주요 CTA 버튼을 덮지 않는다
- **AC-2 [E][P0]: Scenario: 첫 세션 완료 프로모션 1,000원 지급**
  - Given `localStorage['fitcoach.promo.v1'] = { version: 1, firstSessionRewardGranted: false }`이고 `promotionCode="FC2026"`가 설정되어 있을 때
  - When 사용자가 `sessionId="sess_reward_1"` 세션을 종료하여 요약 화면(`/session/summary`)에 진입한다
  - Then `grantPromotionReward({ promotionCode: "FC2026", amount: 1000 })`가 1회 호출된다
  - And `fitcoach.promo.v1.firstSessionRewardGranted=true`로 저장된다
- **AC-3 [W][P1]: Scenario: 프로모션 보상 한도(5,000원) 초과 방지**
  - Given 프로모션 보상 로직에서 amount 계산 결과가 `6000`일 때
  - When 보상 지급을 시도한다
  - Then `grantPromotionReward`는 호출되지 않는다
  - And 토스트 `"프로모션 보상 금액이 올바르지 않아요"`가 표시된다
- **AC-4 [W][P1]: Scenario: 프로모션 중복 지급 방지**
  - Given `localStorage['fitcoach.promo.v1'].firstSessionRewardGranted=true`일 때
  - When 사용자가 두 번째 세션을 종료한다
  - Then `grantPromotionReward`가 호출되지 않는다
- **AC-5 [W][P0]: Scenario: 외부 도메인 이탈 금지**
  - Given 사용자가 앱을 사용 중일 때
  - When 코드 경로에서 `window.open("https://example.com")` 또는 `window.location.href="https://example.com"` 호출이 발생하려고 한다
  - Then 해당 호출은 실행되지 않는다
  - And 토스트 `"앱 밖으로 이동할 수 없어요"`가 표시된다
- **AC-6 [U][P0]: Scenario: 프로덕션 콘솔 에러 0개**
  - Given `npm run build` 산출물을 프로덕션 모드로 실행했을 때
  - When 사용자가 `/`, `/profile`, `/coach`, `/report`, `/history`, `/premium`를 각각 1회 이상 방문한다
  - Then `console.error`가 0회 호출된다
- **AC-7 [U][P1]: Scenario: Android 7+, iOS 16+ 호환 API 사용**
  - Given Android 7 WebView 또는 iOS 16 Safari 수준 환경일 때
  - When 사용자가 `/coach`에서 음성 피드백을 켠다
  - Then 음성 API 미지원이면 텍스트 피드백만 제공한다
  - And 토스트 `"이 기기에서는 음성 안내가 지원되지 않아요"`가 표시된다

---

## Assumptions

- MVP는 서버 없이 `localStorage`만 사용하며, 운동 정의(3종)와 리포트 텍스트 템플릿은 앱 번들에 포함한다.
- “실시간 자세 분석”은 웹 환경에서 가능한 범위(카메라 스트림 기반)로 제공하며, 카메라 권한 거부/미지원 시에도 앱의 나머지 기능은 사용 가능해야 한다.
- 프리미엄은 MVP에서 **구독 자동 갱신이 아닌**, 1회 구매로 **기간(30일) 부여** 방식으로 동작한다(템플릿 결제 컴포넌트 제약).
- 친구 공유/챌린지는 MVP 범위에서 외부 링크/외부 서비스 연동 없이 진행한다(예: 추후 범위).

---

## Open Questions

1. 프리미엄 전용 범위 확정 필요: “전체 운동 라이브러리/실시간 자세 교정/개인화 플랜” 중 MVP에서 어떤 항목을 잠금 처리할지?
2. 보상형 광고 게이트 위치 확정: `/session/summary`의 “AI 리포트 보기”만 게이트할지, `/report` 진입 자체를 게이트할지?
3. 프로모션 코드/지급 정책 확정: `promotionCode` 실제 값과 지급 트리거(첫 세션 종료 vs 첫 리포트 생성 완료) 중 어느 쪽이 캠페인 KPI에 적합한지?
4. 음성 피드백 문구 표준화: 피드백 코드별 고정 문구(예: `"무릎을 더 굽히세요"`) 목록을 MVP에서 몇 개까지 포함할지?