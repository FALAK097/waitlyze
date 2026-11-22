import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { DnsDeliverabilityWidget } from "@/components/tools/widgets/dns-deliverability-widget";

export const metadata = buildToolMetadata("email-deliverability-checker");

export default function EmailDeliverabilityCheckerPage() {
  return (
    <ToolPageShell slug="email-deliverability-checker">
      <DnsDeliverabilityWidget />
    </ToolPageShell>
  );
}
