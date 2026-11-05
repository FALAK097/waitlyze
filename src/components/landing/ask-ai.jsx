"use client";

import { ArrowUpRight01Icon, Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const question =
  "Help me decide whether Waitlyze fits my pre-launch waitlist. Check its official guide at https://waitlyze.falakgala.dev/agent-instructions.md and docs at https://waitlyze.falakgala.dev/docs if you can access them, and cite what you verify. If you cannot access them, still give a useful assessment based only on this unverified description: Waitlyze is an open-source waitlist builder with hosted pages or embeds, a server-side signup API, verified referrals, consent-aware email, audience analytics, CSV export, webhooks and team roles. Email delivery needs sender setup and opt-in; custom domains need configuration; referral rewards are not automatically fulfilled. Explain good fits, poor fits, and setup-dependent features. Label unverified claims and specific unknowns, but do not stop at a generic verification disclaimer. Open-source does not imply self-hosting. Do not invent pricing, reliability, integrations or customer results.";

const assistants = [
  {
    name: "ChatGPT",
    logo: "/images/ai/openai.svg",
    url: `https://chatgpt.com/?q=${encodeURIComponent(question)}`,
    kind: "prefill",
  },
  {
    name: "Claude",
    logo: "/images/ai/claude.svg",
    url: "https://claude.ai/new",
    kind: "copy",
  },
  {
    name: "Perplexity",
    logo: "/images/ai/perplexity.svg",
    url: `https://www.perplexity.ai/search?q=${encodeURIComponent(question)}`,
    kind: "prefill",
  },
  {
    name: "Gemini",
    logo: "/images/ai/gemini.svg",
    url: "https://gemini.google.com/app",
    kind: "copy",
  },
];

export default function AskAi() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyQuestion() {
    try {
      await navigator.clipboard.writeText(question);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <section className="wl-section wl-ask-ai" aria-labelledby="ask-ai-title">
      <div className="wl-ask-ai-intro">
        <p className="wl-eyebrow">AN OUTSIDE OPINION</p>
        <h2 id="ask-ai-title">Don’t just take our word for it.</h2>
        <p>
          Ask the AI you already use if Waitlyze fits your launch. We’ll give it the facts, not a
          sales pitch.
        </p>
      </div>
      <div className="wl-ask-ai-panel">
        <div className="wl-ai-links">
          {assistants.map(({ name, logo, url, kind }) => {
            const content = (
              <>
                <Image src={logo} alt="" width={34} height={34} />
                <span>{name}</span>
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={20} aria-hidden="true" />
              </>
            );
            return kind === "prefill" ? (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="wl-ai-link"
                aria-label={`Ask ${name} about Waitlyze (opens a new tab)`}
              >
                {content}
              </a>
            ) : (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="wl-ai-link"
                aria-label={`Copy question and open ${name} in a new tab`}
                onClick={() => void copyQuestion()}
              >
                {content}
              </a>
            );
          })}
        </div>
        <p className="wl-ai-note">
          ChatGPT and Perplexity open with the question. Claude and Gemini copy it for you to paste.
          Sign-in and prompt support vary.
        </p>
        <output className="wl-ai-copy-status">
          {copyError
            ? "Couldn’t copy automatically. Open the question below to select it."
            : copied
              ? "Question copied. Paste it into your AI chat."
              : ""}
        </output>
        <details className="wl-ai-details">
          <summary>What will it ask?</summary>
          <p>{question}</p>
          <button type="button" onClick={copyQuestion}>
            <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={17} aria-hidden="true" />
            {copied ? "Copied" : "Copy question"}
          </button>
        </details>
        <p className="wl-ai-caveat">
          AI can get details wrong. Check the <Link href="/docs">current docs</Link> before
          deciding.
        </p>
      </div>
    </section>
  );
}
