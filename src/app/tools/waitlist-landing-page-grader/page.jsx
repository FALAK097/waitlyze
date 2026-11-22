import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { PageGraderWidget } from "@/components/tools/widgets/page-grader-widget";

export const metadata = buildToolMetadata("waitlist-landing-page-grader");

export default function WaitlistLandingPageGraderPage() {
  return (
    <ToolPageShell slug="waitlist-landing-page-grader">
      <PageGraderWidget />
    </ToolPageShell>
  );
}
