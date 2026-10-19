"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmailCanvas } from "./email-canvas";
import { upsertEmailTemplate, sendTestEmail } from "@/app/actions/emails";
import styles from "./email-tools.module.css";

const kinds = [
  { key: "signup", label: "Welcome", timing: "Sent after confirmation", note: "Classic waitlist pages. Snapshot pages can use the Welcome automation." },
  { key: "offboarding", label: "Offboarding", timing: "Never sent on its own", note: "A saved draft. To reach subscribers today, use Broadcasts." },
];

export function EmailTemplatesManager({ waitListId, initialTemplates }) {
  const [current, setCurrent] = useState("signup");
  const [drafts, setDrafts] = useState(initialTemplates);
  const [saved, setSaved] = useState(initialTemplates);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState("");
  const [testTo, setTestTo] = useState("");
  const editorRef = useRef(null);
  const template = drafts[current];
  const kind = kinds.find((item) => item.key === current);

  function edit(field, value) {
    setDrafts((items) => ({ ...items, [current]: { ...items[current], [field]: value } }));
    setDirty(true);
  }
  function select(key) {
    if (dirty) { setPending(key); return; }
    setCurrent(key); setPending(null);
  }
  function discard() {
    setDrafts((items) => ({ ...items, [current]: saved[current] }));
    setDirty(false); setCurrent(pending); setPending(null);
  }
  async function exportMessage() {
    if (!editorRef.current?.editor) throw new Error("The editor is still loading.");
    const { html, text } = await editorRef.current.getEmail();
    return JSON.parse(JSON.stringify({ editorDocument: editorRef.current.getJSON(), renderedHtml: html, renderedText: text }));
  }
  async function save() {
    setBusy("save");
    try {
      const content = await exportMessage();
      const response = await upsertEmailTemplate({ waitListId, templateType: current, data: { subject: template.subject, previewText: template.previewText, ...content } });
      if (!response.success) throw new Error(response.message);
      const savedTemplate = { ...template, ...response.template };
      setDrafts((items) => ({ ...items, [current]: savedTemplate }));
      setSaved((items) => ({ ...items, [current]: savedTemplate }));
      setDirty(false);
      toast.success("Email saved.");
    } catch (error) { toast.error(error.message || "Couldn't save the email."); }
    finally { setBusy(""); }
  }
  async function sendTest(event) {
    event.preventDefault();
    if (dirty) return toast.error("Save your changes before sending a test.");
    setBusy("test");
    try {
      const response = await sendTestEmail({ waitListId, templateType: current, to: testTo });
      if (!response.success) throw new Error(response.message);
      toast.success(`Test sent to ${testTo}.`);
    } catch (error) { toast.error(error.message || "Couldn't send the test."); }
    finally { setBusy(""); }
  }

  return <div className={styles.scope}>
    {pending && <div className={styles.unsaved} role="alert"><span>Save this email before switching, or discard your edits.</span><button type="button" onClick={() => setPending(null)}>Keep editing</button><button type="button" onClick={discard}>Discard edits</button></div>}
    <div className={styles.split}>
      <nav className={styles.rail} aria-label="Email templates">
        {kinds.map((item) => <button key={item.key} type="button" className={styles.railItem} aria-current={current === item.key ? "true" : undefined} onClick={() => select(item.key)}>
          <strong>{item.label}</strong><span>{item.timing}</span>
        </button>)}
      </nav>
      <section className={styles.pane} aria-label={`${kind.label} email`}>
        <header className={styles.paneHead}>
          <div>
            <h2 className={styles.paneTitle}>{kind.label}</h2>
            <p className={styles.paneMeta}>{kind.note}</p>
          </div>
          <div className={styles.paneActions}>
            <Button type="button" variant="default" onClick={save} disabled={Boolean(busy)}>{busy === "save" ? "Saving…" : "Save"}</Button>
          </div>
        </header>
        <div className={styles.fieldCard}>
          <div className={styles.fieldRow}>
            <input type="text" maxLength={160} aria-label="Subject" placeholder="Subject — what subscribers see in the inbox" value={template.subject} onChange={(event) => edit("subject", event.target.value)} />
          </div>
          <div className={styles.fieldRow}>
            <input type="text" maxLength={180} aria-label="Preview text" placeholder="Preview text — shown after the subject" value={template.previewText} onChange={(event) => edit("previewText", event.target.value)} />
          </div>
        </div>
        <div className={styles.canvasShell}>
          <EmailCanvas key={current} editorRef={editorRef} content={template.editorDocument || template.starterHtml || "<p>Write your message…</p>"} onChange={(value) => edit("editorDocument", value)} />
        </div>
        <div className={styles.metaBar}>
          <p className={styles.chips}>Personalize <code>{"{{waitlist}}"}</code><code>{"{{position}}"}</code><code>{"{{referral_link}}"}</code></p>
          <form className={styles.testForm} onSubmit={sendTest}>
            <input id="subscriber-test-address" type="email" placeholder="you@example.com" required maxLength={320} aria-label="Send a test to" value={testTo} onChange={(event) => setTestTo(event.target.value)} />
            <button type="submit" disabled={Boolean(busy) || dirty}>{busy === "test" ? "Sending…" : "Send test"}</button>
          </form>
        </div>
      </section>
    </div>
  </div>;
}
