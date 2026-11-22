import { parse } from "parse5";

export const LAUNCH_TYPE_OPTIONS = Object.freeze([
  { value: "saas", label: "B2B SaaS" },
  { value: "ai", label: "AI Product" },
  { value: "developer", label: "Developer Tool / API" },
  { value: "mobile", label: "Mobile App" },
  { value: "creator", label: "Creator / Newsletter" },
  { value: "event", label: "Event / Cohort" },
  { value: "commerce", label: "Pre-order / Drop" },
  { value: "other", label: "Other" },
]);

export const GOAL_OPTIONS = Object.freeze([
  { value: "signups", label: "Verified email signups" },
  { value: "referrals", label: "Viral referral sharing" },
  { value: "beta", label: "Qualified beta applications" },
  { value: "reservations", label: "Pre-order reservations" },
]);

export const SAMPLE_AUDIT_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PulseGrid — Automated Incident Timelines for DevOps Teams</title>
  <link rel="canonical" href="https://pulsegrid.example/waitlist" />
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/features">Features</a>
      <a href="/pricing">Pricing</a>
      <a href="/blog">Blog</a>
      <a href="/docs">Docs</a>
      <a href="/careers">Careers</a>
    </nav>
  </header>
  <main>
    <h1>Automated incident timelines for on-call engineering teams</h1>
    <p>PulseGrid turns noisy Slack threads and PagerDuty alerts into clean post-mortems in 60 seconds.</p>
    <form action="/join" method="post">
      <label for="email">Work email</label>
      <input id="email" type="email" name="email" autocomplete="email" placeholder="you@company.com" required />
      <label for="name">Full name</label>
      <input id="name" type="text" name="name" />
      <label for="company">Company</label>
      <input id="company" type="text" name="company" />
      <label for="team">Team size</label>
      <input id="team" type="text" name="team" />
      <button type="submit">Submit</button>
    </form>
    <img src="/preview.png" />
  </main>
