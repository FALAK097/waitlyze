import { loader, llms } from "fumadocs-core/source";
import { createElement } from "react";

import { docs } from "../../.source/server";
import { docsRoute } from "./docs-shared";

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  icon: (icon) => {
    if (icon === "resend") {
      return createElement("img", {
        src: "/integrations/resend.svg",
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
