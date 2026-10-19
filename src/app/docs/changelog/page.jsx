import { readFile } from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";

export const metadata = {
  title: "Changelog | Waitlyze Docs",
  description: "Waitlyze release notes, from the first waitlist release through the latest update.",
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
        <p className="waitlyze-changelog-intro">Every capability, improvement, and fix we have shipped, from the first waitlist release through today&apos;s updates.</p>
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
