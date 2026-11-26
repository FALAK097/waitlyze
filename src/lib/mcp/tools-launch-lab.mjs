import * as z from "zod/v4";

import { env } from "@/lib/env.mjs";
import { jsonResult } from "@/lib/mcp/tool-helpers.mjs";
import { planLaunchReadiness } from "@/lib/tools/engines/launch-planner.mjs";
import { simulateWaitlistQueue } from "@/lib/tools/engines/queue-simulator.mjs";
import { designReferralRewards } from "@/lib/tools/engines/reward-designer.mjs";
import { recommendTemplates } from "@/lib/tools/engines/template-finder.mjs";
import { calculateViralGrowth } from "@/lib/tools/engines/viral-growth.mjs";

const SITE_URL = (env.BETTER_AUTH_URL || "https://waitlyze.com").replace(/\/$/, "");

export function registerLaunchLabMcpTools(server) {
  server.registerTool(
    "calculate_viral_growth",
    {
      title: "Calculate Waitlist Viral Growth",
      description:
        "Models compound waitlist signups, K-factor, and weekly viral trajectory from conversion, share, and referral rates.",
      inputSchema: {
        startingList: z.number().min(0).max(50000).optional(),
        weeklyVisitors: z.number().min(50).max(100000).optional(),
        conversionRatePct: z.number().optional(),
        shareRatePct: z.number().optional(),
        invitesPerSharer: z.number().optional(),
        inviteConversionPct: z.number().optional(),
        weeks: z.number().int().min(1).max(52).optional(),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    ({ invitesPerSharer, inviteConversionPct, ...rest }) =>
      jsonResult({
        ...calculateViralGrowth({
          ...rest,
          ...(invitesPerSharer !== undefined ? { clicksPerSharer: invitesPerSharer } : {}),
          ...(inviteConversionPct !== undefined
            ? { referredConversionPct: inviteConversionPct }
            : {}),
        }),
        toolUrl: `${SITE_URL}/tools/viral-coefficient-calculator`,
      }),
  );

  server.registerTool(
    "simulate_waitlist_queue",
    {
      title: "Simulate Waitlist Queue",
      description: "Simulates leaderboard jump positions from signup & referral point weights.",
      inputSchema: {
        waitlistSize: z.number().min(100).max(100000).optional(),
        pointsSignup: z.number().optional(),
        pointsReferral: z.number().optional(),
        referralsToTest: z.array(z.number()).optional(),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    (args) =>
      jsonResult({
        ...simulateWaitlistQueue(args),
        toolUrl: `${SITE_URL}/tools/waitlist-queue-simulator`,
      }),
  );

  server.registerTool(
    "recommend_waitlist_template",
    {
      title: "Recommend Waitlist Template",
      description:
        "Scores Waitlyze waitlist templates for a product category, motion, asset set, and aesthetic.",
      inputSchema: {
        category: z.string().optional(),
        motion: z.string().optional(),
        assets: z.string().optional(),
        aesthetic: z.string().optional(),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    (args) =>
      jsonResult({
        ...recommendTemplates(args),
        toolUrl: `${SITE_URL}/tools/waitlist-template-finder`,
      }),
  );

  server.registerTool(
    "design_referral_rewards",
    {
      title: "Design Referral Reward Tiers",
      description:
        "Designs margin-safe milestone referral reward tiers based on LTV, margin, and target list size.",
      inputSchema: {
        productLtv: z.number().optional(),
        grossMarginPct: z.number().optional(),
        targetWaitlistSize: z.number().optional(),
        shareRatePct: z.number().optional(),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    (args) =>
      jsonResult({
        ...designReferralRewards(args),
        toolUrl: `${SITE_URL}/tools/referral-reward-calculator`,
      }),
  );

  server.registerTool(
    "plan_launch_timeline",
    {
      title: "Plan Launch Timeline",
      description:
        "Generates a prioritized launch readiness checklist, score, and effort estimate.",
      inputSchema: {
        category: z.string().optional(),
        launchType: z.string().optional(),
        teamSize: z.number().optional(),
        currentAudience: z.number().optional(),
        weeklyHours: z.number().optional(),
        existingAssets: z.array(z.string()).optional(),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    (args) =>
      jsonResult({
        ...planLaunchReadiness(args),
        toolUrl: `${SITE_URL}/tools/product-launch-checklist`,
      }),
  );
}
