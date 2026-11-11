export const LATEST_CHANGELOG_VERSION = "v0.11.0";
export const LATEST_CHANGELOG_DATE = "Nov 11 2026";

export function releaseId(title) {
  const versionMatch = String(title).match(/v\d+\.\d+\.\d+/);
  const base = versionMatch ? versionMatch[0] : title;
  return `release-${base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function formatChangelogDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length === 3) {
    const months = {
      Jan: "January",
      Feb: "February",
      Mar: "March",
      Apr: "April",
      May: "May",
      Jun: "June",
      Jul: "July",
      Aug: "August",
      Sep: "September",
      Oct: "October",
      Nov: "November",
      Dec: "December",
    };
    const fullMonth = months[parts[0]] || parts[0];
    return `${fullMonth} ${parts[1]}, ${parts[2]}`;
  }
  return dateStr;
}

export function parseChangelog(raw) {
  const blocks = raw.split(/^##\s+/m).filter(Boolean);
  return blocks.map((block, index) => {
    const lines = block.trim().split("\n");
    const headerLine = lines[0].trim();
    const versionMatch = headerLine.match(/^(v\d+\.\d+\.\d+)(?:\s*[·—–-]\s*(.+))?$/);
    const version = versionMatch ? versionMatch[1] : headerLine;
    const date = versionMatch && versionMatch[2] ? versionMatch[2].trim() : "";

    let title = "";
    const summaryLines = [];
    const highlights = [];
    let currentSection = "";

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("### ")) {
        title = line.replace(/^###\s+/, "");
      } else if (line.startsWith("#### ")) {
        currentSection = line.replace(/^####\s+/, "");
      } else if (line.startsWith("- ")) {
        const bulletText = line.replace(/^-\s+/, "");
        const boldMatch = bulletText.match(/^\*\*([^*]+)\*\*\s*(.*)$/);
        if (boldMatch) {
          highlights.push({
            title: boldMatch[1].replace(/\.$/, "").trim(),
            description: boldMatch[2].trim(),
          });
        } else {
          highlights.push({
            title: "",
            description: bulletText,
          });
        }
      } else {
        if (!currentSection) {
          summaryLines.push(line);
        }
      }
    }

    return {
      version,
      date,
      title,
      summary: summaryLines.join(" "),
      section: currentSection || "Highlights",
      highlights,
      isLatest: index === 0,
      id: releaseId(version),
    };
  });
}
