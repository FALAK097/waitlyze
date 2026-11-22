import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { IntakeFormDesignerWidget } from "@/components/tools/widgets/intake-form-designer-widget";

export const metadata = buildToolMetadata("beta-application-questions");

export default function BetaApplicationQuestionsPage() {
  return (
    <ToolPageShell slug="beta-application-questions">
      <IntakeFormDesignerWidget />
    </ToolPageShell>
  );
}
