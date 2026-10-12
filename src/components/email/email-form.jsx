"use client";

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "./markdown-editor";
import styles from "./email-tools.module.css";

export function EmailForm({ type, form, disabled }) {
  const textField = (name, title, maxLength, rows = 3) => <Label className="product-field"><span>{title}</span><Textarea {...form.register(`${type}.${name}`)} maxLength={maxLength} rows={rows} disabled={disabled} /></Label>;
  return <div className={styles.templateForm}>
    <Label className="product-field"><span>Subject</span><Input {...form.register(`${type}.subject`)} maxLength={160} disabled={disabled} /></Label>
    <Label className="product-field"><span>Preview text <small>Optional</small></span><Input {...form.register(`${type}.previewText`)} maxLength={180} disabled={disabled} /></Label>
    {textField("header", "Heading", 1000, 2)}
    <div className="product-field"><span id="template-message-label">Message</span><MarkdownEditor value={form.watch(`${type}.mainBody`)} onChange={(value) => form.setValue(`${type}.mainBody`, value, { shouldDirty: true })} disabled={disabled} aria-labelledby="template-message-label" /></div>
    <p className="product-help">Use <code>{"{{waitlist}}"}</code> for the waitlist name. Markdown is supported.</p>
    <Collapsible><CollapsibleTrigger>Additional content</CollapsibleTrigger><CollapsibleContent><div>{textField("subHeader", "Subheading", 1000)}{textField("subBody", "Footer message", 3000)}</div></CollapsibleContent></Collapsible>
  </div>;
}
