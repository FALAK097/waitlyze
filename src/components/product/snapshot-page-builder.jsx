"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BLOCK_TYPES,
  createSection,
  listTemplates,
  snapshotTemplate,
  templateSnapshotSchema,
} from "@/lib/templates/catalog.mjs";
import { findUnchangedStarterCopy } from "@/lib/templates/starter-copy.mjs";

import { PublicationOptions } from "./publication-options";
import {
  StatusPagePreview,
  WaitlistPageContent,
  WaitlistSignupPreview,
} from "./waitlist-page-content";

import styles from "./page-editor.module.css";

const clone = (value) => structuredClone(value);
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const names = Object.fromEntries(BLOCK_TYPES.map((block) => [block.type, block.label]));
const templates = listTemplates();
const fonts = [
  { id: "hanken", label: "Hanken Grotesk" },
  { id: "manrope", label: "Manrope" },
  { id: "bricolage", label: "Bricolage Grotesque" },
  { id: "figtree", label: "Figtree" },
  { id: "archivo", label: "Archivo" },
];
const itemDefaults = {
  features: { title: "A clear benefit", body: "Explain how it helps." },
  steps: { title: "Next step", body: "Explain what happens here." },
  logos: "Company",
  stats: { value: "100+", label: "people waiting" },
  testimonials: { quote: "Add an honest quote.", name: "Customer name", role: "Role" },
  faq: { question: "What should people know?", answer: "Add a useful answer." },
  referralRewards: { referrals: 5, reward: "Early access" },
};

