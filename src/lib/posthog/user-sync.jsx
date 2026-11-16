"use client";

import { useEffect } from "react";

import { identifyClientUser, setClientGroup } from "@/lib/posthog/client";

/**
 * Syncs the current authenticated user's ID and active workspace group with PostHog.
 * Never transmits sensitive PII (names, passwords, emails).
 */
export function PostHogUserSync({ userId, plan, role, workspaceId, workspaceName, memberCount }) {
  useEffect(() => {
    if (!userId) return;

    identifyClientUser(userId, {
      plan: plan || "FREE",
      role: role || "MEMBER",
    });

    if (workspaceId) {
      setClientGroup(workspaceId, {
        name: workspaceName,
        plan: plan || "FREE",
        member_count: memberCount || 1,
      });
    }
  }, [userId, plan, role, workspaceId, workspaceName, memberCount]);

  return null;
}
