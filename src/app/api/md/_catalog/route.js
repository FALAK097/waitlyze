import { listMarkdownRoutes } from "@/lib/md-registry";
import { SITE_URL } from "@/lib/site-metadata";

export const revalidate = false;

export async function GET() {
  const routes = listMarkdownRoutes();
  const catalog = {
    name: "Waitlyze Markdown Catalog",
    description:
      "Complete machine-readable list of all public routes and their markdown endpoints.",
    baseUrl: SITE_URL,
    totalRoutes: routes.length,
    routes: routes.map((r) => ({
      path: r.path,
      title: r.title,
      type: r.type,
      markdownUrl: `${SITE_URL}${r.path === "/" ? "/index.md" : `${r.path}.md`}`,
      canonicalUrl: `${SITE_URL}${r.path}`,
    })),
  };

  return Response.json(catalog, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
