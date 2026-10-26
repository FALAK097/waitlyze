import assert from "node:assert/strict";
import test from "node:test";

import { filterDocsTree, getDocsSection, getDocsSectionTree } from "./docs-sections.js";

const page = (name, url) => ({ type: "page", name, url });

const tree = {
  $id: "all-docs",
  name: "Documentation",
  children: [
    { type: "separator", name: "Get started" },
    page("Introduction", "/docs"),
    { type: "separator", name: "API reference" },
    {
      type: "folder",
      name: "API",
      index: page("Signup API", "/docs/api"),
      children: [page("API Reference", "/docs/api/reference")],
    },
    page("API keys", "/docs/api-keys"),
    { type: "separator", name: "Integrations" },
    {
      type: "folder",
      name: "Integrations",
      index: page("Integrations", "/docs/integrations/overview"),
      children: [],
    },
    page("Slack", "/docs/slack"),
    page("Discord", "/docs/discord"),
    page("Webhooks", "/docs/webhooks"),
  ],
};

function pageUrls(nodes) {
  return nodes.flatMap((node) => {
    if (node.type === "page") return [node.url];
    if (node.type !== "folder") return [];
    return [...(node.index ? [node.index.url] : []), ...pageUrls(node.children)];
  });
}

function separatorNames(nodes) {
  return nodes.flatMap((node) =>
    node.type === "separator"
      ? [
          String(node.name || "")
            .trim()
            .toLowerCase(),
        ]
      : node.type === "folder"
        ? separatorNames(node.children)
        : [],
  );
}

test("top-level documentation routes resolve to their section", () => {
  assert.equal(getDocsSection("/docs"), "documentation");
  assert.equal(getDocsSection("/docs/api/reference"), "api");
  assert.equal(getDocsSection("/docs/api"), "api");
  assert.equal(getDocsSection("/docs/integrations/overview"), "integrations");
  assert.equal(getDocsSection("/docs/slack"), "integrations");
  assert.equal(getDocsSection("/docs/changelog"), "changelog");
});

test("sidebar trees only include pages for the selected section", () => {
  const apiTree = filterDocsTree(tree, "api");
  const integrationTree = filterDocsTree(tree, "integrations");
  const documentationTree = filterDocsTree(tree, "documentation");

  assert.deepEqual(pageUrls(apiTree.children), [
    "/docs/api",
    "/docs/api/reference",
    "/docs/api-keys",
  ]);
  assert.deepEqual(pageUrls(integrationTree.children), [
    "/docs/integrations/overview",
    "/docs/slack",
    "/docs/discord",
    "/docs/webhooks",
  ]);
  assert.deepEqual(pageUrls(documentationTree.children), ["/docs"]);
  assert.equal(separatorNames(apiTree.children).includes("api reference"), false);
  assert.equal(separatorNames(integrationTree.children).includes("integrations"), false);
  assert.equal(apiTree.$id, "all-docs-api");
  assert.equal(integrationTree.$id, "all-docs-integrations");
});

test("the API sidebar keeps the signup guide visible when it is a folder index", () => {
  const treeWithoutVisibleSignup = {
    ...tree,
    children: tree.children.map((node) =>
      node.type === "folder" && node.name === "API" ? { ...node, index: undefined } : node,
    ),
  };

  assert.deepEqual(pageUrls(filterDocsTree(treeWithoutVisibleSignup, "api").children).sort(), [
    "/docs/api",
    "/docs/api-keys",
    "/docs/api/reference",
  ]);
});

test("API and integration sidebars are section-specific and have no duplicate section heading", () => {
  const apiTree = getDocsSectionTree(tree, "api");
  const integrationsTree = getDocsSectionTree(tree, "integrations");

  assert.deepEqual(pageUrls(apiTree.children), [
    "/docs/api/reference",
    "/docs/api-keys",
    "/docs/api/create-signup",
    "/docs/api/lookup-signup",
    "/docs/api/award-points",
    "/docs/custom-frontend",
  ]);
  assert.deepEqual(pageUrls(integrationsTree.children), [
    "/docs/integrations/overview",
    "/docs/resend",
    "/docs/slack",
    "/docs/discord",
    "/docs/webhooks",
    "/docs/zapier",
  ]);
  assert.deepEqual(separatorNames(apiTree.children), []);
  assert.deepEqual(separatorNames(integrationsTree.children), []);
  const endpointGroup = apiTree.children.find(
    (node) => node.type === "folder" && node.name === "Waitlist endpoints",
  );
  assert.deepEqual(pageUrls([endpointGroup]), [
    "/docs/api/create-signup",
    "/docs/api/lookup-signup",
    "/docs/api/award-points",
  ]);
  assert.deepEqual(
    integrationsTree.children
      .filter((node) => node.type === "page" && ["/docs/slack", "/docs/discord"].includes(node.url))
      .map((node) => node.url),
    ["/docs/slack", "/docs/discord"],
  );
  assert.equal(
    integrationsTree.children.some(
      (node) => node.type === "separator" && node.name === "Notifications",
    ),
    false,
  );
  assert.equal(pageUrls(integrationsTree.children).includes("/docs/notifications"), false);
});
