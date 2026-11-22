import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { ViralGrowthWidget } from "@/components/tools/widgets/viral-growth-widget";

export const metadata = buildToolMetadata("viral-coefficient-calculator");

export default function ViralCoefficientCalculatorPage() {
  return (
    <ToolPageShell slug="viral-coefficient-calculator">
      <ViralGrowthWidget />
    </ToolPageShell>
  );
}
