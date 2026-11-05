"use client";

import { ArrowUpRight01Icon, Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const question =
  "Help me decide whether Waitlyze (https://waitlyze.falakgala.dev) fits my pre-launch waitlist. It is an open-source project built by Falak Gala. It lets teams build and publish hosted waitlist pages or embeds, collect signups via a server-side API, use verified referrals, send consent-aware email, and view audience analytics. It also has CSV export, webhooks and team roles. Explain who it is and is not a good fit for; distinguish shipped features from setup-dependent features. Check https://waitlyze.falakgala.dev/agent-instructions.md and https://waitlyze.falakgala.dev/docs if you can access them. Do not invent pricing, customer results, integrations or capabilities; if you cannot verify something, say so.";

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

  async function copyQuestion() {
    try {
      await navigator.clipboard.writeText(question);
      setCopied(true);
    } catch {
      setCopied(false);
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
              <button
                key={name}
                type="button"
                className="wl-ai-link"
                aria-label={`Copy question and open ${name} in a new tab`}
                onClick={() => {
                  void copyQuestion();
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
        <p className="wl-ai-note">
          ChatGPT and Perplexity open with the question. Claude and Gemini copy it for you to paste.
          Sign-in and prompt support vary.
        </p>
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