function Field({ label, value, onChange, multiline = false, type = "text", maxLength }) {
  const id = useId();
  return (
    <div className={styles.field}>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          maxLength={maxLength}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <Label className={styles.toggle}>
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <span>{label}</span>
    </Label>
  );
}
function StringItems({ section, fields, update }) {
  return (
    <div className={styles.itemList}>
      {section.items.map((item, index) => (
        <div className={styles.itemEditor} key={index}>
          <span>{index + 1}</span>
          {fields.map(({ key, label, multiline, type = "text" }) => (
            <Field
              key={key}
              label={label}
              type={type}
              multiline={multiline}
              value={typeof item === "string" ? item : item[key]}
              onChange={(value) =>
                update({
                  ...section,
                  items: section.items.map((entry, itemIndex) =>
                    itemIndex === index
                      ? typeof entry === "string"
                        ? value
                        : { ...entry, [key]: type === "number" ? Number(value) : value }
                      : entry,
                  ),
                })
              }
            />
          ))}
          {section.items.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() =>
                update({
                  ...section,
                  items: section.items.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            >
              Remove
            </Button>
          )}
        </div>
      ))}
      {section.items.length < 8 && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            update({ ...section, items: [...section.items, clone(itemDefaults[section.type])] })
          }
        >
          Add item
        </Button>
      )}
    </div>
  );
}
function LinkItems({ section, update }) {
  return (
    <div className={styles.itemList}>
      {section.links.map((link, index) => (
        <div className={styles.itemEditor} key={index}>
          <Field
            label="Label"
            value={link.label}
            onChange={(label) =>
              update({
                ...section,
                links: section.links.map((entry, itemIndex) =>
                  itemIndex === index ? { ...entry, label } : entry,
                ),
              })
            }
          />
          <Field
            label="Link"
            value={link.href}
            onChange={(href) =>
              update({
                ...section,
                links: section.links.map((entry, itemIndex) =>
                  itemIndex === index ? { ...entry, href } : entry,
                ),
              })
            }
          />
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() =>
              update({
                ...section,
                links: section.links.filter((_, itemIndex) => itemIndex !== index),
              })
            }
          >
            Remove
          </Button>
        </div>
      ))}
      {section.links.length < 5 && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            update({ ...section, links: [...section.links, { label: "Link", href: "#" }] })
          }
        >
          Add link
        </Button>
      )}
    </div>
  );
}
function BlockInspector({ section, update, remove, duplicate }) {
  if (!section)
    return (
      <div className={styles.emptyInspector}>
        <p>Select a block on the left or in the preview.</p>
      </div>
    );
  const field = (key, label, multiline = false) => (
    <Field
      label={label}
      multiline={multiline}
      value={section[key] ?? ""}
      onChange={(value) => update({ ...section, [key]: value })}
    />
  );
  return (
    <div className={styles.inspector}>
      <div className={styles.inspectorHeading}>
        <div>
          <span>Block</span>
          <h3>{names[section.type]}</h3>
        </div>
        <Toggle
          label="Visible"
          checked={section.visible}
          onChange={(visible) => update({ ...section, visible })}
        />
      </div>
      {section.type === "navigation" && (
        <>
          {field("brand", "Brand")}
          {field("buttonText", "Button")}
          <LinkItems section={section} update={update} />
        </>
      )}
      {section.type === "hero" && (
        <>
          {field("eyebrow", "Eyebrow")}
          {field("heading", "Headline")}
          {field("body", "Description", true)}
          <Toggle
            label="Show signup form"
            checked={section.showForm}
            onChange={(showForm) => update({ ...section, showForm })}
          />
        </>
      )}
      {["features", "steps"].includes(section.type) && (
        <>
          {field("heading", "Heading")}
          <StringItems
            section={section}
            fields={[
              { key: "title", label: "Title" },
              { key: "body", label: "Description", multiline: true },
            ]}
            update={update}
          />
        </>
      )}
      {section.type === "logos" && (
        <>
          {field("heading", "Heading")}
          <StringItems
            section={section}
            fields={[{ key: "value", label: "Name" }]}
            update={update}
          />
        </>
      )}
      {section.type === "stats" && (
        <StringItems
          section={section}
          fields={[
            { key: "value", label: "Value" },
            { key: "label", label: "Label" },
          ]}
          update={update}
        />
      )}
      {section.type === "testimonials" && (
        <>
          {field("heading", "Heading")}
          <StringItems
            section={section}
            fields={[
              { key: "quote", label: "Quote", multiline: true },
              { key: "name", label: "Name" },
              { key: "role", label: "Role" },
            ]}
            update={update}
          />
        </>
      )}
      {section.type === "faq" && (
        <>
          {field("heading", "Heading")}
          <StringItems
            section={section}
            fields={[
              { key: "question", label: "Question" },
              { key: "answer", label: "Answer", multiline: true },
            ]}
            update={update}
          />
        </>
      )}
      {section.type === "media" && (
        <>
          {field("heading", "Heading")}
          {field("body", "Description", true)}
          {field("imageUrl", "Image URL")}
          {field("imageAlt", "Image description")}
        </>
      )}
      {section.type === "form" && (
        <>
          {field("heading", "Heading")}
          {field("body", "Description", true)}
        </>
      )}
      {section.type === "signupCount" && (
        <>
          {field("prefix", "Before number")}
          {field("suffix", "After number")}
        </>
      )}
      {section.type === "referralRewards" && (
        <>
          {field("heading", "Heading")}
          <StringItems
            section={section}
            fields={[
              { key: "referrals", label: "Referrals", type: "number" },
              { key: "reward", label: "Reward" },
            ]}
            update={update}
          />
        </>
      )}
      {section.type === "cta" && (
        <>
          {field("heading", "Heading")}
          {field("body", "Description", true)}
          {field("buttonText", "Button")}
        </>
      )}
      {section.type === "footer" && (
        <>
          {field("note", "Footer note", true)}
          <LinkItems section={section} update={update} />
        </>
      )}
      <div className={styles.inspectorActions}>
        <Button variant="outline" type="button" onClick={duplicate}>
          Duplicate
        </Button>
        <Button variant="ghost" type="button" onClick={remove}>
          Remove
        </Button>
      </div>
    </div>
  );
}

