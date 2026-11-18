#!/usr/bin/env node
import "dotenv/config";
import { execFileSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

import { parseChangelog } from "../src/lib/changelog.js";

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

const hasFlag = (flag) => process.argv.includes(flag);

function formatReleaseNotes(release) {
  const lines = [];
  if (release.title) {
    lines.push(`### ${release.title}`, "");
  }
  if (release.summary) {
    lines.push(release.summary, "");
  }
  if (release.features?.length) {
    lines.push("#### Features", "");
    for (const f of release.features) {
      if (f.title) {
        lines.push(`- **${f.title}.** ${f.description}`);
      } else {
        lines.push(`- ${f.description}`);
      }
    }
    lines.push("");
  }
  if (release.fixes?.length) {
    lines.push("#### Fixes", "");
    for (const f of release.fixes) {
      if (f.title) {
        lines.push(`- **${f.title}.** ${f.description}`);
      } else {
        lines.push(`- ${f.description}`);
      }
    }
    lines.push("");
  }
  lines.push(
    "---",
    `*Read the full release documentation on [Waitlyze Changelog](https://waitlyze.com/docs/changelog#${release.id})*`,
  );
  return lines.join("\n");
}

async function main() {
  const isDryRun = hasFlag("--dry-run");
  const skipEmail = hasFlag("--skip-email");
  const explicitVersion = getArg("--version");

  console.log("=== Waitlyze Release Orchestrator ===");

  // 1. Parse CHANGELOG.md
  const changelogRaw = readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8");
  const releases = parseChangelog(changelogRaw);

  if (!releases || releases.length === 0) {
    throw new Error("No releases found in CHANGELOG.md.");
  }

  const release = explicitVersion
    ? releases.find((r) => r.version === explicitVersion)
    : releases[0];

  if (!release) {
    throw new Error(`Release ${explicitVersion || "latest"} not found in CHANGELOG.md.`);
  }

  const version = release.version;
  const title = `${version} · ${release.title || release.date}`;
  console.log(`Target version: ${version} (${release.date})`);
  console.log(`Headline: ${release.title}`);

  // 2. Check Git tags
  const existingTags = new Set(
    execSync("git tag -l", { encoding: "utf8" })
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean),
  );

  const tagExistsLocally = existingTags.has(version);
  let tagExistsRemote = false;

  try {
    const remoteTagsOutput = execSync(`git ls-remote --tags origin refs/tags/${version}`, {
      encoding: "utf8",
    });
    tagExistsRemote = remoteTagsOutput.includes(version);
  } catch {
    tagExistsRemote = false;
  }

  console.log(`Tag ${version} exists locally: ${tagExistsLocally}`);
  console.log(`Tag ${version} exists on remote: ${tagExistsRemote}`);

  if (tagExistsRemote && !hasFlag("--force")) {
    console.log(
      `Tag ${version} already exists on origin. If you want to broadcast release emails, run:`,
    );
    console.log(`  pnpm changelog:broadcast --version ${version}`);
    return;
  }

  if (isDryRun) {
    console.log(`\n[DRY-RUN] Would create git tag ${version} on HEAD and push to origin.`);
    console.log(`[DRY-RUN] Would create GitHub Release ${version} with notes.`);
    if (!skipEmail) {
      console.log(`[DRY-RUN] Would broadcast changelog release email to all platform users.`);
    }
    return;
  }

  // 3. Create local tag if needed
  if (!tagExistsLocally) {
    console.log(`\nCreating local annotated git tag ${version}...`);
    execFileSync("git", ["tag", "-a", version, "-m", title], { stdio: "inherit" });
  }

  // 4. Push tag to origin
  if (!tagExistsRemote) {
    console.log(`Pushing git tag ${version} to origin...`);
    execFileSync("git", ["push", "origin", version], { stdio: "inherit" });
  }

  // 5. Create GitHub Release
  const tempNotesFile = join(process.cwd(), `.temp-release-notes-${version}.md`);
  writeFileSync(tempNotesFile, formatReleaseNotes(release), "utf8");

  try {
    console.log(`Creating GitHub Release ${version}...`);
    execFileSync(
      "gh",
      ["release", "create", version, "--title", title, "--notes-file", tempNotesFile],
      { stdio: "inherit" },
    );
    console.log(`[SUCCESS] GitHub Release ${version} created.`);
  } catch (err) {
    console.warn(`[WARN] GitHub release command exited with: ${err.message}`);
  } finally {
    try {
      unlinkSync(tempNotesFile);
    } catch {}
  }

  // 6. Broadcast release announcement email to users
  if (!skipEmail) {
    console.log(`\nBroadcasting changelog release announcement email to all users...`);
    execFileSync(
      process.execPath,
      [join(process.cwd(), "scripts/broadcast-changelog.mjs"), "--version", version],
      { stdio: "inherit" },
    );
  } else {
    console.log(`[SKIP] Email broadcast skipped per --skip-email flag.`);
  }

  console.log(`\nRelease ${version} complete!`);
}

main().catch((err) => {
  console.error("Release failed:", err);
  process.exit(1);
});
