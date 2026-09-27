import { mkdir, copyFile, rm, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

if (process.env.WAITLYZE_TEST_FIXTURE !== "1") throw new Error("Use pnpm build:test with the isolated environment.");
const route = new URL("../src/app/design-system/", import.meta.url);
// Fail rather than replace any developer-owned route.
try {
  await access(route);
  throw new Error("Temporary fixture route already exists. Inspect it before retrying.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await mkdir(route);
try {
  await copyFile(new URL("../tests/fixtures/foundation/page.jsx", import.meta.url), new URL("page.jsx", route));
  const child = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)), "build"], { stdio: "inherit", env: process.env });
  const forward = (signal) => child.kill(signal);
  const interrupt = () => forward("SIGINT");
  const terminate = () => forward("SIGTERM");
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", terminate);
  try {
    const code = await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (status) => resolve(status ?? 1));
    });
    process.exitCode = code;
  } finally {
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", terminate);
  }
} finally {
  // Both successful and failed builds leave production source without the route.
  await rm(route, { recursive: true });
}
