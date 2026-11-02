import { defineDocs, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

// Blog posts reuse the docs pipeline (MDX, TOC, processed markdown) with a
// richer frontmatter contract. `tldr` and `faqs` render as visible blocks and
// feed the structured data, so every post is answer-first by construction.
export const blog = defineDocs({
  dir: "content/blog",
  docs: {
    schema: frontmatterSchema.extend({
      date: z.preprocess((value) => (value === null ? undefined : value), z.coerce.date()),
      updated: z
        .preprocess((value) => (value === null ? undefined : value), z.coerce.date().optional())
        .optional(),
      author: z.string().default("Waitlyze Team"),
      tags: z.array(z.string()).default([]),
      tldr: z.string(),
      featured: z.boolean().default(false),
      faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});
