"use client";

import {
  ArrowUpRight01Icon,
  CloudUploadIcon,
  CodeIcon,
  Copy01Icon,
  Link01Icon,
  LinkSquare01Icon,
  Plug01Icon,
  Search01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { ImageUploadField } from "./image-upload-field";

const escapeAttribute = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const chip =
  "rounded-full border border-product-border-subtle px-2 py-1 text-xs text-product-text-secondary";

const sections = [
  { id: "checklist", label: "Publish checklist", icon: CloudUploadIcon },
  { id: "page", label: "Hosted page", icon: Link01Icon },
  { id: "embed", label: "Website embed", icon: CodeIcon },
  { id: "api", label: "API", icon: Plug01Icon },
  { id: "domain", label: "Custom domain", icon: LinkSquare01Icon },
  { id: "seo", label: "SEO", icon: Search01Icon },
];

const panelCopy = {
  checklist: {
    title: "Publish checklist",
    description:
      "Fix blockers, review what changed, then push your draft live. Draft edits stay private until you publish again.",
  },
  page: {
    title: "Hosted page",
    description: "The canonical address for this waitlist.",
  },
  embed: {
    title: "Website embed",
    description: "Paste this into any site. The frame sizes itself to the form.",
  },
  api: {
    title: "API",
    description: "Collect signups straight from your own backend.",
  },
  domain: {
    title: "Custom domain",
    description: "Serve this waitlist from a domain you own.",
  },
  seo: {
    title: "SEO",
    description: "How this page looks in search results and when it is shared.",
  },
};

function Section({ title, description, children, action }) {
  return (
    <section className="mt-9 first:mt-0" aria-label={title}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2! text-sm! font-medium!">{title}</h3>
          {description && (
            <p className="text-sm leading-relaxed text-product-text-secondary">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy is unavailable. Select the text and copy it manually.");
    }
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
      <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} aria-hidden="true" /> Copy{" "}
      {label.toLowerCase()}
    </Button>
  );
}

function ReadinessList({ items, tone, onFix }) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 grid list-none gap-2 p-0">
      {items.map((item) => (
        <li
          key={item.id}
          className={
            tone === "blocker"
              ? "flex flex-wrap items-start justify-between gap-4 rounded-lg bg-product-danger-bg px-3 py-2.5 text-product-danger-text"
              : "flex flex-wrap items-start justify-between gap-4 rounded-lg bg-product-bg-inset px-3 py-2.5"
          }
        >
          <div className="grid min-w-0 gap-1">
            <strong className="text-sm font-semibold">{item.title}</strong>
            <span
              className={
                tone === "blocker"
                  ? "text-xs leading-relaxed text-inherit opacity-80"
                  : "text-xs leading-relaxed text-product-text-secondary"
              }
            >
              {item.detail}
            </span>
          </div>
          {item.fix && onFix && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onFix(item.fix)}>
              {item.fix.label}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function PublishAndShare({
  snapshot,
  waitList,
  origin,
  readiness,
  changes,
  onFix,
  onSeoChange,
  pageStatus,
}) {
  const router = useRouter();
  const [section, setSection] = useState("checklist");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const published =
    waitList.status === "PUBLISHED" && !!waitList.publicSlug && waitList.publishedRevision > 0;
  const hostedUrl = waitList.publicSlug
    ? `${origin}/w/${encodeURIComponent(waitList.publicSlug)}`
    : "";
  const embedCode = `<div class="waitlyze-widget" data-key-id="${escapeAttribute(waitList.id)}"></div>\n<script src="${escapeAttribute(origin)}/js/embed.js" defer></script>`;
  const apiEndpoint = `${origin}/api/waitlist`;
  const domain = waitList.customDomain;

  const handleFix = (fix) => {
    if (fix.surface === "seo") {
      setSection("seo");
      return;
    }
    if (fix.surface === "referrals") {
      router.push(`/waitlists/${waitList.id}/settings?section=referral`);
      return;
    }
    onFix(fix);
  };

  const runConfirmed = () => {
    if (!confirming || !pageStatus) return;
    const action = confirming;
    setConfirming(null);
    if (action === "pause") pageStatus.onPause();
    else pageStatus.onRollback();
  };

  return (
    <div className="mx-auto w-full max-w-280">
      <div className="flex items-start gap-8 max-[760px]:flex-col lg:gap-12 xl:gap-18">
        <aside className="sticky top-6 w-52.5 min-w-0 shrink-0 max-[760px]:static max-[760px]:w-full">
          <nav
            aria-label="Publish and share sections"
            className="grid gap-1 max-[760px]:grid-cols-2 max-[760px]:gap-1.5"
          >
            {sections.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                aria-current={section === id ? "page" : undefined}
                onClick={() => setSection(id)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-item transition-colors duration-150 hover:bg-product-bg-inset max-[760px]:gap-2 max-[760px]:px-2.5",
                  section === id
                    ? "bg-product-bg-inset font-medium text-product-text-primary"
                    : "text-product-text-secondary hover:text-product-text-primary",
                )}
              >
                <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="max-w-190 min-w-0 flex-1" aria-labelledby="publish-panel-heading">
          <header className="mb-9 max-[760px]:mb-6">
            <h2 id="publish-panel-heading" className="mb-1.5!">
              {panelCopy[section].title}
            </h2>
            <p className="text-product-text-secondary">{panelCopy[section].description}</p>
          </header>

          {section === "checklist" && (
            <>
              {readiness.blockers.length > 0 ? (
                <ReadinessList items={readiness.blockers} tone="blocker" onFix={handleFix} />
              ) : (
                <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
                  This draft is ready to publish.
                </p>
              )}
              <ReadinessList items={readiness.warnings} tone="warning" onFix={handleFix} />

              {published && changes && (
                <Section
                  title="What changes when you publish"
                  description={
                    changes.changed
                      ? "Your draft replaces the live revision for every surface."
                      : "This draft matches the live revision."
                  }
                >
                  {changes.changed ? (
                    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                      {changes.added > 0 && <li className={chip}>{changes.added} block added</li>}
                      {changes.removed > 0 && (
                        <li className={chip}>{changes.removed} block removed</li>
                      )}
                      {changes.edited > 0 && (
                        <li className={chip}>{changes.edited} block edited</li>
                      )}
                      {changes.templateChanged && <li className={chip}>Template changed</li>}
                      {changes.brandChanged && <li className={chip}>Brand kit changed</li>}
                      {changes.formChanged && <li className={chip}>Signup form changed</li>}
                      {changes.statusChanged && <li className={chip}>Status page changed</li>}
                      {changes.seoChanged && (
                        <li className={chip}>Search and sharing metadata changed</li>
                      )}
                    </ul>
                  ) : (
                    <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
                      Nothing changed since the last publish.
                    </p>
                  )}
                </Section>
              )}

              {pageStatus && (
                <Section
                  title="Page status"
                  description="Pause signups or bring back the previous published version."
                >
                  <div className="flex flex-wrap gap-2">
                    {pageStatus.canPause && (
                      <Button
                        variant="outline"
                        onClick={() => setConfirming("pause")}
                        disabled={pageStatus.publishing}
                      >
                        Pause page
                      </Button>
                    )}
                    {pageStatus.canRollback && (
                      <Button
                        variant="ghost"
                        onClick={() => setConfirming("rollback")}
                        disabled={pageStatus.publishing}
                      >
                        Restore previous version
                      </Button>
                    )}
                  </div>
                </Section>
              )}
            </>
          )}

          {section === "page" &&
            (published && hostedUrl ? (
              <div className="grid gap-4">
                <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
                  <Link
                    className="inline-flex max-w-full min-w-0 items-center gap-2 break-all underline underline-offset-4"
                    href={hostedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {hostedUrl}
                    <HugeiconsIcon icon={LinkSquare01Icon} size={16} aria-hidden="true" />
                  </Link>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <CopyButton value={hostedUrl} label="Page link" />
                </div>
              </div>
            ) : (
              <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
                Publish the page to get a link you can share and an embed code for your own site.
              </p>
            ))}

          {section === "embed" &&
            (published ? (
              <div className="grid gap-4">
                <pre className="m-0 rounded-lg bg-product-bg-inset p-4 text-xs leading-relaxed break-words whitespace-pre-wrap">
                  <code>{embedCode}</code>
                </pre>
                <div className="flex flex-wrap items-center gap-2">
                  <CopyButton value={embedCode} label="Embed code" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewOpen((open) => !open)}
                    aria-expanded={previewOpen}
                  >
                    {previewOpen ? "Hide preview" : "Preview the embed"}
                  </Button>
                </div>
                {previewOpen && (
                  <div className="overflow-hidden rounded-xl border border-product-border-subtle bg-white">
                    <iframe
                      title={`${waitList.name} signup form preview`}
                      src={`${origin}/forms/${encodeURIComponent(waitList.id)}`}
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="block h-96 w-full border-0"
                    />
                  </div>
                )}
                <p className="m-0 text-xs leading-relaxed text-product-text-muted">
                  Referral and UTM parameters are forwarded from the host page.
                </p>
              </div>
            ) : (
              <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
                Publish the page to unlock the embed code.
              </p>
            ))}

          {section === "api" && (
            <div className="grid gap-4">
              <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
                <code className="font-product-mono text-xs break-all">{apiEndpoint}</code>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton value={apiEndpoint} label="Endpoint" />
                <Link
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                  href="/docs/api"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API docs <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
                </Link>
                <Link
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                  href="/settings?section=integrations"
                >
                  API keys
                </Link>
              </div>
            </div>
          )}

          {section === "domain" &&
            (domain ? (
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-product-mono text-xs break-all">{domain.hostname}</code>
                <span
                  className={
                    domain.status === "ACTIVE"
                      ? "rounded-full bg-product-success-bg px-2 py-1 text-xs text-product-success-text capitalize"
                      : domain.status === "NEEDS_ATTENTION"
                        ? "rounded-full bg-product-danger-bg px-2 py-1 text-xs text-product-danger-text capitalize"
                        : "rounded-full bg-product-bg-inset px-2 py-1 text-xs text-product-text-secondary capitalize"
                  }
                >
                  {domain.status.replace(/_/g, " ").toLowerCase()}
                </span>
              </div>
            ) : (
              <div className="grid justify-items-start gap-3">
                <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
                  No domain connected. Add one in settings when you want a branded address.
                </p>
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href={`/waitlists/${waitList.id}/settings?section=domain`}
                >
                  Connect a domain
                </Link>
              </div>
            ))}

          {section === "seo" && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="text-sm font-medium text-product-text-primary">Page title</div>
                <Label className="sr-only" htmlFor="publish-seo-title">
                  Page title
                </Label>
                <Input
                  id="publish-seo-title"
                  value={snapshot.seo.title}
                  maxLength={70}
                  placeholder={waitList.name || "Your waitlist"}
                  onChange={(event) => onSeoChange({ title: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-medium text-product-text-primary">Description</div>
                <Label className="sr-only" htmlFor="publish-seo-description">
                  Description
                </Label>
                <Input
                  id="publish-seo-description"
                  value={snapshot.seo.description}
                  maxLength={180}
                  placeholder="One sentence about what you are launching."
                  onChange={(event) => onSeoChange({ description: event.target.value })}
                />
              </div>
              <ImageUploadField
                label="Share image"
                value={snapshot.seo.image}
                onChange={(image) => onSeoChange({ image })}
                hint="Shown when someone shares the page. 1200×630 works best."
              />
              <div className="flex items-center gap-3">
                <Switch
                  id="publish-seo-indexable"
                  checked={snapshot.seo.indexable}
                  onCheckedChange={(indexable) => onSeoChange({ indexable })}
                />
                <Label className="sr-only" htmlFor="publish-seo-indexable">
                  Allow search engines to index this page
                </Label>
                <span className="text-sm text-product-text-primary">
                  Allow search engines to index this page
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogTitle>
            {confirming === "pause" ? "Pause this page?" : "Restore the previous version?"}
          </DialogTitle>
          <DialogDescription>
            {confirming === "pause"
              ? "Signups stop and visitors see the paused state until you publish again."
              : "The live page switches back to the previously published version."}
          </DialogDescription>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button onClick={runConfirmed}>
              {confirming === "pause" ? "Pause page" : "Restore previous version"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
