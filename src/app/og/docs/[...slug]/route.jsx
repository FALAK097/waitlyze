import { notFound } from "next/navigation";

import { renderOgImage } from "@/lib/og-image";
import { source } from "@/lib/source";

export const revalidate = false;

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: [...page.slugs, "image.png"] }));
}

export async function GET(_request, { params }) {
  const { slug } = await params;
  // The last segment is the file name docs metadata points at (image.png).
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  return renderOgImage({ title: page.data.title, eyebrow: "Waitlyze Docs" });
}
