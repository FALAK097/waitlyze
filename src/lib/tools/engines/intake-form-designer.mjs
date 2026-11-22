export const INTAKE_SEGMENTS = Object.freeze([
  { value: "b2b_saas", label: "B2B SaaS Beta", templateId: "saas" },
  { value: "devtool_api", label: "Developer Tool / API", templateId: "developer" },
  { value: "ai_workflow", label: "AI Workflow Product", templateId: "ai" },
  { value: "consumer_app", label: "Consumer Mobile App", templateId: "mobile" },
  { value: "fintech", label: "Fintech / Compliance", templateId: "saas" },
  { value: "design_partner", label: "Enterprise Design Partner", templateId: "saas" },
]);

export const QUALIFICATION_GOALS = Object.freeze([
  { value: "identify_icp", label: "Identify ideal ICP & team size" },
  { value: "high_urgency", label: "Prioritize high-urgency buyers" },
  { value: "tech_stack", label: "Segment by stack / integration" },
  { value: "filter_noise", label: "Filter out non-target signups" },
]);

export const FRICTION_BUDGETS = Object.freeze([
  { value: "ultra_fast", label: "Ultra-fast (Email + 1)", maxFields: 1 },
  { value: "balanced", label: "Balanced (Email + 2–3)", maxFields: 3 },
  { value: "high_intent", label: "Application (Email + 4–5)", maxFields: 5 },
]);

