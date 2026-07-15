# PACKET-0001: 전 엔티티/API/RouteState 타입 정의 — TEST GUIDE

## Overview

**Test File:** `src/__tests__/packet-0001.test.ts`

This is a **TDD-first** packet. The tests are written BEFORE implementation and will guide you to write `src/lib/types.ts` with all required type definitions.

Current status: **49 tests written, TypeScript compilation shows 32 type errors** (expected — tests guide implementation).

---

## Test Structure (49 Tests Total)

### AC-1: Export All Required Types (25 tests)
Each test verifies that a type/interface is exported from `@/lib/types`:
- `FitnessGoal`
- `FitnessLevel`
- `UserProfile`
- `AiDisclosureState`
- `PremiumState`
- `WorkoutId`
- `WorkoutDefinition`
- `PoseFeedbackEvent`
- `SessionRecord`
- `PromotionState`
- `SessionId`
- `Session`
- `WorkoutSession`
- `Report`
- `ReportId`
- `PageRequest`
- `PageResult<T>`
- `CreateSessionRequest`
- `CreateSessionResponse`
- `SubmitFeedbackRequest`
- `SubmitFeedbackResponse`
- `GenerateReportRequest`
- `GenerateReportResponse`
- `ApiError`
- `RouteState`

### AC-2: RouteState Navigation Contracts (7 tests)
Verify RouteState supports all navigation paths from SPEC:
- `/profile` → optional `from: 'home' | 'premium'`
- `/workouts/:workoutId` → optional `workoutId: string`
- `/coach` → `workoutId: string, sessionId: string`
- `/session/summary` → `sessionId: string`
- `/report` → `sessionId: string`
- `/` (home) → optional `toast: 'saved' | 'premium'`
- `/premium` → optional `from: 'home' | 'report'`

### AC-3: Type Definitions Match SPEC Data Models (16 tests)
Verify each type has:
- Correct fields (no missing, no extra)
- Correct field types
- Correct constraints (version: 1, id: 'me', etc.)
- Correct union value sets (e.g., FitnessGoal exactly = '체중감량' | '근력증가' | '자세교정')

### AC-4: No Runtime Const/Enum Exports (1 test)
Verify only types are exported (no `export const`, no `export enum`).

### Integration: RouteState Discriminated Union (1 test)
Full roundtrip: all navigation paths with valid state objects.

---

## How to Implement src/lib/types.ts

### Step 1: Copy Type Definitions from SPEC

From `.ai-factory/spec.md` (Data Models section, line 418+), add these types in this order:

1. **Union Types (Enums as literal types)**
   ```typescript
   export type FitnessGoal = '체중감량' | '근력증가' | '자세교정';
   export type FitnessLevel = '초급' | '중급' | '상급';
   export type WorkoutId = 'squat' | 'pushup' | 'plank';
   export type SessionId = string;
   export type ReportId = string;
   ```

2. **Core Domain Interfaces** (exactly as in SPEC)
   - `UserProfile` (v1, id='me', fields: heightCm, weightKg, goal, level, voiceFeedbackEnabled, timestamps)
   - `AiDisclosureState` (v1, id='me', acknowledged, acknowledgedAt?, timestamps)
   - `PremiumState` (v1, id='me', isPremium, expiresAt?, lastPurchaseAt?, timestamps)
   - `WorkoutDefinition` (id: WorkoutId, title, description, targetMinutes, premiumOnly)
   - `PoseFeedbackEvent` (t, code, messageKo, severity)
   - `SessionRecord` (v1, sessionId, id=sessionId, workoutId, startedAt, endedAt?, durationSec?, feedbackCount, feedbackEventsSample, score?, timestamps)
   - `PromotionState` (v1, id='me', firstSessionRewardGranted, grantedAt?, timestamps)

