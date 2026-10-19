import { tegami } from "tegami";
import { runCli } from "tegami/cli";
import { github } from "tegami/plugins/github";

const config = tegami({
  npm: { client: "pnpm", updateLockFile: true },
  packages: { waitlyze: {} },
  generator: {
    generate({ pkg, packageDraft }) {
      // The npm plugin updates `pkg.version` before changelogs are generated,
      // so prefer the applied version instead of bumping the draft a second time.
      const version = pkg.version ?? packageDraft.bumpVersion(pkg);
      if (!version) throw new Error(`Waitlyze has no version to release: ${pkg.name}`);

      const lines = [`## v${version}`, ""];
      for (const entry of packageDraft.changelogs ?? []) {
        let sectionDepth = 3;
        if (entry.subject) {
          lines.push(`### ${entry.subject}`, "");
          sectionDepth = 4;
        }
        for (const section of entry.sections) {
          lines.push(`${"#".repeat(sectionDepth)} ${section.title}`, "", section.content, "");
        }
      }

      return lines.join("\n").trim();
    },
  },
  plugins: [
    github({
      repo: "FALAK097/waitlyze",
      versionPr: { base: "main", branch: "tegami/version-packages" },
      // Waitlyze is a private app, not an npm package. Tegami owns versioning
      // and release notes; publishing and GitHub Releases stay explicit.
      release: false,
      createTags: false,
    }),
  ],
});

await runCli(config);
