import { notFound } from "next/navigation";

import { renderToolOgImage } from "@/lib/og-image";
import { getToolBySlug, listTools, TOOL_CATEGORIES } from "@/lib/tools/registry.mjs";

export const revalidate = false;

export function generateStaticParams() {
  return listTools().map((tool) => ({ slug: tool.slug }));
}

export async function GET(_request, { params }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const category = TOOL_CATEGORIES.find((c) => c.id === tool.category);
  return renderToolOgImage({
    title: tool.title,
    eyebrow: category?.label || "Waitlyze Launch Lab",
    subtitle: tool.targetJob,
  });
}