3. **Entity Schemas**
   - `Session` (v1, id, workoutId, startedAt, endedAt?, durationSec?, feedbackCount, feedbackEventsSample, score?, timestamps)
   - `WorkoutSession` (v1, id, workoutId, status: 'READY'|'RUNNING'|'ENDED', lastFeedback?, timestamps)
   - `Report` (v1, id, sessionId, generatedBy: 'AI', language: 'ko-KR', score, summaryKo, improvementsKo[], recommendationsKo[], timestamps)

4. **Pagination Types**
   ```typescript
   export interface PageRequest {
     page: number;  // 1-based
     pageSize: number;
   }

   export interface PageResult<T> {
     items: T[];
     total: number;
     page: number;
     pageSize: number;
     hasNext: boolean;
   }
   ```

5. **API Request/Response Types** (from SPEC External API section)
   - `CreateSessionRequest`
   - `CreateSessionResponse`
   - `SubmitFeedbackRequest`
   - `SubmitFeedbackResponse`
   - `GenerateReportRequest`
   - `GenerateReportResponse`
   - `ApiError` (error.code: one of 'BAD_REQUEST'|'UNAUTHORIZED'|'NOT_FOUND'|'RATE_LIMITED'|'INTERNAL', error.message)

6. **RouteState Union** (complex, see below)

---

## RouteState Implementation Guide

RouteState should be a **discriminated union** supporting all navigation paths:

```typescript
export type RouteState = 
  | { workoutId?: string }  // /profile, /, /history (any path with optional workoutId)
  | { sessionId?: string }  // /coach, /session/summary, /report (sessionId-based paths)
  | { from?: 'home' | 'premium' | 'report' }  // /profile, /premium
  | { toast?: 'saved' | 'premium' }  // / (home after save/premium)
  | { workoutId: string; sessionId: string }  // /coach (required both)
  | {};  // Fallback for any path without state
```

**Or simpler (flat union):**
```typescript
export type RouteState = {
  workoutId?: string;
  sessionId?: string;
  from?: 'home' | 'premium' | 'report';
  toast?: 'saved' | 'premium';
};
```

The tests use the simpler flat union approach, so use that.

---

## Key Constraints from SPEC

1. **version: 1** — All domain entities have `version: 1` for schema versioning
2. **Singleton entities (id: 'me')** — UserProfile, AiDisclosureState, PremiumState, PromotionState
3. **Timestamps** — All entities have `createdAt`, `updatedAt` (epoch ms)
4. **SessionRecord.id === SessionRecord.sessionId** — Must match for referential integrity
5. **PoseFeedbackEvent.severity** — Exactly 1|2|3 (not 0 or 4+)
6. **PoseFeedbackEvent.code** — One of: 'KNEE_MORE_BEND', 'BACK_STRAIGHT', 'ELBOWS_IN' (add more as needed)
7. **WorkoutSession status** — Exactly 'READY'|'RUNNING'|'ENDED'
8. **Report.generatedBy** — Always 'AI' (literal)
9. **Report.language** — Always 'ko-KR' (literal)

---

## Testing During Implementation

After you implement types, run:

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Run tests
npx vitest run src/__tests__/packet-0001.test.ts

# If all pass, run pre-submission checklist
npx vitest run
npx tsc --noEmit
npx vite build
```

All tests should pass ✓, and `npx tsc --noEmit` should have 0 errors.

---

## Notes for the Coder

- **No implementation code** — types.ts should contain ONLY type/interface definitions, no `export const`, no `export enum`.
- **Exact SPEC match** — Field names, types, constraints must match SPEC exactly. Typos = test fail.
- **RouteState flexibility** — Use flat union (all optional fields) for simplicity, or discriminated if you prefer strict typing.
- **Comments** — Optionally add JSDoc comments to complex types (e.g., SessionRecord relationship rules).
- **Imports** — No external imports needed; all types are TypeScript built-ins or app-defined.

---

## Files Involved

- **Test file:** `src/__tests__/packet-0001.test.ts` ✓ (created)
- **Implementation:** `src/lib/types.ts` (empty, ready for implementation)
- **SPEC reference:** `.ai-factory/spec.md` (lines 418-907)
