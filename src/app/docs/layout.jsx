import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { appName, gitConfig } from "@/lib/docs-shared";
import "./docs.css";

export const metadata = { title: "Developer docs", description: "Connect Waitlyze to your website, accept signups from your server, and receive signed webhook events." };

export default function Layout({ children }) {
  return <RootProvider theme={{ enabled: false }} search={{ options: { api: "/api/docs/search" }, links: [["Signup API", "/docs/api"], ["Embed a form", "/docs/embed"], ["Troubleshooting", "/docs/troubleshooting"]] }}><DocsLayout tree={source.getPageTree()} sidebar={{ defaultOpenLevel: 2 }} nav={{ title: `${appName} / Docs`, url: "/" }} themeSwitch={{ enabled: false }} githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}`} links={[{ text: "Open app", url: "/wait-lists" }]} containerProps={{ className: "waitlyze-docs" }}>{children}</DocsLayout></RootProvider>;
}
