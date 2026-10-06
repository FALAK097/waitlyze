import { access } from "node:fs/promises";

try {
  await access(new URL("../src/app/design-system/", import.meta.url));
} catch (error) {
  if (error.code === "ENOENT") process.exit(0);
  throw error;
}
throw new Error("A browser-test fixture route remains in src/app. Inspect and remove it before a product build.");
