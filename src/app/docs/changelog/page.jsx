import { readFile } from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";

export const metadata = {
  title: "Changelog | Waitlyze",
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
    <DocsPage className="waitlyze-changelog-page" toc={toc}>
      <DocsTitle>Changelog</DocsTitle>
      <DocsDescription>Release notes for Waitlyze.</DocsDescription>
      <DocsBody>
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
