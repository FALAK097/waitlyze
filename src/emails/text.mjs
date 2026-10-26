// Plain-text fallbacks for every platform (us → our users) email. Each
// builder mirrors its HTML template's copy so text-only inboxes get the same
// message, links included. Keep these in sync with src/emails/templates/*.

export function welcomeText({ name, url }) {
  const greeting = name ? `Welcome, ${name}.` : "Welcome to Waitlyze.";
  return [
    greeting,
    "",
    "Your next idea deserves an audience. Waitlyze gives you a simple page to collect early interest and turn every signup into an invitation to share.",
    "",
    `Create your first waitlist: ${url}`,
    "",
    "A good place to start:",
    "01 Shape your page — add your launch details and make it yours.",
    "02 Invite your first people — share one link wherever your community is.",
    "03 Let interest grow — give new subscribers a personal link to pass along.",
    "",
    "Questions as you get started? Reply to this email — we're happy to help.",
  ].join("\n");
}

export function workspaceInvitationText({ inviterName, workspaceName, role, url }) {
  return [
    "You've been invited",
    "",
    `${inviterName || "A workspace admin"} has invited you into ${workspaceName} on Waitlyze. Join the team to work on waitlists, subscribers, and launch performance together.`,
    "",
    `Workspace: ${workspaceName}`,
    `Role: ${role}`,
    "Expires: In 7 days",
    "",
    `Accept invitation: ${url}`,
    "",
    "This private invitation expires in seven days and can be used once. If you weren't expecting it, you can safely ignore this message.",
  ].join("\n");
}

export function signupMilestoneText({ waitlistName, count, url, showReferrals = true }) {
  const first = count === 1;
  const nextMilestone = count < 10 ? 10 : count < 100 ? 100 : count < 1000 ? 1000 : null;
  const formatted = Number(count || 0).toLocaleString("en-US");
  const lines = [
    first ? "Your first signup is in." : `${formatted} signups on ${waitlistName}.`,
    "",
    first
      ? `${waitlistName} has its first sign of interest. They’re confirming their address now and will appear in your subscriber list once they do.`
      : showReferrals
        ? `${waitlistName} is gathering momentum. Every subscriber has a personal referral link, making it easy for your early audience to bring in the next wave.`
        : `${waitlistName} is gathering momentum. Keep sharing your page to bring in the next wave.`,
    "",
    `Waitlist: ${waitlistName}`,
    `Milestone: ${first ? "First signup" : `${formatted} signups`}`,
    `Next up: ${nextMilestone ? `${nextMilestone.toLocaleString("en-US")} signups` : "Keep growing"}`,
    "",
    `${first ? "See your subscribers" : "Open the subscribers list"}: ${url}`,
    "",
  ];
  if (first)
    lines.push(
      showReferrals
        ? "Share your page to get there — your thank-you screen makes it easy for the first people to invite others."
        : "Share your page to get there — invite more people to discover your launch.",
    );
  else if (nextMilestone)
    lines.push(`You’ll hear from us again at ${nextMilestone.toLocaleString("en-US")} signups.`);
  else lines.push("Thanks for building with us — keep sharing your page.");
  return lines.join("\n");
}

export function broadcastSummaryText({
  waitlistName,
  subject,
  status,
  delivered,
  failed,
  skipped,
  canceled,
  url,
}) {
  const number = (value) => Number(value || 0).toLocaleString("en-US");
  const heading =
    status === "SENT"
      ? delivered === 1
        ? "Your broadcast landed."
        : `Your broadcast reached ${number(delivered)} people.`
      : status === "CANCELED"
        ? "Broadcast canceled."
        : "Broadcast needs attention.";
  const allAccepted = status === "SENT" && failed === 0 && skipped === 0 && canceled === 0;
  return [
    heading,
    "",
    allAccepted
      ? `Every opted-in subscriber on ${waitlistName} was accepted by the sender. Nothing else to do here.`
      : status === "SENT"
        ? `"${subject}" finished sending. The addresses below were skipped or rejected — they won’t be retried.`
        : status === "CANCELED"
          ? `You stopped "${subject}" before it finished. Recipients already accepted by the sender may still receive it.`
          : `"${subject}" stopped before it could finish. Open the report to see which recipients failed and why.`,
    "",
    `Delivered: ${number(delivered)} accepted`,
    `Skipped: ${number(skipped)}`,
    `Failed: ${number(failed)}`,
    `Canceled: ${number(canceled)}`,
    "",
    `Open broadcast report: ${url}`,
    "",
    "“Delivered” means the email service accepted the message. Inbox placement depends on the recipient’s provider.",
  ].join("\n");
}

export function waitlistPublishedText({ waitlistName, pageUrl, dashboardUrl }) {
  return [
    "You’re live.",
    "",
    `${waitlistName} is published and ready to collect signups. Share the link below wherever your community is — every join feeds your referral loop.`,
    "",
    `Your page: ${pageUrl}`,
    `Manage this waitlist: ${dashboardUrl}`,
    "",
    "A good place to start:",
    "01 Share your link — post it where your early audience already hangs out.",
    "02 Watch the first signups land — we’ll email you when the first person joins.",
    "03 Keep the loop warm — broadcasts and automations turn interest into momentum.",
    "",
    "Questions about your launch? Reply to this email — we’re happy to help.",
  ].join("\n");
}

export function feedbackText({ name, email, title, label, feedback, page, submittedAt, hasImage }) {
  return [
    `Feedback from ${name}`,
    "",
    `From: ${name} (${email})`,
    `Type: ${label}`,
    `Title: ${title}`,
    ...(page ? [`Page: ${page}`] : []),
    `Sent: ${submittedAt}`,
    "",
    feedback,
    ...(hasImage ? ["", "A screenshot is attached to this email."] : []),
  ].join("\n");
}
