import { sectionSchema, templateFormSchema, templateSnapshotSchema } from "../templates/catalog.mjs";

const editPage = (id) => `/wait-lists/${id}/edit`;
const waitlistSettings = (id) => `/wait-lists/${id}/settings#custom-domain-title`;

export function assessWaitlistReadiness(waitlist) {
  const parsed = templateSnapshotSchema.safeParse(waitlist.templateSnapshot);
  const sections = Array.isArray(waitlist.templateSnapshot?.sections) ? waitlist.templateSnapshot.sections : [];
  const formSections = sections.filter((section) => section?.type === "form");
  const formReady = formSections.length === 1 && sectionSchema.safeParse(formSections[0]).success && templateFormSchema.safeParse(waitlist.templateSnapshot?.form).success;
  const contentReady = parsed.success && formReady;

  const checks = [
    {
      key: "page-structure",
      label: "Page structure",
      status: parsed.success ? "ready" : "action",
      detail: parsed.success ? "Your saved page matches the template requirements." : "Review the page structure before publishing.",
      href: `${editPage(waitlist.id)}#page-content`,
      actionLabel: "Open page editor",
    },
    {
      key: "signup-form",
      label: "Signup form",
      status: formReady ? "ready" : "action",
      detail: formReady ? "One valid email signup form is configured." : "Add one valid email signup form to accept signups.",
      href: `${editPage(waitlist.id)}#page-content`,
      actionLabel: "Open page editor",
    },
  ];

  if (waitlist.status === "DRAFT") {
    checks.push({
      key: "publication",
      label: "Publish your waitlist",
      status: waitlist.canPublish === false || !contentReady ? "pending" : "action",
      detail: waitlist.canPublish === false ? "A workspace owner or admin needs to publish this draft."
        : !contentReady ? "Complete the page and signup checks above before publishing."
          : "Drafts stay private until you publish them.",
      ...(waitlist.canPublish === false ? { stateLabel: "Admin required" } : !contentReady ? { stateLabel: "Finish setup" } : {}),
      ...(waitlist.canPublish === false || !contentReady ? {} : { href: `${editPage(waitlist.id)}#publication-actions`, actionLabel: "Open publish controls" }),
    });
  } else if (waitlist.status === "PAUSED") {
    checks.push({
      key: "publication",
      label: "Resume signups",
      status: waitlist.canPublish === false || !contentReady ? "pending" : "action",
      detail: waitlist.canPublish === false ? "A workspace owner or admin needs to resume signups."
        : !contentReady ? "Complete the page and signup checks above before resuming signups."
          : "Signups are paused. Resume them when you’re ready.",
      ...(waitlist.canPublish === false ? { stateLabel: "Admin required" } : !contentReady ? { stateLabel: "Finish setup" } : {}),
      ...(waitlist.canPublish === false || !contentReady ? {} : { href: `${editPage(waitlist.id)}#publication-actions`, actionLabel: "Open publication controls" }),
    });
  } else {
    const published = templateSnapshotSchema.safeParse(waitlist.publishedSnapshot);
    const hasPublication = waitlist.publishedRevision != null && published.success;
    const currentIsLive = hasPublication && waitlist.templateRevision === waitlist.publishedTemplateRevision;
    checks.push({
      key: "publication",
      label: currentIsLive ? "Published page" : "Publish your latest changes",
      status: currentIsLive ? "ready" : waitlist.canPublish === false || !contentReady ? "pending" : "action",
      detail: currentIsLive
        ? "Your latest page version is live."
        : waitlist.canPublish === false ? "A workspace owner or admin needs to publish the saved changes."
          : !contentReady ? "Complete the page and signup checks above before publishing changes."
          : !hasPublication ? "The published page needs a fresh, valid version." : "Saved page changes are not live yet.",
      ...(!currentIsLive && waitlist.canPublish === false ? { stateLabel: "Admin required" } : !currentIsLive && !contentReady ? { stateLabel: "Finish setup" } : {}),
      ...(currentIsLive || waitlist.canPublish === false || !contentReady ? {} : { href: `${editPage(waitlist.id)}#publication-actions`, actionLabel: "Open publication controls" }),
    });
  }

  if (waitlist.customDomain) {
    const active = waitlist.customDomain.status === "ACTIVE";
    const waiting = waitlist.customDomain.status === "VERIFYING";
    const detail = active ? "Your custom domain is connected."
      : waiting ? "Your provider is still checking the domain."
        : waitlist.customDomain.status === "NEEDS_DNS" ? "Finish DNS setup to use your custom domain."
          : "Review the domain settings to restore the connection.";
    checks.push({
      key: "custom-domain",
      label: "Custom domain",
      status: active ? "ready" : waiting ? "pending" : "action",
      detail,
      ...(!active && !waiting ? { href: waitlistSettings(waitlist.id) } : {}),
      ...(!active && !waiting ? { actionLabel: "Open domain settings" } : {}),
    });
  }

  return checks;
}
