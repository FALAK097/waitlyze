import { notFound } from "next/navigation";

import { formatPostDate, getPost, getPosts, getReadingMinutes } from "@/lib/blog-source";
import { renderOgImage } from "@/lib/og-image";

export const revalidate = false;

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slugs[0] }));
}

export async function GET(_request, { params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const minutes = await getReadingMinutes(post);
  return renderOgImage({
    title: post.data.title,
    eyebrow: post.data.tags[0] ?? "Waitlyze Blog",
    readingTime: `${minutes} min read`,
    date: formatPostDate(post.data.date),
  });
}
