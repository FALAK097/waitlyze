"use client";

import { MonitorIcon, SmartphoneIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const frameBar = "flex flex-wrap items-center justify-between gap-3";
const viewportGroup =
  "flex gap-1 [&_button]:flex [&_button]:size-9 [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-center [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-product-text-secondary [&_button[aria-pressed=true]]:bg-product-bg-surface [&_button[aria-pressed=true]]:text-product-text-primary";

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
  const preRef = useRef(null);
  return (
    <div className="relative h-80 max-h-[70vh] min-h-64 resize-y overflow-hidden rounded-lg border border-product-border-subtle bg-white font-product-mono text-caption leading-relaxed">
      <pre
        ref={preRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-0 overflow-hidden p-4 break-words whitespace-pre-wrap text-product-text-primary"
      >
        {highlightHtml(value)}
        {"\n"}
      </pre>
      <textarea
        className="relative h-full max-h-full min-h-full w-full resize-none overflow-auto bg-transparent p-4 break-words whitespace-pre-wrap text-transparent caret-product-text-primary selection:bg-product-success-bg focus-visible:outline-2 focus-visible:outline-product-success-text [&::-webkit-scrollbar]:hidden"
        aria-label={label}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (!preRef.current) return;
          preRef.current.scrollTop = event.currentTarget.scrollTop;
          preRef.current.scrollLeft = event.currentTarget.scrollLeft;
        }}
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
        <TooltipProvider>
          <div className={viewportGroup} role="group" aria-label="Preview viewport">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Desktop preview"
                    aria-pressed={!mobile}
                    onClick={() => setMobile(false)}
                  />
                }
              >
                <HugeiconsIcon icon={MonitorIcon} size={17} aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent side="top">Desktop</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Mobile preview"
                    aria-pressed={mobile}
                    onClick={() => setMobile(true)}
                  />
                }
              >
                <HugeiconsIcon icon={SmartphoneIcon} size={17} aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent side="top">Mobile</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        <span className="text-caption text-product-text-secondary max-sm:flex-1 max-sm:text-right">
          {seedNote}
        </span>
      </div>
      <div
        className="mx-auto w-full overflow-hidden rounded-lg border border-product-border-subtle bg-white transition-[max-width]"
        style={{ maxWidth: mobile ? 375 : "100%" }}
      >
        <iframe
          title={mobile ? "Mobile email preview" : "Desktop email preview"}
          sandbox=""
          srcDoc={html}
          className="block h-96 w-full border-0 max-sm:h-88"
        />
      </div>
    </div>
  );
}

export function EmailPreviewResult({
  html,
  text,
  subject,
  previewText = "",
  viewport,
  onViewportChange,
}) {
  return (
    <div className="flex flex-col gap-4">
      <EmailPreviewFrame html={html} viewport={viewport} onViewportChange={onViewportChange} />
      <SpamHintView subject={subject} previewText={previewText} text={text} html={html} />
    </div>
  );
}

const testForm = "flex min-w-0 items-center gap-2 max-sm:w-full";
const testInput =
  "h-9 w-45 min-w-0 rounded-product-control border border-product-border-control bg-white px-2.5 text-caption max-sm:w-auto max-sm:flex-1 max-sm:text-base";
const testButton =
  "min-h-9 rounded-product-control border border-transparent bg-product-bg-inset px-3.5 text-caption font-semibold text-product-text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text!";

export function EmailTestSendForm({ id, value, onChange, onSubmit, busy, disabled = false }) {
  return (
    <form className={testForm} onSubmit={onSubmit}>
      <input
        className={testInput}
        id={id}
        type="email"
        placeholder="you@example.com"
        required
        maxLength={320}
        aria-label="Send a test to"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" className={testButton} disabled={busy || disabled}>
        {busy ? "Sending…" : "Send test"}
      </button>
    </form>
  );
}
