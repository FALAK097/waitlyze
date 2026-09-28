"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Redo2, Undo2 } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";

const clone = (value) => structuredClone(value);
const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;
const equal = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
const sectionNames = { hero: "Introduction", features: "Highlights", faq: "Questions", form: "Signup form", footer: "Note" };
const newSection = (type) => type === "features"
  ? { type, items: [{ title: "A clear benefit", body: "Explain how it helps." }] }
  : type === "faq"
    ? { type, items: [{ question: "What should people know?", answer: "Add a useful answer." }] }
    : { type, note: "Add a short note." };

function Preview({ snapshot, name }) {
  return <section className="product-page-preview" aria-label="Live page preview">
    <div className="product-page-preview-inner">
      <p className="product-page-preview-eyebrow">{name || "Your waitlist"}</p>
      {snapshot.sections.map((section, index) => <div className={`product-preview-section product-preview-${section.type}`} key={`${section.type}-${index}`}>
        {section.type === "hero" && <><h2>{section.heading}</h2><p>{section.body}</p></>}
        {section.type === "features" && <div className="product-preview-features">{section.items.map((item, itemIndex) => <article key={itemIndex}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>}
        {section.type === "faq" && <div className="product-preview-faq">{section.items.map((item, itemIndex) => <article key={itemIndex}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</div>}
        {section.type === "form" && <div className="product-preview-signup" aria-label="Signup form preview"><span>{section.label}</span><span className="product-preview-email">you@example.com</span><span className="product-preview-submit">{section.buttonText}</span></div>}
        {section.type === "footer" && <p className="product-preview-footer">{section.note}</p>}
      </div>)}
      <p className="product-preview-footnote">Preview only · saved edits stay private until you publish them.</p>
    </div>
  </section>;
}

export function SnapshotPageBuilder({ waitList, saveDraftPage, publishPage, pausePage, rollbackPage, canPublish }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(waitList.templateSnapshot);
  const [version, setVersion] = useState(waitList.templateRevision);
  const [dirty, setDirty] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Saved");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(null);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [addType, setAddType] = useState("features");
  const [showAddSection, setShowAddSection] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const snapshotRef = useRef(snapshot);
  const versionRef = useRef(version);
  const dirtyRef = useRef(dirty);
  const conflictRef = useRef(conflict);
  const inFlightRef = useRef(false);
  const saveAgainRef = useRef(false);
  const key = `waitlyze:page:${waitList.id}`;
  snapshotRef.current = snapshot;
  versionRef.current = version;
  dirtyRef.current = dirty;
  conflictRef.current = conflict;

  const applySnapshot = useCallback((next) => {
    const validated = clone(next);
    if (!Array.isArray(validated.sections) || validated.sections.length < 2 || validated.sections.length > 12) return;
    if (equal(snapshotRef.current, validated)) return;
    undoStack.current.push(clone(snapshotRef.current));
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
    setUndoCount(undoStack.current.length);
    setRedoCount(0);
    snapshotRef.current = validated;
    setSnapshot(validated);
    setDirty(true);
    setMessage("Unsaved changes");
    setError("");
    try {
      sessionStorage.setItem(key, JSON.stringify({ revision: versionRef.current, snapshot: validated }));
    } catch {
      setError("This browser could not keep a recovery copy. Leave this tab open until the page says Saved.");
    }
  }, [key]);

  const flush = useCallback(async () => {
    if (!dirtyRef.current || conflictRef.current) return;
    if (inFlightRef.current) { saveAgainRef.current = true; return; }
    inFlightRef.current = true;
    setSaving(true);
    const sent = clone(snapshotRef.current);
    try {
      const result = await saveDraftPage(waitList.id, versionRef.current, sent);
      if (result?.conflict) {
        setConflict({ revision: result.revision, snapshot: result.snapshot });
        setError("A newer page version was saved elsewhere. Your edits are still safe in this tab.");
        setMessage("Review changes");
        return;
      }
      if (!result?.ok) {
        setError(result?.message || "Couldn't save just now. Your edits are kept in this tab; try again.");
        setMessage("Not saved");
        return;
      }
      versionRef.current = result.revision;
      setVersion(result.revision);
      setError("");
      if (equal(snapshotRef.current, sent)) {
        const canonicalSnapshot = result.snapshot || sent;
        snapshotRef.current = canonicalSnapshot;
        setSnapshot(canonicalSnapshot);
        dirtyRef.current = false;
        setDirty(false);
        setMessage(result.unchanged ? "Saved" : `Saved · version ${result.revision}`);
      } else {
        dirtyRef.current = true;
        setDirty(true);
        saveAgainRef.current = true;
      }
      try { sessionStorage.setItem(key, JSON.stringify({ revision: result.revision, snapshot: snapshotRef.current })); }
      catch { setError("Page saved. This browser could not keep a recovery copy of newer edits."); }
    } catch {
      setError("Couldn't save just now. Your edits are kept in this tab; try again.");
      setMessage("Not saved");
    } finally {
      inFlightRef.current = false;
      setSaving(false);
      if (saveAgainRef.current) {
        saveAgainRef.current = false;
        window.setTimeout(() => { void flush(); }, 0);
      }
    }
  }, [key, saveDraftPage, waitList.id]);

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || "null");
      if (stored && Number.isSafeInteger(stored.revision) && templateSnapshotSchema.safeParse(stored.snapshot).success && !equal(stored.snapshot, waitList.templateSnapshot)) {
        const recovered = clone(stored.snapshot);
        snapshotRef.current = recovered;
        setSnapshot(recovered);
        setDirty(true);
        dirtyRef.current = true;
        if (stored.revision !== waitList.templateRevision) {
          setConflict({ revision: waitList.templateRevision, snapshot: waitList.templateSnapshot });
          conflictRef.current = { revision: waitList.templateRevision, snapshot: waitList.templateSnapshot };
          setError("This tab has edits from an older saved version. Choose which version to keep.");
          setMessage("Review changes");
        } else setMessage("Recovered unsaved edits");
      }
    } catch {
      setError("A recovery copy could not be read. The last saved version is loaded.");
    }
    setHydrated(true);
  }, [key, waitList.templateRevision, waitList.templateSnapshot]);

  useEffect(() => {
    if (!hydrated || !dirty || conflict) return undefined;
    const timer = window.setTimeout(() => { void flush(); }, 700);
    return () => window.clearTimeout(timer);
  }, [snapshot, dirty, conflict, hydrated, flush]);

  const moveSection = (index, direction) => {
    const target = index + direction;
    if (index === 0 || target <= 0 || target >= snapshot.sections.length) return;
    const sections = [...snapshot.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    applySnapshot({ ...snapshot, sections });
  };
  const updateSection = (sectionIndex, transform) => {
    const sections = snapshot.sections.map((section, index) => index === sectionIndex ? transform(section) : section);
    applySnapshot({ ...snapshot, sections });
  };
  const updateItem = (sectionIndex, itemIndex, transform) => updateSection(sectionIndex, (section) => ({ ...section, items: section.items.map((item, index) => index === itemIndex ? transform(item) : item) }));
  const removeSection = (index) => {
    if (snapshot.sections[index].type === "hero" || snapshot.sections[index].type === "form") return;
    applySnapshot({ ...snapshot, sections: snapshot.sections.filter((_, sectionIndex) => sectionIndex !== index) });
  };
  const addSection = () => {
    if (snapshot.sections.length >= 12) return;
    applySnapshot({ ...snapshot, sections: [...snapshot.sections.slice(0, -1), newSection(addType), snapshot.sections.at(-1)] });
    setShowAddSection(false);
  };
  const undo = () => {
    if (!undoStack.current.length) return;
    redoStack.current.push(clone(snapshotRef.current));
    const previous = undoStack.current.pop();
    setUndoCount(undoStack.current.length); setRedoCount(redoStack.current.length);
    snapshotRef.current = previous; setSnapshot(previous); setDirty(true); setMessage("Unsaved changes");
    try { sessionStorage.setItem(key, JSON.stringify({ revision: versionRef.current, snapshot: previous })); } catch { setError("This browser could not keep a recovery copy."); }
  };
  const redo = () => {
    if (!redoStack.current.length) return;
    undoStack.current.push(clone(snapshotRef.current));
    const next = redoStack.current.pop();
    setUndoCount(undoStack.current.length); setRedoCount(redoStack.current.length);
    snapshotRef.current = next; setSnapshot(next); setDirty(true); setMessage("Unsaved changes");
    try { sessionStorage.setItem(key, JSON.stringify({ revision: versionRef.current, snapshot: next })); } catch { setError("This browser could not keep a recovery copy."); }
  };
  const resolveConflict = (choice) => {
    if (!conflict) return;
    const remote = conflict;
    const next = choice === "saved" ? clone(remote.snapshot) : clone(snapshotRef.current);
    undoStack.current = []; redoStack.current = []; setUndoCount(0); setRedoCount(0);
    versionRef.current = remote.revision; setVersion(remote.revision);
    setConflict(null); conflictRef.current = null; setError("");
    snapshotRef.current = next; setSnapshot(next);
    const changed = !equal(next, remote.snapshot);
    dirtyRef.current = changed; setDirty(changed); setMessage(changed ? "Saving your version…" : "Saved");
    try { sessionStorage.setItem(key, JSON.stringify({ revision: remote.revision, snapshot: next })); } catch { /* The editor remains usable in this tab. */ }
  };
  const onKeyDown = (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']"))) return;
    if (event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
    } else if (event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
  };

  const publish = async () => {
    if (dirty || saving || conflict || publishing) return;
    setPublishing(true); setError("");
    const result = await publishPage(waitList.id, version);
    setPublishing(false);
    if (!result?.ok) { setError(result?.message || "Couldn't publish this page."); return; }
    setMessage(result.unchanged ? "Already live" : `Published · version ${result.revision}`);
    router.refresh();
  };
  const lifecycle = async (action) => {
    if (dirty || saving || conflict || publishing) return;
    setPublishing(true); setError("");
    const result = await action(waitList.id);
    setPublishing(false);
    if (!result?.ok) { setError(result?.message || "Couldn't update publication."); return; }
    if (Number.isSafeInteger(result.templateRevision) && result.snapshot) {
      const restored = clone(result.snapshot);
      versionRef.current = result.templateRevision; setVersion(result.templateRevision);
      snapshotRef.current = restored; setSnapshot(restored);
      dirtyRef.current = false; setDirty(false); setConflict(null); conflictRef.current = null;
      undoStack.current = []; redoStack.current = []; setUndoCount(0); setRedoCount(0);
      setMessage("Restored previous published version");
      try { sessionStorage.setItem(key, JSON.stringify({ revision: result.templateRevision, snapshot: restored })); } catch { /* A future reload still uses the saved server version. */ }
    }
    router.refresh();
  };
  const hasUpdates = waitList.status !== "PUBLISHED" || waitList.publishedTemplateRevision !== version;

  return <section className="product-builder" onKeyDown={onKeyDown}>
    <header className="product-builder-header">
      <div><p className="product-builder-kicker">{waitList.status === "PUBLISHED" ? "Published page" : waitList.status === "PAUSED" ? "Paused page" : "Private draft"} · {waitList.name}</p><h1 className="product-page-title">Page</h1><p className="product-help">Edit your page, then publish the saved version when it’s ready.</p></div>
      <div className="product-builder-tools"><span role="status" aria-live="polite">{saving ? "Saving…" : message}</span><Button variant="outline" type="button" aria-label="Undo last change" onClick={undo} disabled={!undoCount}><Undo2 aria-hidden="true" /><span>Undo</span></Button><Button variant="outline" type="button" aria-label="Redo last change" onClick={redo} disabled={!redoCount}><Redo2 aria-hidden="true" /><span>Redo</span></Button><Button type="button" onClick={() => { void flush(); }} disabled={!dirty || saving || !!conflict}>{saving ? "Saving…" : "Save now"}</Button>{canPublish && hasUpdates && <Button type="button" onClick={() => { void publish(); }} disabled={dirty || saving || !!conflict || publishing}>{publishing ? "Publishing…" : waitList.status === "PAUSED" ? "Publish and resume" : waitList.status === "PUBLISHED" ? "Publish updates" : "Publish waitlist"}</Button>}{canPublish && waitList.status === "PUBLISHED" && <Button variant="outline" type="button" onClick={() => { void lifecycle(pausePage); }} disabled={dirty || saving || !!conflict || publishing}>Pause waitlist</Button>}{waitList.status !== "DRAFT" && waitList.publicSlug && <Link className="product-builder-live-link" href={`/w/${waitList.publicSlug}`} target="_blank" rel="noreferrer">View live page</Link>}{canPublish && waitList.publishedRevision > 1 && <Button variant="outline" type="button" onClick={() => { void lifecycle(rollbackPage); }} disabled={dirty || saving || !!conflict || publishing}>Restore previous version</Button>}</div>
    </header>
    {error && <div className="product-builder-alert" role="alert"><p>{error}</p>{conflict && <div className="product-builder-conflict-actions"><Button variant="outline" type="button" onClick={() => resolveConflict("saved")}>Use saved version</Button><Button type="button" onClick={() => resolveConflict("mine")}>Replace saved version with mine</Button></div>}{!conflict && dirty && <Button variant="outline" type="button" onClick={() => { setError(""); void flush(); }}>Retry save</Button>}</div>}
    <div className="product-builder-grid">
      <div className="product-builder-editor">
        <div className="product-builder-editor-heading"><div><h2>Page content</h2><p>Changes save as you edit. Use the arrows to change section order.</p></div><p>Version {version}</p></div>
        {snapshot.sections.map((section, sectionIndex) => <fieldset className="product-builder-section" key={`${section.type}-${sectionIndex}`}><legend>{sectionNames[section.type]}</legend><div className="product-builder-section-tools"><Button variant="outline" type="button" aria-label={`Move ${sectionNames[section.type]} up`} onClick={() => moveSection(sectionIndex, -1)} disabled={sectionIndex <= 1}><ArrowUp aria-hidden="true" /></Button><Button variant="outline" type="button" aria-label={`Move ${sectionNames[section.type]} down`} onClick={() => moveSection(sectionIndex, 1)} disabled={sectionIndex === snapshot.sections.length - 1}><ArrowDown aria-hidden="true" /></Button>{section.type !== "hero" && section.type !== "form" && <Button variant="outline" type="button" onClick={() => removeSection(sectionIndex)} aria-label={`Remove ${sectionNames[section.type]}`}>Remove</Button>}</div>
          {section.type === "hero" && <div className="product-builder-fields"><label htmlFor={`section-${sectionIndex}-heading`}>Headline</label><Input id={`section-${sectionIndex}-heading`} maxLength={120} value={section.heading} onChange={(event) => updateSection(sectionIndex, (item) => ({ ...item, heading: event.target.value }))} /><label htmlFor={`section-${sectionIndex}-body`}>Introduction</label><textarea id={`section-${sectionIndex}-body`} maxLength={600} rows={3} value={section.body} onChange={(event) => updateSection(sectionIndex, (item) => ({ ...item, body: event.target.value }))} /></div>}
          {(section.type === "features" || section.type === "faq") && <div className="product-builder-items">{section.items.map((item, itemIndex) => <div className="product-builder-item" key={itemIndex}><p>{section.type === "features" ? `Highlight ${itemIndex + 1}` : `Question ${itemIndex + 1}`}</p><label htmlFor={`section-${sectionIndex}-item-${itemIndex}-title`}>{section.type === "features" ? "Title" : "Question"}</label><Input id={`section-${sectionIndex}-item-${itemIndex}-title`} maxLength={section.type === "features" ? 80 : 120} value={section.type === "features" ? item.title : item.question} onChange={(event) => updateItem(sectionIndex, itemIndex, (value) => section.type === "features" ? { ...value, title: event.target.value } : { ...value, question: event.target.value })} /><label htmlFor={`section-${sectionIndex}-item-${itemIndex}-body`}>{section.type === "features" ? "Description" : "Answer"}</label><textarea id={`section-${sectionIndex}-item-${itemIndex}-body`} maxLength={section.type === "features" ? 240 : 400} rows={3} value={section.type === "features" ? item.body : item.answer} onChange={(event) => updateItem(sectionIndex, itemIndex, (value) => section.type === "features" ? { ...value, body: event.target.value } : { ...value, answer: event.target.value })} />{section.items.length > 1 && <Button variant="outline" type="button" onClick={() => updateSection(sectionIndex, (value) => ({ ...value, items: value.items.filter((_, index) => index !== itemIndex) }))}>Remove {section.type === "features" ? "highlight" : "question"}</Button>}</div>)}{section.items.length < 6 && <Button variant="outline" type="button" onClick={() => updateSection(sectionIndex, (value) => ({ ...value, items: [...value.items, section.type === "features" ? { title: "A clear benefit", body: "Explain how it helps." } : { question: "What should people know?", answer: "Add a useful answer." }] }))}>Add {section.type === "features" ? "highlight" : "question"}</Button>}</div>}
          {section.type === "form" && <div className="product-builder-fields"><label htmlFor={`section-${sectionIndex}-label`}>Email field label</label><Input id={`section-${sectionIndex}-label`} maxLength={80} value={section.label} onChange={(event) => updateSection(sectionIndex, (item) => ({ ...item, label: event.target.value }))} /><label htmlFor={`section-${sectionIndex}-button`}>Button text</label><Input id={`section-${sectionIndex}-button`} maxLength={40} value={section.buttonText} onChange={(event) => updateSection(sectionIndex, (item) => ({ ...item, buttonText: event.target.value }))} /><p className="product-help">Referrals, verification and signup emails stay off in this draft.</p></div>}
          {section.type === "footer" && <div className="product-builder-fields"><label htmlFor={`section-${sectionIndex}-note`}>Short note</label><textarea id={`section-${sectionIndex}-note`} maxLength={160} rows={3} value={section.note} onChange={(event) => updateSection(sectionIndex, (item) => ({ ...item, note: event.target.value }))} /></div>}
        </fieldset>)}
        <div className="product-builder-add">{showAddSection ? <><label htmlFor="section-type">Section</label><select id="section-type" value={addType} onChange={(event) => setAddType(event.target.value)}><option value="features">Highlights</option><option value="faq">Questions</option><option value="footer">Note</option></select><Button type="button" onClick={addSection} disabled={snapshot.sections.length >= 12}>Add section</Button><Button variant="outline" type="button" onClick={() => setShowAddSection(false)}>Cancel</Button></> : <Button variant="outline" type="button" onClick={() => setShowAddSection(true)} disabled={snapshot.sections.length >= 12}>Add a section</Button>}{snapshot.sections.length >= 12 && <p className="product-help">A page can have up to 12 sections.</p>}</div>
      </div>
      <div className="product-builder-preview-wrap"><div className="product-builder-preview-heading"><h2>Preview</h2><span>Desktop page</span></div><Preview snapshot={snapshot} name={waitList.name} /></div>
    </div>
  </section>;
}
