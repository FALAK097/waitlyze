import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { UtmBuilderWidget } from "@/components/tools/widgets/utm-builder-widget";

export const metadata = buildToolMetadata("waitlist-utm-builder");

export default function WaitlistUtmBuilderPage() {
  return (
    <ToolPageShell slug="waitlist-utm-builder">
      <UtmBuilderWidget />
    </ToolPageShell>
  );
}
