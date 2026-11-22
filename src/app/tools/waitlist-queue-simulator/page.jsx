import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { QueueSimulatorWidget } from "@/components/tools/widgets/queue-simulator-widget";

export const metadata = buildToolMetadata("waitlist-queue-simulator");

export default function WaitlistQueueSimulatorPage() {
  return (
    <ToolPageShell slug="waitlist-queue-simulator">
      <QueueSimulatorWidget />
    </ToolPageShell>
  );
}
