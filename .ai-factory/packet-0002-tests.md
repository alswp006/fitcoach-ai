# Packet 0002 Test Summary — safeStorage

## Test File
`src/__tests__/packet-0002.test.ts` — 14 focused tests covering all 3 ACs + integration roundtrip

## What Tests Expect

### AC-1: safeJsonParse<T>(raw) — 5 tests
- **AC-1a**: Valid JSON → `{ok:true,value:T}`
- **AC-1b**: Invalid JSON → `{ok:false,error:'PARSE_ERROR'}` (no throw)
- **AC-1c**: Empty string → `{ok:false,error:'PARSE_ERROR'}`
- **AC-1d**: Type preservation: `{count:number,name:string}` parsed correctly
- **AC-1e**: Malformed JSON (e.g., `undefined`) → `{ok:false,error:'PARSE_ERROR'}`

**Import**: `import { safeJsonParse } from "@/lib/storage/safeStorage";`

**Signature**:
```typescript
function safeJsonParse<T = unknown>(raw: string): 
  | { ok: true; value: T }
  | { ok: false; error: "PARSE_ERROR" };
```

### AC-2: safeSetItem(key, value) — 5 tests
- **AC-2a**: Success case → `{ok:true}`
- **AC-2b**: QuotaExceededError → `{ok:false,error:'QUOTA_EXCEEDED'}` (no rethrow)
- **AC-2c**: NS_ERROR_DOM_QUOTA_REACHED (Firefox) → same as AC-2b
- **AC-2d**: Other exceptions → handle gracefully (no crash)
- **AC-2e**: Multiple sets work without interference

**Import**: `import { safeSetItem } from "@/lib/storage/safeStorage";`

**Signature**:
```typescript
function safeSetItem(key: string, value: string): 
  | { ok: true }
  | { ok: false; error: "QUOTA_EXCEEDED" | string };
```

**Key requirement**: Must detect `QuotaExceededError` by checking error.name or error.code (22), and also `NS_ERROR_DOM_QUOTA_REACHED` for Firefox. No exception should propagate.

### AC-3: safeGetItem(key) — 3 tests + 3 integration
- **AC-3a**: Existing item → return string value
- **AC-3b**: Non-existing → return `null`
- **AC-3c**: Exception on get → return `null` (no crash)
- **AC-3d**: Preserve raw value (not parsed)
- **AC-3e**: Empty string in storage → return `null`
- **AC-3f**: Multiple gets work independently

**Import**: `import { safeGetItem } from "@/lib/storage/safeStorage";`

**Signature**:
```typescript
function safeGetItem(key: string): string | null;
```

## Integration Tests (3 tests)
- Roundtrip: safeSetItem → safeGetItem → safeJsonParse
- Graceful degradation: get non-existent → parse error
- Exception containment: no exception escapes

## Test Quality
- ✅ Every AC has 2+ tests (AC-1: 5, AC-2: 5, AC-3: 3+3 integration = 14 total)
- ✅ Concrete values: `{count:5}`, `"PARSE_ERROR"`, etc.
- ✅ Both happy path and error cases
- ✅ Return type contracts validated
- ✅ No console.error or uncaught exceptions

## Implementation Checklist
- [ ] Create `src/lib/storage/safeStorage.ts`
- [ ] Export `safeJsonParse<T>(raw: string)`
- [ ] Export `safeSetItem(key: string, value: string)`
- [ ] Export `safeGetItem(key: string)`
- [ ] All 14 tests pass: `npx vitest run src/__tests__/packet-0002.test.ts`
- [ ] No TypeScript errors: `npx tsc --noEmit`

## Notes
- Tests use localStorage directly (jsdom available in vitest setup)
- QuotaExceededError detection must handle both `error.name === "QuotaExceededError"` and code 22, plus Firefox's `NS_ERROR_DOM_QUOTA_REACHED`
- No side effects: `beforeEach/afterEach` clear storage + mocks
