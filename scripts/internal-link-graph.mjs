import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const blogDir = fileURLToPath(new URL("../content/blog/", import.meta.url));
const posts = (await readdir(blogDir)).filter((file) => file.endsWith(".mdx"));
const destinations = ["/pricing", "/features", "/compare", "/alternatives", "/templates"];
const homepageSections = new Map([
  ["#pricing", "/pricing"],
  ["#features", "/features"],
]);
const inbound = new Map(destinations.map((path) => [path, 0]));

for (const post of posts) {
  const source = await readFile(join(blogDir, post), "utf8");
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, "");
  const links = [
    ...[...body.matchAll(/\]\((\/[^)\s]*)[^)]*\)/g)].map((match) => match[1]),
    ...[...body.matchAll(/href="(\/[^"\s]*)"/g)].map((match) => match[1]),
  ];
  const linkedDestinations = new Set();

  for (const link of links) {
    const fragmentIndex = link.indexOf("#");
    const fragment = fragmentIndex >= 0 ? link.slice(fragmentIndex).split("?", 1)[0] : "";
    const sectionDestination = homepageSections.get(fragment);
    const normalizedLink = sectionDestination || link.split(/[?#]/, 1)[0];

    for (const destination of destinations) {
      if (normalizedLink === destination || normalizedLink.startsWith(`${destination}/`)) {
        linkedDestinations.add(destination);
      }
    }
  }

  for (const destination of linkedDestinations) {
    inbound.set(destination, inbound.get(destination) + 1);
  }
  console.log(`${post}: ${links.length} internal links`);
}

console.log("\nBlog posts linking to key destinations:");
for (const [destination, count] of inbound) {
  console.log(`${destination}: ${count}`);
}
