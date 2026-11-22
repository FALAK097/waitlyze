export const LAUNCH_PLANNER_OPTIONS = Object.freeze({
  categories: [
    { value: "saas", label: "B2B SaaS", templateId: "saas" },
    { value: "ai", label: "AI Product", templateId: "ai" },
    { value: "developer", label: "Developer Tool / API", templateId: "developer" },
    { value: "mobile", label: "Mobile App", templateId: "mobile" },
    { value: "creator", label: "Newsletter / Creator", templateId: "creator" },
    { value: "event", label: "Event / Cohort", templateId: "event" },
    { value: "commerce", label: "Hardware / Pre-order", templateId: "commerce" },
  ],
  launchTypes: [
    { value: "private_beta", label: "Private beta wave" },
    { value: "public_launch", label: "Public v1 launch" },
    { value: "product_hunt", label: "Product Hunt launch" },
    { value: "developer_preview", label: "Developer preview" },
    { value: "preorder", label: "Batch-one pre-order" },
  ],
  horizons: [
    { value: 14, label: "14-day sprint" },
    { value: 30, label: "30-day launch" },
    { value: 60, label: "60-day build-up" },
    { value: 90, label: "90-day runway" },
  ],
  existingAssets: [
    { id: "domain", label: "Domain registered", pillar: "page" },
    { id: "landingPage", label: "Waitlist copy & positioning", pillar: "page" },
    { id: "waitlistForm", label: "Live waitlist form", pillar: "audience" },
    { id: "demoVisuals", label: "Product screenshots / demo", pillar: "proof" },
    { id: "emailVerification", label: "Double opt-in verification", pillar: "audience" },
    { id: "referralMechanics", label: "Referral link & rewards plan", pillar: "audience" },
    { id: "welcomeEmail", label: "Welcome & launch emails drafted", pillar: "email" },
    { id: "sendingDns", label: "SPF / DKIM / DMARC verified", pillar: "email" },
    { id: "utmAnalytics", label: "UTM links & analytics wired", pillar: "measurement" },
  ],
  channels: [
    { value: "product_hunt", label: "Product Hunt" },
    { value: "x_twitter", label: "X / Twitter" },
    { value: "hacker_news", label: "Hacker News" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "newsletter", label: "Newsletters" },
    { value: "communities", label: "Founder / Slack communities" },
  ],
});

export const DEFAULT_LAUNCH_PLANNER_INPUTS = Object.freeze({
  category: "saas",
  launchType: "private_beta",
  horizonDays: 30,
  targetLaunchDate: "",
  teamSize: 2,
  currentAudience: 150,
  weeklyHours: 10,
  existingAssets: ["domain", "demoVisuals"],
  channels: ["x_twitter", "product_hunt", "communities"],
});

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(baseDate, offsetDays) {
  const next = new Date(baseDate.getTime());
  next.setUTCDate(next.getUTCDate() + offsetDays);
  return next;
}

