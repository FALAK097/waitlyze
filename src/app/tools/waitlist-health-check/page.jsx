import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { HealthAuditorWidget } from "@/components/tools/widgets/health-auditor-widget";

export const metadata = buildToolMetadata("waitlist-health-check");

export default function WaitlistHealthCheckPage() {
  return (
    <ToolPageShell slug="waitlist-health-check">
      <HealthAuditorWidget />
    </ToolPageShell>
  );
}
