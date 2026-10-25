import sanitizeHtml from "sanitize-html";

import { escapeHtmlText, renderEmailMarkdown } from "../email-markdown.mjs";
import { emailFontStack } from "./brand.mjs";

const allowedTags = [
  "html",
  "head",
  "body",
  "meta",
  "title",
  "div",
  "span",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "a",
  "img",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "blockquote",
  "ul",
  "ol",
  "li",
  "pre",
  "code",
  "section",
  "footer",
];
const spacingValues = [/^[\d.\s]+(?:px|em|rem|%)?(?:\s+[\d.]+(?:px|em|rem|%)?)*$/];
const borderValues = [/^[\w\s#.(),%-]+$/];
const boxSpacingStyles = Object.fromEntries(
  ["", "-top", "-bottom", "-left", "-right"].flatMap((side) => [
    [`padding${side}`, spacingValues],
    [`margin${side}`, spacingValues],
  ]),
);
const borderStyles = Object.fromEntries(
  ["", "-top", "-bottom", "-left", "-right"].map((side) => [`border${side}`, borderValues]),
);
const options = {
  allowedTags,
  allowedAttributes: {
    "*": ["style", "align", "width", "height", "role", "aria-label"],
    a: ["href", "title", "target", "style"],
    img: ["src", "alt", "width", "height", "style"],
    meta: ["charset", "name", "content"],
  },
  allowedSchemes: ["https", "http", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  // The visual editor exports inline email styles; keep only CSS properties
  // used in email layouts, never CSS url(), position or arbitrary HTML.
  allowedStyles: {
    "*": {
      "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,.%]+\)$/i],
      color: [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,.%]+\)$/i],
      "font-family": [/^[\w\s,'"-]+$/],
      "font-size": [/^[\d.]+(?:px|em|rem|%)$/],
      "font-weight": [/^(?:normal|bold|[1-9]00)$/],
      "line-height": [/^[\d.]+(?:px|em|rem|%)?$/],
      "text-align": [/^(?:left|right|center)$/],
      "text-decoration": [/^(?:none|underline|line-through)$/],
      "letter-spacing": [/^-?[\d.]+(?:px|em)$/],
      ...boxSpacingStyles,
      "max-width": [/^[\d.]+(?:px|%)$/],
      width: [/^[\d.]+(?:px|%)$/],
      height: [/^[\d.]+(?:px|%)$/],
      "border-radius": [/^[\d.]+px$/],
      ...borderStyles,
      display: [/^(?:block|inline-block|table|table-cell|none)$/],
    },
  },
};

export function validateComposerContent({ editorDocument, renderedHtml, renderedText }) {
  if (!editorDocument || editorDocument.type !== "doc" || !Array.isArray(editorDocument.content))
    throw new Error("Write a message before saving.");
  if (
    JSON.stringify(editorDocument).length > 60000 ||
    typeof renderedHtml !== "string" ||
    renderedHtml.length > 120000 ||
    typeof renderedText !== "string" ||
    renderedText.length > 12000
  )
    throw new Error("This email is too long. Shorten it and try again.");
  if (!renderedText.trim()) throw new Error("Write a message before saving.");
  const html = sanitizeHtml(renderedHtml, options);
  if (!html.trim()) throw new Error("Write a message before saving.");
  return { editorDocument, renderedHtml: html, renderedText: renderedText.trim() };
}

export function interpolateEmail(value, variables) {
  return String(value || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, name) =>
    escapeHtmlText(variables[name.toLowerCase()] ?? match),
  );
}

export function subscriberEmailHtml({
  name,
  content,
  previewText = "",
  unsubscribeUrl,
  brand = null,
}) {
  const logo = brand?.logo
    ? `<img src="${escapeHtmlText(brand.logo)}" alt="" width="120" style="display:block;max-width:160px;height:auto;margin-bottom:12px">`
    : "";
  const font = emailFontStack(brand?.bodyFont);
  const linkStyle = brand?.linkColor ? `<style>a{color:${brand.linkColor}}</style>` : "";
  const footer = `<table role="presentation" width="100%" style="border-top:1px solid #e5e9e4;margin-top:36px;padding-top:18px"><tr><td style="font:13px/21px Arial,sans-serif;color:#616b64"><strong style="color:#16271d">${escapeHtmlText(name)}</strong>${unsubscribeUrl ? `<br>You received this because you opted in to updates. <a href="${escapeHtmlText(unsubscribeUrl)}" style="color:#33543c">Unsubscribe</a>.` : ""}</td></tr></table>`;
  const body = content.includes("<body")
    ? content.replace(/<\/body\s*>/i, `${footer}</body>`)
    : `<!doctype html><html lang="en"><body style="margin:0;background:#f7f8f5;color:#16271d;font:16px/1.6 ${font}"><div style="max-width:600px;margin:0 auto;padding:36px 24px">${linkStyle}${logo}<p style="font-size:13px;color:#617267">${escapeHtmlText(name)}</p>${content}${footer}</div></body></html>`;
  return previewText
    ? body.replace(
        /<body([^>]*)>/i,
        `<body$1><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtmlText(previewText)}</div>`,
      )
    : body;
}

export function legacyEmailContent({ header, subHeader, mainBody, subBody }) {
  return [
    header ? `<h1>${escapeHtmlText(header)}</h1>` : "",
    subHeader ? renderEmailMarkdown(subHeader) : "",
    renderEmailMarkdown(mainBody),
    subBody ? renderEmailMarkdown(subBody) : "",
  ].join("");
}