const TASK_BLUEPRINTS = [
  {
    id: "waitlist-live",
    phase: "Phase 1 · Validation & Waitlist Setup",
    title: "Publish hosted waitlist page or embed signup form",
    assetKey: "waitlistForm",
    pillar: "audience",
    progressRatio: 0.05,
    hours: 2,
    priority: "Critical",
    dependency: "None (start here first)",
  },
  {
    id: "value-prop",
    phase: "Phase 1 · Validation & Waitlist Setup",
    title: "Tighten hero headline, single CTA, and honest proof block",
    assetKey: "landingPage",
    pillar: "page",
    progressRatio: 0.1,
    hours: 2,
    priority: "Critical",
    dependency: "Waitlist draft created",
  },
  {
    id: "double-optin",
    phase: "Phase 1 · Validation & Waitlist Setup",
    title: "Enable double opt-in verification and anti-abuse fraud limits",
    assetKey: "emailVerification",
    pillar: "audience",
    progressRatio: 0.15,
    hours: 1,
    priority: "Critical",
    dependency: "Live waitlist form",
  },
  {
    id: "dns-auth",
    phase: "Phase 1 · Validation & Waitlist Setup",
    title: "Configure custom sending domain SPF, DKIM, and DMARC records",
    assetKey: "sendingDns",
    pillar: "email",
    progressRatio: 0.22,
    hours: 1.5,
    priority: "Critical",
    dependency: "Domain registered",
  },
  {
    id: "demo-assets",
    phase: "Phase 2 · Warm-Up & Referral Seeding",
    title: "Capture crisp product screenshot or 45-second walkthrough video",
    assetKey: "demoVisuals",
    pillar: "proof",
    progressRatio: 0.35,
    hours: 3,
    priority: "High",
    dependency: "Core product flow ready",
  },
  {
    id: "referral-loop",
    phase: "Phase 2 · Warm-Up & Referral Seeding",
    title: "Configure post-signup referral share card and Tier 1 reward",
    assetKey: "referralMechanics",
    pillar: "audience",
    progressRatio: 0.42,
    hours: 1.5,
    priority: "High",
    dependency: "Double opt-in enabled",
  },
  {
    id: "utm-matrix",
    phase: "Phase 2 · Warm-Up & Referral Seeding",
    title: "Generate normalized UTM tracking links for every launch channel",
    assetKey: "utmAnalytics",
    pillar: "measurement",
    progressRatio: 0.5,
    hours: 1,
    priority: "High",
    dependency: "Hosted URL live",
  },
  {
    id: "seed-first-50",
    phase: "Phase 2 · Warm-Up & Referral Seeding",
    title: "Seed first 25–50 verified subscribers from founder network & interviews",
    assetKey: null,
    pillar: "distribution",
    progressRatio: 0.58,
    hours: 4,
    priority: "High",
    dependency: "UTM links & referral card live",
  },
  {
    id: "email-drafts",
    phase: "Phase 3 · Launch Week Rehearsal",
    title: "Finalize welcome, milestone, warm-up, and launch-day email sequence",
    assetKey: "welcomeEmail",
    pillar: "email",
    progressRatio: 0.72,
    hours: 2.5,
    priority: "Critical",
    dependency: "Sending domain DNS verified",
  },
  {
    id: "warmup-send",
    phase: "Phase 3 · Launch Week Rehearsal",
    title: "Send behind-the-scenes warm-up note to early verified subscribers",
    assetKey: null,
    pillar: "email",
    progressRatio: 0.82,
    hours: 1.5,
    priority: "High",
    dependency: "Email drafts finalized",
  },
  {
    id: "rehearsal-test",
    phase: "Phase 3 · Launch Week Rehearsal",
    title: "Run end-to-end launch rehearsal: signup, verify, referral click, mobile check",
    assetKey: null,
    pillar: "measurement",
    progressRatio: 0.9,
    hours: 1.5,
    priority: "Critical",
    dependency: "All forms & emails active",
  },
  {
    id: "launch-day",
    phase: "Phase 4 · Launch Day & Rollout",
    title: "Publish launch channels, open Wave 1 invites, and send launch broadcast",
    assetKey: null,
    pillar: "distribution",
    progressRatio: 1.0,
    hours: 4,
    priority: "Critical",
    dependency: "Launch rehearsal passed",
  },
  {
    id: "post-launch-followup",
    phase: "Phase 4 · Launch Day & Rollout",
    title: "Review channel conversion rates and follow up with unactivated invites",
    assetKey: null,
    pillar: "measurement",
    progressRatio: 1.08,
    hours: 2,
    priority: "Standard",
    dependency: "Launch broadcast sent",
  },
];

