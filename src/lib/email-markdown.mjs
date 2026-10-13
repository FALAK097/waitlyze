import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const ALLOWED_EMAIL_TAGS = [
	"a",
	"blockquote",
	"br",
	"code",
	"del",
	"em",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"hr",
	"img",
	"li",
	"ol",
	"p",
	"pre",
	"strong",
	"table",
	"tbody",
	"td",
	"th",
	"thead",
	"tr",
	"ul",
];

const EMAIL_SANITIZER_OPTIONS = {
	allowedTags: ALLOWED_EMAIL_TAGS,
	allowedAttributes: {
		a: ["href", "title"],
		img: ["alt", "height", "src", "title", "width"],
	},
	allowedSchemes: ["http", "https", "mailto"],
	allowedSchemesByTag: { img: ["https"] },
	allowProtocolRelative: false,
};

const HTML_TEXT_ENTITIES = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

export function renderEmailMarkdown(markdown) {
	if (!markdown) return "";

	return sanitizeHtml(marked.parse(markdown), EMAIL_SANITIZER_OPTIONS);
}

export function escapeHtmlText(value) {
	return String(value).replace(/[&<>"']/g, (character) => HTML_TEXT_ENTITIES[character]);
}
