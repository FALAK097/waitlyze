import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const files = readdirSync("tests/database")
  .filter((file) => file.endsWith(".test.mjs"))
  .map((file) => join("tests/database", file));
const child = spawn(process.execPath, [
  "--experimental-strip-types",
  "--test",
  "--test-concurrency=1",
  ...files,
], {
  stdio: "inherit",
  detached: process.platform !== "win32",
});

let timedOut = false;
let forceKill;
const timeout = setTimeout(() => {
  timedOut = true;
  console.error("Database tests exceeded five minutes; terminating the test process tree.");
  signalTree("SIGTERM");
  forceKill = setTimeout(() => signalTree("SIGKILL"), 5_000);
}, 300_000);

function signalTree(signal) {
  try {
    if (process.platform !== "win32" && child.pid) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch (error) {
    if (error.code === "ESRCH") return;
    child.kill(signal);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => signalTree(signal));
}

child.once("error", (error) => {
  clearTimeout(timeout);
  console.error(error.message);
  process.exitCode = 1;
});
child.once("close", (code, signal) => {
  clearTimeout(timeout);
  clearTimeout(forceKill);
  process.exitCode = timedOut ? 124 : code ?? (signal ? 1 : 0);
});
