# Sprint Contract: App.tsx 라우팅 + Provider 래핑 + 외부 이동 가드 + 리워드 게이트

## 만들 항목
1. **src/lib/navigation/externalNavigationGuard.ts** — `window.open()`, `location.href` 등 외부 도메인 이동을 차단하는 가드 (try/catch로 SDK throw 처리)
2. **src/App.tsx** — react-router-dom 라우팅 (S1~S8 경로 연결), AppStoreProvider/AppToastProvider 래핑, /report 진입을 TossRewardAd 게이트로 감싸기

## 사용할 TypeScript 타입
- `types.ts`에서 import: `FitnessGoal`, `FitnessLevel`, `WorkoutId`, `SessionId`, `ReportId`, `UserProfile`, `AiDisclosureState`

## 검증 방법
1. `npx vitest run` — 모든 테스트 통과
2. 라우팅: `/` `/profile` `/session/[id]` `/report/[id]` 등 모든 경로 작동 확인
3. Provider 래핑 확인: localStorage/toast 기능 정상
4. 외부 이동 차단: window.open/location.href throw → 조용히 degrade
5. 리워드 게이트: /report 진입 시 TossRewardAd 로드/시청 후 콘텐츠 노출
6. `pnpm typecheck` — 0 errors
7. `npx next build` — 빌드 성공

## 절대 하면 안 되는 것
- ❌ src/main.tsx 수정 금지 — entry point는 보존
- ❌ 기존 Provider (Toaster, Router 등) 제거 금지
- ❌ TossRewardAd 콜백 내 try/catch 제거 금지 — SDK throw 가드 필수
- ❌ 외부 도메인 화이트리스트 추가 금지 — 모든 외부 이동 차단
