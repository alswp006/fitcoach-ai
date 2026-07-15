import type { ReactNode } from "react";

export interface StateSectionProps {
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
}

// Stub — TDD red phase. Only satisfies types so `tsc` passes; behavior is
// intentionally incomplete until the Coder composes these with TDS Spacing/
// Paragraph.Text/Button (see src/components/StateView.tsx's EmptyState for the
// established pattern) per src/__tests__/packet-0011.test.ts.
export function EmptySection({ title, testId }: StateSectionProps) {
  return <div data-testid={testId}>{title}</div>;
}

export function ErrorSection({ title, testId }: StateSectionProps) {
  return <div data-testid={testId}>{title}</div>;
}