</body>
</html>`;

const NON_RENDERED_TAGS = new Set(["script", "style", "noscript", "template"]);

function findElements(node, tagName) {
  const matches = [];
  function visit(current) {
    if (!current?.tagName) return;
    if (current.tagName === tagName) matches.push(current);
    if (NON_RENDERED_TAGS.has(current.tagName)) return;
    for (const child of current.childNodes || []) visit(child);
  }
  for (const child of node?.childNodes || []) visit(child);
  return matches;
}

function findFirstElement(node, tagName) {
  return findElements(node, tagName)[0] || null;
}

function getAttribute(element, name) {
  return element?.attrs?.find((attribute) => attribute.name === name)?.value || "";
}

function getVisibleText(node) {
  const parts = [];
  function visit(current) {
    if (current.nodeName === "#text") {
      parts.push(current.value);
      return;
    }
    if (current.tagName && NON_RENDERED_TAGS.has(current.tagName)) return;
    for (const child of current.childNodes || []) visit(child);
  }
  visit(node);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function letterGrade(score) {
  if (score >= 93) return "A+";
  if (score >= 86) return "A";
  if (score >= 80) return "B+";
  if (score >= 73) return "B";
  if (score >= 66) return "C+";
  if (score >= 58) return "C";
  if (score >= 48) return "D";
  return "F";
}

function templateForLaunchType(launchType) {
  const map = {
    saas: "saas",
    ai: "ai",
    developer: "developer",
    mobile: "mobile",
    creator: "creator",
    event: "event",
    commerce: "commerce",
    other: "simple",
  };
  return map[launchType] || "saas";
}

export function gradeWaitlistHtml({
  html = "",
  url = "",
  launchType = "saas",
  goal = "signups",
  responseBytes = 0,
  statusCode = 200,
} = {}) {
  const raw = String(html || "");
  const isPlainCopy = !/<[a-z][\s\S]*>/i.test(raw);
  const document = isPlainCopy ? null : parse(raw);
  const body = document ? findFirstElement(document, "body") || document : null;
  const head = document ? findFirstElement(document, "head") || document : null;
  const visibleText = isPlainCopy ? raw.replace(/\s+/g, " ").trim() : getVisibleText(body);
  const lowerText = visibleText.toLowerCase();
  const wordCount = visibleText ? visibleText.split(/\s+/).length : 0;

  // Head & SEO tags
  const titleText = document ? getVisibleText(findFirstElement(head, "title") || head) : "";

  const metaTags = document ? findElements(head, "meta") : [];
  let metaDescription = "";
  let metaRobots = "";
  let hasViewport = false;
  for (const tag of metaTags) {
    const name = getAttribute(tag, "name").toLowerCase();
    const content = getAttribute(tag, "content");
    if (name === "description" && content) metaDescription = content;
    if (name === "robots" && content) metaRobots = content.toLowerCase();
    if (name === "viewport" && content) hasViewport = true;
  }

  const linkTags = document ? findElements(head, "link") : [];
  const hasCanonical = linkTags.some((tag) =>
    getAttribute(tag, "rel").toLowerCase().split(/\s+/).includes("canonical"),
  );
  const hasJsonLd =
    document &&
    findElements(document, "script").some(
      (tag) => getAttribute(tag, "type").toLowerCase() === "application/ld+json",
    );

  // Headings
  const h1Matches = document ? findElements(body, "h1").map(getVisibleText) : [];
  const h2Matches = document ? findElements(body, "h2").map(getVisibleText) : [];
  const primaryH1 = h1Matches[0] || (isPlainCopy ? raw.split("\n")[0]?.trim() || "" : "");
  const h1Words = primaryH1 ? primaryH1.split(/\s+/).length : 0;

  // Forms, inputs, buttons
  const formCount = document ? findElements(body, "form").length : 0;
  const inputTags = document ? findElements(body, "input") : [];
  const visibleInputs = inputTags.filter((tag) => {
    const t = getAttribute(tag, "type").toLowerCase();
    return t !== "hidden" && t !== "submit" && t !== "button" && t !== "checkbox";
  });
  const hasEmailInput =
    visibleInputs.some((tag) => getAttribute(tag, "type").toLowerCase() === "email") ||
    /email/i.test(visibleText);
  const hasAutocompleteEmail = visibleInputs.some(
    (tag) => getAttribute(tag, "autocomplete").toLowerCase() === "email",
  );
  const labelCount = document ? findElements(body, "label").length : 0;

  const buttonMatches = document ? findElements(body, "button").map(getVisibleText) : [];
  const submitInputValues = inputTags
    .filter((tag) => getAttribute(tag, "type").toLowerCase() === "submit")
    .map((tag) => getAttribute(tag, "value"));
  const allCtas = [...buttonMatches, ...submitInputValues].filter(Boolean);
  const primaryCta = allCtas[0] || "";
  const genericCta = /^(submit|sign up|signup|send|go|ok|subscribe)$/i.test(primaryCta.trim());

  // Links & images
  const nav = document ? findFirstElement(body, "nav") : null;
  const navLinks = nav ? findElements(nav, "a").length : 0;
  const imgTags = document ? findElements(body, "img") : [];
  const imgsWithAlt = imgTags.filter((tag) =>
    tag.attrs?.some((attribute) => attribute.name === "alt"),
  ).length;

  // Waitlist & trust signals
  const hasPrivacyReassurance =
    /(no spam|unsubscribe|privacy|never share|won't spam|one email)/i.test(lowerText);
  const hasPostSignupExpectation =
    /(early access|invite|wave|batch|beta|confirm your email|queue|spot|launch)/i.test(lowerText);
  const hasReferralSignal =
    /(referral|invite friends|move up|priority|leaderboard|share link|reward)/i.test(lowerText);
  const hasFaqOrProof =
    h2Matches.length >= 2 ||
    /(faq|frequently asked|how it works|built for|demo|screenshot|beta tester)/i.test(lowerText);
  const hasAudienceSignal =
    /(for\s+[a-z]+|teams|founders|developers|creators|engineers|designers|marketers|students|operators)/i.test(
      lowerText,
    );

  // Build 6 weighted pillars (sum of maxPoints = 100)
  const pillars = [
    {
      id: "value-prop",
      name: "Value Proposition & Message Match",
      maxPoints: 22,
      checks: [
        {
          id: "single-h1",
          label: "Clear single H1 headline (4–14 words)",
          maxPoints: 10,
          points:
            h1Matches.length === 1 && h1Words >= 4 && h1Words <= 14
              ? 10
              : primaryH1 && h1Words >= 3
                ? 6
                : 0,
          status:
            h1Matches.length === 1 && h1Words >= 4 && h1Words <= 14
              ? "pass"
              : primaryH1
                ? "warn"
                : "fail",
          detail: primaryH1
            ? `Detected H1 (${h1Words} words): "${primaryH1.slice(0, 80)}"`
            : "No H1 headline found in the initial HTML.",
          fix: "Write one sharp 6–12 word H1 naming the concrete outcome and target audience.",
        },
        {
          id: "audience-outcome",
          label: "Specific target audience & supporting copy",
          maxPoints: 12,
          points: hasAudienceSignal && wordCount >= 35 ? 12 : wordCount >= 20 ? 7 : 2,
          status: hasAudienceSignal && wordCount >= 35 ? "pass" : wordCount >= 20 ? "warn" : "fail",
          detail: hasAudienceSignal
            ? `Target audience language detected (${wordCount} readable words).`
            : `Limited audience specificity detected (${wordCount} readable words).`,
          fix: "Add a 1–2 sentence subheadline stating who this product is for and what bottleneck it removes.",
        },
      ],
    },
    {
      id: "cta-focus",
      name: "CTA & Conversion Focus",
      maxPoints: 18,
      checks: [
        {
          id: "action-cta",
          label: "Outcome-driven CTA button copy",
          maxPoints: 10,
          points: primaryCta && !genericCta ? 10 : primaryCta ? 4 : 0,
          status: primaryCta && !genericCta ? "pass" : primaryCta ? "warn" : "fail",
          detail: primaryCta
            ? genericCta
              ? `Primary button says generic "${primaryCta}".`
              : `Action-oriented CTA detected: "${primaryCta}".`
            : "No visible submit button detected in initial HTML.",
          fix: 'Replace generic "Submit" buttons with specific action copy like "Request early access" or "Claim your spot".',
        },
        {
          id: "nav-distraction",
          label: "Focused navigation (low exit-link distraction)",
          maxPoints: 8,
          points: navLinks <= 4 ? 8 : navLinks <= 6 ? 4 : 1,
          status: navLinks <= 4 ? "pass" : navLinks <= 6 ? "warn" : "fail",
          detail: `${navLinks} link(s) detected inside <nav>.`,
          fix: "Trim top-bar navigation on your waitlist page to 0–3 links so visitors stay focused on signing up.",
        },
      ],
    },
    {
      id: "form-friction",
      name: "Form Friction & Trust",
      maxPoints: 18,
      checks: [
        {
          id: "field-count",
          label: "Low-friction input count (1–2 visible fields)",
          maxPoints: 8,
          points:
            visibleInputs.length >= 1 && visibleInputs.length <= 2
              ? 8
              : visibleInputs.length <= 3
                ? 5
                : visibleInputs.length > 3
                  ? 2
                  : formCount > 0
                    ? 4
                    : 0,
          status:
            visibleInputs.length >= 1 && visibleInputs.length <= 2
              ? "pass"
              : visibleInputs.length === 3
                ? "warn"
                : "fail",
          detail:
            visibleInputs.length > 0
              ? `${visibleInputs.length} visible input field(s) found.`
              : "No HTML form inputs detected in initial markup.",
          fix: "Reduce the initial form to email-only (or email + 1 structured select) and move extra questions post-signup.",
        },
        {
          id: "email-semantics",
          label: 'Accessible email input (type="email", label, autocomplete)',
          maxPoints: 5,
          points:
            hasEmailInput && hasAutocompleteEmail && labelCount > 0 ? 5 : hasEmailInput ? 3 : 0,
          status:
            hasEmailInput && hasAutocompleteEmail && labelCount > 0
              ? "pass"
              : hasEmailInput
                ? "warn"
                : "fail",
          detail: hasEmailInput
            ? `Email input present${hasAutocompleteEmail ? " with autocomplete" : ", missing autocomplete='email'"}.`
            : "Missing semantic email input.",
          fix: 'Use <input type="email" autocomplete="email" /> paired with a visible <label> for fast mobile autofill.',
        },
        {
          id: "privacy-reassurance",
          label: "Visible no-spam / privacy reassurance near form",
          maxPoints: 5,
          points: hasPrivacyReassurance ? 5 : 0,
          status: hasPrivacyReassurance ? "pass" : "fail",
          detail: hasPrivacyReassurance
            ? "Privacy or unsubscribe reassurance copy detected."
            : "No visible no-spam or unsubscribe reassurance detected.",
          fix: 'Add one quiet trust line under the CTA: "One email when access opens. Unsubscribe anytime."',
        },
      ],
    },
    {
      id: "waitlist-mechanics",
      name: "Waitlist & Referral Mechanics",
      maxPoints: 14,
      checks: [
        {
          id: "post-signup-expectation",
          label: "Clear post-signup expectation & proof/FAQ context",
          maxPoints: 8,
          points: hasPostSignupExpectation && hasFaqOrProof ? 8 : hasPostSignupExpectation ? 5 : 1,
          status:
            hasPostSignupExpectation && hasFaqOrProof
              ? "pass"
              : hasPostSignupExpectation
                ? "warn"
                : "fail",
          detail: hasPostSignupExpectation
            ? "Launch/early-access framing detected."
            : "Page does not clearly explain what happens after joining the waitlist.",
          fix: "Tell visitors when invites open and include 3–4 short FAQs addressing timing and access.",
        },
        {
          id: "referral-cue",
          label: "Queue priority or referral mechanic clarity",
          maxPoints: 6,
          points: hasReferralSignal ? 6 : goal === "referrals" ? 0 : 2,
          status: hasReferralSignal ? "pass" : goal === "referrals" ? "fail" : "warn",
          detail: hasReferralSignal
            ? "Referral or queue-priority incentive messaging found."
            : "No mention of queue movement or referral perks.",
          fix: "Add a verified referral loop after signup so early supporters can invite peers to move up the queue.",
        },
      ],
    },
    {
      id: "seo-aeo",
      name: "Search & Answer-Engine (SEO/AEO) Readiness",
      maxPoints: 16,
      checks: [
        {
          id: "indexable-meta",
          label: "Indexable with bounded title & meta description",
          maxPoints: 8,
          points:
            !metaRobots.includes("noindex") &&
            titleText.length >= 15 &&
            metaDescription.length >= 50
              ? 8
              : !metaRobots.includes("noindex") && titleText.length > 0
                ? 4
                : 0,
          status:
            !metaRobots.includes("noindex") &&
            titleText.length >= 15 &&
            metaDescription.length >= 50
              ? "pass"
              : !metaRobots.includes("noindex") && titleText
                ? "warn"
                : "fail",
          detail: metaRobots.includes("noindex")
            ? "Page contains a noindex robots directive."
            : `Title: ${titleText.length} chars, Meta description: ${metaDescription.length} chars.`,
          fix: "Ensure the page is indexable with a 35–60 char <title> and 110–155 char meta description.",
        },
        {
          id: "canonical-schema",
          label: "Self-canonical URL & structured data (JSON-LD)",
          maxPoints: 8,
          points: (hasCanonical ? 4 : 0) + (hasJsonLd ? 4 : 0),
          status: hasCanonical && hasJsonLd ? "pass" : hasCanonical || hasJsonLd ? "warn" : "fail",
          detail: `${hasCanonical ? "Canonical tag found" : "Missing canonical tag"}; ${hasJsonLd ? "JSON-LD present" : "no JSON-LD structured data"}.`,
          fix: "Add a self-referencing <link rel='canonical'> and SoftwareApplication / WebPage JSON-LD matching visible text.",
        },
      ],
    },
    {
      id: "technical",
      name: "Technical & Mobile Basics",
      maxPoints: 12,
      checks: [
        {
          id: "https-viewport",
          label: "HTTPS transport & mobile viewport meta tag",
          maxPoints: 6,
          points:
            (!url || url.startsWith("https://") ? 3 : 0) + (hasViewport || isPlainCopy ? 3 : 0),
          status:
            (!url || url.startsWith("https://")) && (hasViewport || isPlainCopy) ? "pass" : "warn",
          detail: hasViewport
            ? "Responsive viewport meta tag detected."
            : "Missing <meta name='viewport'> tag for mobile scaling.",
          fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1" /> and serve strictly over HTTPS.',
        },
        {
          id: "images-weight",
          label: "Image alt text coverage & lightweight HTML weight",
          maxPoints: 6,
          points:
            (imgTags.length === 0 || imgsWithAlt === imgTags.length ? 3 : 1) +
            (responseBytes === 0 || responseBytes <= 350_000 ? 3 : 1),
          status:
            (imgTags.length === 0 || imgsWithAlt === imgTags.length) &&
            (responseBytes === 0 || responseBytes <= 350_000)
              ? "pass"
              : "warn",
          detail:
            imgTags.length > 0
              ? `${imgsWithAlt}/${imgTags.length} image(s) have alt attributes.`
              : "No <img> tags needing alt attributes.",
          fix: "Add descriptive alt text to every informative product image and keep HTML payloads lean.",
        },
      ],
    },
  ];

  const scoredPillars = pillars.map((pillar) => {
    const earned = pillar.checks.reduce((sum, c) => sum + c.points, 0);
    return {
      ...pillar,
      earned,
      pct: Math.round((earned / pillar.maxPoints) * 100),
    };
  });

  const score = scoredPillars.reduce((sum, p) => sum + p.earned, 0);
  const grade = letterGrade(score);
  const band = score >= 85 ? "strong" : score >= 65 ? "workable" : "high_friction";

  const allFailedOrWarn = scoredPillars
    .flatMap((pillar) =>
      pillar.checks
        .filter((check) => check.status !== "pass")
        .map((check) => ({
          ...check,
          pillarName: pillar.name,
          potentialGain: check.maxPoints - check.points,
        })),
    )
    .sort((a, b) => b.potentialGain - a.potentialGain);

  const topFixes = allFailedOrWarn.slice(0, 3);

  const brandGuess = (
    titleText.split(/[—–|-]/)[0] ||
    primaryH1.split(/\s+/).slice(0, 3).join(" ") ||
    "Your Launch"
  )
    .trim()
    .slice(0, 48);

  const rewrittenCopy = {
    eyebrow: `${brandGuess} · Waitlist`,
    heading:
      primaryH1 && primaryH1.length <= 140 && h1Words >= 4 && h1Words <= 14
        ? primaryH1.slice(0, 140).trim()
        : `Join the ${brandGuess} waitlist.`,
    subheadline:
      metaDescription.length >= 40
        ? metaDescription.slice(0, 220)
        : `Join the waitlist for ${brandGuess} to hear when it becomes available.`,
    buttonText: genericCta || !primaryCta ? "Request early access" : primaryCta.slice(0, 36),
    privacyNote: "",
  };

  return {
    score,
    grade,
    band,
    statusCode,
    sourceMode: url ? "url" : "html",
    auditedHost: url ? new URL(url).hostname : "Manual draft",
    recommendedTemplateId: templateForLaunchType(launchType),
    pillars: scoredPillars,
    topFixes,
    rewrittenCopy,
    extractedSignals: {
      wordCount,
      h1Count: h1Matches.length,
      visibleInputCount: visibleInputs.length,
      navLinkCount: navLinks,
      imageCount: imgTags.length,
      responseKb: responseBytes > 0 ? Math.round(responseBytes / 1024) : 0,
    },
    disclaimer:
      "This score reflects observable HTML and conversion hygiene signals; it does not guarantee a specific conversion rate.",
  };
}
