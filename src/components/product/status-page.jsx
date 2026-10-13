"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import "./status-page.css";

export function StatusPage({ code = "404", title = "Page not found", description = "This link is no longer available. You can start again from the home page.", href = "/", linkLabel = "Back to home", retry, standalone = false }) {
  const content = <section className={`product-ui product-status-page${standalone ? " is-standalone" : ""}`} aria-labelledby="status-title">
    {standalone && <Link prefetch={false} href="/" className="product-status-brand" aria-label="Waitlyze home"><span className="product-status-mark" aria-hidden="true"><i /><i /><i /></span><span className="product-status-word">waitlyze<span className="product-status-dot" aria-hidden="true">.</span></span></Link>}
    <div className="product-status-content">
      <div className="product-status-art" aria-hidden="true"><span>{code}</span><svg className="product-status-flourish" viewBox="0 0 320 160" fill="none"><path d="M14 112C80 48 150 118 218 86C244 74 268 84 298 84" stroke="currentColor" strokeWidth="14" strokeLinecap="round" /><path d="M278 68l20 16-20 16" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <h1 id="status-title">{title}</h1>
      <p>{description}</p>
      <div className="product-status-actions">{retry && <Button onClick={retry}><HugeiconsIcon icon={RotateLeft01Icon} size={16} aria-hidden="true" />Try again</Button>}<Button variant={retry ? "ghost" : "default"} render={<Link prefetch={false} href={href} />}><HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />{linkLabel}</Button></div>
    </div>
  </section>;
  return standalone ? <main>{content}</main> : content;
}
