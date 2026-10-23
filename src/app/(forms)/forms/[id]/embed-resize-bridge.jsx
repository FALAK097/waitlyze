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
    post();
    window.addEventListener("load", post);
    const observer = new ResizeObserver(post);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("load", post);
      observer.disconnect();
    };
  }, []);
  return null;
}
