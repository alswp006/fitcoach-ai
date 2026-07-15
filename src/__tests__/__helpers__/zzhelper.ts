import { vi } from "vitest";

export function zzMockTds() {
  vi.mock("@toss/tds-mobile", () => ({ Foo: () => null }));
}