export function planLaunchReadiness(rawInputs = {}) {
  const category = rawInputs.category || DEFAULT_LAUNCH_PLANNER_INPUTS.category;
  const launchType = rawInputs.launchType || DEFAULT_LAUNCH_PLANNER_INPUTS.launchType;
  const teamSize = Math.max(1, Math.min(50, Number(rawInputs.teamSize) || 2));
  const currentAudience = Math.max(0, Math.min(500000, Number(rawInputs.currentAudience) || 0));
  const weeklyHours = Math.max(2, Math.min(80, Number(rawInputs.weeklyHours) || 10));
  const existingSet = new Set(
    Array.isArray(rawInputs.existingAssets)
      ? rawInputs.existingAssets
      : DEFAULT_LAUNCH_PLANNER_INPUTS.existingAssets,
  );
  const channels =
    Array.isArray(rawInputs.channels) && rawInputs.channels.length
      ? rawInputs.channels
      : DEFAULT_LAUNCH_PLANNER_INPUTS.channels;

  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  let horizonDays = [14, 30, 60, 90].includes(Number(rawInputs.horizonDays))
    ? Number(rawInputs.horizonDays)
    : 30;
  let launchDate = addDays(todayUtc, horizonDays);

  if (
    typeof rawInputs.targetLaunchDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(rawInputs.targetLaunchDate)
  ) {
    const parsed = new Date(`${rawInputs.targetLaunchDate}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      const diffDays = Math.round((parsed.getTime() - todayUtc.getTime()) / (24 * 60 * 60 * 1000));
      horizonDays = Math.max(7, Math.min(180, diffDays));
      launchDate = addDays(todayUtc, horizonDays);
    }
  }

  // 6-pillar weighted readiness score (total 100)
  const pillars = [
    {
      id: "page",
      label: "Page & Value Prop",
      max: 20,
      score: (existingSet.has("domain") ? 8 : 0) + (existingSet.has("landingPage") ? 12 : 0),
    },
    {
      id: "audience",
      label: "Audience & Waitlist Mechanics",
      max: 20,
      score:
        (existingSet.has("waitlistForm") ? 9 : 0) +
        (existingSet.has("emailVerification") ? 6 : 0) +
        (existingSet.has("referralMechanics") ? 5 : 0),
    },
    {
      id: "email",
      label: "Email & Deliverability",
      max: 18,
      score: (existingSet.has("welcomeEmail") ? 9 : 0) + (existingSet.has("sendingDns") ? 9 : 0),
    },
    {
      id: "proof",
      label: "Proof & Assets",
      max: 16,
      score: existingSet.has("demoVisuals") ? 16 : 0,
    },
    {
      id: "distribution",
      label: "Distribution & Channels",
      max: 14,
      score: Math.min(
        14,
        channels.length * 3 + (currentAudience >= 100 ? 5 : currentAudience > 0 ? 2 : 0),
      ),
    },
    {
      id: "measurement",
      label: "Measurement & Attribution",
      max: 12,
      score: existingSet.has("utmAnalytics") ? 12 : 0,
    },
  ];

  const readinessScore = pillars.reduce((sum, p) => sum + p.score, 0);
  const band = readinessScore >= 80 ? "ready" : readinessScore >= 45 ? "in_progress" : "early";

  const tasks = TASK_BLUEPRINTS.map((task) => {
    const dayOffset = Math.round(horizonDays * task.progressRatio);
    const dueDate = formatIsoDate(addDays(todayUtc, dayOffset));
    const completed = Boolean(task.assetKey && existingSet.has(task.assetKey));
    return {
      ...task,
      dueDate,
      completed,
    };
  });

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const firstIncompleteTask = incompleteTasks[0] || tasks[0];
  const remainingHours = incompleteTasks.reduce((sum, t) => sum + t.hours, 0);
  const availableTotalHours = Number(
    ((horizonDays / 7) * weeklyHours * Math.min(teamSize, 3)).toFixed(1),
  );
  const bandwidthWarning = remainingHours > availableTotalHours * 0.85;

  const catOption =
    LAUNCH_PLANNER_OPTIONS.categories.find((c) => c.value === category) ||
    LAUNCH_PLANNER_OPTIONS.categories[0];

  return {
    inputs: {
      category,
      launchType,
      horizonDays,
      targetLaunchDate: formatIsoDate(launchDate),
      teamSize,
      currentAudience,
      weeklyHours,
      existingAssets: [...existingSet],
      channels,
    },
    readinessScore,
    band,
    pillars,
    tasks,
    firstIncompleteTask,
    remainingHours,
    availableTotalHours,
    bandwidthWarning,
    recommendedTemplateId: catOption.templateId,
  };
}

export function buildLaunchCalendarIcs(plan) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Waitlyze//Launch Lab Readiness Planner//EN",
    "CALSCALE:GREGORIAN",
  ];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  for (const task of plan.tasks) {
    if (task.completed) continue;
    const dateCompact = task.dueDate.replaceAll("-", "");
    const summary = task.title.replace(/[,;\\]/g, " ");
    const desc = `${task.phase} | Priority: ${task.priority} | Est: ${task.hours}h | Dependency: ${task.dependency} (Generated by Waitlyze Launch Lab)`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:waitlyze-${task.id}-${dateCompact}@waitlyze.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateCompact}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function buildLaunchMarkdown(plan) {
  const lines = [
    `# Product Launch Readiness Plan (Target: ${plan.inputs.targetLaunchDate})`,
    "",
    `- **Readiness Score:** ${plan.readinessScore}/100`,
    `- **Horizon:** ${plan.inputs.horizonDays} days`,
    `- **Remaining Effort:** ${plan.remainingHours} hrs`,
    "",
    "## Critical-Path Tasks",
  ];
  for (const task of plan.tasks) {
    lines.push(
      `- [${task.completed ? "x" : " "}] **${task.dueDate}**: ${task.title} _(${task.priority}, ${task.hours}h)_`,
    );
  }
  lines.push(
    "",
    "_Generated with Waitlyze Launch Lab (https://waitlyze.com/tools/product-launch-checklist)_",
  );
  return lines.join("\n");
}
