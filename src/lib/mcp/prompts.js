import * as z from "zod/v4";

/**
 * Registers reusable Waitlyze MCP prompts for common end-to-end operator workflows.
 */
export function registerWaitlyzePrompts(server) {
  server.registerPrompt(
    "launch_waitlist",
    {
      title: "Launch a Production Waitlist",
      description:
        "Guided workflow to create a waitlist, configure hosted page & form/reward rules, run pre-flight rehearsal, and publish live.",
      argsSchema: {
        name: z.string().describe("Product or waitlist name"),
        publicSlug: z.string().optional().describe("Desired URL slug under /w/<slug>"),
        workspaceId: z.string().optional().describe("Target workspace ID"),
      },
    },
    ({ name, publicSlug, workspaceId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Set up and launch a Waitlyze waitlist named "${name}"${publicSlug ? ` with slug "${publicSlug}"` : ""}${workspaceId ? ` in workspace "${workspaceId}"` : ""}.`,
              "",
              "Follow these steps:",
              "1. Inspect workspaces with `waitlyze_list_workspaces` (unless workspaceId was provided).",
              "2. Call `waitlyze_create_waitlist` with sensible defaults and enable referrals (`showReferrals: true`).",
              "3. Customize the hosted page (`waitlyze_update_waitlist_page`), form rules (`waitlyze_configure_form_rules`), and referral milestone tiers (`waitlyze_configure_rewards`).",
              "4. Verify sender configuration (`waitlyze_manage_email_sender` / `waitlyze_manage_workspace_email_integration`).",
              "5. Call `waitlyze_run_launch_rehearsal` and resolve any reported blockers.",
              "6. Call `waitlyze_publish_waitlist` and return the live public URL and published revision.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "diagnose_waitlist_growth",
    {
      title: "Diagnose Waitlist Growth & Fraud",
      description:
        "Analyze live signups, conversion rate, referral K-factor, traffic sources, and pending referral fraud reviews.",
      argsSchema: {
        waitlistId: z.string().describe("Waitlist ID to diagnose"),
        days: z.string().optional().describe("Lookback window in days (default 30)"),
      },
    },
    ({ waitlistId, days }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Audit growth and referral health for waitlist "${waitlistId}" over the last ${days || "30"} days.`,
              "",
              "Execute in parallel:",
              "- `waitlyze_get_waitlist` (live totalSignups & verifiedSignups)",
              "- `waitlyze_get_analytics` (funnel, UTMs, countries, devices, referral K-factor)",
              "- `waitlyze_get_leaderboard` (top referrers & verified referrals)",
              "- `waitlyze_list_referral_reviews` (flagged/pending referral fraud checks)",
              "",
              "Summarize bottlenecks, top acquisition channels, suspicious referrals needing resolution, and actionable next steps.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "send_waitlist_broadcast",
    {
      title: "Safely Send a Subscriber Broadcast",
      description:
        "Safely preview a segment, send a test email, verify recipient count, and send or schedule a marketing broadcast.",
      argsSchema: {
        waitlistId: z.string().describe("Waitlist ID"),
        subject: z.string().describe("Broadcast email subject"),
        segment: z.string().optional().describe("Audience segment (ALL, VERIFIED, etc.)"),
        testEmail: z.string().describe("Founder/operator email to receive test preview first"),
      },
    },
    ({ waitlistId, subject, segment, testEmail }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Prepare broadcast "${subject}" on waitlist "${waitlistId}" for segment "${segment || "ALL"}".`,
              "",
              "Strict safety steps:",
              `1. Preview eligible recipients via \`waitlyze_preview_broadcast_recipients\` (waitlistId="${waitlistId}", segment="${segment || "ALL"}").`,
              "2. Create or update the draft broadcast via `waitlyze_create_broadcast`.",
              `3. Send a test email to "${testEmail}" via \`waitlyze_send_test_email\` (kind="broadcast") and confirm content.`,
              "4. Only after explicit confirmation, invoke `waitlyze_send_broadcast` (with exact `expectedRecipientCount`) or `waitlyze_schedule_broadcast`.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "import_and_onboard_subscribers",
    {
      title: "Import & Onboard Subscribers",
      description:
        "Bulk import JSON subscriber records, configure welcome/referral automations, and verify notification webhooks.",
      argsSchema: {
        waitlistId: z.string().describe("Waitlist ID"),
      },
    },
    ({ waitlistId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Onboard an existing list into waitlist "${waitlistId}":`,
              "1. Inspect current automations (`waitlyze_list_automations`), templates (`waitlyze_list_email_templates`), and webhooks (`waitlyze_list_webhooks`).",
              "2. Enable or customize automations (`waitlyze_save_automation_recipe`, `waitlyze_set_automation_status`).",
              "3. Use `waitlyze_import_subscribers` (up to 500 per batch) and confirm imported/skipped counts + live `totalSignups`.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
