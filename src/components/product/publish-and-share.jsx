"use client";

import { ArrowUpRight01Icon, Copy01Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const escapeAttribute = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const chip =
  "rounded-full border border-product-border-subtle px-2 py-1 text-xs text-product-text-secondary";

function Section({ title, description, children, action }) {
  return (
    <section
      className="border-t border-product-border-subtle py-6 last:border-b"
      aria-label={title}
    >
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-product-text-secondary">
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function CopyButton({ value, label }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Copy is unavailable. Select the text and copy it manually.");
    }
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
      <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" /> Copy {label.toLowerCase()}
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
              ? "flex items-start justify-between gap-4 rounded-lg bg-product-danger-bg px-3 py-2.5 text-product-danger-text"
              : "flex items-start justify-between gap-4 rounded-lg bg-product-bg-inset px-3 py-2.5"
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
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const published =
    waitList.status === "PUBLISHED" && !!waitList.publicSlug && waitList.publishedRevision > 0;
  const hostedUrl = waitList.publicSlug
    ? `${origin}/w/${encodeURIComponent(waitList.publicSlug)}`
    : "";
  const embedCode = `<div class="waitlyze-widget" data-key-id="${escapeAttribute(waitList.id)}"></div>\n<script src="${escapeAttribute(origin)}/js/embed.js" defer></script>`;
  const apiEndpoint = `${origin}/api/v1/sign_up`;
  const domain = waitList.customDomain;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-14 pb-24">
      <header className="mb-10 max-w-xl">
        <p className="text-xs font-semibold tracking-widest text-product-text-muted uppercase">
          Publish &amp; share
        </p>
        <h2 className="mt-3 mb-4 text-3xl leading-tight tracking-tight text-balance md:text-4xl">
          One waitlist, wherever your audience is.
        </h2>
        <p className="text-sm leading-relaxed text-product-text-secondary">
          The hosted page, the embeddable form, and the API all read the same published revision.
          Draft edits stay private until you publish again.
        </p>
      </header>

      <Section
        title="Before you publish"
        description={
          readiness.blockers.length > 0
            ? "Fix these before publishing."
            : "Nothing blocks this publish. The notes below are worth a look."
        }
      >
        {readiness.blockers.length > 0 ? (
          <ReadinessList items={readiness.blockers} tone="blocker" onFix={onFix} />
        ) : (
          <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
            This draft is ready to publish.
          </p>
        )}
        <ReadinessList items={readiness.warnings} tone="warning" onFix={onFix} />
      </Section>

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
              {changes.removed > 0 && <li className={chip}>{changes.removed} block removed</li>}
              {changes.edited > 0 && <li className={chip}>{changes.edited} block edited</li>}
              {changes.templateChanged && <li className={chip}>Template changed</li>}
              {changes.brandChanged && <li className={chip}>Brand kit changed</li>}
              {changes.formChanged && <li className={chip}>Signup form changed</li>}
              {changes.statusChanged && <li className={chip}>Status page changed</li>}
              {changes.seoChanged && <li className={chip}>Search and sharing metadata changed</li>}
            </ul>
          ) : (
            <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
              Nothing changed since the last publish.
            </p>
          )}
        </Section>
      )}

      <Section
        title="Hosted page"
        description="The canonical address for this waitlist."
        action={
          published && hostedUrl ? (
            <Button variant="outline" size="sm" render={<Link href={hostedUrl} target="_blank" />}>
              Open page <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
            </Button>
          ) : null
        }
      >
        {published && hostedUrl ? (
          <>
            <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="inline-flex items-center gap-2 break-words underline underline-offset-4"
                href={hostedUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {hostedUrl}
                <HugeiconsIcon icon={LinkSquare01Icon} size={16} aria-hidden="true" />
              </Link>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CopyButton value={hostedUrl} label="Page link" />
            </div>
          </>
        ) : (
          <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
            Publish the page to get a link you can share and an embed code for your own site.
          </p>
        )}
      </Section>

      <Section
        title="Website embed"
        description="Paste this into any site. The frame sizes itself to the form."
      >
        {published ? (
          <>
            <pre className="m-0 rounded-lg bg-product-bg-inset p-4 text-xs leading-relaxed break-words whitespace-pre-wrap">
              <code>{embedCode}</code>
            </pre>
            <div className="mt-4 flex flex-wrap items-center gap-2">
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
              <div className="mt-4 overflow-hidden rounded-xl border border-product-border-subtle bg-white">
                <iframe
                  title={`${waitList.name} signup form preview`}
                  src={`${origin}/forms/${encodeURIComponent(waitList.id)}`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="block h-96 w-full border-0"
                />
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-product-text-muted">
              Referral and UTM parameters are forwarded from the host page. Plain HTML is the
              supported embed; no React package is published yet.
            </p>
          </>
        ) : (
          <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
            Publish the page to unlock the embed code.
          </p>
        )}
      </Section>

      <Section title="API" description="Collect signups straight from your own backend.">
        <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
          <code className="font-product-mono text-xs break-words">{apiEndpoint}</code>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CopyButton value={apiEndpoint} label="Endpoint" />
          <Button variant="ghost" size="sm" render={<Link href="/docs/api" target="_blank" />}>
            API docs <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" render={<Link href="/settings?section=integrations" />}>
            API keys
          </Button>
        </div>
      </Section>

      <Section
        title="Custom domain"
        description="Serve this waitlist from a domain you own."
        action={
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/waitlists/${waitList.id}/settings?section=domain`} />}
          >
            Manage domain
          </Button>
        }
      >
        {domain ? (
          <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
            <code className="font-product-mono text-xs break-words">{domain.hostname}</code>
            <span
              className={
                domain.status === "READY"
                  ? "rounded-full bg-product-success-bg px-2 py-1 text-xs text-product-success-text capitalize"
                  : domain.status === "FAILED"
                    ? "rounded-full bg-product-danger-bg px-2 py-1 text-xs text-product-danger-text capitalize"
                    : "rounded-full bg-product-bg-inset px-2 py-1 text-xs text-product-text-secondary capitalize"
              }
            >
              {domain.status.replace(/_/g, " ").toLowerCase()}
            </span>
          </p>
        ) : (
          <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
            No domain connected. Add one in settings when you want a branded address.
          </p>
        )}
      </Section>

      <Section
        title="Search and sharing"
        description="How this page looks in search results and when it is shared."
      >
        <div className="mt-4 grid gap-2">
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
        <div className="mt-4 grid gap-2">
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
        <div className="mt-4 grid gap-2">
          <div className="text-sm font-medium text-product-text-primary">Share image URL</div>
          <Label className="sr-only" htmlFor="publish-seo-image">
            Share image URL
          </Label>
          <Input
            id="publish-seo-image"
            value={snapshot.seo.image}
            maxLength={500}
            placeholder="https://…"
            onChange={(event) => onSeoChange({ image: event.target.value })}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
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
      </Section>
    </div>
  );
}
