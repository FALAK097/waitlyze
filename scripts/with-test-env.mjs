import { spawn } from "node:child_process";

// Explicit overrides prevent Next/dotenv from adopting a developer's real credentials.
// This environment supports compilation and public smoke tests, never sending or data fixtures.
const fixtureEnv = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://waitlyze:waitlyze@127.0.0.1:5432/waitlyze_test",
  BETTER_AUTH_SECRET: "waitlyze-local-fixture-secret-not-for-deployment-2026",
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
};

const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error("Usage: node scripts/with-test-env.mjs <command> [args]");
const child = spawn(command, args, {
  stdio: "inherit",
  env: { ...process.env, ...fixtureEnv },
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
