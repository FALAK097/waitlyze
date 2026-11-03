import { blogFeed } from "@/lib/blog-feed";

export const revalidate = 3600;

export function GET() {
  return blogFeed("/rss.xml");
}
