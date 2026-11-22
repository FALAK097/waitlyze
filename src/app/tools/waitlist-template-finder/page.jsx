import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { TemplateFinderWidget } from "@/components/tools/widgets/template-finder-widget";
import { listTemplates } from "@/lib/templates/catalog.mjs";

export const metadata = buildToolMetadata("waitlist-template-finder");

export default function WaitlistTemplateFinderPage() {
  const templates = listTemplates();
  return (
    <ToolPageShell slug="waitlist-template-finder">
      <TemplateFinderWidget templates={templates} mode="full" />
    </ToolPageShell>
  );
}
