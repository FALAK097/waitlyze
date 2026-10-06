import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtmlText, renderEmailMarkdown } from "../../src/lib/email-markdown.mjs";

test("email Markdown keeps formatting and removes active HTML", () => {
	const html = renderEmailMarkdown("**Welcome**\n\n<script>alert(1)</script>");

	assert.match(html, /<strong>Welcome<\/strong>/);
	assert.doesNotMatch(html, /<script|alert\(1\)/i);
});

test("email Markdown removes unsafe links, remote images, and event handlers", () => {
	const html = renderEmailMarkdown(
		'<a href="javascript:alert(1)" onclick="alert(1)">Open</a> <img src="http://tracker.test/pixel" onerror="alert(1)"> <img src="https://images.test/logo.png" alt="Logo">',
	);

	assert.doesNotMatch(html, /javascript:|onclick=|onerror=|http:\/\/tracker\.test/i);
	assert.match(html, /https:\/\/images\.test\/logo\.png/);
});

test("HTML text escaping keeps template values out of markup", () => {
	assert.equal(escapeHtmlText('<img src=x onerror="run()"> & "welcome"'), "&lt;img src=x onerror=&quot;run()&quot;&gt; &amp; &quot;welcome&quot;");
});