const FIELD_BANK = Object.freeze({
  b2b_saas: [
    {
      id: "role",
      label: "Your role",
      type: "select",
      required: true,
      placeholder: "Select your role",
      options: ["Founder / Exec", "Product", "Engineering", "Growth / Marketing", "Operations"],
      rationale: "Fast single tap to separate buyers from researchers.",
      vipRule: { condition: "Founder / Exec or Product", bonusPoints: 40, tag: "Decision Maker" },
    },
    {
      id: "team-size",
      label: "Company team size",
      type: "select",
      required: true,
      placeholder: "Select team size",
      options: ["Solo", "2–10", "11–50", "51–200", "200+"],
      rationale: "Instant ICP sizing without asking for revenue.",
      vipRule: { condition: "11–50 or 51–200", bonusPoints: 50, tag: "Target ICP" },
    },
    {
      id: "timeline",
      label: "When are you looking to roll this out?",
      type: "select",
      required: false,
      placeholder: "Select timeline",
      options: ["This month", "Next 1–3 months", "Evaluating for later"],
      rationale: "Surfaces immediate design partners.",
      vipRule: { condition: "This month", bonusPoints: 60, tag: "High Urgency" },
    },
    {
      id: "current-tool",
      label: "Current tool you use today",
      type: "text",
      required: false,
      placeholder: "e.g., Notion, Spreadsheets, Linear",
      options: [],
      rationale: "Reveals migration needs and competitor positioning.",
      vipRule: null,
    },
    {
      id: "main-blocker",
      label: "Biggest bottleneck you want to solve",
      type: "textarea",
      required: false,
      placeholder: "1–2 sentences on your current workflow pain",
      options: [],
      postSignupCandidate: true,
      rationale: "High qualitative signal, but adds typing friction on mobile.",
      vipRule: null,
    },
  ],
  devtool_api: [
    {
      id: "primary-stack",
      label: "Primary runtime / language",
      type: "select",
      required: true,
      placeholder: "Select runtime",
      options: ["TypeScript / Node.js", "Python", "Go", "Rust", "Java / JVM"],
      rationale: "Tells you which SDK to ship first.",
      vipRule: { condition: "TypeScript / Node.js or Python", bonusPoints: 40, tag: "Wave 1 SDK" },
    },
    {
      id: "use-case",
      label: "Primary environment",
      type: "select",
      required: true,
      placeholder: "Select environment",
      options: [
        "Production workload",
        "Side project / prototype",
        "Internal tooling",
        "Evaluating",
      ],
      rationale: "Separates commercial builders from hobbyists cleanly.",
      vipRule: { condition: "Production workload", bonusPoints: 60, tag: "Production VIP" },
    },
    {
      id: "monthly-volume",
      label: "Estimated monthly API calls",
      type: "select",
      required: false,
      placeholder: "Select volume",
      options: ["< 50k", "50k – 500k", "500k – 5M", "5M+"],
      rationale: "Sizes infrastructure capacity before inviting cohorts.",
      vipRule: { condition: "500k+", bonusPoints: 50, tag: "High Volume" },
    },
    {
      id: "github-org",
      label: "GitHub handle or org (optional)",
      type: "text",
      required: false,
      placeholder: "github.com/your-org",
      options: [],
      rationale: "Helps prioritize active open-source maintainers.",
      vipRule: null,
    },
    {
      id: "integration-notes",
      label: "Frameworks or cloud providers you deploy on",
      type: "textarea",
      required: false,
      placeholder: "Cloudflare Workers, Vercel, AWS, etc.",
      options: [],
      postSignupCandidate: true,
      rationale: "Helpful for docs coverage; best optional or post-signup.",
      vipRule: null,
    },
  ],
  ai_workflow: [
    {
      id: "workflow-goal",
      label: "First workflow you want to automate",
      type: "select",
      required: true,
      placeholder: "Choose workflow",
      options: [
        "Customer support",
        "Sales research",
        "Code & PR review",
        "Internal docs",
        "Data extraction",
      ],
      rationale: "Guides onboarding template assignment.",
      vipRule: { condition: "Matches v1 workflow focus", bonusPoints: 45, tag: "Core Fit" },
    },
    {
      id: "model-provider",
      label: "Preferred AI stack",
      type: "select",
      required: false,
      placeholder: "Select provider",
      options: ["OpenAI", "Anthropic Claude", "Google Gemini", "Self-hosted / Open weights"],
      rationale: "Identifies BYOK and compliance expectations.",
      vipRule: null,
    },
    {
      id: "data-sensitivity",
      label: "Compliance requirement",
      type: "select",
      required: false,
      placeholder: "Select requirement",
      options: ["Standard cloud", "SOC 2 required", "Zero data retention", "On-prem / VPC"],
      rationale: "Flags enterprise procurement needs early.",
      vipRule: { condition: "Standard cloud", bonusPoints: 35, tag: "Fast Onboard" },
    },
    {
      id: "seat-count",
      label: "Expected active users",
      type: "number",
      required: false,
      placeholder: "10",
      options: [],
      rationale: "Quick seat sizing for beta invites.",
      vipRule: null,
    },
    {
      id: "sample-prompt",
      label: "Describe one recurring task you want handled",
      type: "textarea",
      required: false,
      placeholder: "Optional 1-sentence example",
      options: [],
      postSignupCandidate: true,
      rationale: "Rich product research; move post-signup if conversion dips.",
      vipRule: null,
    },
  ],
  consumer_app: [
    {
      id: "platform",
      label: "Primary device",
      type: "select",
      required: true,
      placeholder: "Select device",
      options: ["iOS (iPhone)", "Android", "Web + Desktop"],
      rationale: "Required so you only send TestFlight links to iOS users.",
      vipRule: { condition: "iOS (iPhone)", bonusPoints: 30, tag: "TestFlight Ready" },
    },
    {
      id: "goal",
      label: "What are you most excited for?",
      type: "select",
      required: false,
      placeholder: "Select focus",
      options: [
        "Daily habit tracking",
        "Sharing with friends",
        "Importing past data",
        "Early perks",
      ],
      rationale: "Zero-friction tap question for onboarding personalization.",
      vipRule: null,
    },
    {
      id: "beta-feedback",
      label: "Willing to share 2 minutes of beta feedback?",
      type: "checkbox",
      required: false,
      placeholder: "",
      options: [],
      rationale: "Identifies vocal early champions.",
      vipRule: { condition: "Checked yes", bonusPoints: 25, tag: "Beta Champion" },
    },
    {
      id: "referral-source",
      label: "Where did you hear about us?",
      type: "text",
      required: false,
      placeholder: "Friend, X, podcast, AI assistant...",
      options: [],
      rationale: "Captures dark-social and AI-assistant attribution.",
      vipRule: null,
    },
  ],
  fintech: [
    {
      id: "entity-type",
      label: "Organization type",
      type: "select",
      required: true,
      placeholder: "Select type",
      options: ["Startup (US)", "Startup (Global)", "SMB / Agency", "Enterprise"],
      rationale: "Filters supported jurisdictions immediately.",
      vipRule: {
        condition: "Supported launch jurisdiction",
        bonusPoints: 50,
        tag: "Eligible Wave 1",
      },
    },
    {
      id: "monthly-volume",
      label: "Monthly transaction volume",
      type: "select",
      required: true,
      placeholder: "Select volume",
      options: ["Under $25k", "$25k – $250k", "$250k – $1M", "$1M+"],
      rationale: "High-signal underwriting & priority cohort sizing.",
      vipRule: { condition: "$250k+", bonusPoints: 70, tag: "Priority Underwriting" },
    },
    {
      id: "accounting-stack",
      label: "Accounting software",
      type: "select",
      required: false,
      placeholder: "Select stack",
      options: ["QuickBooks", "Xero", "NetSuite", "Other"],
      rationale: "Matches native integrations.",
      vipRule: null,
    },
    {
      id: "company-url",
      label: "Company website",
      type: "text",
      required: false,
      placeholder: "https://company.com",
      options: [],
      rationale: "Speeds up KYB screening before invite.",
      vipRule: null,
    },
  ],
  design_partner: [
    {
      id: "role",
      label: "Your role",
      type: "select",
      required: true,
      placeholder: "Select role",
      options: ["VP / Head of Dept", "Founder / CEO", "Team Lead", "Individual Contributor"],
      rationale: "Identifies pilot sponsors.",
      vipRule: { condition: "VP / Founder", bonusPoints: 60, tag: "Executive Sponsor" },
    },
    {
      id: "company-size",
      label: "Company headcount",
      type: "select",
      required: true,
      placeholder: "Select headcount",
      options: ["1–20", "21–100", "101–500", "500+"],
      rationale: "Targets enterprise design partner band.",
      vipRule: { condition: "101–500 or 500+", bonusPoints: 75, tag: "Enterprise Pilot" },
    },
    {
      id: "pilot-ready",
      label: "Ready for a 30-day hands-on pilot?",
      type: "checkbox",
      required: false,
      placeholder: "",
      options: [],
      rationale: "Confirms active design partner commitment.",
      vipRule: { condition: "Checked yes", bonusPoints: 50, tag: "Pilot Ready" },
    },
    {
      id: "company-name",
      label: "Company name",
      type: "text",
      required: true,
      placeholder: "Acme Corp",
      options: [],
      rationale: "Enables manual account research.",
      vipRule: null,
    },
    {
      id: "success-criteria",
      label: "What would make a 30-day pilot a clear win?",
      type: "textarea",
      required: false,
      placeholder: "e.g., Cut onboarding time from 4 days to 1 hour",
      options: [],
      postSignupCandidate: true,
      rationale: "Gives founders immediate discovery call prep.",
      vipRule: null,
    },
  ],
});

