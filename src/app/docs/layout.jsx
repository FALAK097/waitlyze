import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { docsTree } from "@/lib/developer-docs";
import "./docs.css";

export const metadata = { title: "Developer docs", description: "Connect Waitlyze to your website, accept signups from your server, and receive signed webhook events." };

export default function Layout({ children }) {
  return <RootProvider theme={{ enabled: false }} search={{ enabled: false }}><DocsLayout tree={docsTree} nav={{ title: "Waitlyze / Docs", url: "/" }} themeSwitch={{ enabled: false }} searchToggle={{ enabled: false }} links={[{ text: "Open app", url: "/wait-lists" }]} containerProps={{ className: "waitlyze-docs" }}>{children}</DocsLayout></RootProvider>;
}
