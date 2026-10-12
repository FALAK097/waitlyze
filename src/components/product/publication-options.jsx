"use client";

import { useId, useState } from "react";
import { ChevronDown, Copy, ExternalLink } from "lucide-react";
import { Button } from "./button";
import { SITE_URL } from "@/lib/site-metadata";
import styles from "./publication-options.module.css";

const escapeAttribute = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function PublicationOptions({ waitList, origin = SITE_URL }) {
  const headingId = useId();
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState("hosted");
  const published = waitList.status === "PUBLISHED" && !!waitList.publicSlug && waitList.publishedRevision > 0;
  const hostedUrl = `${origin}/w/${encodeURIComponent(waitList.publicSlug || "")}`;
  const embedCode = `<div class="waitlyze-widget" data-key-id="${escapeAttribute(waitList.id)}" data-height="720px"></div>\n<script src="${escapeAttribute(origin)}/js/embed.js" defer></script>`;
  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); setMessage(`${label} copied.`); }
    catch { setMessage("Copy is unavailable. Select the text and copy it manually."); }
  }
  return <section className={styles.options} aria-labelledby={headingId}>
    <details className={styles.disclosure}>
      <summary><h2 id={headingId}>Share your page</h2><ChevronDown aria-hidden="true" /></summary>
      {published ? <>
        <div className={styles.methodToggle} role="group" aria-label="Publication method"><Button variant="ghost" type="button" aria-pressed={method === "hosted"} onClick={() => setMethod("hosted")}>Hosted page</Button><Button variant="ghost" type="button" aria-pressed={method === "embed"} onClick={() => setMethod("embed")}>Website embed</Button></div>
        {method === "hosted" ? <div className={styles.method}>
          <p>Share this link to start collecting signups.</p>
          <a className={styles.url} href={hostedUrl} target="_blank" rel="noopener noreferrer">{hostedUrl}<ExternalLink size={16} aria-hidden="true" /></a>
          <Button type="button" variant="outline" onClick={() => copy(hostedUrl, "Page link")}><Copy aria-hidden="true" /> Copy page link</Button>
        </div> : <div className={styles.method}>
          <p>Paste this snippet into your website. Adjust the height to fit your page.</p>
          <pre className={styles.code} tabIndex={0} aria-label="Website embed code"><code>{embedCode}</code></pre>
          <Button type="button" variant="outline" onClick={() => copy(embedCode, "Embed code")}><Copy aria-hidden="true" /> Copy embed code</Button>
        </div>}
        <p className={styles.status} role="status" aria-live="polite">{message || "Your published version is shared. Draft edits stay private."}</p>
      </> : <p>{waitList.status === "PAUSED" ? "Resume publication to collect signups through your hosted page or website embed." : "Publish to get a hosted link and website embed code."}</p>}
    </details>
  </section>;
}
