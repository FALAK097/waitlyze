import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { LaunchPlannerWidget } from "@/components/tools/widgets/launch-planner-widget";

export const metadata = buildToolMetadata("product-launch-checklist");

export default function ProductLaunchChecklistPage() {
  return (
    <ToolPageShell slug="product-launch-checklist">
      <LaunchPlannerWidget />
    </ToolPageShell>
  );
}
