#!/usr/bin/env node
import { execFileSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

import { parseChangelog } from "../src/lib/changelog.js";

const COMMIT_MAP = {
  "v0.1.0": "f491f18b",
  "v0.2.0": "e0fa40b8",
  "v0.3.0": "f57ce495",
  "v0.4.0": "eca543aa",
  "v0.5.0": "afdd76ee",
  "v0.6.0": "c1b1277e",
  "v0.7.0": "63cd8429",
  "v0.8.0": "2a735827",
  "v0.9.0": "6c5b7a3e",
  "v0.10.0": "c895a86a",
  "v0.11.0": "03d230db",
};

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
    `---`,
    `*Read the full release documentation on [Waitlyze Changelog](https://waitlyze.com/docs/changelog#${release.id})*`,
  );
  return lines.join("\n");
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const changelogRaw = readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8");
  const releases = parseChangelog(changelogRaw);

  console.log(`Found ${releases.length} releases in CHANGELOG.md.`);
  if (isDryRun) {
    console.log("Running in --dry-run mode. No tags or GitHub Releases will be created.");
  }

  // Fetch existing tags
  const existingTags = new Set(
    execSync("git tag -l", { encoding: "utf8" })
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean),
  );

  // Also query GitHub releases if gh is available
  const existingGhReleases = new Set();
  try {
    const ghOutput = execSync("gh release list --limit 100", { encoding: "utf8" });
    for (const line of ghOutput.split("\n")) {
      const tag = line.split("\t")[0]?.trim();
      if (tag) existingGhReleases.add(tag);
    }
  } catch (err) {
    console.warn("Could not list remote GitHub releases via gh CLI:", err.message);
  }

  // Process releases in chronological order (v0.1.0 up to v0.11.0)
  const orderedReleases = [...releases].reverse();

  for (const release of orderedReleases) {
    const version = release.version;
    const targetCommit = COMMIT_MAP[version];
    if (!targetCommit) {
      console.warn(`[SKIP] No target commit mapped for ${version}`);
      continue;
    }

    const title = `${version} · ${release.title || release.date}`;
    const notes = formatReleaseNotes(release);

    console.log(`\n========================================`);
    console.log(`Release: ${version} (${release.date})`);
    console.log(`Target Commit: ${targetCommit}`);
    console.log(`Title: ${title}`);
    console.log(`Already tagged locally: ${existingTags.has(version)}`);
    console.log(`Already on GitHub: ${existingGhReleases.has(version)}`);

    if (existingTags.has(version) && existingGhReleases.has(version)) {
      console.log(`[OK] ${version} already exists. Skipping.`);
      continue;
    }

    if (isDryRun) {
      console.log(`[DRY-RUN] Would create release ${version} at ${targetCommit}`);
      continue;
    }

    // Write temp notes file for gh CLI
    const tempNotesFile = join(process.cwd(), `.temp-release-notes-${version}.md`);
    writeFileSync(tempNotesFile, notes, "utf8");

    try {
      // Step 1: Create local tag if it does not exist
      const fullCommit = execSync(`git rev-parse ${targetCommit}`, { encoding: "utf8" }).trim();
      if (!existingTags.has(version)) {
        console.log(`Creating local git tag ${version} at ${fullCommit}...`);
        execFileSync("git", ["tag", "-a", version, fullCommit, "-m", title], { stdio: "inherit" });
      }

      // Step 2: Push tag to origin via SSH
      console.log(`Pushing git tag ${version} to origin...`);
      execFileSync("git", ["push", "origin", version], { stdio: "inherit" });

      // Step 3: Create GitHub release using gh CLI if not already created
      if (!existingGhReleases.has(version)) {
        console.log(`Creating GitHub Release ${version}...`);
        execFileSync(
          "gh",
          ["release", "create", version, "--title", title, "--notes-file", tempNotesFile],
          { stdio: "inherit" },
        );
        console.log(`[SUCCESS] Created release ${version}`);
      } else {
        console.log(`[OK] GitHub release ${version} already exists.`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed on release ${version}:`, err.message);
    } finally {
      try {
        unlinkSync(tempNotesFile);
      } catch {}
    }
  }

  console.log("\nDone backfilling tags and releases!");
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
