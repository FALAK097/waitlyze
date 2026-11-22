import { WAITLYZE_PRICING } from "@/lib/billing/pricing.mjs";
import { getPost, getPostModifiedDate, getPosts, getTags } from "@/lib/blog-source";
import {
  competitors,
  featureRows,
  getCompetitor,
  getCompetitorFaqs,
  pricingRows,
  RESEARCHED_ON,
  waitlyze,
} from "@/lib/comparison-data";
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
function buildMarkdownDoc({ title, description, path, body, related = [], updated }) {
  const content = `# ${title}

> ${description}

Canonical: ${canonical(path)}
${updated ? `Last updated: ${updated}\n` : ""}

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
    const body = `Waitlyze is a waitlist builder made by Falak Gala for founders and teams. Build a branded page, publish a hosted page or embed, grow through referrals, send consent-aware email, and learn from audience analytics. Free to use; no credit card required.

## Core Capabilities
- **Build and publish**: Start with a template, edit content and brand, preview desktop and mobile, save drafts without changing the live page, then publish, pause, or roll back.
- **Hosted Pages & Embeds**: Share a hosted page or embed its published form on your site. Pro includes one optional custom domain per waitlist, and the hosted URL remains available.
- **Referral Sharing and Credit**: When enabled, confirmed subscribers receive personal share links. With double opt-in enabled, referred signups earn credit after email verification; with it disabled, they may earn credit without verification. Review points and queue positions; reward fulfillment is not automatic.
- **Consent-Aware Email**: Connect a verified Resend sender for subscriber confirmation email. Pro adds welcome, reminder, and milestone automations plus one-time broadcasts. Marketing email requires verified addresses with explicit opt-in.
- **Audience Analytics**: See visitors, signups, conversion, verification, acquisition sources, geography, devices, and referral activity. Product screenshots on the homepage show example data, not customer results.
- **Developer Tools**: Server-side Signup API (\`POST /api/waitlist\`), scoped API keys, signed webhooks, and subscriber CSV export. Zapier-style connections use webhook recipes rather than a native integration.
- **Workspace Controls**: Invite teammates with role permissions and review publication changes.

The homepage includes the Blank page template as an interactive example waitlist. Its form is a local preview only: it does not collect, store, or send email.

Explore the [Waitlyze source on GitHub](https://github.com/FALAK097/waitlyze).

## Available Templates (14 Ready-to-Use Layouts)
${templates
  .map(
    (t) =>
      `- **${t.name}** (\`/templates/${t.id}\`): ${t.description} (Best for: ${getGalleryMeta(t.id)?.bestFor.join(", ")})`,
  )
  .join("\n")}

## Frequently Asked Questions
### Is Waitlyze free to use?
Yes. Free includes one workspace with one waitlist and 100 lifetime signups, with no credit card required. Pro is ${WAITLYZE_PRICING.pro.monthly.formatted} per month or ${WAITLYZE_PRICING.pro.annual.formatted} per year, with unlimited workspaces, waitlists, signups, and members.

### Do I need a website or coding skills?
No. You can visually design your page in the builder and share its hosted URL. If you already have a website, copy the embed snippet from your dashboard.

### How do referrals work?
When referral sharing is enabled, confirmed subscribers receive a personal link. If double opt-in is enabled, referred signups earn credit after verifying their email. If it is disabled, they may earn credit without verifying. Reward delivery is up to the waitlist owner.

### Can I email everyone who signs up?
With Pro, connect and verify your own Resend sender to send broadcasts and automations from your domain. Marketing email goes only to verified subscribers who explicitly opted in. A connected Resend sender is also required if your signup form sends confirmation email.

### Can I cancel Pro or get a refund?
You can cancel renewal from workspace Billing at any time and keep Pro through the paid period. Payments are non-refundable except where applicable law requires otherwise. See the [Refund Policy](/refund-policy).

### Can I change a live page without breaking it?
Edits save as drafts. Visitors continue seeing the published version until you publish again. You can pause signups or roll back to an earlier published revision.

### Can I use my own domain?
Pro includes one custom domain per waitlist with automatic HTTPS. The Waitlyze-hosted page remains available, so connecting a domain is optional.

### Can I take my subscriber data with me?
Yes. Search and filter subscribers in your dashboard, then export them as CSV.

### What happens after someone joins?
You can require email confirmation before a signup is verified. The after-signup experience can include a personal share link, queue position, and configured referral rewards.

### Can I put the signup form on my own site?
Yes. Publish your waitlist, then copy its embed snippet into your site. Hosted and embedded forms feed the same waitlist.

### What can I see in analytics?
Review visitors, signups, conversion, verification, and referral activity, with breakdowns by source, device, geography, and landing page as data arrives.

### Can teammates work on a waitlist?
Yes, with Pro. Invite teammates to your workspace and assign editing, publishing, and email permissions. Free includes one member per workspace.

### How can I protect the signup form from bots?
Enable Turnstile verification on the form. Marketing consent is a separate choice for subscribers.

Waitlyze is built by Falak Gala. Questions or ideas? Email [Falak](mailto:support@waitlyze.com).`;

    return buildMarkdownDoc({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      path: "/",
      body,
      related: [
        { title: "Pricing", path: "/pricing", description: "Free and Pro plan details" },
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

  // 1b. Features /features
  if (path === "/features") {
    const body = `Waitlyze brings the core jobs of a product launch into one workspace: publish a signup page, grow through verified referrals, manage subscribers, send updates, and measure demand.

## Build and publish
Create a branded waitlist page with the visual editor, start from a template, and publish a hosted page. Embed the signup form or connect a custom domain when you need it.

## Grow through referrals
Give confirmed subscribers a personal referral link, show their queue position, and award points for eligible referred signups.

## Manage and engage subscribers
Search and filter subscribers, export the list as CSV, send confirmation email through a verified sender, and use Pro for broadcasts and automations.

## Measure launch demand
Track visitors, verified signups, conversion, referral activity, and acquisition sources to see what is bringing people in.

## Connect your tools
Use embedded forms, the server-side Signup API, signed webhooks, and documented integrations to connect Waitlyze to your launch stack.

Read the [pricing details](${canonical("/pricing")}) or [product documentation](${canonical("/docs")}).`;

    return buildMarkdownDoc({
      title: "Waitlist Software Features | Waitlyze",
      description:
        "Explore Waitlyze tools for building a branded waitlist, verified referrals, subscriber email, analytics, and integrations.",
      path: "/features",
      body,
      updated: "2026-11-22",
      related: [
        { title: "Pricing", path: "/pricing", description: "Free and Pro plan details" },
        { title: "Templates", path: "/templates", description: "Ready-to-customize launch pages" },
        { title: "Documentation", path: "/docs", description: "Setup and API guides" },
      ],
    });
  }

  // 1c. About /about
  if (path === "/about") {
    const body = `Waitlyze is open-source waitlist software for founders who want to publish a launch page, grow through referrals, and understand their audience. It is built and maintained by [Falak Gala](https://falakgala.dev).

## Why it exists
A waitlist should help founders understand demand and see which supporters bring in more people. Waitlyze brings the page, referrals, subscriber management, and launch metrics together.

## Built in the open
The [source code](https://github.com/FALAK097/waitlyze), [release history](${canonical("/docs/changelog")}), and [product documentation](${canonical("/docs")}) are public.

## Product principles
- **Verified growth**: Referral credit is based on eligible signups, not clicks alone.
- **Portable audiences**: Subscribers can be exported, with APIs and signed webhooks for connected tools.
- **Clear operations**: Pricing, publishing, and launch metrics are available in the product and its documentation.

Explore the [features](${canonical("/features")}) or [pricing](${canonical("/pricing")}), or [contact Waitlyze](mailto:support@waitlyze.com).`;

    return buildMarkdownDoc({
      title: "About Waitlyze",
      description:
        "Learn why Waitlyze was built, who maintains it, and how its open-source waitlist software helps founders prepare for launch.",
      path: "/about",
      body,
      updated: "2026-11-22",
      related: [
        { title: "Features", path: "/features", description: "Waitlist and launch tools" },
        { title: "Pricing", path: "/pricing", description: "Free and Pro plan details" },
        { title: "Changelog", path: "/docs/changelog", description: "Release history" },
      ],
    });
  }

  // 2. Pricing /pricing
  if (path === "/pricing") {
    const body = `Waitlyze has a Free plan and a workspace-level Pro plan. Base prices are shown in USD; country-adjusted pricing may be available and applicable taxes are shown at checkout.

| Plan | Price | Core limits and features |
| --- | --- | --- |
| Free | ${WAITLYZE_PRICING.free.formatted} forever | One workspace, one waitlist, one member, and 100 cumulative signups per Free workspace; hosted page, embed, referrals, confirmation email through a connected verified Resend sender, and CSV export |
| Pro monthly | ${WAITLYZE_PRICING.pro.monthly.formatted}/month | Unlimited workspaces, waitlists, signups, and members; advanced analytics, referral milestones, broadcasts and automations, custom domains, and branding removal |
| Pro annual | ${WAITLYZE_PRICING.pro.annual.formatted}/year (${WAITLYZE_PRICING.pro.annual.monthlyEquivalentFormatted}/month equivalent) | The same Pro features, billed annually |

## Important limits and dependencies
- Each Free workspace has a 100-signup cumulative allowance, not a monthly allowance. Deleting a waitlist does not reset that workspace's usage.
- Subscriber email requires the waitlist owner to connect and verify a Resend sender. Pro unlocks broadcasts and automated sequences through that sender.
- Pro includes one optional custom domain per waitlist.
- Waitlyze tracks referrals, milestones, points, and reward eligibility, but the waitlist owner fulfills promised rewards.
- Paid subscriptions renew for the selected interval until canceled. Cancellation takes effect after the paid period. Payments are non-refundable except where applicable law requires otherwise.

## Which plan fits?
Choose Free to validate one launch below 100 cumulative signups in its workspace. Choose Pro when you need multiple launches, unlimited growth, teammates, source analytics, subscriber email campaigns, custom domains, or unbranded pages. If automatic reward fulfillment is central to the campaign, use a separate fulfillment service.`;

    return buildMarkdownDoc({
      title: "Waitlyze Pricing: Free and Pro Plans",
      description:
        "Current Waitlyze waitlist software pricing, plan limits, included features, and setup requirements.",
      path: "/pricing",
      body,
      updated: "2026-11-22",
      related: [
        { title: "Waitlyze Home", path: "/", description: "Product overview" },
        { title: "Compare Tools", path: "/compare", description: "Waitlist software comparison" },
        { title: "Refund Policy", path: "/refund-policy", description: "Cancellation and refunds" },
      ],
    });
  }

  // 2b. Compare /compare
  if (path === "/compare") {
    const tools = [waitlyze, ...competitors];
    const header = `| Dimension | ${tools.map((t) => t.name).join(" | ")} |\n| --- | ${tools.map(() => "---").join(" | ")} |`;
    const priceLines = pricingRows.map(
      ({ key, label }) => `| **${label}** | ${tools.map((t) => t[key]).join(" | ")} |`,
    );
    const featureLines = featureRows.map(
      ({ key, label }) =>
        `| **${label}** | ${tools.map((t) => `${t.features[key].label} (${t.features[key].level})`).join(" | ")} |`,
    );
    const body = `Side-by-side comparison of seven dedicated waitlist platforms (researched ${RESEARCHED_ON}).

${[header, ...priceLines, ...featureLines].join("\n")}

## Quick Summary
- **Lowest entry price**: LaunchList ($9/mo, priced by contact tier)
- **Flat paid pricing**: Waitlyze (${WAITLYZE_PRICING.pro.monthly.formatted}/mo or ${WAITLYZE_PRICING.pro.annual.formatted}/yr per workspace), GetWaitlist ($15/mo), Waitlister ($19/mo)
- **Referral & contest specialists**: Prefinery, KickoffLabs, Viral Loops

## Focused Guides
${competitors.map((c) => `- [Waitlyze vs ${c.name}](${canonical(`/alternatives/${c.slug}`)}) — ${c.bestFor}`).join("\n")}`;

    return buildMarkdownDoc({
      title: "Waitlist Software Comparison: 7 Tools Side by Side (2026)",
      description:
        "Compare Waitlyze, GetWaitlist, LaunchList, Prefinery, KickoffLabs, Viral Loops, and Waitlister on pricing, referrals, email, analytics, and API access.",
      path: "/compare",
      body,
      updated: "2026-11-09",
      related: [
        { title: "Waitlyze Pricing", path: "/pricing", description: "Free and Pro plan details" },
        {
          title: "Waitlist Alternatives",
          path: "/alternatives",
          description: "Focused buyer guides",
        },
      ],
    });
  }

  // 2c. Alternatives hub /alternatives
  if (path === "/alternatives") {
    const body = `Compare dedicated waitlist platforms by page design, verification, referrals, email, analytics, and how pricing scales (researched ${RESEARCHED_ON}).

## Dedicated Waitlist Platforms
${competitors
  .map(
    (c) =>
      `### [Waitlyze vs ${c.name}](${canonical(`/alternatives/${c.slug}`)})
- **Category**: ${c.category}
- **Starting price**: ${c.price} (${c.model})
- **Free plan**: ${c.freePlan}
- **Best for**: ${c.bestFor}
- **Verdict**: ${c.verdict}`,
  )
  .join("\n\n")}`;

    return buildMarkdownDoc({
      title: "Best Waitlist Software Alternatives (2026) | Waitlyze",
      description:
        "Compare Waitlyze with GetWaitlist, LaunchList, Prefinery, KickoffLabs, Viral Loops, and Waitlister.",
      path: "/alternatives",
      body,
      updated: "2026-11-09",
      related: [
        {
          title: "Side-by-Side Comparison",
          path: "/compare",
          description: "7 waitlist tools compared",
        },
        { title: "Waitlyze Pricing", path: "/pricing", description: "Free and Pro plan details" },
      ],
    });
  }

  // 2d. Alternative detail /alternatives/:slug
  const alternativeMatch = path.match(/^\/alternatives\/([a-z0-9-]+)$/);
  if (alternativeMatch) {
    const competitor = getCompetitor(alternativeMatch[1]);
    if (competitor) {
      const faqs = getCompetitorFaqs(competitor);
      const body = `${competitor.summary}

**Researched**: ${RESEARCHED_ON}

## Verdict
${competitor.verdict}

## Where ${competitor.name} Wins Today
${competitor.whereTheyWinToday}

**Who should pick ${competitor.name}**: ${competitor.whoShouldPickThemSummary}

## Side-by-Side Snapshot
| Dimension | Waitlyze | ${competitor.name} |
| --- | --- | --- |
${pricingRows.map(({ key, label }) => `| **${label}** | ${waitlyze[key]} | ${competitor[key]} |`).join("\n")}
${featureRows.map(({ key, label }) => `| **${label}** | ${waitlyze.features[key].label} | ${competitor.features[key].label} |`).join("\n")}

## Choose Waitlyze When
${competitor.chooseWaitlyze.map((item) => `- ${item}`).join("\n")}

## Choose ${competitor.name} When
${competitor.chooseThem.map((item) => `- ${item}`).join("\n")}

## Frequently Asked Questions
${faqs.map(([q, a]) => `### ${q}\n${a}`).join("\n\n")}`;

      return buildMarkdownDoc({
        title: `Waitlyze vs ${competitor.name}: Pricing, Features & Verdict (2026)`,
        description: `${competitor.name} alternative: compare Waitlyze and ${competitor.name} on free plans, pricing, hosted pages, referrals, email, analytics, custom domains, and API access.`,
        path: `/alternatives/${competitor.slug}`,
        body,
        updated: "2026-11-09",
        related: [
          {
            title: "All Waitlist Alternatives",
            path: "/alternatives",
            description: "Focused buyer guides",
          },
          {
            title: "Side-by-Side Comparison",
            path: "/compare",
            description: "7 waitlist tools compared",
          },
          { title: "Waitlyze Pricing", path: "/pricing", description: "Free and Pro plan details" },
        ],
      });
    }
  }

  // 3. Templates index /templates
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

      const postDate = getPostModifiedDate(post.data).toISOString().slice(0, 10);
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

  // 7. Legal pages
  if (
    path === "/privacy" ||
    path === "/terms" ||
    path === "/support" ||
    path === "/refund-policy"
  ) {
    const isPrivacy = path === "/privacy";
    const isTerms = path === "/terms";
    const isSupport = path === "/support";
    const title = isPrivacy
      ? "Privacy Policy"
      : isTerms
        ? "Terms of Service"
        : isSupport
          ? "Waitlyze Support"
          : "Refund Policy";
    const body = isPrivacy
      ? `This policy applies to Waitlyze websites, waitlist pages, dashboards, APIs, and our Model Context Protocol (MCP) integration.

## 1. Information We Collect
- **Account and workspace data**: name, email address, authentication records, workspace membership, plan, and billing status.
- **Campaign and audience data**: waitlist content, subscriber details, consent and verification status, referrals, broadcasts, and analytics.
- **Integration data**: OAuth grants, requested scopes, connected-client details, tool name, execution status, and timing for MCP requests.
- **Usage, device, and support data**: IP address, browser and device information, features used, security events, and support messages.

## 2. How We Use Information
We use information to provide and secure Waitlyze, authenticate users and integrations, execute requested campaign actions, provide analytics, troubleshoot problems, prevent abuse, comply with law, and improve the service.

## 3. AI Clients and MCP
When you connect ChatGPT or another AI client, it can request Waitlyze data and actions covered by the permissions you approve. We return requested data to that client at your direction. Our MCP telemetry is limited to operational metadata such as tool name, duration, outcome, and basic client type. Tool inputs, outputs, conversation text, model identifiers, access tokens, API keys, and webhook secrets are not recorded in MCP analytics.

## 4. Sharing
We do not sell or rent personal information. We may share information with a connected AI client at your direction; providers supporting hosting, databases, storage, email, analytics, authentication, support, and payments; authorized workspace members; authorities when legally required; or a business successor.

## 5. Retention
Account, campaign, and audience data is generally retained while your account is active and for a reasonable period after deletion. MCP access tokens expire after one hour and refresh tokens after 30 days unless revoked earlier. We generally retain MCP operational metadata for up to 12 months, security logs for up to 90 days, and support correspondence for up to 24 months. Billing records may be retained longer where law requires it. Deleted data may remain in encrypted backups until those backups age out.

## 6. Security
We use reasonable technical and organizational safeguards, including encrypted transport, scoped OAuth access, access controls, and secret handling protections. No internet service can guarantee absolute security.

## 7. Your Choices
Depending on your location, you may have rights to access, correct, delete, restrict, object to, or export personal information. You may disconnect an AI client, revoke OAuth access, unsubscribe from marketing, or delete campaign data through Waitlyze.

## 8. Contact
Privacy questions and requests can be sent to support@waitlyze.com.`
      : isSupport
        ? `Email support@waitlyze.com for product, account, billing, or integration help. We aim to reply within two business days.

## What to Include
Include your Waitlyze account email, workspace or waitlist name, what you expected to happen, and any visible error message. Do not send passwords, access tokens, API keys, or webhook secrets.

## ChatGPT Plugin Help
If the Waitlyze plugin cannot connect, disconnect it in ChatGPT and connect it again. Check the requested permissions before approving access. For an unexpected result, include the approximate time and action name without sharing private conversation content.

## Privacy and Accounts
For access, correction, export, or deletion requests, email support from the address associated with your account. See the [Privacy Policy](https://waitlyze.com/privacy) for details.`
        : isTerms
          ? `Welcome to Waitlyze ("Platform," "Service," "we," "us," "our"). By accessing or using https://waitlyze.com ("Website"), you agree to comply with and be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our services.

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
- Use automated means to access the Platform, except to retrieve public pages allowed by our AI access policy (/ai.txt) and robots.txt; this exception does not permit automated access to accounts, private data, or authenticated features

## 6. Intellectual Property
All content provided on the Platform, including logos, graphics, and text, is owned by Waitlyze or our partners. Users are not granted any license to use this content without permission.

## 7. Termination of Service
We reserve the right to suspend or terminate access to the Platform without notice if you violate these Terms.

## 8. Limitation of Liability
To the fullest extent permitted by law, Waitlyze shall not be liable for any damages resulting from the use or inability to use our services.

## 9. Modifications to Terms
We reserve the right to update these Terms at any time. We will notify users of any material changes, and continued use of the Platform indicates acceptance of the revised Terms.

## 10. Third-Party AI Clients
You may connect Waitlyze to ChatGPT or another compatible AI client through OAuth and MCP. You are responsible for reviewing the permissions requested by that client and for actions you authorize it to take. The client is governed by its own terms and privacy policy, and you can revoke its Waitlyze access at any time.

## 11. Subscriptions and Billing
Waitlyze offers a free plan and a paid Pro plan billed monthly or annually. Base prices are ${WAITLYZE_PRICING.pro.monthly.formatted} per month and ${WAITLYZE_PRICING.pro.annual.formatted} per year in USD. Where available, the pricing page shows Dodo Payments' country-adjusted price in local currency; applicable taxes are calculated based on your billing location and shown at checkout. Paid subscriptions renew automatically for the selected interval until canceled. The workspace owner can manage or cancel renewal from Billing in workspace settings. A cancellation takes effect at the end of the current paid period. Refunds are governed by our [Refund Policy](https://waitlyze.com/refund-policy). Dodo Payments acts as Merchant of Record for purchases and handles checkout, invoices, and customer-facing transaction taxes.

## 12. Contact Information
For questions about these Terms, please contact us at support@waitlyze.com.`
          : `## No Refunds

**Payments are non-refundable.** Waitlyze does not provide refunds or credits for partial subscription periods, unused features, unused time after cancellation, or a renewal that has already been charged. Your subscription remains available through the end of the paid billing period unless the service is terminated for a serious violation of our Terms.

## Cancel a Subscription

You can cancel renewal at any time from Billing in your workspace settings. Cancellation prevents the next charge; it does not refund the current billing period. Your workspace keeps Pro access until the paid period ends, then returns to the Free plan. Existing waitlists, subscribers, and members are retained, and pending invitations expire. Each Free workspace includes one waitlist, 100 lifetime signups, and one member, even if you keep Pro on another workspace; new activity above those limits prompts an upgrade. Separately, if you have no other active Pro workspace, your account is limited to one owned workspace.

## Billing Issues

If you see a duplicate charge, an incorrect billing interval, or a technical issue that prevented access to a paid feature, contact support@waitlyze.com with the workspace name and Dodo Payments transaction reference. We will investigate and correct verified billing or service errors. This does not change the no-refund policy for unused time or a change of mind.

## Rights Required by Law

Nothing in this policy limits a refund, cancellation, or other right that cannot lawfully be excluded in your jurisdiction. Where mandatory law requires a refund, Dodo Payments and Waitlyze will follow the applicable process.

## Contact

For billing questions, contact [support@waitlyze.com](mailto:support@waitlyze.com). Never email a full card number or security code.`;

    return buildMarkdownDoc({
      title,
      description: `Waitlyze ${title}`,
      path,
      body,
      updated: isPrivacy || isTerms || isSupport ? "2026-11-18" : "2026-11-08",
      related: [
        { title: "Waitlyze Home", path: "/", description: "Product overview" },
        ...(isPrivacy
          ? []
          : [
              {
                title: "Refund Policy",
                path: "/refund-policy",
                description: "Subscriptions and refunds",
              },
            ]),
      ],
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
        const d = getPostModifiedDate(post.data);
        return d > latest ? d : latest;
      }, new Date(0));
      return buildMarkdownDoc({
        title: `${tag.name} guides | Waitlyze Blog`,
        description: `Waitlyze articles about ${tag.name.toLowerCase()}: practical waitlist and launch guidance you can apply today.`,
        path: `/blog/tag/${tag.slug}`,
        body: `${posts.length} ${posts.length === 1 ? "article" : "articles"} about ${tag.name.toLowerCase()}.\n\n## Articles\n${list}`,
        updated: posts.length ? newestPostInTag.toISOString().slice(0, 10) : undefined,
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
    { path: "/features", title: "Waitlist Software Features", type: "page" },
    { path: "/about", title: "About Waitlyze", type: "page" },
    { path: "/pricing", title: "Waitlyze Pricing", type: "page" },
    { path: "/compare", title: "Waitlist Software Comparison", type: "page" },
    { path: "/alternatives", title: "Waitlist Software Alternatives", type: "page" },
    ...competitors.map((c) => ({
      path: `/alternatives/${c.slug}`,
      title: `Waitlyze vs ${c.name}`,
      type: "comparison",
    })),
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
    ...getTags().map((tag) => ({
      path: `/blog/tag/${tag.slug}`,
      title: `${tag.name} guides`,
      type: "blog-tag",
    })),
    ...docPages.map((d) => ({
      path: d.url,
      title: d.data.title,
      type: "doc",
    })),
    { path: "/privacy", title: "Privacy Policy", type: "legal" },
    { path: "/terms", title: "Terms of Service", type: "legal" },
    { path: "/refund-policy", title: "Refund Policy", type: "legal" },
    { path: "/agent-instructions.md", title: "AI Agent Instructions", type: "agent" },
  ];
}
