import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { EmailSequenceWidget } from "@/components/tools/widgets/email-sequence-widget";

export const metadata = buildToolMetadata("waitlist-email-generator");

export default function WaitlistEmailGeneratorPage() {
  return (
    <ToolPageShell slug="waitlist-email-generator">
      <EmailSequenceWidget />
    </ToolPageShell>
  );
}
