import type { ReactNode } from "react";
import { Button, Paragraph, Spacing } from "@toss/tds-mobile";

export interface StateSectionProps {
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
}

function Section({
  title,
  description,
  actionLabel,
  onAction,
  testId,
  actionVariant,
}: StateSectionProps & { actionVariant: "weak" | "fill" }) {
  return (
    <div
      data-testid={testId}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "48px 24px",
      }}
    >
      <Paragraph.Text typography="t4">{title}</Paragraph.Text>
      {description ? (
        <>
          <Spacing size={4} />
          <Paragraph.Text typography="t6">{description}</Paragraph.Text>
        </>
      ) : null}
      {actionLabel ? (
        <>
          <Spacing size={20} />
          <Button variant={actionVariant} display="block" onClick={onAction}>
            {actionLabel}
          </Button>
        </>
      ) : null}
    </div>
  );
}

/**
 * 빈 상태 섹션 — 제목 + 설명 + 보조(weak) CTA. TDS Spacing으로 간격 생성(margin/padding 금지).
 *
 * Pre-built (재구현 금지): 목록/결과가 비었을 때 사용. StateView.EmptyState와 달리 아이콘 슬롯 없이
 * 텍스트+액션만 필요한 인라인 섹션에 적합.
 */
export function EmptySection(props: StateSectionProps) {
  return <Section {...props} actionVariant="weak" />;
}

/**
 * 에러 상태 섹션 — 제목 + 설명 + 재시도(fill) CTA. TDS Spacing으로 간격 생성(margin/padding 금지).
 *
 * Pre-built (재구현 금지): fetch/비동기 작업 실패 시 사용.
 */
export function ErrorSection(props: StateSectionProps) {
  return <Section {...props} actionVariant="fill" />;
}
