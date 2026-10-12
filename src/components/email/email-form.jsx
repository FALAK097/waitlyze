"use client";

import { Input } from "@/components/product/input";
import { MarkdownEditor } from "./markdown-editor";
import styles from "./email-tools.module.css";

export function EmailForm({ type, form, disabled }) {
  const textField = (name, title, maxLength, rows = 3) => <label className="product-field"><span>{title}</span><textarea className="product-input" {...form.register(`${type}.${name}`)} maxLength={maxLength} rows={rows} disabled={disabled} /></label>;
  return <div className={styles.templateForm}>
    <label className="product-field"><span>Subject</span><Input {...form.register(`${type}.subject`)} maxLength={160} disabled={disabled} /></label>
    <label className="product-field"><span>Preview text <small>Optional</small></span><Input {...form.register(`${type}.previewText`)} maxLength={180} disabled={disabled} /></label>
    {textField("header", "Heading", 1000, 2)}
    <div className="product-field"><span id="template-message-label">Message</span><MarkdownEditor value={form.watch(`${type}.mainBody`)} onChange={(value) => form.setValue(`${type}.mainBody`, value, { shouldDirty: true })} disabled={disabled} aria-labelledby="template-message-label" /></div>
    <p className="product-help">Use <code>{"{{waitlist}}"}</code> for the waitlist name. Markdown is supported.</p>
    <details><summary>Additional content</summary><div>{textField("subHeader", "Subheading", 1000)}{textField("subBody", "Footer message", 3000)}</div></details>
  </div>;
}
