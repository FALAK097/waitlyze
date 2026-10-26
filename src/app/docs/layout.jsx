import { RootProvider } from "fumadocs-ui/provider/next";

import { DocsSectionLayout } from "@/components/docs/docs-section-layout";
import { source } from "@/lib/source";

export const metadata = {
  title: "Developer docs",
  description:
    "Create waitlists, publish pages, grow referrals, send email, and connect your stack to Waitlyze.",
};

export default function Layout({ children }) {
  return (
    <RootProvider
      theme={{ enabled: false }}
      search={{
        options: { api: "/api/docs/search" },
        links: [
          ["Introduction", "/docs"],
          ["Publish a waitlist", "/docs/publishing"],
          ["API Reference", "/docs/api/reference"],
          ["Create signup", "/docs/api/create-signup"],
          ["Look up signup", "/docs/api/lookup-signup"],
          ["Award custom points", "/docs/api/award-points"],
          ["Integrations", "/docs/integrations/overview"],
          ["Slack notifications", "/docs/slack"],
          ["Discord notifications", "/docs/discord"],
          ["Embed a form", "/docs/embed"],
          ["Automations", "/docs/automations"],
          ["Webhooks", "/docs/webhooks"],
          ["Troubleshooting", "/docs/troubleshooting"],
        ],
      }}
    >
      <DocsSectionLayout tree={source.getPageTree()}>{children}</DocsSectionLayout>
    </RootProvider>
  );
}
