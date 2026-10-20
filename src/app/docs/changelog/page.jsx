import { readFile } from "node:fs/promises";
import path from "node:path";

import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata = {
  title: "Changelog | Waitlyze",
  description: "Waitlyze release notes, from the first waitlist release through the latest update.",
};

function releaseId(title) {
  return `release-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function textContent(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  return "";
}

export default async function ChangelogPage() {
  const changelog = await readFile(path.join(process.cwd(), "CHANGELOG.md"), "utf8");
  const releases = [...changelog.matchAll(/^##\s+(v\d+\.\d+\.\d+)\s*$/gm)].map(
    ([, version]) => version,
  );
  const toc = releases.map((version) => ({
    title: version,
    url: `#${releaseId(version)}`,
    depth: 2,
  }));

  return (
    <DocsPage className="waitlyze-changelog-page" toc={toc}>
      <DocsTitle>Changelog</DocsTitle>
      <DocsDescription>Release notes for Waitlyze.</DocsDescription>
      <DocsBody>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2({ children, node, ...props }) {
              return (
                <h2
                  {...props}
                  id={releaseId(textContent(children))}
                  className="mt-0 scroll-mt-24 border-t border-fd-border pt-7 text-3xl leading-tight tracking-tight"
                >
                  {children}
                </h2>
              );
            },
            h3({ children, node, ...props }) {
              return (
                <h3
                  {...props}
                  className="mt-2.5 mb-2 text-base font-medium text-fd-muted-foreground"
                >
                  {children}
                </h3>
              );
            },
            h4({ children, node, ...props }) {
              return (
                <h4 {...props} className="mt-4 mb-2 text-caption font-semibold tracking-wide">
                  {children}
                </h4>
              );
            },
            p({ children, node, ...props }) {
              return (
                <p {...props} className="mb-4 max-w-144 leading-relaxed">
                  {children}
                </p>
              );
            },
            ul({ children, node, ...props }) {
              return (
                <ul {...props} className="mb-8 grid gap-3 ps-5">
                  {children}
                </ul>
              );
            },
            li({ children, node, ...props }) {
              return (
                <li {...props} className="ps-1 leading-relaxed marker:text-fd-primary">
                  {children}
                </li>
              );
            },
          }}
        >
          {changelog}
        </ReactMarkdown>
      </DocsBody>
    </DocsPage>
  );
}
