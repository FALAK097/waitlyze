import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createHmac } from "node:crypto";
import { FIXTURE_AUTH_SECRET } from "../../scripts/test-environment.mjs";

export async function startFixtureServer() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(3100, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => probe.close(resolve));
  const child = spawn(process.execPath, ["scripts/with-test-env.mjs", process.execPath, "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"], { stdio: ["ignore", "pipe", "pipe"], env: process.env });
  try {
    await new Promise((resolve, reject) => {
      let output = "";
      const timer = setTimeout(() => reject(new Error("Fixture server did not become ready.")), 15000);
      child.on("error", (error) => { clearTimeout(timer); reject(error); });
      child.on("exit", () => { clearTimeout(timer); reject(new Error(`Fixture server exited before readiness: ${output.slice(-1000)}`)); });
      child.stdout.on("data", (data) => {
        output += data.toString();
        if (output.includes("Ready in")) { clearTimeout(timer); resolve(); }
      });
      child.stderr.on("data", (data) => { output += data.toString(); });
    });
    return child;
  } catch (error) {
    child.kill("SIGTERM");
    throw error;
  }
}

export function signedCookie(token) {
  const signature = createHmac("sha256", FIXTURE_AUTH_SECRET).update(token).digest("base64");
  return `ba.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
}
