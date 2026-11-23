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
  ToolTextareaField,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
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
    <ToolWorkspace>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <ToolTextField
            label="Product name"
            value={inputs.productName}
            onChange={(v) => updateInput("productName", v)}
            maxLength={60}
          />
          <ToolTextField
            label="One-line value prop"
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
            label="Referral incentive"
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
                  label="Timing"
                  value={inputs.launchHorizon}
                  onChange={(v) => updateInput("launchHorizon", v)}
                  options={LAUNCH_HORIZON_OPTIONS}
                />
              </div>
              <ToolSegmentedControl
                label="Voice"
                value={inputs.voice}
                onChange={(v) => updateInput("voice", v)}
                options={EMAIL_VOICE_OPTIONS}
              />
            </>
          ) : null}
        </div>

        <div className="grid content-start gap-5">
          <ToolSegmentedControl
            value={activeStageId}
            onChange={setActiveStageId}
            options={sequence.emails.map((e) => ({ value: e.id, label: e.stage }))}
          />

          <div className="grid gap-4 pt-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="font-product-display text-lg font-semibold text-product-text-primary">
                  {activeEmail.stageLabel}
                </h3>
                <p className="text-micro text-product-text-muted">{activeEmail.timing}</p>
              </div>
              <ToolStatusBadge tone={liveSpamCheck.clean ? "success" : "warning"}>
                {liveSpamCheck.clean
                  ? "No spam flags"
                  : `${liveSpamCheck.count} spam warning${liveSpamCheck.count > 1 ? "s" : ""}`}
              </ToolStatusBadge>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {activeEmail.subjectOptions.map((subj) => (
                <Button
                  key={subj}
                  type="button"
                  variant="product-outline"
                  size="xs"
                  onClick={() =>
                    setEdits((prev) => ({
                      ...prev,
                      [activeEmail.id]: {
                        ...prev[activeEmail.id],
                        subject: subj.slice(0, 160),
                      },
                    }))
                  }
                  className="max-w-full truncate font-normal text-product-text-secondary hover:text-product-text-primary"
                >
                  {subj}
                </Button>
              ))}
            </div>

            <ToolTextField
              label="Subject"
              value={currentSubject}
              onChange={(val) =>
                setEdits((prev) => ({
                  ...prev,
                  [activeEmail.id]: { ...prev[activeEmail.id], subject: val.slice(0, 160) },
                }))
              }
              maxLength={160}
            />

            <ToolTextareaField
              label="Body"
              rows={9}
              mono
              value={currentBody}
              maxLength={3000}
              onChange={(val) =>
                setEdits((prev) => ({
                  ...prev,
                  [activeEmail.id]: {
                    ...prev[activeEmail.id],
                    body: val.slice(0, 3000),
                  },
                }))
              }
            />

            {!liveSpamCheck.clean ? (
              <p className="text-caption text-product-warning-text">
                {liveSpamCheck.flags.join(" · ")}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <ToolCopyButton
                text={`Subject: ${currentSubject}\nPreview: ${activeEmail.previewText}\n\n${currentBody}`}
                label="Copy Markdown"
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
                All 5 (.md)
              </ToolActionButton>
              <ToolActionButton
                onClick={() => downloadJson("waitlyze-email-sequence.json", effectiveEmails)}
              >
                JSON
              </ToolActionButton>
              {hasEdits ? (
                <ToolActionButton icon="reset" onClick={() => setEdits({})}>
                  Reset edits
                </ToolActionButton>
              ) : null}
            </div>
          </div>

          <ToolHandoffCta
            toolSlug="waitlist-email-generator"
            entrySurface={entrySurface}
            compact={compact}
            label="Save this email sequence in Waitlyze"
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
