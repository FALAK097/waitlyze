import { createElement } from "react";

const SECTION_PATHS = {
  api: ["/docs/api", "/docs/api-keys", "/docs/custom-frontend"],
  integrations: [
    "/docs/integrations",
    "/docs/resend",
    "/docs/notifications",
    "/docs/slack",
    "/docs/discord",
    "/docs/webhooks",
    "/docs/zapier",
    "/docs/esp-sync",
  ],
};

function matchesSectionPath(pathname, paths) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function getDocsSection(pathname) {
  if (pathname === "/docs/changelog") return "changelog";
  if (matchesSectionPath(pathname, SECTION_PATHS.api)) return "api";
  if (matchesSectionPath(pathname, SECTION_PATHS.integrations)) return "integrations";
  return "documentation";
}

function pruneChildren(children, includePage, hiddenSeparatorLabels) {
  const result = [];
  let pendingSeparator;

  for (const node of children) {
    if (node.type === "separator") {
      if (
        hiddenSeparatorLabels.has(
          String(node.name || "")
            .trim()
            .toLowerCase(),
        )
      ) {
        pendingSeparator = undefined;
        continue;
      }
      pendingSeparator = node;
      continue;
    }

    let filtered = node;
    if (node.type === "page") {
      if (!includePage(node.url)) filtered = null;
    } else if (node.type === "folder") {
      const index = node.index && includePage(node.index.url) ? node.index : undefined;
      const nested = pruneChildren(node.children, includePage, hiddenSeparatorLabels);
      if (!index && nested.length === 0) {
        filtered = null;
      } else {
        filtered = { ...node, children: nested, ...(node.index ? { index } : {}) };
      }
    }

    if (filtered) {
      if (pendingSeparator) result.push(pendingSeparator);
      result.push(filtered);
    }
    pendingSeparator = undefined;
  }

  return result;
}

export function filterDocsTree(tree, section) {
  const selected = section === "api" || section === "integrations" ? section : "documentation";
  const includePage = (url) => {
    const belongsToApi = matchesSectionPath(url, SECTION_PATHS.api);
    const belongsToIntegrations = matchesSectionPath(url, SECTION_PATHS.integrations);
    if (selected === "api") return belongsToApi;
    if (selected === "integrations") return belongsToIntegrations;
    return !belongsToApi && !belongsToIntegrations;
  };
  const hiddenSeparatorLabels = new Set(
    selected === "api" ? ["api reference"] : selected === "integrations" ? ["integrations"] : [],
  );

  const children = pruneChildren(tree.children, includePage, hiddenSeparatorLabels);
  if (selected === "api" && !containsPage(children, "/docs/api")) {
    const referenceIndex = children.findIndex(
      (node) => node.type === "page" && node.url === "/docs/api/reference",
    );
    children.splice(referenceIndex + 1, 0, {
      type: "page",
      name: "Signup API",
      url: "/docs/api",
    });
  }

  return {
    ...tree,
    $id: `${tree.$id || "docs"}-${selected}`,
    children,
  };
}

function sectionPage(name, url, icon) {
  return { type: "page", name, url, ...(icon ? { icon } : {}) };
}

function apiEndpointPage(name, method, url) {
  const methodClass =
    method === "GET"
      ? "docs-http-method docs-http-method--get"
      : "docs-http-method docs-http-method--post";

  return sectionPage(
    createElement("span", { className: "inline-flex min-w-0 items-center gap-2" }, [
      createElement("span", { key: "name", className: "min-w-0" }, name),
      createElement("span", { key: "method", className: methodClass }, method),
    ]),
    url,
  );
}

function integrationLogo(file) {
  return createElement("img", {
    src: `/integrations/${file}`,
    alt: "",
    width: 16,
    height: 16,
    style: { width: 16, height: 16, objectFit: "contain", flexShrink: 0 },
  });
}

export function getDocsSectionTree(tree, section) {
  if (section === "api") {
    return {
      type: "root",
      $id: "waitlyze-api-docs",
      name: "API Reference",
      children: [
        sectionPage("API Reference", "/docs/api/reference"),
        sectionPage("API keys", "/docs/api-keys"),
        {
          type: "folder",
          name: "Waitlist endpoints",
          defaultOpen: true,
          children: [
            apiEndpointPage("Create signup", "POST", "/docs/api/create-signup"),
            apiEndpointPage("Look up signup", "GET", "/docs/api/lookup-signup"),
            apiEndpointPage("Award custom points", "POST", "/docs/api/award-points"),
          ],
        },
        sectionPage("Custom frontend guide", "/docs/custom-frontend"),
      ],
    };
  }

  if (section === "integrations") {
    return {
      type: "root",
      $id: "waitlyze-integration-docs",
      name: "Integrations",
      children: [
        sectionPage("Integrations", "/docs/integrations/overview"),
        sectionPage("Resend", "/docs/resend", integrationLogo("resend.svg")),
        sectionPage("Slack", "/docs/slack", integrationLogo("slack.svg")),
        sectionPage("Discord", "/docs/discord", integrationLogo("discord.svg")),
        sectionPage("Webhooks", "/docs/webhooks", integrationLogo("webhooks.svg")),
        sectionPage("Zapier", "/docs/zapier", integrationLogo("zapier.webp")),
      ],
    };
  }

  return filterDocsTree(tree, "documentation");
}

function containsPage(nodes, url) {
  return nodes.some((node) => {
    if (node.type === "page") return node.url === url;
    if (node.type !== "folder") return false;
    return node.index?.url === url || containsPage(node.children, url);
  });
}
