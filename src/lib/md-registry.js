import { getPost, getPosts, getTags } from "@/lib/blog-source";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site-metadata";
import { source } from "@/lib/source";
import { listTemplates } from "@/lib/templates/catalog.mjs";
import { getGalleryMeta, isTemplateId } from "@/lib/templates/gallery.mjs";

function estimateTokens(text) {
  // Approximate 1 token per 4 characters.
  return Math.ceil(text.length / 4);
}

/** Formats an absolute canonical URL */
function canonical(path) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Builds the full markdown response object */
function buildMarkdownDoc({
  title,
  description,
  path,
  body,
  related = [],
  updated = "2026-11-01",
}) {
  const content = `# ${title}

> ${description}

Canonical: ${canonical(path)}
Last updated: ${updated}

${body.trim()}

${
  related.length > 0
    ? `## Related Links
${related.map((r) => `- [${r.title}](${canonical(r.path)}) - ${r.description}`).join("\n")}`
    : ""
}
`;

  return {
    content,
    title,
    description,
    canonicalUrl: canonical(path),
    tokens: estimateTokens(content),
  };
}

/** Renderers map */
export async function renderMarkdownRoute(rawPath) {
  // Normalize path
  let path = rawPath.replace(/\.md$/, "");
  if (path === "/index" || path === "index") path = "/";
  if (!path.startsWith("/")) path = `/${path}`;

  // 1. Home /
  if (path === "/") {
    const templates = listTemplates();
    const body = `Waitlyze is a waitlist builder for founders and teams. Create a branded waitlist page or embed a signup form on any website, grow signups with verified referral loops, send automated email sequences, and inspect privacy-first audience analytics.

## Core Capabilities
- **Hosted Pages & Zero-Code Embeds**: Launch a standalone page on \`waitlyze.falakgala.dev/w/your-slug\` or embed a customizable widget onto Next.js, React, HTML, Webflow, or Framer.
- **Viral Referral Engine**: Every subscriber gets a verified referral link. Track queue positions, referral points, and milestones.
- **Built-in Email Engine**: Visual email designer with welcome messages, referral reminders, and milestone broadcasts powered by Resend and BYOK senders.
- **Privacy-First Analytics**: Track visitors, conversion rates, confirmation rates, UTM traffic sources, geographic locations, and devices without tracking cookies.
- **Developer API & Webhooks**: Public Signup API (\`POST /api/waitlist\`), API keys, and real-time webhooks (\`referral.completed\`, \`signup.created\`).

## Available Templates (14 Ready-to-Use Layouts)
${templates
  .map(
    (t) =>
      `- **${t.name}** (\`/templates/${t.id}\`): ${t.description} (Best for: ${getGalleryMeta(t.id)?.bestFor.join(", ")})`,
  )
  .join("\n")}

## Frequently Asked Questions
### Is Waitlyze free to use?
Yes. You can create a waitlist, publish a hosted page, embed signup widgets, and collect signups for free.

### Do I need a website or coding skills?
No. You can visually design your page in the builder and share its hosted URL. If you already have a website, copy the embed snippet from your dashboard.

### How do referrals work?
Each subscriber receives a personal referral link upon confirmation. Waitlyze tracks referred signups and applies fraud checks so you can reward authentic promoters.`;

    return buildMarkdownDoc({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      path: "/",
      body,
      related: [
        {
          title: "Templates Gallery",
          path: "/templates",
          description: "Browse 14 launch templates",
        },
        { title: "Developer Docs", path: "/docs", description: "API reference and integrations" },
        { title: "Blog & Guides", path: "/blog", description: "Pre-launch playbooks" },
        {
          title: "Agent Instructions",
          path: "/agent-instructions.md",
          description: "Instructions for AI agents",
        },
      ],
    });
  }

  // 2. Templates index /templates
  if (path === "/templates") {
    const templates = listTemplates();
    const body = `Browse fourteen free waitlist templates designed for SaaS betas, AI previews, newsletters, mobile apps, events, and developer tools.

| Template | Category | Use Case | Link |
| --- | --- | --- | --- |
${templates
  .map((t) => {
    const meta = getGalleryMeta(t.id);
    return `| ${t.name} | ${t.category} | ${meta?.useCase || t.description} | [View Template](${canonical(`/templates/${t.id}`)}) |`;
  })
  .join("\n")}

## Using a Template
Open any template in Waitlyze, customize the brand colors, fonts, hero headlines, and sections, and publish your page in minutes.`;

    return buildMarkdownDoc({
      title: "Waitlist Templates",
      description:
        "Fourteen free waitlist templates for SaaS betas, AI launches, newsletters, events, and pre-orders.",
      path: "/templates",
      body,
      related: [
        { title: "Waitlyze Home", path: "/", description: "Product overview" },
        { title: "Developer Docs", path: "/docs", description: "API reference and guides" },
      ],
    });
  }

  // 3. Single template /templates/:id
  const templateMatch = path.match(/^\/templates\/([a-z0-9-]+)$/);
  if (templateMatch) {
    const id = templateMatch[1];
    if (isTemplateId(id)) {
      const template = listTemplates().find((t) => t.id === id);
      const meta = getGalleryMeta(id);
      const hero = template.snapshot.sections.find((s) => s.type === "hero");
      const visibleSections = template.snapshot.sections
        .filter((s) => s.visible)
        .map((s) => `- **${s.type.toUpperCase()}**: ${s.variant || "standard"}`)
        .join("\n");

      const body = `**Category**: ${template.category}
**Best For**: ${meta.bestFor.join(", ")}
**Primary Heading**: ${hero?.heading || template.name}
**Subheading**: ${hero?.body || template.description}

### Configured Page Sections
${visibleSections}

### Color Palette
- Background: \`${template.snapshot.brand.pageBackground}\`
- Text: \`${template.snapshot.brand.textColor}\`
- Accent: \`${template.snapshot.brand.accentColor}\`

### How to Use
1. Log in to your Waitlyze workspace.
2. Select **New Waitlist** and pick the **${template.name}** template.
3. Customize your copy and publish.`;

      return buildMarkdownDoc({
        title: `${meta.seoTitle} | Waitlyze Templates`,
        description: meta.seoDescription,
        path: `/templates/${id}`,
        body,
        related: [
          { title: "All Templates", path: "/templates", description: "Browse all templates" },
          { title: "Waitlyze Home", path: "/", description: "Product overview" },
        ],
      });
    }
  }

  // 4. Blog index /blog
  if (path === "/blog") {
    const posts = getPosts();
    const body = `Practical playbooks on waitlist design, referral mechanics, launch email sequences, and early-stage distribution.

## Published Articles
${posts
  .map(
    (post) =>
      `### [${post.data.title}](${canonical(post.url)})
- **Summary**: ${post.data.description}
- **Tags**: ${post.data.tags.join(", ")}
- **TL;DR**: ${post.data.tldr}`,
  )
  .join("\n\n")}`;

    return buildMarkdownDoc({
      title: "Waitlyze Blog",
      description:
        "Guides on building a waitlist, running referral campaigns, and launching with an audience.",
      path: "/blog",
      body,
      related: [
        { title: "Waitlyze Home", path: "/", description: "Product overview" },
        { title: "Templates", path: "/templates", description: "Browse launch templates" },
      ],
    });
  }

  // 5. Single blog post /blog/:slug
  const blogMatch = path.match(/^\/blog\/([a-z0-9-]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const post = getPost(slug);
    if (post) {
      const text = await post.data.getText("processed");
      const faqs = post.data.faqs
        ? `\n\n## Frequently Asked Questions\n${post.data.faqs
            .map((f) => `### ${f.question}\n${f.answer}`)
            .join("\n\n")}`
        : "";

      const body = `**Author**: ${post.data.author}
**Tags**: ${post.data.tags.join(", ")}

## Key Takeaway (TL;DR)
${post.data.tldr}

${text}${faqs}`;

      const postDate = (post.data.updated ?? post.data.date).toISOString().slice(0, 10);
      return buildMarkdownDoc({
        title: post.data.title,
        description: post.data.description,
        path: post.url,
        body,
        updated: postDate,
        related: [
          { title: "All Articles", path: "/blog", description: "Waitlyze Blog index" },
          { title: "Waitlist Templates", path: "/templates", description: "Browse templates" },
        ],
      });
    }
  }

  // 6. Docs /docs or /docs/:slug
  if (path.startsWith("/docs")) {
    const docSlug = path === "/docs" ? [] : path.replace(/^\/docs\/?/, "").split("/");
    const page = source.getPage(docSlug);
    if (page) {
      const text = await page.data.getText("processed");
      return buildMarkdownDoc({
        title: `${page.data.title} | Waitlyze Docs`,
        description: page.data.description,
        path: page.url,
        body: text,
        related: [
          {
            title: "API Reference",
            path: "/docs/api/reference",
            description: "REST API endpoints",
          },
          { title: "Embed Widget", path: "/docs/embed", description: "Embed instructions" },
          { title: "Waitlyze Home", path: "/", description: "Product overview" },
        ],
      });
    }
  }

  // 7. Legal pages /privacy, /terms
  if (path === "/privacy" || path === "/terms") {
    const isPrivacy = path === "/privacy";
    const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
    const body = isPrivacy
      ? `At Waitlyze ("we," "us," "our"), accessible from https://waitlyze.falakgala.dev, we are committed to protecting your privacy. This Privacy Policy outlines our practices regarding data collection, usage, and sharing when you access our platform.

## 1. Information We Collect
- **Personal Information**: When you create an account, we collect personal information such as your name, email address, and any other details you choose to provide.
- **Usage Data**: We automatically collect information about your interactions with our platform. This data includes your IP address, browser type, pages viewed, and the time and duration of your visits. We use this information to monitor and improve our services.

## 2. Use of Information
We use your information to:
- Provide and improve our platform's services.
- Personalize your experience and deliver content relevant to your interests.
- Monitor platform performance and usage to identify trends and enhance functionality.

## 3. Sharing of Information
We do not sell or rent your personal information. However, we may share information in the following cases:
- **Service Providers**: We may share information with trusted third-party service providers who perform services on our behalf.
- **Legal Requirements**: We may disclose information if required by law, such as in response to a subpoena, court order, or other legal processes.

## 4. Data Retention
We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy unless a longer retention period is required or permitted by law.

## 5. Security
We take data security seriously and implement reasonable measures to protect your information. However, no online service is completely secure, and we cannot guarantee the security of your data.

## 6. Your Rights
Depending on your location, you may have rights regarding your personal information, including access, correction, deletion, restriction of processing, and data portability.

## 7. Changes to This Privacy Policy
We may update this Privacy Policy from time to time. We will notify users of any material changes and indicate the effective date at the top of this policy.

## 8. Contact Us
If you have questions or concerns about this Privacy Policy or our data practices, please contact us at hi@falakgala.dev.`
      : `Welcome to Waitlyze ("Platform," "Service," "we," "us," "our"). By accessing or using https://waitlyze.falakgala.dev ("Website"), you agree to comply with and be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our services.

## 1. Acceptance of Terms
By creating an account or accessing our Platform, you accept and agree to be bound by these Terms, our Privacy Policy, and any other policies or guidelines that we may implement.

## 2. Description of Service
Waitlyze provides a platform for creating and managing waitlists that help convert visitors into eager customers. The platform may collect analytics to enhance user experience, which is detailed in our Privacy Policy.

## 3. Eligibility
You must be at least 18 years of age or have permission from a legal guardian to use our services. By using the Platform, you confirm that you meet these requirements.

## 4. User Accounts
You are responsible for maintaining the confidentiality of your account information. You are solely responsible for all activities that occur under your account.

## 5. User Conduct
Users agree to use the Platform responsibly and may not:
- Engage in any illegal or unauthorized activities
- Violate or infringe upon the rights of others, including intellectual property rights
- Use any automated means to access the Platform

## 6. Intellectual Property
All content provided on the Platform, including logos, graphics, and text, is owned by Waitlyze or our partners. Users are not granted any license to use this content without permission.

## 7. Termination of Service
We reserve the right to suspend or terminate access to the Platform without notice if you violate these Terms.

## 8. Limitation of Liability
To the fullest extent permitted by law, Waitlyze shall not be liable for any damages resulting from the use or inability to use our services.

## 9. Modifications to Terms
We reserve the right to update these Terms at any time. We will notify users of any material changes, and continued use of the Platform indicates acceptance of the revised Terms.

## 10. Contact Information
For questions about these Terms, please contact us at hi@falakgala.dev.`;

    return buildMarkdownDoc({
      title,
      description: `Waitlyze ${title}`,
      path,
      body,
      updated: "2026-10-11",
      related: [{ title: "Waitlyze Home", path: "/", description: "Product overview" }],
    });
  }

  // 8. Blog tag /blog/tag/:slug
  const tagMatch = path.match(/^\/blog\/tag\/([a-z0-9-]+)$/);
  if (tagMatch) {
    const tag = getTags().find((t) => t.slug === tagMatch[1]);
    if (tag) {
      const posts = getPosts().filter((post) => post.data.tags.includes(tag.name));
      const list = posts
        .map((post) => `- [${post.data.title}](${canonical(post.url)}) - ${post.data.description}`)
        .join("\n");
      const newestPostInTag = posts.reduce((latest, post) => {
        const d = post.data.updated ?? post.data.date;
        return d > latest ? d : latest;
      }, new Date(0));
      return buildMarkdownDoc({
        title: `${tag.name} guides | Waitlyze Blog`,
        description: `Waitlyze articles about ${tag.name.toLowerCase()}: practical waitlist and launch guidance you can apply today.`,
        path: `/blog/tag/${tag.slug}`,
        body: `${posts.length} ${posts.length === 1 ? "article" : "articles"} about ${tag.name.toLowerCase()}.\n\n## Articles\n${list}`,
        updated: posts.length ? newestPostInTag.toISOString().slice(0, 10) : "2026-11-01",
        related: [{ title: "All Articles", path: "/blog", description: "Waitlyze Blog index" }],
      });
    }
  }

  // Route not found
  return null;
}

/** Lists all addressable markdown routes for the catalog */
export function listMarkdownRoutes() {
  const templates = listTemplates();
  const posts = getPosts();
  const docPages = source.getPages();

  return [
    { path: "/", title: SITE_TITLE, type: "page" },
    { path: "/templates", title: "Templates Gallery", type: "page" },
    ...templates.map((t) => ({
      path: `/templates/${t.id}`,
      title: `${t.name} Template`,
      type: "template",
    })),
    { path: "/blog", title: "Waitlyze Blog", type: "blog-index" },
    ...posts.map((p) => ({
      path: p.url,
      title: p.data.title,
      type: "blog-post",
    })),
    ...docPages.map((d) => ({
      path: d.url,
      title: d.data.title,
      type: "doc",
    })),
    { path: "/privacy", title: "Privacy Policy", type: "legal" },
    { path: "/terms", title: "Terms of Service", type: "legal" },
    { path: "/agent-instructions.md", title: "AI Agent Instructions", type: "agent" },
  ];
}
