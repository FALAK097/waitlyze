"use client";

import { useId, useState } from "react";
import { Button } from "./button";
import { SITE_URL } from "@/lib/site-metadata";
import styles from "./publication-options.module.css";

const escapeAttribute = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function PublicationOptions({ waitList, origin = SITE_URL }) {
  const headingId = useId();
  const [message, setMessage] = useState("");
  const published = waitList.status === "PUBLISHED" && !!waitList.publicSlug && waitList.publishedRevision > 0;
  const hostedUrl = `${origin}/w/${encodeURIComponent(waitList.publicSlug || "")}`;
  const embedCode = `<div class="waitlyze-widget" data-key-id="${escapeAttribute(waitList.id)}" data-height="720px"></div>\n<script src="${escapeAttribute(origin)}/js/embed.js" defer></script>`;
  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); setMessage(`${label} copied.`); }
    catch { setMessage("Copy is unavailable. Select the text and copy it manually."); }
  }
  return <section className={styles.options} aria-labelledby={headingId}>
    <h2 id={headingId}>Share your published page</h2>
    {published ? <>
      <div className={styles.methods}>
        <div><h3>Hosted by Waitlyze</h3><p>Share a link. Your page is ready without a website.</p><a className={styles.url} href={hostedUrl} target="_blank" rel="noopener noreferrer">{hostedUrl}</a><Button type="button" variant="outline" onClick={() => copy(hostedUrl, "Page link")}>Copy page link</Button></div>
        <div><h3>On your website</h3><p>Add this snippet where you want the published page to appear. Adjust the height to fit your content.</p><pre className={styles.code} tabIndex={0} aria-label="Website embed code"><code>{embedCode}</code></pre><Button type="button" variant="outline" onClick={() => copy(embedCode, "Embed code")}>Copy embed code</Button></div>
      </div>
      <p className={styles.status} role="status" aria-live="polite">{message || "Both options use your published version. Draft edits stay private."}</p>
    </> : <p>{waitList.status === "PAUSED" ? "Resume publication to collect signups through your hosted page or website embed." : "Publish your waitlist to get its hosted link and website embed code."}</p>}
  </section>;
}
