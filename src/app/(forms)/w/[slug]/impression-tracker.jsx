"use client";

import { useEffect } from "react";

import { collectAttribution } from "@/utils/attribution";

// Records one page-view impression per browser (server dedupes by
// waitListId + hypeSession). Renders nothing.
export function ImpressionTracker({ waitListId }) {
  useEffect(() => {
    if (!waitListId || typeof window === "undefined") return;
    try {
      const sessionKey = `wl_imp_${waitListId}`;
      if (sessionStorage.getItem(sessionKey)) return;

      let hypeSession = localStorage.getItem("hypeSession");
      if (!hypeSession) {
        hypeSession = crypto.randomUUID();
        localStorage.setItem("hypeSession", hypeSession);
      }
      sessionStorage.setItem(sessionKey, "1");

      fetch("/api/v1/impressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitListId, hypeSession, ...collectAttribution(waitListId) }),
      }).catch(() => {
        sessionStorage.removeItem(sessionKey);
      });
    } catch {
      // Impressions are best-effort; never break the page.
    }
  }, [waitListId]);
  return null;
}
