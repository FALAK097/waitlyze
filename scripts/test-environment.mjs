import { workspaceTestTarget } from "./workspace-test-target.mjs";

// Explicit overrides prevent Next/dotenv from adopting a developer's real credentials.
// This environment supports compilation and public smoke tests, never sending or using production data.
export const FIXTURE_AUTH_SECRET = "waitlyze-local-fixture-secret-not-for-deployment-2026";

export function fixtureEnvironment() {
  return {
    NODE_ENV: "production",
    DATABASE_URL: process.env.WORKSPACE_TEST_DATABASE_URL ? workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) : "postgresql://waitlyze:waitlyze@127.0.0.1:5432/waitlyze_test",
    BETTER_AUTH_SECRET: FIXTURE_AUTH_SECRET,
    BETTER_AUTH_URL: "http://127.0.0.1:3100",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    R2_ACCOUNT_ID: "fixture",
    R2_ACCESS_KEY_ID: "fixture",
    R2_SECRET_ACCESS_KEY: "fixture",
    R2_BUCKET_NAME: "waitlyze-test",
    NEXT_PUBLIC_R2_PUBLIC_URL: "http://127.0.0.1:3100/fixture-assets",
    RESEND_API_KEY: "re_fixture_not_a_real_key",
    RESEND_FROM_EMAIL: "test@example.invalid",
    RESEND_REPLY_TO: "test@example.invalid",
    NEXT_TELEMETRY_DISABLED: "1",
    WAITLYZE_TEST_FIXTURE: "1",
  };
}
