import "server-only";
import { escapeHtmlText, renderEmailMarkdown } from "../email-markdown.mjs";
import { emailBrandFromSnapshot } from "./brand.mjs";
import { interpolateEmail, subscriberEmailHtml } from "./composer.mjs";

export function renderLegacyTemplateEmail({ template, waitList, variables }) {
  const replaceVars = (text) =>
    text.replace(/\{\{([^}]+)\}\}/g, (_, key) => variables[key.trim()] ?? `{{${key}}}`);
  const subject = replaceVars(template.subject);
  const previewText = replaceVars(template.previewText);
  const header = renderEmailMarkdown(replaceVars(template.header));
  const subHeader = renderEmailMarkdown(replaceVars(template.subHeader));
  const mainBody = renderEmailMarkdown(replaceVars(template.mainBody));
  const subBody = renderEmailMarkdown(replaceVars(template.subBody));
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlText(subject)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 0;
      margin: 0;
      background-color: #f7f7f7;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 30px 20px;
    }
    .email-body {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #111827;
    }
    .subheader {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    .content {
      font-size: 14px;
      margin-bottom: 24px;
    }
    .footer {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    .divider {
      border-top: 1px solid #e5e7eb;
      margin: 24px 0;
    }
    .email-footer {
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
      margin-top: 24px;
    }
    /* Markdown styles */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 0;
      color: #111827;
    }
    h1 { font-size: 22px; }
    h2 { font-size: 20px; }
    h3 { font-size: 18px; }
    h4 { font-size: 16px; }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    p {
      margin-top: 0;
    }
    code {
      font-family: monospace;
      background-color: #f3f4f6;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      background-color: #f3f4f6;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #e5e7eb;
      margin-left: 0;
      padding-left: 12px;
      color: #6b7280;
    }
    ul, ol {
      padding-left: 24px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-body">
      <div class="header">${header}</div>
      <div class="subheader">${subHeader}</div>
      <div class="content">${mainBody}</div>
      <div class="footer">${subBody}</div>
      <div class="divider"></div>
      <div class="email-footer">
        Need help? Reply to this email • © ${new Date().getFullYear()} ${escapeHtmlText(waitList.name || "This waitlist")}
      </div>
    </div>
  </div>
</body>
</html>`;
  const richHtml = template.renderedHtml
    ? subscriberEmailHtml({
        name: waitList.name || "Your project",
        content: interpolateEmail(template.renderedHtml, variables),
        previewText,
        brand: emailBrandFromSnapshot(waitList.templateSnapshot),
      })
    : null;

  return {
    subject,
    html: richHtml || html,
    text: template.renderedText ? replaceVars(template.renderedText) : undefined,
  };
}
