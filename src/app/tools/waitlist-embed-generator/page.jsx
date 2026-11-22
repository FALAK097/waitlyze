import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { EmbedConfiguratorWidget } from "@/components/tools/widgets/embed-configurator-widget";

export const metadata = buildToolMetadata("waitlist-embed-generator");

export default function WaitlistEmbedGeneratorPage() {
  return (
    <ToolPageShell slug="waitlist-embed-generator">
      <EmbedConfiguratorWidget />
    </ToolPageShell>
  );
}
