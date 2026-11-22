import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const blogDir = fileURLToPath(new URL("../content/blog/", import.meta.url));
const posts = (await readdir(blogDir)).filter((file) => file.endsWith(".mdx"));
const destinations = ["/pricing", "/features", "/compare", "/alternatives", "/templates"];
const inbound = new Map(destinations.map((path) => [path, 0]));

for (const post of posts) {
  const source = await readFile(join(blogDir, post), "utf8");
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, "");
  const links = [
    ...[...body.matchAll(/\]\((\/[^)#?]*)[^)]*\)/g)].map((match) => match[1]),
    ...[...body.matchAll(/href="(\/[^"#?]*)"/g)].map((match) => match[1]),
  ];
  const linkedDestinations = new Set();

  for (const link of links) {
    for (const destination of destinations) {
      if (link === destination || link.startsWith(`${destination}/`)) {
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
