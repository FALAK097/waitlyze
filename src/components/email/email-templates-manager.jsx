"use client";

import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryState } from "nuqs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { EmailForm } from "./email-form";
import { upsertEmailTemplate, sendTestEmail } from "@/app/actions/emails";
import styles from "./email-tools.module.css";

export function EmailTemplatesManager({ waitListId, waitListName, initialTemplates }) {
  const [current, setCurrent] = useQueryState("emailTab", { defaultValue: "signup", parse: (value) => value === "offboarding" ? "offboarding" : "signup", serialize: (value) => value });
  const [busy, setBusy] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [error, setError] = useState("");
  const form = useForm({ defaultValues: { signup: initialTemplates.signup, offboarding: initialTemplates.offboarding } });
  const template = useWatch({ control: form.control, name: current }) || initialTemplates[current];
  function markdown(text) { return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{(text || "").replace(/\{\{waitlist\}\}/g, waitListName || "Project")}</ReactMarkdown>; }
  async function save() {
    setBusy("save"); setError("");
    try { const result = await upsertEmailTemplate({ waitListId, templateType: current, data: form.getValues(current) }); if (!result.success) throw new Error(result.message || "Couldn’t save this template. Try again."); toast.add({ title: "Template saved.", type: "success" }); }
    catch (failure) { setError(failure.message || "Couldn’t save this template. Try again."); toast.add({ title: "Template could not be saved.", type: "error" }); }
    finally { setBusy(""); }
  }
  async function sendTest(event) {
    event.preventDefault(); setBusy("test"); setError("");
    try { const result = await sendTestEmail({ waitListId, templateType: current, to: testEmail }); if (!result.success) throw new Error(result.message || "Couldn’t send this test. Check the address and try again."); toast.add({ title: result.message || "Test email sent.", type: "success" }); }
    catch (failure) { setError(failure.message || "Couldn’t send this test. Try again."); toast.add({ title: "Test email could not be sent.", type: "error" }); }
    finally { setBusy(""); }
  }
  return <div className={styles.scope}>
    <div className={styles.templateHeading}><div><h2>Email templates</h2><p>Write the emails subscribers receive.</p></div><Button onClick={save} disabled={Boolean(busy)}>{busy === "save" ? "Saving…" : "Save template"}</Button></div>
    <div role="tablist" aria-label="Email template" className={styles.templateTabs}>{[["signup", "Signup"], ["offboarding", "Offboarding"]].map(([value, title]) => <Button key={value} id={`template-tab-${value}`} type="button" role="tab" aria-selected={current === value} aria-controls="template-editor" tabIndex={current === value ? 0 : -1} disabled={Boolean(busy)} onClick={() => setCurrent(value)} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? "signup" : event.key === "End" ? "offboarding" : current === "signup" ? "offboarding" : "signup"; setCurrent(next); document.getElementById(`template-tab-${next}`)?.focus(); } }}>{title}</Button>)}</div>
    {error && <p role="alert" className={styles.feedback}>{error}</p>}
    <div className={styles.templateGrid}><section id="template-editor" role="tabpanel" aria-labelledby={`template-tab-${current}`}><EmailForm key={current} type={current} form={form} disabled={Boolean(busy)} /></section><aside className={styles.preview} aria-label="Email preview"><p className={styles.previewLabel}>Preview</p><div className={styles.previewMessage}><div className={styles.previewHeading}>{markdown(template.header)}</div>{markdown(template.subHeader)}{markdown(template.mainBody)}{markdown(template.subBody)}<footer>Need help? Reply to this email · {new Date().getFullYear()} Waitlyze</footer></div><form onSubmit={sendTest} className={styles.testForm}><Label htmlFor="template-test-address">Send a test</Label><div><Input id="template-test-address" type="email" required maxLength={320} placeholder="you@example.com" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} disabled={Boolean(busy)} /><Button variant="outline" type="submit" disabled={Boolean(busy) || !testEmail}>{busy === "test" ? "Sending…" : "Send test"}</Button></div><p>Tests use the saved template. Save your changes first.</p></form></aside></div>
  </div>;
}
