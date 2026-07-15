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
    storage.ts
    types.ts
    utils.ts
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
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
- types.ts: export type FitnessGoal = '체중감량' | '근력증가' | '자세교정'; export type FitnessLevel = '초급' | '중급' | '상급'; export type WorkoutId = 'squat' | 'pushup' | 'plank'; export type SessionId = string; export type ReportId = string; export interface UserProfile; export interface AiDisclosureState; export interface PremiumState
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string

### Components (src/components/)
- AdSlot.tsx: AdSlot
- Amount.tsx: Amount
- BottomCTA.tsx: SubmitFooter, ButtonStack
- Card.tsx: Card
- CountUp.tsx: CountUp
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- PageShell.tsx: PageShell
- ScreenScaffold.tsx: ScreenScaffold
- Sparkline.tsx: Sparkline
- StateView.tsx: EmptyState, LoadingState
- SummaryHero.tsx: SummaryHero
- TossPurchase.tsx: TossPurchase
- TossRewardAd.tsx: TossRewardAd
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0001: 전 엔티티/API/RouteState 타입 정의(types.ts) (files: src/lib/types.ts)