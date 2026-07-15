import { Top, Paragraph, Spacing } from "@toss/tds-mobile";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { Card } from "@/components/Card";
import { TossPurchase } from "@/components/TossPurchase";
import { useAppPremium } from "@/lib/store/AppStore";
import { useAppToast } from "@/components/AppToastProvider";

export default function Premium() {
  const iapSku = import.meta.env.VITE_TOSS_IAP_SKU as string;
  const { isPremiumActive, savePurchase30d } = useAppPremium();
  const { showToast } = useAppToast();

  const handlePurchased = async () => {
    const result = await savePurchase30d();
    if (!result.ok) {
      showToast("저장에 실패했어요. 잠시 후 다시 시도해주세요");
    }
  };

  const top = <Top title={<Top.TitleParagraph>프리미엄</Top.TitleParagraph>} />;

  return (
    <ScreenScaffold top={top}>
      <Card testId="premium-benefits-card">
        <Paragraph.Text typography="t5">프리미엄 혜택</Paragraph.Text>
        <Spacing size={8} />
        <Paragraph.Text typography="st13">AI 맞춤 리포트, 프리미엄 전용 운동을 30일간 이용할 수 있어요</Paragraph.Text>
      </Card>
      <Spacing size={16} />
      {isPremiumActive ? (
        <Card testId="premium-active-card">
          <Paragraph.Text typography="t5">프리미엄 이용 중</Paragraph.Text>
        </Card>
      ) : (
        <TossPurchase
          sku={iapSku}
          processProductGrant={async () => true}
          onPurchased={handlePurchased}
        >
          프리미엄 구매하기
        </TossPurchase>
      )}
      <Spacing size={24} />
    </ScreenScaffold>
  );
}
