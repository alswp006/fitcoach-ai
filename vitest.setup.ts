/**
 * Vitest setup — runs before each test file.
 *
 * Handles:
 *  - localStorage isolation between tests (prevents cross-test pollution)
 *  - requestAnimationFrame shim for jsdom (needed for animate/countup utilities)
 *  - sessionStorage isolation
 *  - console.error filtering (React Router warnings etc.)
 */

import { beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// ── Spy-friendly Storage polyfill ──
// jsdom's native Storage is a legacy-platform-object Proxy: defining an own property
// named "setItem"/"getItem" on an instance (which is exactly what vi.spyOn(localStorage, "setItem")
// does) doesn't shadow the method — the Proxy's defineProperty trap treats any property name
// jsdom doesn't already own as a *storage key* and silently stores the stringified value under
// it instead. That makes per-method spying on localStorage/sessionStorage a silent no-op.
//
// Fix: back the data with a WeakMap keyed by `this` and install the methods on the REAL
// Storage.prototype (native Storage can't be `new`'d or subclassed in jsdom — "Illegal
// constructor" — but `Object.create(Storage.prototype)` sidesteps the constructor entirely).
// This makes both `vi.spyOn(localStorage, "setItem")` (own-property spy, shadows the
// prototype) and `vi.spyOn(Storage.prototype, "setItem")` (shared-prototype spy) work,
// since our instances are genuine `instanceof Storage` plain objects, not Proxies.
const storageBackingMaps = new WeakMap<object, Map<string, string>>();

function getBackingMap(instance: object): Map<string, string> {
  let map = storageBackingMaps.get(instance);
  if (!map) {
    map = new Map();
    storageBackingMaps.set(instance, map);
  }
  return map;
}

Object.defineProperty(Storage.prototype, "length", {
  configurable: true,
  get(this: object) {
    return getBackingMap(this).size;
  },
});
Storage.prototype.getItem = function (this: object, key: string) {
  const map = getBackingMap(this);
  return map.has(key) ? map.get(key)! : null;
};
Storage.prototype.setItem = function (this: object, key: string, value: string) {
  getBackingMap(this).set(key, String(value));
};
Storage.prototype.removeItem = function (this: object, key: string) {
  getBackingMap(this).delete(key);
};
Storage.prototype.clear = function (this: object) {
  getBackingMap(this).clear();
};
Storage.prototype.key = function (this: object, index: number) {
  return Array.from(getBackingMap(this).keys())[index] ?? null;
};

function createMemoryStorage(): Storage {
  return Object.create(Storage.prototype) as Storage;
}

Object.defineProperty(globalThis, "localStorage", { value: createMemoryStorage(), configurable: true, writable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: createMemoryStorage(), configurable: true, writable: true });

// ── localStorage / sessionStorage isolation ──
// jsdom's storage persists between tests by default. Clear it to prevent pollution.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// ── requestAnimationFrame shim for jsdom ──
// jsdom does NOT implement rAF natively, so animate/countup code hangs forever.
// Shim that immediately invokes callback with a monotonic timestamp.
if (typeof globalThis.requestAnimationFrame !== "function") {
  let now = 0;
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    now += 16;
    return setTimeout(() => cb(now), 0) as unknown as number;
  }) as typeof globalThis.requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof globalThis.cancelAnimationFrame;
}

// ── afterEach reset ──
afterEach(() => {
  vi.restoreAllMocks(); // clears call history AND restores spyOn-ed implementations
  vi.useRealTimers(); // in case a test used fake timers
});
