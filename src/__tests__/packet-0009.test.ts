import { describe, it, expect } from "vitest";
import {
  generateLocalPlanSummary,
  generateLocalFeedback,
  generateLocalReport,
} from "@/lib/ai/localGenerators";

describe("로컬 더미 생성 로직(플랜/피드백/리포트 템플릿)", () => {
  describe("AC-1: 동기 함수 + 입력 비어도 예외 없음", () => {
    it("generateLocalPlanSummary는 동기 함수이고 빈 입력에도 예외를 throw하지 않음", () => {
      const result = generateLocalPlanSummary("");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("generateLocalPlanSummary는 null 입력에도 예외를 throw하지 않음", () => {
      const result = generateLocalPlanSummary(null as any);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("generateLocalFeedback는 동기 함수이고 빈 입력에도 예외를 throw하지 않음", () => {
      const result = generateLocalFeedback("");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("generateLocalFeedback는 undefined 입력에도 예외를 throw하지 않음", () => {
      const result = generateLocalFeedback(undefined as any);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("generateLocalReport는 동기 함수이고 빈 입력에도 예외를 throw하지 않음", () => {
      const result = generateLocalReport({});
      expect(typeof result).toBe("object");
      expect(result).not.toBeNull();
    });
  });

  describe("AC-2: generateLocalReport 반환값에 UI 라벨 필드 포함", () => {
    it("generateLocalReport 반환값에 aiGenerated 필드가 true로 설정되어 있음", () => {
      const result = generateLocalReport({});
      expect(result).toHaveProperty("aiGenerated");
      expect(result.aiGenerated).toBe(true);
    });

    it("generateLocalReport 반환값에 리포트 텍스트(summary/content)가 포함되어 있음", () => {
      const result = generateLocalReport({});
      const hasContent =
        result.summary ||
        result.content ||
        result.text ||
        result.report;
      expect(hasContent).toBeTruthy();
    });

    it("generateLocalReport 반환값에 타입 필드가 있어 report임을 명시", () => {
      const result = generateLocalReport({});
      expect(result).toHaveProperty("type");
      expect(result.type).toBe("local");
    });
  });

  describe("AC-3: 결과 텍스트에 외부 앱 설치 유도 문구 없음", () => {
    it("generateLocalPlanSummary 결과에 '다운로드' 문구가 없음", () => {
      const result = generateLocalPlanSummary("기본 플랜");
      expect(result).not.toMatch(/다운로드/);
    });

    it("generateLocalFeedback 결과에 '설치' 문구가 없음", () => {
      const result = generateLocalFeedback("피드백 요청");
      expect(result).not.toMatch(/설치/);
    });

    it("generateLocalReport 결과 텍스트에 '앱인토스 앱' 설치 유도가 없음", () => {
      const result = generateLocalReport({});
      const textContent = result.summary || result.content || result.text || "";
      expect(textContent).not.toMatch(/앱인토스.*설치|앱인토스.*다운로드/);
    });

    it("generateLocalReport 결과 텍스트에 외부 도메인 링크가 없음", () => {
      const result = generateLocalReport({});
      const textContent = result.summary || result.content || result.text || "";
      expect(textContent).not.toMatch(/https?:\/\/|www\./);
    });
  });

  describe("통합 테스트: 함수들이 유효한 한국어 텍스트 생성", () => {
    it("generateLocalPlanSummary는 한국어 텍스트를 반환함", () => {
      const result = generateLocalPlanSummary("월급 5천만원");
      expect(result.length).toBeGreaterThan(0);
      // 한글 문자 포함 확인
      expect(result).toMatch(/[가-힯]/);
    });

    it("generateLocalFeedback는 한국어 텍스트를 반환함", () => {
      const result = generateLocalFeedback("더 나은 결과를 원함");
      expect(result.length).toBeGreaterThan(0);
      // 한글 문자 포함 확인
      expect(result).toMatch(/[가-힯]/);
    });

    it("generateLocalReport는 한국어 텍스트를 반함", () => {
      const result = generateLocalReport({ input: "테스트" });
      const textContent = result.summary || result.content || result.text || "";
      expect(textContent.length).toBeGreaterThan(0);
      // 한글 문자 포함 확인
      expect(textContent).toMatch(/[가-힯]/);
    });
  });

  describe("엣지 케이스: 다양한 입력값 처리", () => {
    it("generateLocalPlanSummary는 긴 입력값도 처리함", () => {
      const longInput = "x".repeat(1000);
      const result = generateLocalPlanSummary(longInput);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("generateLocalReport는 깊은 객체 입력도 처리함", () => {
      const complexInput = {
        input: { salary: 50000000, hours: 40, days: 365 },
        metadata: { timestamp: Date.now() },
      };
      const result = generateLocalReport(complexInput);
      expect(result).toHaveProperty("aiGenerated");
      expect(result.aiGenerated).toBe(true);
    });

    it("generateLocalFeedback는 특수 문자 입력도 처리함", () => {
      const specialInput = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const result = generateLocalFeedback(specialInput);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
