"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { spamHint } from "@/lib/email/variables.mjs";

const chipsLine = "m-0 text-xs text-product-text-secondary";
const chipCode =
  "ml-1 rounded-sm bg-product-bg-inset px-1.5 py-0.5 font-product-mono text-micro text-product-text-primary";
const chipCodeNext =
  "ml-1.5 rounded-sm bg-product-bg-inset px-1.5 py-0.5 font-product-mono text-micro text-product-text-primary";

export function VariableChips({ keys }) {
  const [first, ...rest] = keys;
  return (
    <p className={chipsLine}>
      Personalize <code className={chipCode}>{`{{${first}}}`}</code>
      {rest.map((key) => (
        <code key={key} className={chipCodeNext}>{`{{${key}}}`}</code>
      ))}
    </p>
  );
}

const hintOk = "m-0 text-caption leading-normal text-product-text-secondary";
const hintWarn =
  "m-0 rounded-lg bg-product-warning-bg px-3.5 py-2.75 text-caption leading-relaxed text-product-text-primary";

export function SpamHintView({ subject, previewText, text, html }) {
  const hint = spamHint({ subject, previewText, text, html });
  if (!hint.issues.length)
    return (
      <p className={hintOk}>
        Spam check: looks clean - subject length, caps, and trigger words all pass.
      </p>
    );
  return (
    <div className={hintWarn} role="note" aria-label="Spam check hints">
      <strong>
        Spam check ({hint.level}): {hint.issues.length} hint{hint.issues.length === 1 ? "" : "s"}
      </strong>
      <ul className="m-1.5 mb-0 pl-4.5">
        {hint.issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}

const frameBar = "flex flex-wrap items-center gap-2";

export function EmailPreviewFrame({
  html,
  seedNote = "Preview uses sample data (Ada, #42, 230 pts).",
}) {
  const [mobile, setMobile] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className={frameBar}>
        <Button
          type="button"
          variant="product-toggle"
          size="product-toggle"
          aria-pressed={!mobile}
          onClick={() => setMobile(false)}
        >
          Desktop
        </Button>
        <Button
          type="button"
          variant="product-toggle"
          size="product-toggle"
          aria-pressed={mobile}
          onClick={() => setMobile(true)}
        >
          Mobile · 375px
        </Button>
        <span className="text-caption text-product-text-secondary">{seedNote}</span>
      </div>
      <div
        className="mx-auto w-full overflow-hidden rounded-lg border border-product-border-subtle bg-white transition-[max-width]"
        style={{ maxWidth: mobile ? 375 : "100%" }}
      >
        <iframe
          title={mobile ? "Mobile email preview" : "Desktop email preview"}
          sandbox=""
          srcDoc={html}
          className="block h-130 w-full border-0"
        />
      </div>
    </div>
  );
}
