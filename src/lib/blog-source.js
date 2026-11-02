import { loader } from "fumadocs-core/source";

import { blog } from "../../.source/server";

export const blogRoute = "/blog";

export const blogSource = loader({
  baseUrl: blogRoute,
  source: blog.toFumadocsSource(),
});

const WORDS_PER_MINUTE = 220;

const postDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * Newest first. Draft-style future dates are excluded so scheduled posts stay hidden.
 * Listing pages revalidate hourly via ISR (or on the next build deploy) so newly
 * due posts become visible automatically.
 */
export function getPosts() {
  const now = Date.now();
  return blogSource
    .getPages()
    .filter((page) => page.data.date.getTime() <= now)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getPost(slug) {
  const page = blogSource.getPage([slug]);
  if (!page || page.data.date.getTime() > Date.now()) return undefined;
  return page;
}

/** Use publication date until a scheduled edit has actually taken effect. */
export function getPostModifiedDate({ date, updated }, now = Date.now()) {
  return updated && updated.getTime() <= now ? updated : date;
}

export async function getReadingMinutes(page) {
  const text = await page.data.getText("processed");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function slugifyTag(tag) {
  const slug = tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) {
    throw new Error(`Tag "${tag}" does not contain alphanumeric characters for slug generation.`);
  }
  return slug;
}

export function getTags() {
  const counts = new Map();
  for (const post of getPosts()) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const tags = [...counts.entries()].map(([name, count]) => ({
    name,
    slug: slugifyTag(name),
    count,
  }));
  const namesBySlug = new Map();
  for (const tag of tags) {
    const existing = namesBySlug.get(tag.slug);
    if (existing && existing !== tag.name) {
      throw new Error(`Tags "${existing}" and "${tag.name}" share the slug "${tag.slug}".`);
    }
    namesBySlug.set(tag.slug, tag.name);
  }
  return tags.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getRelatedPosts(page, limit = 3) {
  const tags = new Set(page.data.tags);
  return getPosts()
    .filter((post) => post.url !== page.url)
    .map((post) => ({
      post,
      score: post.data.tags.filter((tag) => tags.has(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || b.post.data.date - a.post.data.date)
    .slice(0, limit)
    .map(({ post }) => post);
}

export function formatPostDate(date) {
  return postDateFormatter.format(date);
}
