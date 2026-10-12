"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import "./status-page.css";

export function StatusPage({ code = "404", title = "Page not found", description = "This link is no longer available. You can start again from the home page.", href = "/", linkLabel = "Back to home", retry, standalone = false }) {
  const content = <section className={`product-ui product-status-page${standalone ? " is-standalone" : ""}`} aria-labelledby="status-title">
    {standalone && <Link href="/" className="product-status-wordmark" aria-label="Waitlyze home">Waitlyze<span aria-hidden="true">.</span></Link>}
    <div className="product-status-content">
      <div className="product-status-art" aria-hidden="true"><span>{code}</span><svg viewBox="0 0 320 160" fill="none"><path d="M15 110C50 25 120 125 145 62S235 4 261 59C287 114 223 140 302 125" stroke="currentColor" strokeWidth="20" strokeLinecap="round" /><path d="m290 104 18 22-27 15" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <h1 id="status-title">{title}</h1>
      <p>{description}</p>
      <div className="product-status-actions">{retry && <Button onClick={retry}><HugeiconsIcon icon={RotateLeft01Icon} size={16} aria-hidden="true" />Try again</Button>}<Button variant={retry ? "ghost" : "default"} render={<Link href={href} />}><HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />{linkLabel}</Button></div>
    </div>
  </section>;
  return standalone ? <main>{content}</main> : content;
}
