import { getPostModifiedDate, getPosts, getTags } from "@/lib/blog-source";
import { competitors } from "@/lib/comparison-data";
import { SITE_URL } from "@/lib/site-metadata";
import { source } from "@/lib/source";
import { TEMPLATE_IDS } from "@/lib/templates/gallery.mjs";

// Editorial update dates, not the time a crawler requests this file. Bump
// SITE_UPDATED when marketing, template or docs pages change in a meaningful way.
const SITE_UPDATED = "2026-11-08";
const PRIVACY_UPDATED = "2026-10-11";
const LEGAL_UPDATED = "2026-11-08";

export const revalidate = 3600;

export default function sitemap() {
  const posts = getPosts();
  const newestPost =
    posts.reduce((latest, post) => {
      const modified = getPostModifiedDate(post.data);
      return !latest || modified > latest ? modified : latest;
    }, undefined) ?? SITE_UPDATED;
  return [
    { url: SITE_URL, lastModified: SITE_UPDATED, priority: 1 },
    { url: `${SITE_URL}/templates`, lastModified: SITE_UPDATED, priority: 0.8 },
    { url: `${SITE_URL}/alternatives`, lastModified: "2026-11-09", priority: 0.8 },
    { url: `${SITE_URL}/compare`, lastModified: "2026-11-09", priority: 0.8 },
    ...competitors.map(({ slug }) => ({
      url: `${SITE_URL}/alternatives/${slug}`,
      lastModified: "2026-11-09",
      priority: 0.7,
    })),
    ...TEMPLATE_IDS.map((id) => ({
      url: `${SITE_URL}/templates/${id}`,
      lastModified: SITE_UPDATED,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/blog`, lastModified: newestPost, priority: 0.8 },
    ...posts.map((post) => ({
      url: `${SITE_URL}${post.url}`,
      lastModified: getPostModifiedDate(post.data),
      priority: 0.7,
    })),
    ...getTags().map((tag) => ({
      url: `${SITE_URL}/blog/tag/${tag.slug}`,
      lastModified:
        posts.reduce((latest, post) => {
          if (!post.data.tags.includes(tag.name)) return latest;
          const modified = getPostModifiedDate(post.data);
          return !latest || modified > latest ? modified : latest;
        }, undefined) ?? SITE_UPDATED,
      priority: 0.4,
    })),
    ...source.getPages().map((page) => ({
      url: `${SITE_URL}${page.url}`,
      lastModified: SITE_UPDATED,
      priority: page.slugs.length === 0 ? 0.6 : 0.5,
    })),
    { url: `${SITE_URL}/docs/changelog`, lastModified: SITE_UPDATED, priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: PRIVACY_UPDATED, priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: LEGAL_UPDATED, priority: 0.3 },
    { url: `${SITE_URL}/refund-policy`, lastModified: LEGAL_UPDATED, priority: 0.3 },
  ];
}
