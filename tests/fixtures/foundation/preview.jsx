"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Plus } from "lucide-react";
import { Button } from "@/components/product/button";
import { buttonVariants } from "@/components/product/button-variants";
import { Input } from "@/components/product/input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/product/dialog";

const subscribe = (notify) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const clientSnapshot = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const serverSnapshot = () => false;

export function FoundationPreview({ avatar }) {
  const [theme, setTheme] = useState("light");
  const systemDark = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;
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
    <div className={`fixture-theme ${resolvedTheme}`}><div className="product-ui product-stage" ref={containerRef}>
      <a className="product-skip" href="#foundation-content">Skip to content</a>
      <header className="product-preview-header">
        <Link className="product-wordmark" href="/"><Layers aria-hidden="true" />Waitlyze<span className="product-badge">Design preview</span></Link>
        <div className="product-theme-controls" role="group" aria-label="Appearance">
          <Button variant="ghost" static aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Light</Button>
          <Button variant="ghost" static aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</Button>
          <Button variant="ghost" static aria-pressed={theme === "system"} onClick={() => setTheme("system")}>System</Button>
        </div>
      </header>
      <main id="foundation-content" className="product-preview-main" tabIndex={-1}>
        <h1>Component test fixture</h1>
        <section aria-label="Dialog fixture">
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
        </section>
        {avatar}
        <p className="product-announcement" role="status">{announcement}</p>
        
      </main>
    </div></div>
  );
}
