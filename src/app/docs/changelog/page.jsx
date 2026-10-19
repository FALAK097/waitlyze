import { readFile } from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";

export const metadata = {
  title: "Changelog | Waitlyze Docs",
  description: "Waitlyze release notes from v0.1.0 through v0.9.0, with future updates managed by Tegami.",
};

function releaseId(title) {
  return `release-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function textContent(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  return "";
}

export default async function ChangelogPage() {
  const changelog = await readFile(path.join(process.cwd(), "CHANGELOG.md"), "utf8");
  const releases = [...changelog.matchAll(/^##\s+(v\d+\.\d+\.\d+)\s*$/gm)].map(([, version]) => version);
  const toc = releases.map((version) => ({ title: version, url: `#${releaseId(version)}`, depth: 2 }));

  return (
    <DocsPage toc={toc} full>
      <DocsTitle>What’s new in Waitlyze</DocsTitle>
      <DocsDescription>Follow new capabilities, improvements, and fixes across the platform.</DocsDescription>
      <DocsBody>
        <p className="waitlyze-changelog-intro">The v0.1.0–v0.9.0 entries are a retrospective of shipped work. New changes go in <code>.tegami/</code>; Tegami updates the version and this archive, then opens a Version Packages pull request. Waitlyze is a private app, so it is versioned without publishing an npm package.</p>
        <details className="waitlyze-tegami-guidance">
          <summary>Add a release note with Tegami</summary>
          <p>Create a Markdown file in <code>.tegami/</code> and set the bump for the app:</p>
          <pre><code>{`---
subject: Explain the update in a short phrase
packages:
  waitlyze: patch
---

### Highlights

Describe the customer-facing change here.`}</code></pre>
          <p>Run <code>pnpm tegami</code> locally to draft an entry. After it merges to <code>main</code>, the Tegami workflow prepares a Version Packages pull request that updates <code>package.json</code> and <code>CHANGELOG.md</code>.</p>
        </details>
        <nav className="waitlyze-docs-changelog-index" aria-label="Release versions">
          {releases.map((version, index) => <a key={version} href={`#${releaseId(version)}`} data-latest={index === 0 ? "true" : undefined}>{version}</a>)}
        </nav>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2({ children, node, ...props }) {
              return <h2 {...props} id={releaseId(textContent(children))}>{children}</h2>;
            },
          }}
        >
          {changelog}
        </ReactMarkdown>
      </DocsBody>
    </DocsPage>
  );
}
