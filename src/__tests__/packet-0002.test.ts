import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { safeJsonParse, safeSetItem, safeGetItem } from "@/lib/storage/safeStorage";

describe("safeStorage: localStorage 안전 parse/쓰기(Quota) 유틸", () => {
  const testKey = `test-key-${Date.now()}`;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ===== AC-1: safeJsonParse =====
  describe("AC-1: safeJsonParse<T>(raw)", () => {
    it("AC-1a: should return {ok:true,value} when JSON parse succeeds", () => {
      const input = '{"name":"test","age":30}';
      const result = safeJsonParse(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ name: "test", age: 30 });
      }
    });

    it("AC-1b: should return {ok:false,error:'PARSE_ERROR'} when JSON parse fails, without throwing", () => {
      const input = "invalid json {incomplete";
      const result = safeJsonParse(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("PARSE_ERROR");
      }
    });

    it("AC-1c: should handle empty string as parse error", () => {
      const result = safeJsonParse("");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("PARSE_ERROR");
      }
    });

    it("AC-1d: should preserve type of parsed value", () => {
      const input = '{"count":5,"name":"test"}';
      const result = safeJsonParse<{ count: number; name: string }>(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(typeof result.value.count).toBe("number");
        expect(result.value.count).toBe(5);
        expect(typeof result.value.name).toBe("string");
        expect(result.value.name).toBe("test");
      }
    });

    it("AC-1e: should handle malformed JSON with special characters", () => {
      const input = '{"data": undefined}'; // undefined is not valid JSON
      const result = safeJsonParse(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("PARSE_ERROR");
      }
    });
  });

  // ===== AC-2: safeSetItem =====
  describe("AC-2: safeSetItem(key, value)", () => {
    it("AC-2a: should successfully set item in localStorage when quota available", () => {
      const value = { data: "test-value", count: 42 };
      const result = safeSetItem(testKey, JSON.stringify(value));

      expect(result.ok).toBe(true);
      const stored = localStorage.getItem(testKey);
      expect(stored).toBe(JSON.stringify(value));
    });

    it("AC-2b: should return {ok:false,error:'QUOTA_EXCEEDED'} when QuotaExceededError occurs, without rethrowing", () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const quotaError = new Error("QuotaExceededError") as Error & { code?: number };
      quotaError.name = "QuotaExceededError";
      quotaError.code = 22; // QuotaExceededError code

      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw quotaError;
      });

      const result = safeSetItem(testKey, "large-value");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("QUOTA_EXCEEDED");
      }

      // Verify the exception was not rethrown (we got here without crashing)
      expect(true).toBe(true);
    });

    it("AC-2c: should handle NS_ERROR_DOM_QUOTA_REACHED (Firefox quota error) as QUOTA_EXCEEDED", () => {
      const quotaError = new Error("NS_ERROR_DOM_QUOTA_REACHED");
      quotaError.name = "NS_ERROR_DOM_QUOTA_REACHED";

      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw quotaError;
      });

      const result = safeSetItem(testKey, "value");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("QUOTA_EXCEEDED");
      }
    });

    it("AC-2d: should handle other exceptions gracefully without rethrowing", () => {
      const customError = new Error("Some other error");

      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw customError;
      });

      // This should not throw; it should return error or success
      const result = safeSetItem(testKey, "value");

      // The function should handle the error gracefully
      // It could return {ok:false} for unknown errors or handle it silently
      expect(true).toBe(true); // Just verify no crash
    });

    it("AC-2e: should set multiple items without interference", () => {
      const result1 = safeSetItem(testKey + "-1", JSON.stringify({ id: 1 }));
      const result2 = safeSetItem(testKey + "-2", JSON.stringify({ id: 2 }));

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);

      const stored1 = localStorage.getItem(testKey + "-1");
      const stored2 = localStorage.getItem(testKey + "-2");

      expect(stored1).toBe(JSON.stringify({ id: 1 }));
      expect(stored2).toBe(JSON.stringify({ id: 2 }));
    });
  });

  // ===== AC-3: safeGetItem =====
  describe("AC-3: safeGetItem(key)", () => {
    it("AC-3a: should return string value for existing item", () => {
      const value = "test-value";
      localStorage.setItem(testKey, value);

      const result = safeGetItem(testKey);

      expect(result).toBe(value);
      expect(typeof result).toBe("string");
    });

    it("AC-3b: should return null for non-existing item", () => {
      const result = safeGetItem(testKey + "-nonexistent-" + Date.now());

      expect(result).toBeNull();
    });

    it("AC-3c: should handle exception on get and return null without crashing", () => {
      vi.spyOn(localStorage, "getItem").mockImplementation(() => {
        throw new Error("Access denied");
      });

      const result = safeGetItem(testKey);

      expect(result).toBeNull();
      // Verify app didn't crash
      expect(true).toBe(true);
    });

    it("AC-3d: should preserve value from localStorage (not parse)", () => {
      const rawValue = '{"nested":{"data":true}}';
      localStorage.setItem(testKey, rawValue);

      const result = safeGetItem(testKey);

      // Should return raw string, not parsed
      expect(result).toBe(rawValue);
      expect(typeof result).toBe("string");
    });

    it("AC-3e: should return null for empty string in localStorage", () => {
      localStorage.setItem(testKey, "");

      const result = safeGetItem(testKey);

      expect(result).toBeNull();
    });

    it("AC-3f: should handle multiple gets without side effects", () => {
      const value1 = "value-1";
      const value2 = "value-2";
      localStorage.setItem(testKey + "-a", value1);
      localStorage.setItem(testKey + "-b", value2);

      const result1 = safeGetItem(testKey + "-a");
      const result2 = safeGetItem(testKey + "-b");

      expect(result1).toBe(value1);
      expect(result2).toBe(value2);
    });
  });

  // ===== Integration: safeJsonParse + safeSetItem + safeGetItem =====
  describe("Integration: parse → set → get roundtrip", () => {
    it("should roundtrip: safeSetItem + safeGetItem + safeJsonParse", () => {
      const original = { user: "john", age: 30, active: true };
      const serialized = JSON.stringify(original);

      // Set
      const setResult = safeSetItem(testKey, serialized);
      expect(setResult.ok).toBe(true);

      // Get
      const retrieved = safeGetItem(testKey);
      expect(retrieved).toBe(serialized);

      // Parse
      const parseResult = safeJsonParse<typeof original>(retrieved!);
      expect(parseResult.ok).toBe(true);
      if (parseResult.ok) {
        expect(parseResult.value).toEqual(original);
        expect(parseResult.value.user).toBe("john");
        expect(parseResult.value.age).toBe(30);
        expect(parseResult.value.active).toBe(true);
      }
    });

    it("should handle invalid stored data gracefully: get → parse error", () => {
      const invalidJson = "{invalid json";
      localStorage.setItem(testKey, invalidJson);

      // Get
      const retrieved = safeGetItem(testKey);
      expect(retrieved).toBe(invalidJson);

      // Parse should fail gracefully
      const parseResult = safeJsonParse(retrieved!);
      expect(parseResult.ok).toBe(false);
      if (!parseResult.ok) {
        expect(parseResult.error).toBe("PARSE_ERROR");
      }
    });

    it("should not allow exception to propagate when all operations fail", () => {
      // Get non-existent
      const retrieved = safeGetItem(testKey + "-missing");
      expect(retrieved).toBeNull();

      // No exception thrown
      expect(true).toBe(true);
    });
  });

  // ===== Result type checking =====
  describe("Return type contracts", () => {
    it("safeJsonParse returns discriminated union {ok:true,value} | {ok:false,error}", () => {
      const successResult = safeJsonParse('{"x":1}');
      if (successResult.ok) {
        expect(successResult).toHaveProperty("value");
        expect(successResult).not.toHaveProperty("error");
      }

      const errorResult = safeJsonParse("bad");
      if (!errorResult.ok) {
        expect(errorResult).toHaveProperty("error");
        expect(errorResult.error).toBe("PARSE_ERROR");
      }
    });

    it("safeSetItem returns {ok:boolean} with error field when failed", () => {
      const result = safeSetItem(testKey, "value");
      expect(result).toHaveProperty("ok");
      expect(typeof result.ok).toBe("boolean");

      if (!result.ok) {
        expect(result).toHaveProperty("error");
        expect(["QUOTA_EXCEEDED", "SET_ERROR"]).toContain(result.error);
      }
    });

    it("safeGetItem returns string | null", () => {
      const result1 = safeGetItem(testKey + "-missing");
      expect(result1).toBeNull();

      localStorage.setItem(testKey, "exists");
      const result2 = safeGetItem(testKey);
      expect(typeof result2 === "string" || result2 === null).toBe(true);
    });
  });
});
