"use client";

import { useEffect, useRef } from "react";

import { authClient } from "@/lib/auth-client";
import { trackToolEvent } from "@/lib/tools/analytics";

export function ToolAnalyticsTracker({
  toolSlug,
  toolVersion = "1.0",
  entrySurface = "public_tool",
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    let active = true;
    authClient
      .getSession()
      .then((res) => {
        if (!active) return;
        trackToolEvent("TOOL_VIEWED", {
          tool_slug: toolSlug,
          tool_version: toolVersion,
          entry_surface: entrySurface,
          authenticated: Boolean(res?.data?.user),
        });
      })
      .catch(() => {
        if (!active) return;
        trackToolEvent("TOOL_VIEWED", {
          tool_slug: toolSlug,
          tool_version: toolVersion,
          entry_surface: entrySurface,
          authenticated: false,
        });
      });
    return () => {
      active = false;
    };
  }, [toolSlug, toolVersion, entrySurface]);

  return null;
}