const FIELD_FRICTION_WEIGHT = Object.freeze({
  select: 12,
  checkbox: 8,
  number: 16,
  text: 20,
  textarea: 30,
});

export function evaluateFormFriction(fields = []) {
  const active = fields.filter((f) => f.enabled !== false);
  const rawScore = active.reduce((sum, field) => {
    const base = FIELD_FRICTION_WEIGHT[field.type] ?? 15;
    return sum + base + (field.required ? 4 : 0);
  }, 10);
  const score = Math.min(100, rawScore);

  let label = "Ultra-Low Friction";
  let tone = "success";
  let impactNote = "Minimal completion drop-off; ideal for broad top-of-funnel signups.";

  if (score >= 70) {
    label = "Abandonment Risk";
    tone = "danger";
    impactNote =
      "Heavy form load. Move open textareas to post-signup or mark secondary fields optional unless running a selective application.";
  } else if (score >= 48) {
    label = "High-Intent Application";
    tone = "warning";
    impactNote =
      "Expect fewer raw signups but significantly stronger qualification signal per applicant.";
  } else if (score >= 28) {
    label = "Balanced Conversion & Signal";
    tone = "success";
    impactNote = "Sweet spot for B2B and developer betas using quick tappable select fields.";
  }

  const deferSuggestions = active
    .filter((f) => f.type === "textarea" || f.postSignupCandidate)
    .map((f) => f.label);

  return { score, label, tone, impactNote, activeCount: active.length, deferSuggestions };
}

export function designBetaIntakeForm({
  segment = "b2b_saas",
  goal = "identify_icp",
  frictionBudget = "balanced",
} = {}) {
  const budgetObj = FRICTION_BUDGETS.find((b) => b.value === frictionBudget) || FRICTION_BUDGETS[1];
  const segmentObj = INTAKE_SEGMENTS.find((s) => s.value === segment) || INTAKE_SEGMENTS[0];
  const bank = FIELD_BANK[segmentObj.value] || FIELD_BANK.b2b_saas;

  const fields = bank.map((field, index) => ({
    ...field,
    enabled: index < budgetObj.maxFields,
  }));

  return {
    segment: segmentObj,
    goal,
    frictionBudget: budgetObj,
    fields,
  };
}
