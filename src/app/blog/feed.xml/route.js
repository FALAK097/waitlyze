import { getPosts } from "@/lib/blog-source";
import { SITE_URL } from "@/lib/site-metadata";

export const revalidate = 3600;

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = getPosts();
  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${post.url}`;
      const categories = post.data.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("");
      return `<item><title>${escapeXml(post.data.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${post.data.date.toUTCString()}</pubDate><description>${escapeXml(post.data.description)}</description>${categories}</item>`;
    })
    .join("");
  const lastBuild = (posts[0]?.data.updated ?? posts[0]?.data.date ?? new Date()).toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Waitlyze Blog</title><link>${SITE_URL}/blog</link><description>Practical guides on building a waitlist, running referral campaigns, and launching with an audience.</description><language>en</language><lastBuildDate>${lastBuild}</lastBuildDate><atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
