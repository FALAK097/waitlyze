import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { RewardDesignerWidget } from "@/components/tools/widgets/reward-designer-widget";

export const metadata = buildToolMetadata("referral-reward-calculator");

export default function ReferralRewardCalculatorPage() {
  return (
    <ToolPageShell slug="referral-reward-calculator">
      <RewardDesignerWidget />
    </ToolPageShell>
  );
}