export function SnapshotPageBuilder({
  waitList,
  saveDraftPage,
  publishPage,
  pausePage,
  rollbackPage,
  canPublish,
  publicationOrigin,
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(waitList.templateSnapshot);
  const [version, setVersion] = useState(waitList.templateRevision);
  const [surface, setSurface] = useState("page");
  const [panel, setPanel] = useState("blocks");
  const [selectedId, setSelectedId] = useState(waitList.templateSnapshot.sections[0]?.id);
  const [previewViewport, setPreviewViewport] = useState("desktop");
  const [dirty, setDirty] = useState(false),
    [saving, setSaving] = useState(false),
    [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState("Saved"),
    [error, setError] = useState(""),
    [conflict, setConflict] = useState(null);
  const [undoCount, setUndoCount] = useState(0),
    [redoCount, setRedoCount] = useState(0),
    [publishing, setPublishing] = useState(false);
  const [publishReviewOpen, setPublishReviewOpen] = useState(false),
    [publishConfirmed, setPublishConfirmed] = useState(false);
  const undoStack = useRef([]),
    redoStack = useRef([]),
    snapshotRef = useRef(snapshot),
    versionRef = useRef(version),
    dirtyRef = useRef(false),
    conflictRef = useRef(null),
    inFlightRef = useRef(false),
    saveAgainRef = useRef(false);
  const key = `waitlyze:page:${waitList.id}`;
  useLayoutEffect(() => {
    snapshotRef.current = snapshot;
    versionRef.current = version;
    dirtyRef.current = dirty;
    conflictRef.current = conflict;
  }, [snapshot, version, dirty, conflict]);
  const applySnapshot = useCallback(
    (next) => {
      if (equal(snapshotRef.current, next)) return;
      undoStack.current.push(clone(snapshotRef.current));
      if (undoStack.current.length > 100) undoStack.current.shift();
      redoStack.current = [];
      setUndoCount(undoStack.current.length);
      setRedoCount(0);
      snapshotRef.current = clone(next);
      setSnapshot(clone(next));
      dirtyRef.current = true;
      setDirty(true);
      setMessage("Unsaved changes");
      setError("");
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({ revision: versionRef.current, snapshot: next }),
        );
      } catch {
        setError(
          "This browser could not keep a recovery copy. Keep this tab open until the page says Saved.",
        );
      }
    },
    [key],
  );
  const flush = useCallback(async () => {
    if (!dirtyRef.current || conflictRef.current) return;
    if (inFlightRef.current) {
      saveAgainRef.current = true;
      return;
    }
    inFlightRef.current = true;
    setSaving(true);
    const sent = clone(snapshotRef.current);
    try {
      const result = await saveDraftPage(waitList.id, versionRef.current, sent);
      if (result?.conflict) {
        setConflict({ revision: result.revision, snapshot: result.snapshot });
        setError("A newer version was saved elsewhere. Choose which version to keep.");
        setMessage("Review changes");
        return;
      }
      if (!result?.ok) {
        setError(result?.message || "Could not save just now. Your edits remain in this tab.");
        setMessage("Not saved");
        return;
      }
      versionRef.current = result.revision;
      setVersion(result.revision);
      if (equal(snapshotRef.current, sent)) {
        const saved = result.snapshot || sent;
        snapshotRef.current = saved;
        setSnapshot(saved);
        dirtyRef.current = false;
        setDirty(false);
        setMessage("Saved");
      } else saveAgainRef.current = true;
      setError("");
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({ revision: result.revision, snapshot: snapshotRef.current }),
        );
      } catch {
        /* saved on server */
      }
    } catch {
      setError("Could not save just now. Your edits remain in this tab.");
      setMessage("Not saved");
    } finally {
      inFlightRef.current = false;
      setSaving(false);
      if (saveAgainRef.current) {
        saveAgainRef.current = false;
        window.setTimeout(() => void flush(), 0);
      }
    }
  }, [key, saveDraftPage, waitList.id]);
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || "null");
      if (
        stored &&
        Number.isSafeInteger(stored.revision) &&
        templateSnapshotSchema.safeParse(stored.snapshot).success &&
        !equal(stored.snapshot, waitList.templateSnapshot)
      ) {
        snapshotRef.current = clone(stored.snapshot);
        setSnapshot(clone(stored.snapshot));
        dirtyRef.current = true;
        setDirty(true);
        setMessage("Recovered unsaved edits");
        if (stored.revision !== waitList.templateRevision)
          setConflict({ revision: waitList.templateRevision, snapshot: waitList.templateSnapshot });
      }
    } catch {
      setError("The last saved version is loaded; a browser recovery copy could not be read.");
    }
    setHydrated(true);
  }, [key, waitList.templateRevision, waitList.templateSnapshot]);
  useEffect(() => {
    if (!hydrated || !dirty || conflict) return;
    const timer = window.setTimeout(() => void flush(), 700);
    return () => window.clearTimeout(timer);
  }, [snapshot, dirty, conflict, hydrated, flush]);
  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(clone(snapshotRef.current));
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
    snapshotRef.current = previous;
    setSnapshot(previous);
    dirtyRef.current = true;
    setDirty(true);
    setMessage("Unsaved changes");
  };
  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(clone(snapshotRef.current));
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
    snapshotRef.current = next;
    setSnapshot(next);
    dirtyRef.current = true;
    setDirty(true);
    setMessage("Unsaved changes");
  };
  const resolveConflict = (choice) => {
    const next = choice === "saved" ? clone(conflict.snapshot) : clone(snapshotRef.current);
    versionRef.current = conflict.revision;
    setVersion(conflict.revision);
    setConflict(null);
    conflictRef.current = null;
    snapshotRef.current = next;
    setSnapshot(next);
    const changed = !equal(next, conflict.snapshot);
    dirtyRef.current = changed;
    setDirty(changed);
    setError("");
    setMessage(changed ? "Saving your version…" : "Saved");
  };
  const updateSection = (next) =>
    applySnapshot({
      ...snapshot,
      sections: snapshot.sections.map((section) => (section.id === next.id ? next : section)),
    });
  const selected = snapshot.sections.find((section) => section.id === selectedId);
  const addBlock = (type) => {
    const block = createSection(type);
    applySnapshot({ ...snapshot, sections: [...snapshot.sections, block] });
    setSelectedId(block.id);
    setPanel("blocks");
  };
  const removeBlock = () => {
    if (!selected || snapshot.sections.length === 1) return;
    const sections = snapshot.sections.filter((section) => section.id !== selected.id);
    setSelectedId(sections[0]?.id);
    applySnapshot({ ...snapshot, sections });
  };
  const duplicateBlock = () => {
    if (!selected || snapshot.sections.length >= 24) return;
    const copy = { ...clone(selected), id: `block-${crypto.randomUUID()}` };
    const at = snapshot.sections.findIndex((section) => section.id === selected.id);
    const sections = [...snapshot.sections];
    sections.splice(at + 1, 0, copy);
    applySnapshot({ ...snapshot, sections });
    setSelectedId(copy.id);
  };
  const moveBlock = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= snapshot.sections.length) return;
    const sections = [...snapshot.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    applySnapshot({ ...snapshot, sections });
  };
  const updateRoot = (key, value) =>
    applySnapshot({ ...snapshot, [key]: { ...snapshot[key], ...value } });
  const onKeyDown = (event) => {
    if (
      !(event.metaKey || event.ctrlKey) ||
      event.altKey ||
      event.target.closest?.("input,textarea,select,[contenteditable=true]")
    )
      return;
    if (event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if (event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
  };
  const publish = async () => {
    if (dirty || saving || conflict || publishing || !publishConfirmed) return;
    setPublishing(true);
    try {
      const result = await publishPage(waitList.id, version);
      if (!result?.ok) {
        setError(result?.message || "Could not publish this page.");
        return;
      }
      setMessage(result.unchanged ? "Already live" : "Published");
      setPublishReviewOpen(false);
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };
  const lifecycle = async (action) => {
    if (dirty || saving || conflict || publishing) return;
    setPublishing(true);
    try {
      const result = await action(waitList.id);
      if (!result?.ok) {
        setError(result?.message || "Could not update publication.");
        return;
      }
      if (result.snapshot) {
        versionRef.current = result.templateRevision;
        setVersion(result.templateRevision);
        snapshotRef.current = clone(result.snapshot);
        setSnapshot(clone(result.snapshot));
        setDirty(false);
        dirtyRef.current = false;
      }
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };
  const unchangedStarterCopy = findUnchangedStarterCopy(snapshot);
  const hasUpdates =
    waitList.status !== "PUBLISHED" || waitList.publishedTemplateRevision !== version;

  return (
    // Delegated undo/redo shortcuts for every control inside the studio.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <section className={styles.builder} onKeyDown={onKeyDown}>
      <header className={styles.commandBar}>
        <div className={styles.titleGroup}>
          <Link href="/waitlists">Waitlists</Link>
          <span>/</span>
          <strong>{waitList.name}</strong>
          <span className={styles.saveState}>{saving ? "Saving…" : message}</span>
        </div>
        <nav className={styles.surfaceTabs} aria-label="Builder surfaces">
          {[
            ["page", "Page"],
            ["form", "Form"],
            ["status", "Status"],
            ["publish", "Publish"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-current={surface === id ? "page" : undefined}
              onClick={() => setSurface(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className={styles.commandActions}>
          <Button variant="ghost" size="sm" onClick={undo} disabled={!undoCount}>
            Undo
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={!redoCount}>
            Redo
          </Button>
          {waitList.status !== "DRAFT" && waitList.publicSlug && (
            <Button
              render={<Link href={`/w/${waitList.publicSlug}`} target="_blank" />}
              variant="outline"
              size="sm"
            >
              View live
            </Button>
          )}
          {canPublish && hasUpdates && (
            <Button
              size="sm"
              onClick={() => {
                setPublishConfirmed(false);
                setPublishReviewOpen(true);
              }}
              disabled={dirty || saving || !!conflict}
            >
              {waitList.status === "PUBLISHED" ? "Publish updates" : "Publish"}
            </Button>
          )}
        </div>
      </header>
      {error && (
        <div className={styles.alert} role="alert">
          <span>{error}</span>
          {conflict ? (
            <>
              <Button size="sm" variant="outline" onClick={() => resolveConflict("saved")}>
                Use saved
              </Button>
              <Button size="sm" onClick={() => resolveConflict("mine")}>
                Keep mine
              </Button>
            </>
          ) : (
            dirty && (
              <Button size="sm" variant="outline" onClick={() => void flush()}>
                Retry
              </Button>
            )
          )}
        </div>
      )}
      {surface === "page" && (
        <div className={styles.studio}>
          <aside className={styles.library}>
            <div className={styles.panelTabs}>
              {[
                ["blocks", "Blocks"],
                ["templates", "Templates"],
                ["design", "Design"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={panel === id}
                  onClick={() => setPanel(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {panel === "blocks" && (
              <>
                <div className={styles.layers}>
                  {snapshot.sections.map((section, index) => (
                    <div
                      className={styles.layer}
                      data-selected={selectedId === section.id}
                      key={section.id}
                    >
                      <button type="button" onClick={() => setSelectedId(section.id)}>
                        <span>{names[section.type]}</span>
                        {!section.visible && <small>Hidden</small>}
                      </button>
                      <div>
                        <button
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => moveBlock(index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          aria-label="Move down"
                          disabled={index === snapshot.sections.length - 1}
                          onClick={() => moveBlock(index, 1)}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.addBlocks}>
                  <p>Add block</p>
                  {BLOCK_TYPES.map((block) => (
                    <button type="button" key={block.type} onClick={() => addBlock(block.type)}>
                      {block.label}
                      <span>+</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {panel === "templates" && (
              <div className={styles.templateList}>
                {templates.map((template) => (
                  <button
                    type="button"
                    key={template.id}
                    data-active={snapshot.templateId === template.id}
                    onClick={() => {
                      const next = snapshotTemplate(template.id);
                      applySnapshot(next);
                      setSelectedId(next.sections[0].id);
                    }}
                  >
                    <strong>{template.name}</strong>
                    <span>{template.description}</span>
                  </button>
                ))}
              </div>
            )}
            {panel === "design" && (
              <DesignPanel brand={snapshot.brand} update={(value) => updateRoot("brand", value)} />
            )}
          </aside>
          <main className={styles.canvasArea}>
            <div className={styles.canvasTools}>
              <span>Preview</span>
              <div>
                <button
                  type="button"
                  aria-pressed={previewViewport === "desktop"}
                  onClick={() => setPreviewViewport("desktop")}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  aria-pressed={previewViewport === "mobile"}
                  onClick={() => setPreviewViewport("mobile")}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div className={styles.canvas} data-viewport={previewViewport}>
              <WaitlistPageContent
                snapshot={snapshot}
                name={waitList.name}
                previewViewport={previewViewport}
                renderSignupForm={() => <WaitlistSignupPreview form={snapshot.form} />}
              />
            </div>
          </main>
          <aside className={styles.properties}>
            <BlockInspector
              section={selected}
              update={updateSection}
              remove={removeBlock}
              duplicate={duplicateBlock}
            />
          </aside>
        </div>
      )}
      {surface === "form" && (
        <SurfaceLayout
          sidebar={<FormPanel form={snapshot.form} update={(value) => updateRoot("form", value)} />}
          title="Signup form"
          description="The same form is used wherever it appears on your page or embed."
        >
          <div className={styles.formPreview}>
            <WaitlistSignupPreview form={snapshot.form} />
          </div>
        </SurfaceLayout>
      )}
      {surface === "status" && (
        <SurfaceLayout
          sidebar={
            <StatusPanel
              status={snapshot.statusPage}
              update={(value) => updateRoot("statusPage", value)}
            />
          }
          title="After signup"
          description="Edit both the pending confirmation and confirmed states."
        >
          <StatusPagePreview snapshot={snapshot} pending={snapshot.form.verification} />
        </SurfaceLayout>
      )}
      {surface === "publish" && (
        <div className={styles.publishSurface}>
          <div>
            <p className={styles.overline}>Distribution</p>
            <h2>One waitlist, wherever your audience is.</h2>
            <p>Publish a hosted page, embed the form, connect your domain, or use the API.</p>
          </div>
          <PublicationOptions waitList={waitList} origin={publicationOrigin} />
          <div className={styles.channelLinks}>
            <Link href={`/waitlists/${waitList.id}/settings`}>
              Custom domain <span>→</span>
            </Link>
            <Link href="/docs/api">
              API access <span>→</span>
            </Link>
            {waitList.status === "PUBLISHED" && (
              <Button
                variant="outline"
                onClick={() => void lifecycle(pausePage)}
                disabled={publishing}
              >
                Pause page
              </Button>
            )}
            {waitList.publishedRevision > 1 && (
              <Button
                variant="ghost"
                onClick={() => void lifecycle(rollbackPage)}
                disabled={publishing}
              >
                Restore previous version
              </Button>
            )}
          </div>
        </div>
      )}
      <Dialog
        open={publishReviewOpen}
        onOpenChange={(open) => !publishing && setPublishReviewOpen(open)}
      >
        <DialogContent>
          <DialogTitle>Ready to publish?</DialogTitle>
          <DialogDescription>
            Your saved draft becomes the public version. Future edits remain private until you
            publish again.
          </DialogDescription>
          {unchangedStarterCopy.length > 0 && (
            <div className={styles.reviewNote}>
              <strong>
                Starter copy remains in {unchangedStarterCopy.length}{" "}
                {unchangedStarterCopy.length === 1 ? "place" : "places"}.
              </strong>
              <span>Keep it if it fits, or return to edit.</span>
            </div>
          )}
          <div className={styles.reviewPreview}>
            <WaitlistPageContent
              snapshot={snapshot}
              name={waitList.name}
              previewViewport="desktop"
              renderSignupForm={() => <WaitlistSignupPreview form={snapshot.form} />}
            />
          </div>
          <Toggle
            label="I reviewed the public page."
            checked={publishConfirmed}
            onChange={setPublishConfirmed}
          />
          <div className={styles.dialogActions}>
            <DialogClose render={<Button variant="outline" />}>Back</DialogClose>
            <Button disabled={!publishConfirmed || publishing} onClick={() => void publish()}>
              {publishing ? "Publishing…" : "Publish page"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function SurfaceLayout({ sidebar, title, description, children }) {
  return (
    <div className={styles.surfaceLayout}>
      <aside>
        <p className={styles.overline}>Settings</p>
        {sidebar}
      </aside>
      <main>
        <div className={styles.surfaceHeading}>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className={styles.surfaceCanvas}>{children}</div>
      </main>
    </div>
  );
}
function DesignPanel({ brand, update }) {
  return (
    <div className={styles.settings}>
      <SelectField
        label="Heading font"
        value={brand.headingFont}
        options={fonts}
        onChange={(headingFont) => update({ headingFont })}
      />
      <SelectField
        label="Body font"
        value={brand.bodyFont}
        options={fonts}
        onChange={(bodyFont) => update({ bodyFont })}
      />
      <SelectField
        label="Corners"
        value={brand.radius}
        options={[
          { id: "sharp", label: "Sharp" },
          { id: "soft", label: "Soft" },
          { id: "round", label: "Round" },
          { id: "pill", label: "Pill" },
        ]}
        onChange={(radius) => update({ radius })}
      />
      <div className={styles.colors}>
        {[
          ["pageBackground", "Page"],
          ["surfaceColor", "Surface"],
          ["textColor", "Text"],
          ["mutedColor", "Muted text"],
          ["accentColor", "Accent"],
          ["buttonColor", "Button"],
          ["buttonTextColor", "Button text"],
          ["inputBackground", "Input"],
          ["inputBorder", "Input border"],
          ["inputTextColor", "Input text"],
        ].map(([key, label]) => (
          <label key={key}>
            <span>{label}</span>
            <input
              type="color"
              value={brand[key]}
              onChange={(event) => update({ [key]: event.target.value })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
function SelectField({ label, value, options, onChange }) {
  return (
    <div className={styles.field}>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem value={option.id} key={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function FormPanel({ form, update }) {
  return (
    <div className={styles.settings}>
      <Field label="Field label" value={form.label} onChange={(label) => update({ label })} />
      <Field
        label="Placeholder"
        value={form.placeholder}
        onChange={(placeholder) => update({ placeholder })}
      />
      <Field
        label="Button"
        value={form.buttonText}
        onChange={(buttonText) => update({ buttonText })}
      />
      <SelectField
        label="Layout"
        value={form.layout}
        options={[
          { id: "inline", label: "Inline" },
          { id: "stacked", label: "Stacked" },
        ]}
        onChange={(layout) => update({ layout })}
      />
      <Toggle
        label="Require marketing consent"
        checked={form.requireConsent}
        onChange={(requireConsent) => update({ requireConsent })}
      />
      {form.requireConsent && (
        <Field
          label="Consent copy"
          value={form.consentLabel}
          multiline
          onChange={(consentLabel) => update({ consentLabel })}
        />
      )}
      <Toggle
        label="Email verification"
        checked={form.verification}
        onChange={(verification) => update({ verification })}
      />
    </div>
  );
}
function StatusPanel({ status, update }) {
  return (
    <div className={styles.settings}>
      <Field
        label="Confirmed heading"
        value={status.heading}
        onChange={(heading) => update({ heading })}
      />
      <Field
        label="Confirmed message"
        value={status.body}
        multiline
        onChange={(body) => update({ body })}
      />
      <Field
        label="Pending heading"
        value={status.pendingHeading}
        onChange={(pendingHeading) => update({ pendingHeading })}
      />
      <Field
        label="Pending message"
        value={status.pendingBody}
        multiline
        onChange={(pendingBody) => update({ pendingBody })}
      />
      <Toggle
        label="Show position"
        checked={status.showPosition}
        onChange={(showPosition) => update({ showPosition })}
      />
      <Toggle
        label="Show referral link"
        checked={status.showReferralLink}
        onChange={(showReferralLink) => update({ showReferralLink })}
      />
      <Toggle
        label="Show referral count"
        checked={status.showReferralCount}
        onChange={(showReferralCount) => update({ showReferralCount })}
      />
      <Field
        label="Share message"
        value={status.shareMessage}
        multiline
        onChange={(shareMessage) => update({ shareMessage })}
      />
      <div className={styles.itemList}>
        <span className={styles.overline}>Share buttons</span>
        {["x", "linkedin", "whatsapp", "email"].map((channel) => (
          <Toggle
            key={channel}
            label={channel === "x" ? "X" : channel[0].toUpperCase() + channel.slice(1)}
            checked={status.shareChannels.includes(channel)}
            onChange={(enabled) =>
              update({
                shareChannels: enabled
                  ? [...status.shareChannels, channel]
                  : status.shareChannels.filter((item) => item !== channel),
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
