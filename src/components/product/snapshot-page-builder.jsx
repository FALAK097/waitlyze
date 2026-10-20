"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

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
import { assessPublishReadiness, summarizeChanges } from "@/lib/campaigns/publish-readiness.mjs";
import { brandContrastIssues } from "@/lib/color/contrast.mjs";
import {
  BLOCK_TYPES,
  createSection,
  listTemplates,
  snapshotTemplate,
  templateSnapshotSchema,
} from "@/lib/templates/catalog.mjs";
import { findUnchangedStarterCopy } from "@/lib/templates/starter-copy.mjs";

import { PublishAndShare } from "./publish-and-share";
import {
  StatusPagePreview,
  WaitlistPageContent,
  WaitlistSignupPreview,
} from "./waitlist-page-content";

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
    <div className="grid gap-1.5 [&_input]:text-caption [&_label]:text-caption [&_label]:font-semibold [&_textarea]:text-caption">
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
    <label className="flex items-center gap-2 text-caption font-medium">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <span>{label}</span>
    </label>
  );
}
function StringItems({ section, fields, update }) {
  return (
    <div className="grid gap-5">
      {section.items.map((item, index) => (
        <div
          className="grid gap-2.5 border-t border-product-border-subtle pt-4 [&>button]:justify-self-start [&>span]:text-micro [&>span]:text-product-text-muted"
          key={index}
        >
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
    <div className="grid gap-5">
      {section.links.map((link, index) => (
        <div
          className="grid gap-2.5 border-t border-product-border-subtle pt-4 [&>button]:justify-self-start"
          key={index}
        >
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
      <div className={"px-5 py-8 text-caption leading-relaxed text-product-text-secondary"}>
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
    <div className="grid gap-4 p-5">
      <div className="flex items-start justify-between gap-3 pb-1.5">
        <div>
          <span className="text-micro font-bold tracking-widest text-product-text-secondary uppercase">
            Block
          </span>
          <h3 className="mt-1 text-item">{names[section.type]}</h3>
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
      <div className="flex gap-2 pt-2">
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
  const readiness = useMemo(
    () =>
      assessPublishReadiness(snapshot, {
        publishedSnapshot: waitList.publishedSnapshot,
        showReferrals: waitList.showReferrals,
      }),
    [snapshot, waitList.publishedSnapshot, waitList.showReferrals],
  );
  const changes = useMemo(
    () => summarizeChanges(snapshot, waitList.publishedSnapshot),
    [snapshot, waitList.publishedSnapshot],
  );
  const goToFix = (fix) => {
    if (!fix) return;
    if (fix.surface === "referrals") {
      router.push(`/waitlists/${waitList.id}/settings?section=referral`);
      return;
    }
    if (fix.surface === "seo") {
      setSurface("publish");
      return;
    }
    if (fix.surface === "design") {
      setSurface("page");
      setPanel("design");
      return;
    }
    setSurface(fix.surface || "page");
    if (fix.panel) setPanel(fix.panel);
  };

  return (
    // Delegated undo/redo shortcuts for every control inside the studio.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <section className={"min-w-0"} onKeyDown={onKeyDown}>
      <header className={"flex min-h-16 items-center gap-5 px-2 pb-4"}>
        <div className={"flex min-w-0 flex-1 items-center gap-2 text-caption"}>
          <Link href="/waitlists">Waitlists</Link>
          <span>/</span>
          <strong>{waitList.name}</strong>
          <span className={"ml-1 text-micro text-product-text-secondary"}>
            {saving ? "Saving…" : message}
          </span>
        </div>
        <nav
          className="flex items-center gap-1 [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-3.5 [&_button]:text-caption [&_button]:font-semibold [&_button]:text-product-text-secondary [&_button[aria-current=page]]:relative [&_button[aria-current=page]]:text-product-text-primary [&_button[aria-current=page]]:after:absolute [&_button[aria-current=page]]:after:inset-x-3 [&_button[aria-current=page]]:after:bottom-1 [&_button[aria-current=page]]:after:h-0.5 [&_button[aria-current=page]]:after:rounded-full [&_button[aria-current=page]]:after:bg-product-accent-solid"
          aria-label="Builder surfaces"
        >
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
        <div className={"flex flex-1 items-center justify-end gap-1"}>
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
        <div
          className="mx-2 mb-3 flex items-center gap-2.5 rounded-lg bg-product-danger-bg px-3 py-2.5 text-caption text-product-danger-text [&>span]:mr-auto"
          role="alert"
        >
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
        <div className="flex h-studio min-h-studio overflow-hidden border-t border-product-border-subtle bg-product-bg-inset max-[1180px]:h-studio-compact max-[900px]:h-auto max-[900px]:min-h-0 max-[680px]:flex-col">
          <aside className="w-library shrink-0 overflow-auto border-r border-product-border-subtle bg-product-bg-surface max-[1180px]:w-55 max-[680px]:w-full max-[680px]:border-r-0 max-[680px]:border-b max-[680px]:border-product-border-subtle">
            <div className="sticky top-0 z-2 grid grid-cols-3 gap-1 bg-product-bg-surface p-2.5 [&_button]:min-h-9 [&_button]:cursor-pointer [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-caption [&_button]:font-semibold [&_button]:text-product-text-secondary [&_button[aria-pressed=true]]:bg-product-bg-inset [&_button[aria-pressed=true]]:text-product-text-primary">
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
                <div className="px-2.5 pt-1 pb-4">
                  {snapshot.sections.map((section, index) => (
                    <div
                      className="group flex items-center gap-1 rounded-lg data-[selected=true]:bg-product-bg-inset [&>button]:min-w-0 [&>button]:flex-1 [&>button]:cursor-pointer [&>button]:items-center [&>button]:justify-between [&>button]:gap-2 [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-2.5 [&>button]:py-3 [&>button]:text-left [&>button]:text-caption [&>button]:text-product-text-primary [&>div]:hidden [&>div]:pr-1 focus-within:[&>div]:flex hover:[&>div]:flex [&>div>button]:size-7 [&>div>button]:cursor-pointer [&>div>button]:border-0 [&>div>button]:bg-transparent [&>div>button]:text-product-text-secondary [&>div>button:disabled]:opacity-25 [&>small]:text-micro [&>small]:text-product-text-muted"
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
                <div className="border-t border-product-border-subtle px-4 pt-3.5 pb-6 [&_button]:flex [&_button]:w-full [&_button]:cursor-pointer [&_button]:justify-between [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-2 [&_button]:text-caption [&_button]:text-product-text-primary [&_button_span]:text-item [&_button_span]:text-product-text-muted [&_p]:mb-2 [&_p]:text-micro [&_p]:font-bold [&_p]:tracking-widest [&_p]:text-product-text-secondary [&_p]:uppercase">
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
              <div className="grid px-4 pt-1 pb-6 [&_button]:grid [&_button]:cursor-pointer [&_button]:gap-1 [&_button]:border-0 [&_button]:border-b [&_button]:border-product-border-subtle [&_button]:bg-transparent [&_button]:py-3.5 [&_button]:text-left [&_button]:text-product-text-primary [&_span]:text-caption [&_span]:leading-relaxed [&_span]:text-product-text-secondary [&_strong]:text-caption">
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
          <main className={"min-w-0 flex-1 overflow-auto px-7 pt-0 pb-9"}>
            <div className="flex h-canvas-tools items-center justify-between text-caption text-product-text-secondary [&_button]:cursor-pointer [&_button]:rounded-md [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-2.5 [&_button]:py-2 [&_button]:text-micro [&_button]:text-product-text-secondary [&_button[aria-pressed=true]]:bg-product-bg-surface [&_button[aria-pressed=true]]:text-product-text-primary [&_button[aria-pressed=true]]:shadow-pressed">
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
            <div
              className="max-w-canvas w-full canvas-zoom overflow-auto rounded-xl bg-white shadow-canvas data-[viewport=mobile]:w-mobile-canvas data-[viewport=mobile]:max-w-full"
              data-viewport={previewViewport}
              style={{ "--canvas-zoom": previewViewport === "mobile" ? 0.85 : 0.72 }}
            >
              <WaitlistPageContent
                snapshot={snapshot}
                name={waitList.name}
                previewViewport={previewViewport}
                renderSignupForm={() => <WaitlistSignupPreview form={snapshot.form} />}
              />
            </div>
          </main>
          <aside className="w-inspector shrink-0 overflow-auto border-l border-product-border-subtle bg-product-bg-surface max-[1180px]:w-68 max-[680px]:w-full max-[680px]:border-t max-[680px]:border-l-0 max-[680px]:border-product-border-subtle">
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
          <div className={"mx-auto w-full max-w-2xl p-15"}>
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
        <div className={"mx-auto w-full max-w-4xl"}>
          <PublishAndShare
            snapshot={snapshot}
            waitList={waitList}
            origin={publicationOrigin}
            readiness={readiness}
            changes={changes}
            onFix={goToFix}
            onSeoChange={(patch) => updateRoot("seo", patch)}
          />
          <div className="mt-7 flex flex-col items-stretch gap-0 [&_button]:mt-4 [&_button]:self-start [&>a]:flex [&>a]:justify-between [&>a]:border-t [&>a]:border-product-border-subtle [&>a]:px-0.5 [&>a]:py-4 [&>a]:text-body [&>a]:text-product-text-primary [&>a]:no-underline [&>a:last-of-type]:border-b">
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
          {readiness.blockers.length > 0 && (
            <div
              className="grid gap-1 rounded-lg bg-product-warning-bg p-3 text-caption data-[tone=blocker]:bg-product-danger-bg data-[tone=blocker]:text-product-danger-text [&_span]:text-product-text-secondary data-[tone=blocker]:[&_span]:text-product-danger-text"
              data-tone="blocker"
            >
              <strong>
                {readiness.blockers.length}{" "}
                {readiness.blockers.length === 1 ? "thing blocks" : "things block"} this publish
              </strong>
              <span>{readiness.blockers.map((blocker) => blocker.title).join(" · ")}</span>
            </div>
          )}
          {readiness.warnings.length > 0 && (
            <div className="grid gap-1 rounded-lg bg-product-warning-bg p-3 text-caption [&_span]:text-product-text-secondary">
              <strong>
                {readiness.warnings.length} {readiness.warnings.length === 1 ? "note" : "notes"} to
                review
              </strong>
              <span>{readiness.warnings.map((warning) => warning.title).join(" · ")}</span>
            </div>
          )}
          {unchangedStarterCopy.length > 0 && readiness.warnings.length === 0 && (
            <div className="grid gap-1 rounded-lg bg-product-warning-bg p-3 text-caption [&_span]:text-product-text-secondary">
              <strong>
                Starter copy remains in {unchangedStarterCopy.length}{" "}
                {unchangedStarterCopy.length === 1 ? "place" : "places"}.
              </strong>
              <span>Keep it if it fits, or return to edit.</span>
            </div>
          )}
          <div
            className="max-h-88 canvas-zoom overflow-auto rounded-lg shadow-outline"
            style={{ "--canvas-zoom": 0.48 }}
          >
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
          <div className={"flex items-center justify-end gap-2"}>
            <DialogClose render={<Button variant="outline" />}>Back</DialogClose>
            <Button
              disabled={!publishConfirmed || publishing || readiness.blockers.length > 0}
              onClick={() => void publish()}
            >
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
    <div className="flex min-h-studio border-t border-product-border-subtle bg-product-bg-inset">
      <aside className="w-78 shrink-0 overflow-auto border-r border-product-border-subtle bg-product-bg-surface max-[900px]:w-70">
        <p
          className={
            "block text-micro font-bold tracking-widest text-product-text-secondary uppercase"
          }
        >
          Settings
        </p>
        {sidebar}
      </aside>
      <main className="min-w-0 flex-1 p-10 max-[900px]:p-7">
        <div className="mx-auto mb-6 max-w-2xl">
          <h2 className="text-section">{title}</h2>
          <p className="mt-1.5 text-caption text-product-text-secondary">{description}</p>
        </div>
        <div
          className={
            "mx-auto grid min-h-140 w-full max-w-4xl items-center overflow-hidden rounded-xl bg-white shadow-surface"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}
function DesignPanel({ brand, update }) {
  return (
    <div className={"grid gap-4 p-4"}>
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
      <div className="grid gap-0.5 pt-2 [&_input]:size-8 [&_input]:cursor-pointer [&_input]:rounded-lg [&_input]:border [&_input]:border-product-border-control [&_input]:bg-transparent [&_input]:p-0.5 [&_label]:flex [&_label]:min-h-10 [&_label]:items-center [&_label]:justify-between [&_label]:text-caption">
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
      <ContrastPanel brand={brand} update={update} />
    </div>
  );
}
function ContrastPanel({ brand, update }) {
  const issues = brandContrastIssues(brand);
  if (!issues.length)
    return (
      <p className={"m-0 text-caption leading-relaxed text-product-text-secondary"}>
        Every text and background pair meets the WCAG AA contrast minimum.
      </p>
    );
  return (
    <div className={"grid gap-2.5 border-t border-product-border-subtle pt-3.5"}>
      <p
        className={
          "block text-micro font-bold tracking-widest text-product-text-secondary uppercase"
        }
      >
        Contrast
      </p>
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="grid gap-2 rounded-lg bg-product-warning-bg p-2.5 [&_button]:justify-self-start [&_span]:text-micro [&_span]:leading-relaxed [&_span]:text-product-text-secondary [&_strong]:text-caption [&_strong]:font-semibold [&>div]:grid [&>div]:gap-0.5"
        >
          <div>
            <strong>{issue.label}</strong>
            <span>
              {issue.ratio.toFixed(2)}:1 — needs {issue.required}:1 or better.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update({ [issue.fix.key]: issue.fix.value })}
          >
            Use a readable colour
          </Button>
        </div>
      ))}
      <p className={"m-0 text-micro leading-relaxed text-product-text-muted"}>
        The suggested colour keeps your background and changes the text to stay legible.
      </p>
    </div>
  );
}
function SelectField({ label, value, options, onChange }) {
  return (
    <div className={"grid gap-1.5"}>
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
    <div className={"grid gap-4 p-4"}>
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
    <div className={"grid gap-4 p-4"}>
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
      <div className={"grid gap-5"}>
        <span
          className={
            "block text-micro font-bold tracking-widest text-product-text-secondary uppercase"
          }
        >
          Share buttons
        </span>
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
