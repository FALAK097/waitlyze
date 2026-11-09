import { renderMarkdownRoute } from "@/lib/md-registry";

export const revalidate = false;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = request.headers.get("x-waitlyze-markdown-path") || searchParams.get("path") || "/";

  // Prevent accessing private admin/auth paths via markdown
  const isPrivate =
    path.startsWith("/dashboard") ||
    path.startsWith("/waitlists") ||
    path.startsWith("/settings") ||
    path.startsWith("/api-keys") ||
    path.startsWith("/api/");

  if (isPrivate) {
    return new Response("# 403 Forbidden\n\nThis is a private authenticated surface.", {
      status: 403,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  const doc = await renderMarkdownRoute(path);

  if (!doc) {
    const notFoundContent = `# 404 Not Found

The requested markdown page \`${path}\` does not exist.

## Useful Resources
- [Waitlyze Home](https://waitlyze.com/)
- [Templates Gallery](https://waitlyze.com/templates)
- [Blog & Guides](https://waitlyze.com/blog)
- [Developer Docs](https://waitlyze.com/docs)
- [Full LLMs Context](https://waitlyze.com/llms-full.txt)
`;
    return new Response(notFoundContent, {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  return new Response(doc.content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "X-Markdown-Tokens": String(doc.tokens),
      Link: `<${doc.canonicalUrl}>; rel="canonical"`,
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
}
