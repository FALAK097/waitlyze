import { loader, llms } from "fumadocs-core/source";
import { createElement } from "react";

import { docs } from "../../.source/server";
import { docsRoute } from "./docs-shared";

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  icon: (icon) => {
    const src = {
      resend: "/integrations/resend.svg",
      slack: "/integrations/slack.svg",
      discord: "/integrations/discord.svg",
      webhooks: "/integrations/webhooks.svg",
      zapier: "/integrations/zapier.webp",
    }[icon];
    if (src) {
      return createElement("img", {
        src,
        alt: "",
        width: 16,
        height: 16,
        style: { width: 16, height: 16, flexShrink: 0 },
      });
    }
  },
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText("processed")}`,
});
