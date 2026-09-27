"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Clock3, Layers, Plus } from "lucide-react";
import { Button } from "./button";
import { buttonVariants } from "./button-variants";
import { Input } from "./input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "./dialog";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function FoundationPreview({ avatar }) {
  const { theme, setTheme } = useTheme();
  const themeReady = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [open, setOpen] = useState(false);

  function rehearse(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a campaign name to try the preview.");
      inputRef.current?.focus();
      return;
    }
    setError("");
    setOpen(false);
    setAnnouncement(`Preview complete for ${name.trim()}. No campaign was created.`);
  }

  return (
    <div className="product-ui product-stage" ref={containerRef}>
      <a className="product-skip" href="#foundation-content">Skip to content</a>
      <header className="product-preview-header">
        <Link className="product-wordmark" href="/"><Layers aria-hidden="true" />Waitlyze<span className="product-badge">Design preview</span></Link>
        <div className="product-theme-controls" role="group" aria-label="Appearance">
          <Button variant="ghost" static aria-pressed={themeReady && theme === "light"} onClick={() => setTheme("light")}>Light</Button>
          <Button variant="ghost" static aria-pressed={themeReady && theme === "dark"} onClick={() => setTheme("dark")}>Dark</Button>
          <Button variant="ghost" static aria-pressed={themeReady && theme === "system"} onClick={() => setTheme("system")}>System</Button>
        </div>
      </header>
      <main id="foundation-content" className="product-preview-main" tabIndex={-1}>
        <div className="product-page-heading">
          <p className="product-eyebrow">Foundation / 02</p>
          <h1>A calmer place to launch.</h1>
          <p className="product-description">Clear decisions, considered details, and room for what comes next. This preview tests the foundations of the campaign experience.</p>
        </div>
        <section className="product-panel product-preview-hero" aria-labelledby="campaign-preview-title">
          <div className="product-preview-copy">
            <span className="product-status"><Clock3 aria-hidden="true" /> Draft preview</span>
            <h2 id="campaign-preview-title">From first interest<br />to your next launch.</h2>
            <p>Start with a campaign. Shape its page, understand your audience, and open access when you are ready.</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button />}><Plus aria-hidden="true" /> Try campaign dialog</DialogTrigger>
              <DialogContent container={containerRef}>
                <div className="product-dialog-heading">
                  <DialogTitle>Rehearse a campaign draft</DialogTitle>
                  <DialogDescription>This is a component preview. Nothing will be saved or sent.</DialogDescription>
                </div>
                <form onSubmit={rehearse} noValidate className="product-form">
                  <div className="product-field">
                    <label htmlFor="preview-name">Campaign name</label>
                    <Input ref={inputRef} id="preview-name" name="campaignName" autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. The next chapter" aria-invalid={!!error} aria-describedby={error ? "preview-name-error" : "preview-name-hint"} />
                    {error ? <p id="preview-name-error" className="product-field-error">{error}</p> : <p id="preview-name-hint">Choose a name you will recognize later.</p>}
                  </div>
                  <div className="product-actions">
                    <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                    <Button type="submit">Complete preview<ArrowRight aria-hidden="true" /></Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="product-preview-detail">
            <div className="product-owner">{avatar}<div><strong>Example workspace</strong><span>Local avatar · synthetic identity</span></div></div>
            <h3>Ready when you are</h3>
            <ul className="product-checklist">
              <li><Check aria-hidden="true" /><span>Choose a purposeful starter</span></li>
              <li><Check aria-hidden="true" /><span>Make the page your own</span></li>
              <li><Check aria-hidden="true" /><span>Review before publishing</span></li>
            </ul>
            <p className="product-caption">Illustrative checklist. No live readiness checks run here.</p>
          </div>
        </section>
        <section aria-labelledby="component-states" className="product-state-section">
          <div className="product-section-heading"><h2 id="component-states">Small details, predictable states</h2><p>Every action should tell you what happens next.</p></div>
          <div className="product-state-grid">
            <article className="product-panel product-state-card"><span className="product-status product-status-success"><Check aria-hidden="true" /> Saved state</span><h3>Visible confirmation</h3><p>Static labels carry meaning even when motion is reduced.</p><Button variant="outline" disabled>Unavailable action</Button></article>
            <article className="product-panel product-state-card"><span className="product-status product-status-danger"><CircleAlert aria-hidden="true" /> Error state</span><h3>A way forward</h3><p>Errors explain the next step and preserve your work.</p><Button variant="outline" onClick={() => { setError("Enter a campaign name to try the preview."); setOpen(true); }}>Try validation</Button></article>
            <article className="product-panel product-state-card"><span className="product-status"><Layers aria-hidden="true" /> First-use state</span><h3>One clear next step</h3><p>Empty views explain their purpose and keep the next action close.</p><Link href="/" className={buttonVariants({ variant: "outline" })}>Visit public site<ArrowRight aria-hidden="true" /></Link></article>
          </div>
        </section>
        <p className="product-announcement" role="status">{announcement}</p>
        <footer className="product-preview-footer">Foundation preview · no live campaigns, subscribers, or delivery data</footer>
      </main>
    </div>
  );
}
