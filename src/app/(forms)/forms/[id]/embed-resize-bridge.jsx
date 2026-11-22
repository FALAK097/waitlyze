"use client";

import { useEffect } from "react";

// The embed loader and this page agree on this marker, so a message from any
// other source is ignored. The parent checks the origin; this side only ever
// posts to the origin that embedded the frame.
const MESSAGE_SOURCE = "waitlyze-embed";

/**
 * Tells the embedding page how tall the form is, so the frame can size itself
 * instead of scrolling. Posts to the referring origin only, and stays quiet
 * when the page is opened directly.
 */
export function EmbedResizeBridge() {
  useEffect(() => {
    if (window.parent === window) return;
    const referrer = document.referrer;
    if (!referrer) return;
    let targetOrigin;
    try {
      targetOrigin = new URL(referrer).origin;
    } catch {
      return;
    }
    const post = () => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
      );
      if (!height) return;
      window.parent.postMessage({ source: MESSAGE_SOURCE, type: "resize", height }, targetOrigin);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      window.parent.postMessage({ source: MESSAGE_SOURCE, type: "close" }, targetOrigin);
    };
    const focusables = () =>
      Array.from(
        document.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
    let overlayActive = false;
    const onParentMessage = (event) => {
      if (event.source !== window.parent || event.origin !== targetOrigin) return;
      const message = event.data;
      if (!message || message.source !== MESSAGE_SOURCE) return;
      if (message.type === "overlay-init") overlayActive = true;
      if (message.type === "focus-first") focusables()[0]?.focus();
      if (message.type === "focus-last") focusables().at(-1)?.focus();
    };
    const trapFrameBoundary = (event) => {
      if (!overlayActive || event.key !== "Tab") return;
      const fields = focusables();
      const boundary = event.shiftKey ? fields[0] : fields.at(-1);
      if (!boundary || event.target !== boundary) return;
      event.preventDefault();
      window.parent.postMessage(
        {
          source: MESSAGE_SOURCE,
          type: "focus-boundary",
          direction: event.shiftKey ? "backward" : "forward",
        },
        targetOrigin,
      );
    };
    post();
    window.addEventListener("load", post);
    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("keydown", trapFrameBoundary, true);
    window.addEventListener("message", onParentMessage);
    // The parent only activates the focus trap after this readiness message
    // comes from its active modal iframe. Inline and pill embeds stay untrapped.
    window.parent.postMessage({ source: MESSAGE_SOURCE, type: "ready" }, targetOrigin);
    const observer = new ResizeObserver(post);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("load", post);
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("keydown", trapFrameBoundary, true);
      window.removeEventListener("message", onParentMessage);
      observer.disconnect();
    };
  }, []);
  return null;
}
