"use client";

import { useMemo, useRef, useState } from "react";

import { downloadJson, downloadTextFile } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolSegmentedControl,
  ToolSelectField,
  ToolStatusBadge,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  checkSpamTriggers,
  EMAIL_SEQUENCE_DEFAULTS,
  EMAIL_VOICE_OPTIONS,
  generateEmailSequence,
  LAUNCH_HORIZON_OPTIONS,
  toSimpleHtml,
} from "@/lib/tools/engines/email-sequence.mjs";

export function EmailSequenceWidget({
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [inputs, setInputs] = useState(EMAIL_SEQUENCE_DEFAULTS);
  const [activeStageId, setActiveStageId] = useState("verification");
  const [edits, setEdits] = useState({});
  const startedRef = useRef(false);

  const sequence = useMemo(() => generateEmailSequence(inputs), [inputs]);
  const effectiveEmails = useMemo(
    () =>
      sequence.emails.map((email) => {
        const subject = edits[email.id]?.subject ?? email.subjectOptions[0];
        const markdownBody = edits[email.id]?.body ?? email.markdownBody;
        return {
          ...email,
          subject,
          markdownBody,
          htmlBody: toSimpleHtml(markdownBody),
          spamCheck: checkSpamTriggers(subject, markdownBody),
        };
      }),
    [sequence.emails, edits],
  );
  const effectiveFullMarkdown = useMemo(
    () =>
      effectiveEmails
        .map(
          (email) =>
            `## ${email.stageLabel}\n- **Timing:** ${email.timing}\n- **Subject:** ${email.subject}\n- **Preview text:** ${email.previewText}\n\n${email.markdownBody}`,
        )
        .join("\n\n---\n\n"),
    [effectiveEmails],
  );
  const activeEmail = effectiveEmails.find((e) => e.id === activeStageId) || effectiveEmails[0];
  const currentSubject = activeEmail.subject;
  const currentBody = activeEmail.markdownBody;
  const liveSpamCheck = activeEmail.spamCheck;
  const hasEdits = Object.keys(edits).length > 0;

  function updateInput(key, value) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "waitlist-email-generator",
        tool_version: "1.0",
        entry_surface: entrySurface,
      });
    }
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <ToolWorkspace className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        {/* Inputs */}
        <div className="grid content-start gap-4">
          <ToolTextField
            label="Product name"
            value={inputs.productName}
            onChange={(v) => updateInput("productName", v)}
            maxLength={60}
          />
          <ToolTextField
            label="One-line value proposition"
            value={inputs.valueProp}
            onChange={(v) => updateInput("valueProp", v)}
            maxLength={160}
          />
          <ToolTextField
            label="Target audience"
            value={inputs.audience}
            onChange={(v) => updateInput("audience", v)}
            maxLength={80}
          />
          <ToolTextField
            label="Referral reward summary"
            value={inputs.referralIncentive}
            onChange={(v) => updateInput("referralIncentive", v)}
            maxLength={140}
          />
          {!compact ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <ToolTextField
                  label="Sender name"
                  value={inputs.senderName}
                  onChange={(v) => updateInput("senderName", v)}
                  maxLength={50}
                />
                <ToolSelectField
                  label="Launch timing"
                  value={inputs.launchHorizon}
                  onChange={(v) => updateInput("launchHorizon", v)}
                  options={LAUNCH_HORIZON_OPTIONS}
                />
              </div>
              <ToolSegmentedControl
                label="Email voice"
                value={inputs.voice}
                onChange={(v) => updateInput("voice", v)}
                options={EMAIL_VOICE_OPTIONS}
              />
            </>
          ) : null}
        </div>

        {/* 5-Stage Email Preview & Editor */}
        <div className="grid content-start gap-4">
          <ToolSegmentedControl
            label="Pre-launch lifecycle stage"
            value={activeStageId}
            onChange={setActiveStageId}
            options={sequence.emails.map((e) => ({ value: e.id, label: e.stage }))}
          />

          <div className="grid gap-4 rounded-xl border border-product-border-subtle bg-product-bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-product-border-subtle pb-3">
              <div>
                <h3 className="font-product-display text-lg font-semibold text-product-text-primary">
                  {activeEmail.stageLabel}
                </h3>
                <p className="text-micro text-product-text-secondary">
                  Send trigger: {activeEmail.timing}
                </p>
              </div>
              <ToolStatusBadge tone={liveSpamCheck.clean ? "success" : "warning"}>
                {liveSpamCheck.clean
                  ? "0 spam triggers"
                  : `${liveSpamCheck.count} spam warning${liveSpamCheck.count > 1 ? "s" : ""}`}
              </ToolStatusBadge>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-micro">
              <span className="text-product-text-secondary">Subject presets:</span>
              {activeEmail.subjectOptions.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() =>
                    setEdits((prev) => ({
                      ...prev,
                      [activeEmail.id]: {
                        ...prev[activeEmail.id],
                        subject: subj.slice(0, 160),
                      },
                    }))
                  }
                  className="rounded-full border border-product-border-subtle bg-product-bg-inset/70 px-2.5 py-1 text-micro font-medium text-product-text-primary hover:border-product-text-secondary"
                >
                  {subj}
                </button>
              ))}
            </div>

            <ToolTextField
              label="Subject line"
              value={currentSubject}
              onChange={(val) =>
                setEdits((prev) => ({
                  ...prev,
                  [activeEmail.id]: { ...prev[activeEmail.id], subject: val.slice(0, 160) },
                }))
              }
              maxLength={160}
            />

            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="email-seq-body"
                  className="text-caption font-semibold text-product-text-primary"
                >
                  Email body (Markdown with Waitlyze merge tags)
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-product-mono text-micro text-product-text-muted">
                    {"{{position}}"} · {"{{referral_link}}"} · {"{{referral_count}}"}
                  </span>
                  <span className="font-product-mono text-micro text-product-text-muted tabular-nums">
                    {currentBody.length}/3000
                  </span>
                </div>
              </div>
              <textarea
                id="email-seq-body"
                rows={9}
                value={currentBody}
                maxLength={3000}
                onChange={(event) =>
                  setEdits((prev) => ({
                    ...prev,
                    [activeEmail.id]: {
                      ...prev[activeEmail.id],
                      body: event.target.value.slice(0, 3000),
                    },
                  }))
                }
                className="w-full rounded-lg border border-product-border-control bg-product-bg-surface p-3.5 font-product-mono text-caption leading-relaxed text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus"
              />
            </div>

            {!liveSpamCheck.clean ? (
              <div className="rounded-lg border border-product-warning-text/25 bg-product-warning-bg/50 px-3.5 py-2.5 text-micro text-product-warning-text">
                {liveSpamCheck.flags.join(" · ")}
              </div>
            ) : null}

            <p className="rounded-lg bg-product-bg-inset/60 px-3.5 py-2 text-micro text-product-text-secondary">
              <strong className="text-product-text-primary">Plan note:</strong>{" "}
              {activeEmail.planNote}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <ToolCopyButton
                text={`Subject: ${currentSubject}\nPreview: ${activeEmail.previewText}\n\n${currentBody}`}
                label="Copy email (Markdown)"
              />
              <ToolCopyButton text={activeEmail.htmlBody} label="Copy HTML" />
              <ToolActionButton
                onClick={() => {
                  downloadTextFile(
                    `${inputs.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "waitlist"}-email-sequence.md`,
                    effectiveFullMarkdown,
                    "text/markdown;charset=utf-8;",
                  );
                  trackToolEvent("TOOL_RESULT_EXPORTED", {
                    tool_slug: "waitlist-email-generator",
                    entry_surface: entrySurface,
                    export_format: "markdown",
                  });
                }}
              >
                Export all 5 (.md)
              </ToolActionButton>
              <ToolActionButton
                onClick={() => downloadJson("waitlyze-email-sequence.json", effectiveEmails)}
              >
                Export JSON
              </ToolActionButton>
              {hasEdits ? (
                <ToolActionButton onClick={() => setEdits({})}>Reset custom edits</ToolActionButton>
              ) : null}
            </div>
          </div>

          <ToolHandoffCta
            toolSlug="waitlist-email-generator"
            entrySurface={entrySurface}
            compact={compact}
            label="Save this email sequence in Waitlyze"
            sublabel="Saves all 5 drafts to your campaign blueprint. Automated sequences & broadcasts require Waitlyze Pro."
            resultBand={liveSpamCheck.clean ? "clean" : "spam_warning"}
            onApplyInProduct={onApplyInProduct}
            buildBlueprint={() => ({
              templateId: "creator",
              campaignName: inputs.productName,
              showReferrals: true,
              emailDrafts: effectiveEmails.map((email) => ({
                stage: email.stageLabel,
                subject: (email.subject || "").trim().slice(0, 160),
                previewText: (email.previewText || "").trim().slice(0, 200),
                body: (email.markdownBody || "").trim().slice(0, 3000),
                timing: (email.timing || "").trim().slice(0, 100),
              })),
              summaryBullets: [
                `5 pre-launch lifecycle emails drafted for ${inputs.productName}`,
                `Merge tags ({{position}}, {{referral_link}}, {{referral_count}}) pre-wired`,
                `Confirmation email works with Resend; automated drips unlock on Pro`,
              ],
            })}
          />
        </div>
      </div>
    </ToolWorkspace>
  );
}
