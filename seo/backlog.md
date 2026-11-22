# SEO backlog

Evidence and priorities from the Nov 22, 2026 Search Console/repository review are in `context.md`. Recheck low-volume query data before treating a movement as a trend.

## Shipped in this PR

- [x] Add contextual product callouts to the landing-page checklist and examples, waitlist email templates, milestone referrals, and robots.txt/AI crawling guide.
- [x] Add real product and comparison destinations to `/llms.txt` and `/llms-full.txt`.
- [x] Add `server.json` and a root `SKILL.md` for MCP discovery and setup.
- [x] Add `scripts/internal-link-graph.mjs` to review blog links to key product destinations.

## Next

- [ ] Refresh Search Console page/query data, then review the email-template and landing-page posts for query fit and actual impression volume.
- [ ] Inspect whether `/alternatives/launchlist` has gained useful contextual links from relevant editorial pages; avoid inserting a comparison link where it does not help the reader.
- [ ] Review remaining posts flagged by the prior unslop scan manually. Edit only specific unsupported or repetitive wording; do not apply bulk regex rewrites.
- [ ] Check indexing for the homepage pricing/features anchors through their canonical homepage URL; Google indexes the page, not fragment URLs independently.
- [ ] Submit the MCP registry and other directory listings only after checking each registry's current schema and submission policy.
