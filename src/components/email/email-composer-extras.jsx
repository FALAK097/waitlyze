"use client";

import { MonitorIcon, SmartphoneIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

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
        Spam check: looks clean — subject length, caps, and trigger words all pass.
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
const frameTab =
  "min-h-8.5 rounded-product-control border border-product-border-control bg-white px-3 text-caption font-semibold text-product-text-primary cursor-pointer aria-[pressed=true]:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text!";

const htmlToken = "text-product-success-text";

function highlightHtml(source) {
  const occurrences = new Map();
  return source.split(/(<\/?[\w:-]+|\s+[\w:-]+(?=\s*=)|=|"[^"]*"|'[^']*'|\/?>)/g).map((part) => {
    if (!part) return null;
    const isTag = /^<\/?[\w:-]+|^\/>?$/.test(part);
    const isAttribute = /^\s+[\w:-]+$/.test(part);
    const isValue = /^(?:"[^"]*"|'[^']*')$/.test(part);
    const occurrence = occurrences.get(part) || 0;
    occurrences.set(part, occurrence + 1);
    return (
      <span
        key={`${part}-${occurrence}`}
        className={
          isTag || isAttribute ? htmlToken : isValue ? "text-product-warning-text" : undefined
        }
      >
        {part}
      </span>
    );
  });
}

export function HtmlSourceEditor({ value, onChange, label = "Email HTML source" }) {
  return (
    <div className="relative min-h-105 overflow-hidden rounded-lg border border-product-border-subtle bg-white font-product-mono text-caption leading-relaxed">
      <pre
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-0 overflow-auto p-4 break-words whitespace-pre-wrap text-product-text-primary"
      >
        {highlightHtml(value)}
        {"\n"}
      </pre>
      <textarea
        className="relative min-h-105 w-full resize-y bg-transparent p-4 break-words whitespace-pre-wrap text-transparent caret-product-text-primary selection:bg-product-success-bg focus-visible:outline-2 focus-visible:outline-product-success-text [&::-webkit-scrollbar]:hidden"
        aria-label={label}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(event) => onChange(event.target.value)}
        style={{ WebkitTextFillColor: "transparent" }}
      />
    </div>
  );
}

export function EmailPreviewFrame({
  html,
  seedNote = "Preview uses sample data (Ada, #42, 230 pts).",
  viewport: controlledViewport,
  onViewportChange,
}) {
  const [localMobile, setLocalMobile] = useState(false);
  const mobile = controlledViewport ? controlledViewport === "mobile" : localMobile;
  const setMobile = (value) => {
    setLocalMobile(value);
    onViewportChange?.(value ? "mobile" : "desktop");
  };
  return (
    <div className="flex flex-col gap-3">
      <div className={frameBar}>
        <button
          type="button"
          className={frameTab}
          aria-pressed={!mobile}
          onClick={() => setMobile(false)}
        >
          <HugeiconsIcon icon={MonitorIcon} size={16} aria-hidden="true" />
          <span className="sr-only">Desktop</span>
        </button>
        <button
          type="button"
          className={frameTab}
          aria-pressed={mobile}
          onClick={() => setMobile(true)}
        >
          <HugeiconsIcon icon={SmartphoneIcon} size={16} aria-hidden="true" />
          <span className="sr-only">Mobile preview, 375 pixels wide</span>
        </button>
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
