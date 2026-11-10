// scripts/capture-4k-assets.mjs
// Automates capturing high-resolution 4K product screenshots and videos
// from the running Waitlyze instance with realistic seeded data.

import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.resolve("public/images/showcase");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SESSION_TOKEN =
  "hiSE5YQVOdht9rMrvhzjZxRZMQwJcSs9.lQ%2FhFdqgFmPxLA0qyElbGLl7EKqfN1gQSlhJfRLysEQ%3D";
const WAITLIST_ID = "cmw7nr6iu0002iz6lhgh24pxa";

async function main() {
  const diaPath = "/Applications/Dia.app/Contents/MacOS/Dia";
  const hasDia = fs.existsSync(diaPath);
  console.log(`Launching ${hasDia ? "Dia.app" : "browser"} for 4K asset capture...`);
  const browser = await chromium.launch({
    headless: true,
    ...(hasDia ? { executablePath: diaPath } : {}),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });

  // Create context with 4K viewport and deviceScaleFactor for ultra crisp display
  const context = await browser.newContext({
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 3840, height: 2160 },
    },
  });

  // Add authentication cookies
  await context.addCookies([
    {
      name: "__Secure-ba.session_token",
      value: SESSION_TOKEN,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
    {
      name: "ba.session_token",
      value: SESSION_TOKEN,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // Helper to strip dev elements, agentation badges, and portals
  async function cleanPage() {
    await page.evaluate(() => {
      const selectors = [
        "nextjs-portal",
        "#__next-build-watcher",
        "[data-nextjs-toast]",
        "[data-nextjs-dialog]",
        "[class*='agentation']",
        "#agentation",
        "[id*='agentation']",
        "button[aria-label='Feedback']",
      ];
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      }
    });
  }

  console.log("1. Capturing Analytics 4K Dashboard...");
  await page.goto(`${BASE_URL}/waitlists/${WAITLIST_ID}/analytics`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await cleanPage();
  const analyticsPath = path.join(OUTPUT_DIR, "analytics-4k.png");
  await page.screenshot({ path: analyticsPath, fullPage: false });
  console.log("Saved:", analyticsPath);

  console.log("2. Capturing Audience / Subscribers 4K...");
  await page.goto(`${BASE_URL}/waitlists/${WAITLIST_ID}/subscribers`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await cleanPage();
  const subscribersPath = path.join(OUTPUT_DIR, "subscribers-4k.png");
  await page.screenshot({ path: subscribersPath, fullPage: false });
  console.log("Saved:", subscribersPath);

  console.log("3. Capturing Email Broadcasts & Campaigns 4K...");
  await page.goto(`${BASE_URL}/waitlists/${WAITLIST_ID}/emails/broadcasts`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1500);
  await cleanPage();
  const emailsPath = path.join(OUTPUT_DIR, "emails-4k.png");
  await page.screenshot({ path: emailsPath, fullPage: false });
  console.log("Saved:", emailsPath);

  console.log("4. Capturing Page Builder 4K...");
  await page.goto(`${BASE_URL}/waitlists/${WAITLIST_ID}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await cleanPage();
  const builderPath = path.join(OUTPUT_DIR, "builder-4k.png");
  await page.screenshot({ path: builderPath, fullPage: false });
  console.log("Saved:", builderPath);

  console.log("5. Capturing Public Waitlist Experience...");
  await page.goto(`${BASE_URL}/w/nova-studio`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await cleanPage();
  const publicPagePath = path.join(OUTPUT_DIR, "public-waitlist-4k.png");
  await page.screenshot({ path: publicPagePath, fullPage: false });
  console.log("Saved:", publicPagePath);

  // Close context to flush video recording
  await page.close();
  await context.close();
  await browser.close();

  // Find generated video
  const videoFiles = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".webm") || f.endsWith(".mp4"));
  console.log("Recorded video files:", videoFiles);
  if (videoFiles.length > 0) {
    const videoFile = videoFiles[0];
    const finalVideoPath = path.join(OUTPUT_DIR, "demo-4k.webm");
    fs.renameSync(path.join(OUTPUT_DIR, videoFile), finalVideoPath);
    console.log("Final 4K video saved to:", finalVideoPath);
  }

  console.log("All 4K product assets successfully captured!");
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
