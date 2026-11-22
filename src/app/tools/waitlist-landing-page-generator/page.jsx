import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { CopyBuilderWidget } from "@/components/tools/widgets/copy-builder-widget";

export const metadata = buildToolMetadata("waitlist-landing-page-generator");

export default function WaitlistLandingPageGeneratorPage() {
  return (
    <ToolPageShell slug="waitlist-landing-page-generator">
      <CopyBuilderWidget />
    </ToolPageShell>
  );
}
