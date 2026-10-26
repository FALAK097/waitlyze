"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Add01Icon,
  AlignLeftIcon,
  Analytics01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckListIcon,
  Copy01Icon,
  Delete02Icon,
  DragDropIcon,
  FlowchartIcon,
  FormIcon,
  GiftIcon,
  HelpCircleIcon,
  Image01Icon,
  Message01Icon,
  MonitorIcon,
  Mouse02Icon,
  Navigation01Icon,
  Redo02Icon,
  Rocket01Icon,
  SmartphoneIcon,
  StarIcon,
  Undo02Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { ColorPicker } from "@/components/reui/color-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { FontPicker } from "@/components/ui/font-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { assessPublishReadiness } from "@/lib/campaigns/publish-readiness.mjs";
import { brandContrastIssues } from "@/lib/color/contrast.mjs";
import {
  BLOCK_TYPES,
  createSection,
  listTemplates,
  snapshotTemplate,
  templateSnapshotSchema,
} from "@/lib/templates/catalog.mjs";
import { findUnchangedStarterCopy } from "@/lib/templates/starter-copy.mjs";
import { cn } from "@/lib/utils";

import { ImageUploadField } from "./image-upload-field";
import { PublishAndShare } from "./publish-and-share";
import { SHARE_CHANNELS, ShareChannelIcon } from "./share-buttons";
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
const blockIcons = {
  hero: Rocket01Icon,
  form: FormIcon,
  navigation: Navigation01Icon,
  features: CheckListIcon,
  steps: FlowchartIcon,
  logos: StarIcon,
  stats: Analytics01Icon,
  testimonials: Message01Icon,
  faq: HelpCircleIcon,
  media: Image01Icon,
  signupCount: UserMultiple02Icon,
  referralRewards: GiftIcon,
  cta: Mouse02Icon,
  footer: AlignLeftIcon,
};
const blockGroups = BLOCK_TYPES.reduce((groups, block) => {
  (groups[block.category] ??= []).push(block);
  return groups;
}, {});
const templates = listTemplates();
const itemDefaults = {
  features: { title: "A clear benefit", body: "Explain how it helps." },
  steps: { title: "Next step", body: "Explain what happens here." },
  logos: "Company",
  stats: { value: "100+", label: "people waiting" },
  testimonials: { quote: "Add an honest quote.", name: "Customer name", role: "Role" },
  faq: { question: "What should people know?", answer: "Add a useful answer." },
  referralRewards: { referrals: 5, reward: "Early access" },
};
const identityListValue = (entry) => entry;

function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  maxLength,
  placeholder = "",
  disabled = false,
  onFocus,
  onBlur,
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5 [&_input]:text-caption [&_label]:text-caption [&_label]:font-semibold [&_textarea]:text-caption">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )}
    </div>
  );
}
// Number input that lets founders clear the field while typing and commits a
// clamped integer on blur, instead of snapping to 0 mid-edit.
function PointsField({ label, value, onCommit, max = 100000 }) {
  const id = useId();
  // Callers pass `key={value}` so React remounts and re-syncs the text state
  // when the committed value changes, instead of resetting it from an effect.
  const [text, setText] = useState(value == null ? "" : String(value));
  const commit = () => {
    if (text === "" || text == null) {
      onCommit(0);
      return;
    }
    const parsed = Math.trunc(Number(text));
    onCommit(!Number.isSafeInteger(parsed) || parsed < 0 ? 0 : Math.min(parsed, max));
  };
  return (
    <div className="grid gap-1.5 [&_input]:text-caption [&_label]:text-caption [&_label]:font-semibold">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
      />
    </div>
  );
}
function ListField({ label, value, onChange, placeholder, normalize = identityListValue }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const text = Array.isArray(value) ? value.join(", ") : "";
  const parse = (raw) =>
    raw
      .split(/[,;\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map(normalize);

  return (
    <Field
      label={label}
      value={editing ? draft : text}
      placeholder={placeholder}
      onFocus={() => {
        setDraft(text);
        setEditing(true);
      }}
      onChange={(raw) => {
        setDraft(raw);
        onChange(parse(raw));
      }}
      onBlur={(event) => {
        const entries = parse(event.currentTarget.value);
        setDraft(entries.join(", "));
        setEditing(false);
        onChange(entries);
      }}
    />
  );
}
function Toggle({ label, checked, onChange, disabled = false, hint = "" }) {
  return (
    <label
      className={
        disabled
          ? "flex items-center gap-2 text-caption font-medium text-product-text-muted"
          : "flex items-center gap-2 text-caption font-medium"
      }
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <span>{label}</span>
      {hint && <span className="text-micro text-product-text-muted">{hint}</span>}
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
function LogoItems({ section, update }) {
  const setItem = (index, next) =>
    update({
      ...section,
      items: section.items.map((entry, itemIndex) => (itemIndex === index ? next : entry)),
    });
  return (
    <div className="grid gap-5">
      {section.items.map((raw, index) => {
        const item = typeof raw === "string" ? { label: raw, imageUrl: "" } : raw;
        return (
          <div
            className="grid gap-2.5 border-t border-product-border-subtle pt-4 [&>button]:justify-self-start [&>span]:text-micro [&>span]:text-product-text-secondary"
            key={index}
          >
            <span>{index + 1}</span>
            <Field
              label="Name"
              value={item.label}
              onChange={(label) => setItem(index, { ...item, label })}
            />
            <ImageUploadField
              label="Logo image"
              hint="Optional. Shown instead of the name when set."
              value={item.imageUrl}
              onChange={(imageUrl) => setItem(index, { ...item, imageUrl })}
              previewClassName="aspect-16/9 object-contain bg-product-bg-inset"
            />
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
        );
      })}
      {section.items.length < 8 && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => update({ ...section, items: [...section.items, "Company"] })}
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
function BlockInspector({ section, update, form, updateForm }) {
  if (!section)
    return (
      <div className={"px-5 py-8 text-caption leading-relaxed text-product-text-secondary"}>
        <p>Click a block in the preview or the list to edit it.</p>
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
          <LogoItems section={section} update={update} />
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
          <ImageUploadField
            label="Image"
            value={section.imageUrl}
            onChange={(imageUrl) => update({ ...section, imageUrl })}
            hint="PNG, JPEG, or WebP up to 4MB."
          />
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
      {(section.type === "form" || (section.type === "hero" && section.showForm)) && (
        <div className="grid gap-4 border-t border-product-border-subtle pt-4">
          <div className="grid gap-1">
            <p className="text-micro font-bold tracking-widest text-product-text-secondary uppercase">
              Signup form
            </p>
            <p className="text-micro leading-relaxed text-product-text-secondary">
              The same form is used wherever it appears on your page or embed.
            </p>
          </div>
          <FormPanel form={form} update={updateForm} />
        </div>
      )}
    </div>
  );
}

function SortableBlockRow({ section, selected, disabled, onSelect, onDuplicate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled,
  });
  return (
    <div
      className={cn(
        "sortable-block-row group relative flex items-center gap-1 rounded-lg data-[selected=true]:bg-product-bg-inset",
        isDragging && "z-10 bg-product-bg-surface opacity-80 shadow-md",
      )}
      data-selected={selected}
      ref={setNodeRef}
      style={{
        "--sortable-transform": CSS.Transform.toString(transform),
        "--sortable-transition": transition,
      }}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Drag ${names[section.type]} block`}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border-0 bg-transparent text-product-text-muted active:cursor-grabbing"
        type="button"
      >
        <HugeiconsIcon icon={DragDropIcon} size={15} aria-hidden="true" />
      </button>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-product-text-muted group-data-[selected=true]:bg-product-bg-surface group-data-[selected=true]:text-product-text-primary">
        <HugeiconsIcon icon={blockIcons[section.type]} size={15} aria-hidden="true" />
      </span>
      <button
        aria-pressed={selected}
        className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center border-0 bg-transparent px-1 py-2 text-left text-caption text-product-text-primary"
        type="button"
        onClick={onSelect}
      >
        <span className="truncate">{names[section.type]}</span>
      </button>
      <div className="hidden items-center pr-1 group-focus-within:flex group-hover:flex group-data-[selected=true]:flex [@media(hover:none)]:flex">
        <button
          aria-label="Duplicate"
          className="flex size-7 cursor-pointer items-center justify-center border-0 bg-transparent text-product-text-secondary"
          onClick={onDuplicate}
        >
          <HugeiconsIcon icon={Copy01Icon} size={14} aria-hidden="true" />
        </button>
        <button
          aria-label="Remove"
          className="flex size-7 cursor-pointer items-center justify-center border-0 bg-transparent text-product-text-secondary"
          onClick={onRemove}
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function TemplatePreview({ template }) {
  const hero = template.snapshot.sections.find((section) => section.type === "hero");
  const visibleBlocks = template.snapshot.sections.filter((section) => section.visible).slice(0, 4);
  return (
    <div
      aria-hidden="true"
      className="border-product-border flex aspect-video flex-col overflow-hidden rounded-lg border bg-(--template-bg) p-3 text-(--template-text)"
      style={{
        "--template-accent": template.snapshot.brand.accentColor,
        "--template-bg": template.snapshot.brand.pageBackground,
        "--template-text": template.snapshot.brand.textColor,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="h-1.5 w-9 rounded-full bg-(--template-text) opacity-80" />
        <span className="h-1.5 w-5 rounded-full bg-(--template-accent)" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 py-2">
        <span className="max-w-32 truncate text-micro leading-none font-bold">
          {hero?.heading || template.name}
        </span>
        <span className="h-1 w-20 rounded-full bg-(--template-text) opacity-25" />
        <span className="h-1 w-14 rounded-full bg-(--template-text) opacity-15" />
        <span className="mt-1 h-2.5 w-16 rounded-sm bg-(--template-accent)" />
      </div>
      <div className="flex gap-1">
        {visibleBlocks.map((section) => (
          <span
            className="h-1 flex-1 rounded-full bg-(--template-text) opacity-15"
            key={section.id}
          />
        ))}
      </div>
    </div>
  );
}

export function SnapshotPageBuilder({
  waitList,
  saveDraftPage,
  replaceInvalidDraftPage,
  publishPage,
  pausePage,
  rollbackPage,
  canPublish,
  publicationOrigin,
  turnstileConfigured,
}) {
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [snapshot, setSnapshot] = useState(waitList.templateSnapshot);
  const [version, setVersion] = useState(waitList.templateRevision);
  const [replacement, setReplacement] = useState(waitList.snapshotReplacement);
  const [surface, setSurface] = useQueryState(
    "tab",
    parseAsStringLiteral(["page", "status", "publish"]).withDefault("page"),
  );
  const [panel, setPanel] = useState("blocks");
  const [rightPanel, setRightPanel] = useState("properties");
  const [addOpen, setAddOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState("edit");
  const [mobileEditorPanel, setMobileEditorPanel] = useState("structure");
  const [selectedId, setSelectedId] = useState(waitList.templateSnapshot.sections[0]?.id);
  const [previewViewport, setPreviewViewport] = useState("desktop");
  const [statusState, setStatusState] = useState("confirmed");
  const [statusViewport, setStatusViewport] = useState("desktop");
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [dirty, setDirty] = useState(false),
    [saving, setSaving] = useState(false),
    [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState("Saved"),
    [error, setError] = useState(""),
    [announcement, setAnnouncement] = useState(""),
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
  const canvasRef = useRef(null);
  const scrollRestoreRef = useRef(null);
  const key = `waitlyze:page:${waitList.id}`;
  useLayoutEffect(() => {
    snapshotRef.current = snapshot;
    versionRef.current = version;
    dirtyRef.current = dirty;
    conflictRef.current = conflict;
    if (scrollRestoreRef.current != null && canvasRef.current) {
      canvasRef.current.scrollTop = scrollRestoreRef.current;
      scrollRestoreRef.current = null;
    }
  }, [snapshot, version, dirty, conflict]);
  const applySnapshot = useCallback(
    (next) => {
      const parsed = templateSnapshotSchema.safeParse(next);
      if (!parsed.success) {
        const issue =
          parsed.error.issues.find((issue) => issue.code === "custom") || parsed.error.issues[0];
        setError(issue?.message || "Review the page content.");
        return false;
      }
      if (equal(snapshotRef.current, next)) return true;
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
      return true;
    },
    [key],
  );
  const flush = useCallback(async () => {
    if (replacement || !dirtyRef.current || conflictRef.current) return;
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
  }, [key, replacement, saveDraftPage, waitList.id]);
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || "null");
      const parsed = templateSnapshotSchema.safeParse(stored?.snapshot);
      if (
        stored &&
        Number.isSafeInteger(stored.revision) &&
        parsed.success &&
        !equal(parsed.data, waitList.templateSnapshot)
      ) {
        snapshotRef.current = clone(parsed.data);
        setSnapshot(clone(parsed.data));
        dirtyRef.current = true;
        setDirty(true);
        setMessage("Recovered unsaved edits");
        if (!waitList.snapshotReplacement && stored.revision !== waitList.templateRevision)
          setConflict({ revision: waitList.templateRevision, snapshot: waitList.templateSnapshot });
      }
    } catch {
      setError("The last saved version is loaded; a browser recovery copy could not be read.");
    }
    setHydrated(true);
  }, [key, waitList.templateRevision, waitList.templateSnapshot, waitList.snapshotReplacement]);
  useEffect(() => {
    if (replacement || !hydrated || !dirty || conflict) return;
    const timer = window.setTimeout(() => void flush(), 700);
    return () => window.clearTimeout(timer);
  }, [snapshot, dirty, conflict, hydrated, flush, replacement]);
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
    const saved = templateSnapshotSchema.parse(conflict.snapshot);
    const next = choice === "saved" ? clone(saved) : clone(snapshotRef.current);
    versionRef.current = conflict.revision;
    setVersion(conflict.revision);
    setConflict(null);
    conflictRef.current = null;
    snapshotRef.current = next;
    setSnapshot(next);
    const changed = !equal(next, saved);
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
    if (snapshot.sections.length >= 24) {
      setError("A page can have up to 24 blocks.");
      return;
    }
    const block = createSection(type);
    const sections = [...snapshot.sections];
    const selectedIndex = sections.findIndex((section) => section.id === selectedId);
    sections.splice(selectedIndex < 0 ? sections.length : selectedIndex + 1, 0, block);
    applySnapshot({ ...snapshot, sections });
    setSelectedId(block.id);
    setPanel("blocks");
    setAnnouncement(`${names[type]} block added.`);
  };
  const removeBlock = (target) => {
    const id = typeof target === "string" ? target : selectedId;
    const section = snapshot.sections.find((item) => item.id === id);
    if (!section) return;
    const sections = snapshot.sections.filter((item) => item.id !== id);
    if (applySnapshot({ ...snapshot, sections })) {
      setSelectedId((current) =>
        sections.some((item) => item.id === current) ? current : sections[0]?.id,
      );
      setAnnouncement(`${names[section.type]} block removed.`);
    }
  };
  const duplicateBlock = (target) => {
    const id = typeof target === "string" ? target : selectedId;
    const section = snapshot.sections.find((item) => item.id === id);
    if (!section || snapshot.sections.length >= 24) return;
    const copy = { ...clone(section), id: `block-${crypto.randomUUID()}` };
    const at = snapshot.sections.findIndex((item) => item.id === id);
    const sections = [...snapshot.sections];
    sections.splice(at + 1, 0, copy);
    applySnapshot({ ...snapshot, sections });
    setSelectedId(copy.id);
    setAnnouncement(`${names[section.type]} block duplicated.`);
  };
  const moveBlock = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= snapshot.sections.length) return;
    const sections = [...snapshot.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    applySnapshot({ ...snapshot, sections });
    setAnnouncement(
      `${names[sections[target].type]} block moved ${direction < 0 ? "up" : "down"}.`,
    );
  };
  const finishBlockDrag = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = snapshot.sections.findIndex((section) => section.id === active.id);
    const to = snapshot.sections.findIndex((section) => section.id === over.id);
    if (from < 0 || to < 0) return;
    const sections = arrayMove(snapshot.sections, from, to);
    if (applySnapshot({ ...snapshot, sections }))
      setAnnouncement(`${names[sections[to].type]} block moved to position ${to + 1}.`);
  };
  const renderBlockToolbar = (section) => {
    const index = snapshot.sections.findIndex((item) => item.id === section.id);
    const action =
      "flex size-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-white/70 transition-colors hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-30";
    return (
      <div className="absolute top-2 left-2 z-10 hidden items-center gap-0.5 rounded-lg bg-product-text-primary p-1 shadow-canvas group-focus-within:flex group-hover:flex group-data-[selected=true]:flex">
        <span className="rounded-md bg-product-accent-solid px-2 py-1 text-micro font-bold text-product-text-primary">
          {names[section.type]}
        </span>
        <button
          type="button"
          className={action}
          aria-label="Move up"
          disabled={index <= 0}
          onClick={() => moveBlock(index, -1)}
        >
          <HugeiconsIcon icon={ArrowUp01Icon} size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={action}
          aria-label="Move down"
          disabled={index >= snapshot.sections.length - 1}
          onClick={() => moveBlock(index, 1)}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={action}
          aria-label="Duplicate"
          onClick={() => duplicateBlock(section.id)}
        >
          <HugeiconsIcon icon={Copy01Icon} size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={action}
          aria-label="Remove"
          onClick={() => removeBlock(section.id)}
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} aria-hidden="true" />
        </button>
      </div>
    );
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
    if (replacement || dirty || saving || conflict || publishing || !publishConfirmed) return;
    setPublishing(true);
    try {
      const result = await publishPage(waitList.id, version);
      if (!result?.ok) {
        setError(result?.message || "Could not publish this page.");
        return;
      }
      setMessage(result.unchanged ? "Already live" : "Published");
      setAnnouncement(result.unchanged ? "This page is already live." : "Page published.");
      setPublishReviewOpen(false);
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };
  const lifecycle = async (action) => {
    if (replacement || dirty || saving || conflict || publishing) return;
    setPublishing(true);
    try {
      const result = await action(waitList.id);
      if (!result?.ok) {
        setError(result?.message || "Could not update publication.");
        return;
      }
      if (result.snapshot) {
        const restored = templateSnapshotSchema.parse(result.snapshot);
        versionRef.current = result.templateRevision;
        setVersion(result.templateRevision);
        snapshotRef.current = clone(restored);
        setSnapshot(clone(restored));
        setDirty(false);
        dirtyRef.current = false;
        try {
          sessionStorage.setItem(
            key,
            JSON.stringify({ revision: result.templateRevision, snapshot: restored }),
          );
        } catch {
          /* restored on server */
        }
      }
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };
  const acceptReplacement = async () => {
    if (saving || !replacement) return;
    setSaving(true);
    const sent = clone(snapshotRef.current);
    try {
      const result = await replaceInvalidDraftPage(waitList.id, versionRef.current, sent);
      if (!result?.ok) {
        setError(
          result?.conflict
            ? "The saved page changed. Reload before accepting a replacement."
            : result?.message || "Could not replace this page. Try again.",
        );
        return;
      }
      versionRef.current = result.revision;
      setVersion(result.revision);
      const changed = !equal(snapshotRef.current, sent);
      if (!changed) {
        snapshotRef.current = result.snapshot;
        setSnapshot(result.snapshot);
      }
      dirtyRef.current = changed;
      setDirty(changed);
      setReplacement(false);
      setMessage(changed ? "Unsaved changes" : "Saved");
      setError("");
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({ revision: result.revision, snapshot: snapshotRef.current }),
        );
      } catch {
        /* saved on server */
      }
      router.refresh();
    } catch {
      setError("Could not replace this page. Try again.");
    } finally {
      setSaving(false);
    }
  };
  const applyTemplate = (templateId) => {
    const template = snapshotTemplate(templateId);
    scrollRestoreRef.current = canvasRef.current?.scrollTop ?? null;
    const next = {
      ...template,
      brand: {
        ...template.brand,
        logo: snapshot.brand.logo,
        favicon: snapshot.brand.favicon,
        showPoweredBy: snapshot.brand.showPoweredBy,
      },
      form: snapshot.form,
      statusPage: snapshot.statusPage,
      seo: snapshot.seo,
      // Template switches restyle the page but must never reset rewards config.
      rewards: snapshot.rewards ?? template.rewards,
    };
    if (applySnapshot(next)) setSelectedId(next.sections[0].id);
  };
  const applyTemplateStyle = (templateId) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    scrollRestoreRef.current = canvasRef.current?.scrollTop ?? null;
    const brand = {
      ...clone(template.snapshot.brand),
      logo: snapshot.brand.logo,
      favicon: snapshot.brand.favicon,
      showPoweredBy: snapshot.brand.showPoweredBy,
    };
    if (applySnapshot({ ...snapshot, brand })) {
      setAnnouncement(`${template.name} style applied. Page content was preserved.`);
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
        turnstileConfigured,
      }),
    [snapshot, waitList.publishedSnapshot, waitList.showReferrals, turnstileConfigured],
  );
  const goToFix = (fix) => {
    if (!fix) return;
    if (fix.surface === "referrals") {
      router.push(`/waitlists/${waitList.id}/settings?section=referral`);
      return;
    }
    if (fix.surface === "seo") {
      void setSurface("publish");
      return;
    }
    if (fix.surface === "design") {
      void setSurface("page");
      setRightPanel("design");
      setMobileEditorPanel("properties");
      return;
    }
    void setSurface(fix.surface || "page");
    if (fix.panel) setPanel(fix.panel);
  };

  return (
    // Delegated undo/redo shortcuts for every control inside the studio.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <section className={"min-w-0"} onKeyDown={onKeyDown}>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <header className="flex min-h-14 flex-wrap items-center gap-x-5 gap-y-2 px-2 pb-3 max-[760px]:pt-2">
        <nav
          aria-label="Builder surfaces"
          className="flex min-w-0 flex-1 gap-5.5 overflow-x-auto max-[760px]:basis-full"
        >
          {[
            ["page", "Hosted page"],
            ["status", "After signup"],
            ["publish", "Publish & share"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-current={surface === id ? "page" : undefined}
              onClick={() => void setSurface(id)}
              className={cn(
                "inline-block min-h-10 shrink-0 cursor-pointer border-b-2 border-transparent py-2 font-medium text-product-text-secondary transition-colors hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text! motion-reduce:transition-none",
                surface === id && "border-product-accent-solid text-product-text-primary",
              )}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-1 max-[760px]:order-2 max-[760px]:w-full max-[760px]:justify-start max-[760px]:overflow-x-auto [&>*]:shrink-0">
          <span className="text-micro text-product-text-secondary" role="status" aria-live="polite">
            {saving ? "Saving…" : message}
          </span>
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Undo"
                      onClick={undo}
                      disabled={!undoCount}
                    />
                  }
                >
                  <HugeiconsIcon icon={Undo02Icon} size={18} aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Undo <kbd data-slot="kbd">⌘Z</kbd>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Redo"
                      onClick={redo}
                      disabled={!redoCount}
                    />
                  }
                >
                  <HugeiconsIcon icon={Redo02Icon} size={18} aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Redo <kbd data-slot="kbd">⌘⇧Z</kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          {waitList.status !== "DRAFT" && waitList.publicSlug && (
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href={`/w/${waitList.publicSlug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View live
            </Link>
          )}
          {canPublish && hasUpdates && (
            <Button
              size="sm"
              onClick={() => {
                setPublishConfirmed(false);
                setPublishReviewOpen(true);
              }}
              disabled={replacement || dirty || saving || !!conflict}
            >
              {waitList.status === "PUBLISHED" ? "Publish updates" : "Publish"}
            </Button>
          )}
        </div>
      </header>
      {replacement && (
        <div
          className="mx-2 mb-3 grid gap-3 rounded-lg bg-product-danger-bg px-3 py-2.5 text-caption text-product-danger-text"
          role="alert"
        >
          <p>
            The saved page could not be read. This is a replacement preview. Autosave is paused
            until you accept replacing the saved page.
          </p>
          <Button size="sm" disabled={saving} onClick={() => void acceptReplacement()}>
            Accept and save replacement
          </Button>
        </div>
      )}
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
            dirty &&
            !replacement && (
              <Button size="sm" variant="outline" onClick={() => void flush()}>
                Retry
              </Button>
            )
          )}
        </div>
      )}
      {surface !== "publish" && (
        <div className="hidden items-center gap-1 border-t border-product-border-subtle bg-product-bg-surface p-2 max-[680px]:flex">
          {[
            ["edit", "Edit"],
            ["preview", "Preview"],
          ].map(([id, label]) => (
            <button
              className="min-h-11 flex-1 rounded-lg border-0 bg-transparent px-4 text-caption font-semibold text-product-text-secondary aria-pressed:bg-product-bg-inset aria-pressed:text-product-text-primary"
              key={id}
              type="button"
              aria-pressed={mobileMode === id}
              onClick={() => setMobileMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {surface === "page" && (
        <div className="flex h-studio min-h-studio overflow-hidden bg-product-bg-inset max-[1180px]:h-studio-compact max-[900px]:h-auto max-[900px]:min-h-0 max-[680px]:flex-col">
          <div
            className="hidden items-center gap-1 border-b border-product-border-subtle bg-product-bg-surface p-2 max-[680px]:flex max-[680px]:data-[mobile-mode=preview]:hidden"
            data-mobile-mode={mobileMode}
          >
            {[
              ["structure", "Structure"],
              ["properties", "Block settings"],
            ].map(([id, label]) => (
              <button
                className="min-h-11 flex-1 rounded-lg border-0 bg-transparent px-3 text-caption font-semibold text-product-text-secondary aria-pressed:bg-product-bg-inset aria-pressed:text-product-text-primary"
                key={id}
                type="button"
                aria-pressed={mobileEditorPanel === id}
                onClick={() => setMobileEditorPanel(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <aside
            className={cn(
              "w-library shrink-0 overflow-auto border-r border-product-border-subtle bg-product-bg-surface max-[1180px]:w-55 max-[680px]:w-full max-[680px]:border-r-0 max-[680px]:border-b max-[680px]:border-product-border-subtle max-[680px]:data-[mobile-mode=preview]:hidden max-[680px]:data-[mobile-panel=properties]:hidden",
              panel === "templates" && "no-scrollbar",
            )}
            data-mobile-mode={mobileMode}
            data-mobile-panel={mobileEditorPanel}
          >
            <div className="sticky top-0 z-2 grid grid-cols-2 gap-1 bg-product-bg-surface p-2.5 [&_button]:min-h-9 [&_button]:cursor-pointer [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-caption [&_button]:font-semibold [&_button]:text-product-text-secondary [&_button[aria-pressed=true]]:bg-product-bg-inset [&_button[aria-pressed=true]]:text-product-text-primary">
              {[
                ["blocks", "Blocks"],
                ["templates", "Templates"],
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
                  <DndContext
                    collisionDetection={closestCenter}
                    sensors={sensors}
                    onDragEnd={finishBlockDrag}
                  >
                    <SortableContext
                      items={snapshot.sections.map((section) => section.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {snapshot.sections.map((section) => (
                        <SortableBlockRow
                          disabled={!!conflict || !!replacement}
                          key={section.id}
                          section={section}
                          selected={selectedId === section.id}
                          onDuplicate={() => duplicateBlock(section.id)}
                          onRemove={() => removeBlock(section.id)}
                          onSelect={() => {
                            setSelectedId(section.id);
                            setRightPanel("properties");
                            setMobileEditorPanel("properties");
                          }}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
                <div className="border-t border-product-border-subtle px-4 pt-3.5 pb-6">
                  <Button type="button" className="w-full" onClick={() => setAddOpen(true)}>
                    <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
                    Add block
                  </Button>
                </div>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogContent className="flex max-h-screen flex-col sm:max-w-3xl">
                    <DialogTitle>Add a block</DialogTitle>
                    <DialogDescription>
                      New blocks are inserted after your current selection.
                    </DialogDescription>
                    <div className="no-scrollbar grid min-h-0 flex-1 gap-5 overflow-y-auto">
                      {Object.entries(blockGroups).map(([category, blocks]) => (
                        <div className="grid gap-1.5" key={category}>
                          <p className="text-micro font-bold tracking-widest text-product-text-secondary uppercase">
                            {category}
                          </p>
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {blocks.map((block) => (
                              <button
                                key={block.type}
                                type="button"
                                className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-product-border-subtle bg-product-bg-surface p-2.5 text-left transition-colors hover:border-product-accent-solid"
                                onClick={() => {
                                  addBlock(block.type);
                                  setAddOpen(false);
                                }}
                              >
                                <HugeiconsIcon
                                  aria-hidden="true"
                                  className="mt-0.5 shrink-0 text-product-text-secondary"
                                  icon={blockIcons[block.type]}
                                  size={16}
                                />
                                <span className="grid gap-0.5">
                                  <span className="text-caption font-semibold text-product-text-primary">
                                    {block.label}
                                  </span>
                                  <span className="text-micro leading-relaxed text-product-text-secondary">
                                    {block.description}
                                  </span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
            {panel === "templates" && (
              <div className="grid gap-3 px-3 pt-1 pb-6">
                <p className="px-1 text-micro leading-relaxed text-product-text-secondary">
                  Use style keeps your blocks, signup form, after-signup states, SEO, logo, and
                  powered-by preference. Replace page changes its blocks, copy, and visual style.
                </p>
                {templates.map((template) => (
                  <div
                    className="shadow-panel grid gap-2 rounded-xl border border-product-border-subtle bg-product-bg-surface p-2"
                    key={template.id}
                  >
                    <TemplatePreview template={template} />
                    <div className="grid gap-0.5 px-0.5">
                      <strong className="text-caption text-product-text-primary">
                        {template.name}
                        {snapshot.templateId === template.id && (
                          <span className="ml-2 text-micro font-semibold tracking-widest text-product-success-text uppercase">
                            Current structure
                          </span>
                        )}
                      </strong>
                      <span className="text-micro leading-relaxed text-product-text-secondary">
                        {template.description}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        className="h-8"
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => applyTemplateStyle(template.id)}
                      >
                        Use style
                      </Button>
                      <Button
                        className="h-8"
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => setPendingTemplate(template)}
                      >
                        Replace page
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
          <main
            className="min-w-0 flex-1 overflow-auto px-7 pt-0 pb-9 max-[680px]:px-3 max-[680px]:data-[mobile-mode=edit]:hidden"
            data-mobile-mode={mobileMode}
          >
            <div className="flex h-canvas-tools items-center justify-end text-caption text-product-text-secondary [&_button]:cursor-pointer [&_button]:rounded-md [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-2.5 [&_button]:py-2 [&_button]:text-micro [&_button]:text-product-text-secondary [&_button[aria-pressed=true]]:bg-product-bg-surface [&_button[aria-pressed=true]]:text-product-text-primary [&_button[aria-pressed=true]]:shadow-pressed">
              <TooltipProvider>
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          aria-label="Desktop preview"
                          aria-pressed={previewViewport === "desktop"}
                          onClick={() => setPreviewViewport("desktop")}
                        />
                      }
                    >
                      <HugeiconsIcon icon={MonitorIcon} size={18} aria-hidden="true" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Desktop</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          aria-label="Mobile preview"
                          aria-pressed={previewViewport === "mobile"}
                          onClick={() => setPreviewViewport("mobile")}
                        />
                      }
                    >
                      <HugeiconsIcon icon={SmartphoneIcon} size={18} aria-hidden="true" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Mobile</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
            <div
              className="max-w-canvas w-full canvas-zoom overflow-auto rounded-xl bg-white shadow-canvas data-[viewport=mobile]:mx-auto data-[viewport=mobile]:w-mobile-canvas data-[viewport=mobile]:max-w-full"
              data-viewport={previewViewport}
              ref={canvasRef}
              style={{ "--canvas-zoom": previewViewport === "mobile" ? 0.85 : 0.72 }}
            >
              <WaitlistPageContent
                snapshot={snapshot}
                name={waitList.name}
                previewViewport={previewViewport}
                hideCounts={snapshot.rewards?.hideCounts === true}
                renderSignupForm={() => <WaitlistSignupPreview form={snapshot.form} />}
                interactive
                selectedBlockId={selectedId}
                onBlockSelect={(id) => {
                  setSelectedId(id);
                  setRightPanel("properties");
                  setMobileEditorPanel("properties");
                }}
                renderBlockToolbar={renderBlockToolbar}
              />
            </div>
          </main>
          <aside
            className="w-inspector shrink-0 overflow-auto border-l border-product-border-subtle bg-product-bg-surface max-[1180px]:w-68 max-[680px]:w-full max-[680px]:border-t max-[680px]:border-l-0 max-[680px]:border-product-border-subtle max-[680px]:data-[mobile-mode=preview]:hidden max-[680px]:data-[mobile-panel=structure]:hidden"
            data-mobile-mode={mobileMode}
            data-mobile-panel={mobileEditorPanel}
          >
            <div className="sticky top-0 z-2 grid grid-cols-2 gap-1 bg-product-bg-surface p-2.5 [&_button]:min-h-9 [&_button]:cursor-pointer [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-caption [&_button]:font-semibold [&_button]:text-product-text-secondary [&_button[aria-pressed=true]]:bg-product-bg-inset [&_button[aria-pressed=true]]:text-product-text-primary">
              {[
                ["properties", "Properties"],
                ["design", "Design"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={rightPanel === id}
                  onClick={() => setRightPanel(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {rightPanel === "properties" ? (
              <BlockInspector
                section={selected}
                update={updateSection}
                form={snapshot.form}
                updateForm={(value) => updateRoot("form", value)}
              />
            ) : (
              <DesignPanel brand={snapshot.brand} update={(value) => updateRoot("brand", value)} />
            )}
          </aside>
        </div>
      )}
      {surface === "status" && (
        <SurfaceLayout
          mobileMode={mobileMode}
          sidebar={
            <StatusPanel
              status={snapshot.statusPage}
              showReferrals={waitList.showReferrals}
              waitListId={waitList.id}
              rewards={snapshot.rewards}
              update={(value) => updateRoot("statusPage", value)}
              updateRewards={(value) => updateRoot("rewards", value)}
            />
          }
        >
          <div className="mx-auto w-full max-w-4xl">
            {snapshot.statusPage.postSignupBehavior === "no-change" ? (
              <div className="grid min-h-140 w-full place-content-center gap-3 rounded-xl bg-white px-6 text-center shadow-surface">
                <p className="m-0 text-micro font-bold tracking-widest text-product-text-secondary uppercase">
                  Post-signup behavior
                </p>
                <h2 className="m-0 font-product-display text-3xl font-semibold tracking-tight text-product-text-primary">
                  The form stays as-is
                </h2>
                <p className="m-0 max-w-lg text-sm leading-relaxed text-product-text-secondary">
                  Visitors aren’t redirected or shown a confirmation or referral state after signup.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div
                    className="flex flex-wrap gap-1 [&_button]:cursor-pointer [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-3 [&_button]:py-2 [&_button]:text-caption [&_button]:font-semibold [&_button]:text-product-text-secondary [&_button[aria-pressed=true]]:bg-product-bg-surface [&_button[aria-pressed=true]]:text-product-text-primary"
                    role="group"
                    aria-label="Preview state"
                  >
                    {[
                      ["confirmed", "Confirmed"],
                      ["pending", "Pending email"],
                      ["returning", "Returning visitor"],
                    ]
                      .filter(
                        ([id]) =>
                          (id !== "pending" || snapshot.form.verification) &&
                          (id !== "returning" || waitList.showReferrals),
                      )
                      .map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={statusState === id}
                          onClick={() => setStatusState(id)}
                        >
                          {label}
                        </button>
                      ))}
                  </div>
                  <div
                    className="flex gap-1 [&_button]:flex [&_button]:size-9 [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-center [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-product-text-secondary [&_button[aria-pressed=true]]:bg-product-bg-surface [&_button[aria-pressed=true]]:text-product-text-primary"
                    role="group"
                    aria-label="Preview viewport"
                  >
                    <button
                      type="button"
                      aria-label="Desktop preview"
                      aria-pressed={statusViewport === "desktop"}
                      onClick={() => setStatusViewport("desktop")}
                    >
                      <HugeiconsIcon icon={MonitorIcon} size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Mobile preview"
                      aria-pressed={statusViewport === "mobile"}
                      onClick={() => setStatusViewport("mobile")}
                    >
                      <HugeiconsIcon icon={SmartphoneIcon} size={17} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div
                  className={cn(
                    "grid overflow-hidden rounded-xl bg-white shadow-surface",
                    statusViewport === "mobile"
                      ? "mx-auto min-h-160 w-full max-w-md"
                      : "min-h-140 w-full",
                  )}
                >
                  <StatusPagePreview
                    snapshot={snapshot}
                    state={statusState}
                    showReferrals={waitList.showReferrals}
                  />
                </div>
              </>
            )}
          </div>
        </SurfaceLayout>
      )}
      {surface === "publish" && (
        <div className="pt-6 pb-16">
          <PublishAndShare
            snapshot={snapshot}
            waitList={waitList}
            origin={publicationOrigin}
            readiness={readiness}
            onFix={goToFix}
            onSeoChange={(patch) => updateRoot("seo", patch)}
            pageStatus={
              waitList.status === "PUBLISHED" || waitList.publishedRevision > 1
                ? {
                    publishing,
                    canPause: waitList.status === "PUBLISHED",
                    canRollback: waitList.publishedRevision > 1,
                    onPause: () => void lifecycle(pausePage),
                    onRollback: () => void lifecycle(rollbackPage),
                  }
                : null
            }
          />
        </div>
      )}
      <Dialog open={!!pendingTemplate} onOpenChange={(open) => !open && setPendingTemplate(null)}>
        <DialogContent>
          <DialogTitle>Replace the blocks on this page?</DialogTitle>
          <DialogDescription>
            {pendingTemplate
              ? `${pendingTemplate.name} replaces your blocks, copy, and visual style. Signup settings, after-signup states, SEO, logo, favicon, and powered-by preference stay intact. Your current page is kept in undo history.`
              : ""}
          </DialogDescription>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingTemplate(null)}>
              Keep my page
            </Button>
            <Button
              onClick={() => {
                if (pendingTemplate) applyTemplate(pendingTemplate.id);
                setPendingTemplate(null);
              }}
            >
              Replace page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
              hideCounts={snapshot.rewards?.hideCounts === true}
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

function SurfaceLayout({ sidebar, children, mobileMode }) {
  return (
    <div className="flex h-studio min-h-studio overflow-hidden bg-product-bg-inset max-[1180px]:h-studio-compact max-[900px]:h-auto max-[900px]:min-h-0 max-[680px]:flex-col">
      <aside
        className="w-78 shrink-0 overflow-auto border-r border-product-border-subtle bg-product-bg-surface max-[900px]:w-70 max-[680px]:w-full max-[680px]:border-r-0 max-[680px]:data-[mobile-mode=preview]:hidden"
        data-mobile-mode={mobileMode}
      >
        {sidebar}
      </aside>
      <main
        className="min-h-0 min-w-0 flex-1 overflow-hidden p-10 max-[900px]:p-7 max-[680px]:p-3 max-[680px]:data-[mobile-mode=edit]:hidden"
        data-mobile-mode={mobileMode}
      >
        {children}
      </main>
    </div>
  );
}
function TypeSizeField({ label, value, defaultValue, onChange, min = 12, max = 160 }) {
  const id = useId();
  const shown = typeof value === "number" ? value : defaultValue;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={shown}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, Math.round(next))));
          }}
        />
        <span className="text-micro text-product-text-secondary">px</span>
      </div>
    </div>
  );
}
function DesignPanel({ brand, update }) {
  const poweredById = useId();
  return (
    <div className={"grid gap-4 p-4"}>
      <ImageUploadField
        label="Logo"
        hint="Shown instead of your brand name in the page header."
        value={brand.logo ?? ""}
        onChange={(logo) => update({ logo })}
        previewClassName="aspect-16/9 object-contain bg-product-bg-inset"
      />
      <ImageUploadField
        label="Favicon"
        hint="Browser-tab icon for the hosted page. Square PNG works best."
        value={brand.favicon ?? ""}
        onChange={(favicon) => update({ favicon })}
        previewClassName="aspect-square object-contain bg-product-bg-inset"
      />
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={poweredById}>Powered by Waitlyze</Label>
        <Switch
          checked={brand.showPoweredBy !== false}
          id={poweredById}
          onCheckedChange={(checked) => update({ showPoweredBy: checked })}
        />
      </div>
      <FontPicker
        label="Heading font"
        value={brand.headingFont}
        onValueChange={(headingFont) => update({ headingFont })}
      />
      <FontPicker
        label="Body font"
        value={brand.bodyFont}
        onValueChange={(bodyFont) => update({ bodyFont })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TypeSizeField
          label="Heading size"
          value={brand.headingSize}
          defaultValue={48}
          onChange={(headingSize) => update({ headingSize })}
        />
        <TypeSizeField
          label="Body size"
          value={brand.bodySize}
          defaultValue={16}
          onChange={(bodySize) => update({ bodySize })}
        />
      </div>
      <div className="grid gap-1.5">
        <span className="text-sm font-medium">Corners</span>
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-product-bg-inset p-1">
          {[
            { id: "sharp", label: "Sharp", shape: "rounded-none" },
            { id: "soft", label: "Soft", shape: "rounded-md" },
            { id: "round", label: "Round", shape: "rounded-xl" },
            { id: "pill", label: "Pill", shape: "rounded-full" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={brand.radius === option.id}
              className="flex min-h-17 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-0 bg-transparent px-1 py-2 text-micro text-product-text-secondary aria-pressed:bg-product-bg-surface aria-pressed:text-product-text-primary aria-pressed:shadow-pressed"
              onClick={() => update({ radius: option.id })}
            >
              <span
                className={cn("block size-5 border border-product-text-secondary", option.shape)}
              />
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-0.5 pt-2 [&_label]:flex [&_label]:min-h-10 [&_label]:items-center [&_label]:justify-between [&_label]:text-caption">
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
            <ColorPicker
              aria-label={`${label} color`}
              className="w-32"
              format="hex"
              value={brand[key]}
              onValueChange={(value) => {
                if (value) update({ [key]: value });
              }}
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
              {issue.ratio.toFixed(2)}:1 - needs {issue.required}:1 or better.
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
  const id = useId();
  return (
    <div className={"grid gap-1.5"}>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue>{options.find((option) => option.id === value)?.label ?? value}</SelectValue>
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
  const customFields = Array.isArray(form.customFields) ? form.customFields : [];
  const updateField = (id, patch) =>
    update({
      customFields: customFields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    });
  return (
    <div className={"grid gap-4"}>
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
        label="Double opt-in (verify email before counting the signup)"
        checked={(form.doubleOptIn ?? true) && (form.verification ?? true)}
        onChange={(doubleOptIn) => update({ doubleOptIn, verification: doubleOptIn })}
      />
      <ListField
        label="Allowed email domains (comma-separated, empty = all)"
        value={form.allowedEmailDomains}
        placeholder="company.com, partner.org"
        onChange={(allowedEmailDomains) => update({ allowedEmailDomains })}
      />
      <ListField
        label="Blocked email domains (comma-separated)"
        value={form.blockedEmailDomains}
        placeholder="competitor.com"
        onChange={(blockedEmailDomains) => update({ blockedEmailDomains })}
      />
      <ListField
        label="Allowed countries (ISO codes, empty = all)"
        value={form.allowedCountries}
        placeholder="US, DE, IN"
        normalize={(code) => code.toUpperCase()}
        onChange={(allowedCountries) => update({ allowedCountries })}
      />
      <ListField
        label="Blocked countries (ISO codes)"
        value={form.blockedCountries}
        placeholder="RU, CN"
        normalize={(code) => code.toUpperCase()}
        onChange={(blockedCountries) => update({ blockedCountries })}
      />
      <Toggle
        label="Collect phone number"
        checked={form.collectPhone === true || form.requirePhone === true}
        onChange={(collectPhone) =>
          update(collectPhone ? { collectPhone } : { collectPhone, requirePhone: false })
        }
      />
      {(form.collectPhone || form.requirePhone) && (
        <Toggle
          label="Require phone number"
          checked={form.requirePhone === true}
          onChange={(requirePhone) => update({ requirePhone })}
        />
      )}
      <Toggle
        label="Bot protection (Cloudflare Turnstile)"
        checked={form.requireTurnstile === true}
        onChange={(requireTurnstile) => update({ requireTurnstile })}
        hint={
          form.requireTurnstile === true
            ? "Signups fail while the server's TURNSTILE_SECRET_KEY is missing."
            : ""
        }
      />
      {form.requireTurnstile && (
        <Field
          label="Turnstile site key (must match this server's widget)"
          value={form.turnstileSiteKey ?? ""}
          onChange={(turnstileSiteKey) => update({ turnstileSiteKey })}
        />
      )}
      <div className="grid gap-3 border-t border-product-border-subtle pt-4">
        <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
          Custom fields
        </span>
        {customFields.map((field) => (
          <div
            className="grid gap-2.5 rounded-lg border border-product-border-subtle p-3"
            key={field.id}
          >
            <Field
              label="Label"
              value={field.label}
              onChange={(label) => updateField(field.id, { label })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Type"
                value={field.type}
                options={[
                  { id: "text", label: "Short text" },
                  { id: "textarea", label: "Long text" },
                  { id: "number", label: "Number" },
                  { id: "select", label: "Dropdown" },
                  { id: "checkbox", label: "Checkbox" },
                ]}
                onChange={(type) => updateField(field.id, { type })}
              />
              <Field
                label="Placeholder"
                value={field.placeholder ?? ""}
                onChange={(placeholder) => updateField(field.id, { placeholder })}
              />
            </div>
            {field.type === "select" && (
              <ListField
                label="Options (comma-separated)"
                value={field.options}
                onChange={(options) => updateField(field.id, { options })}
              />
            )}
            <Toggle
              label="Required"
              checked={field.required === true}
              onChange={(required) => updateField(field.id, { required })}
            />
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() =>
                update({
                  customFields: customFields.filter((entry) => entry.id !== field.id),
                })
              }
            >
              Remove
            </Button>
          </div>
        ))}
        {customFields.length < 10 && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() =>
              update({
                customFields: [
                  ...customFields,
                  {
                    id: `field-${crypto.randomUUID().slice(0, 8).toLowerCase()}`,
                    label: "New question",
                    type: "text",
                    required: false,
                    placeholder: "",
                    options: [],
                  },
                ],
              })
            }
          >
            Add field
          </Button>
        )}
      </div>
      <div className="grid gap-4 border-t border-product-border-subtle pt-4">
        <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
          After signup
        </span>
        <Field
          label="Redirect URL (empty = stay on the thank-you screen)"
          value={form.successRedirectUrl ?? ""}
          placeholder="/thanks"
          onChange={(successRedirectUrl) => update({ successRedirectUrl })}
        />
        <ListField
          label="Redirect host allowlist (for https:// URLs)"
          value={form.successRedirectAllowlist}
          placeholder="app.example.com"
          onChange={(successRedirectAllowlist) => update({ successRedirectAllowlist })}
        />
      </div>
    </div>
  );
}
function StatusPanel({ status, update, showReferrals = true, waitListId, rewards, updateRewards }) {
  // Drafts saved before rewards existed have no key yet: fall back to the
  // zero-config defaults (same values the API resolves server-side).
  const perks = {
    pointsSignup: 50,
    pointsReferral: 30,
    pointsFollow: 5,
    customEvents: [],
    positionOffset: 0,
    hideCounts: false,
    showPoints: true,
    showProgress: true,
    ...rewards,
  };
  const referralNote = showReferrals ? null : (
    <p className="m-0 text-caption leading-relaxed text-product-text-secondary">
      Referral sharing is off for this waitlist, so the referral link and share buttons stay hidden.{" "}
      <Link
        className="underline underline-offset-4"
        href={`/waitlists/${waitListId}/settings?section=referral`}
      >
        Turn referrals on
      </Link>
    </p>
  );
  // Snapshots saved before the cockpit fields existed parse without them;
  // fall back to the schema defaults so the builder never crashes.
  const channels = Array.isArray(status.shareChannels) ? status.shareChannels : [];
  const follows = Array.isArray(status.socialFollows) ? status.socialFollows : [];
  const followUrl = (network) => follows.find((entry) => entry?.network === network)?.url ?? "";
  const setFollowUrl = (network, url) => {
    const next = follows.filter((entry) => entry?.network !== network);
    if (url.trim()) next.push({ network, url: url.trim() });
    update({ socialFollows: next });
  };
  return (
    <div className={"grid gap-4 p-4"}>
      <SelectField
        label="After a successful signup"
        value={status.postSignupBehavior}
        options={[
          { id: "confirmation", label: "Show confirmation" },
          { id: "no-change", label: "No redirect or state change" },
        ]}
        onChange={(postSignupBehavior) => update({ postSignupBehavior })}
      />
      {status.postSignupBehavior === "no-change" && (
        <p className="m-0 text-caption leading-relaxed text-product-text-secondary">
          No redirect or confirmation/referral state is shown. The signup is still recorded.
        </p>
      )}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Icon style"
          value={status.iconStyle || "filled"}
          options={[
            { id: "filled", label: "Filled" },
            { id: "soft", label: "Soft" },
          ]}
          onChange={(iconStyle) => update({ iconStyle })}
        />
        <SelectField
          label="Layout"
          value={status.layout || "centered"}
          options={[
            { id: "centered", label: "Centered" },
            { id: "card", label: "Card" },
          ]}
          onChange={(layout) => update({ layout })}
        />
      </div>
      <Toggle
        label="Show position"
        checked={status.showPosition}
        onChange={(showPosition) => update({ showPosition })}
      />
      {referralNote}
      <Toggle
        label="Show referral link"
        checked={status.showReferralLink}
        disabled={!showReferrals}
        onChange={(showReferralLink) => update({ showReferralLink })}
      />
      <Toggle
        label="Show referral count"
        checked={status.showReferralCount}
        disabled={!showReferrals}
        onChange={(showReferralCount) => update({ showReferralCount })}
      />
      <Toggle
        label="Show leaderboard"
        checked={status.showLeaderboard !== false}
        disabled={!showReferrals}
        onChange={(showLeaderboard) => update({ showLeaderboard })}
      />
      <Field
        label="Share message"
        value={status.shareMessage}
        multiline
        disabled={!showReferrals}
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
        {SHARE_CHANNELS.map(({ id: channel, label }) => (
          <Toggle
            key={channel}
            label={
              <span className="inline-flex items-center gap-2">
                <ShareChannelIcon channel={channel} />
                {label}
              </span>
            }
            checked={channels.includes(channel)}
            disabled={!showReferrals}
            onChange={(enabled) =>
              update({
                shareChannels: enabled
                  ? [...channels, channel]
                  : channels.filter((item) => item !== channel),
              })
            }
          />
        ))}
      </div>
      <div className={"grid gap-4"}>
        <span
          className={
            "block text-micro font-bold tracking-widest text-product-text-secondary uppercase"
          }
        >
          Social follows
        </span>
        <p className="m-0 text-caption leading-relaxed text-product-text-secondary">
          Shown as follow tasks on the referral cockpit. Follows earn points once rewards launch.
        </p>
        <Field
          label="X profile URL"
          value={followUrl("x")}
          disabled={!showReferrals}
          placeholder="https://x.com/yourhandle"
          onChange={(url) => setFollowUrl("x", url)}
        />
        <Field
          label="Instagram profile URL"
          value={followUrl("instagram")}
          disabled={!showReferrals}
          placeholder="https://instagram.com/yourhandle"
          onChange={(url) => setFollowUrl("instagram", url)}
        />
      </div>
      <RewardsSection perks={perks} updateRewards={updateRewards} />
    </div>
  );
}

function RewardsSection({ perks, updateRewards }) {
  const setPerks = (patch) => updateRewards({ ...perks, ...patch });
  return (
    <div className="grid gap-4 border-t border-product-border-subtle pt-4">
      <div className="grid gap-1">
        <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
          Points & rewards
        </span>
        <p className="m-0 text-caption leading-relaxed text-product-text-secondary">
          Points accrue automatically from activation. Reward tiers come from the Referral rewards
          blocks on your page.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <PointsField
          key={perks.pointsSignup}
          label="Per verified signup"
          value={perks.pointsSignup}
          onCommit={(pointsSignup) => setPerks({ pointsSignup })}
        />
        <PointsField
          key={perks.pointsReferral}
          label="Per referral"
          value={perks.pointsReferral}
          onCommit={(pointsReferral) => setPerks({ pointsReferral })}
        />
        <PointsField
          key={perks.pointsFollow}
          label="Per social follow"
          value={perks.pointsFollow}
          onCommit={(pointsFollow) => setPerks({ pointsFollow })}
        />
      </div>
      <PointsField
        key={perks.positionOffset}
        label="Position boost"
        value={perks.positionOffset}
        max={1000000}
        onCommit={(positionOffset) => setPerks({ positionOffset })}
      />
      <p className="-mt-2 text-caption leading-relaxed text-product-text-secondary">
        Adds to every displayed position - e.g. 846 makes the first signup show #847.
      </p>
      <Toggle
        label="Show points balance"
        checked={perks.showPoints}
        onChange={(showPoints) => setPerks({ showPoints })}
      />
      <Toggle
        label="Show reward progress"
        checked={perks.showProgress}
        onChange={(showProgress) => setPerks({ showProgress })}
      />
      <Toggle
        label="Stealth mode (hide all counts)"
        hint="Hides positions, points, and headcounts on the public page. Best for private or B2B launches."
        checked={perks.hideCounts}
        onChange={(hideCounts) => setPerks({ hideCounts })}
      />
      <div className="grid gap-2.5">
        <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
          Custom events
        </span>
        <p className="m-0 text-caption leading-relaxed text-product-text-secondary">
          Off-site actions awarded through the API (survey, Discord join…). The event key goes in
          the API call.
        </p>
        {(perks.customEvents ?? []).map((entry, index) => (
          <div
            className="grid gap-2.5 border-t border-product-border-subtle pt-4 [&>button]:justify-self-start"
            key={entry.id ?? `${entry.key}:${entry.label}:${entry.points}`}
          >
            <Field
              label="Event key"
              value={entry.key}
              maxLength={40}
              onChange={(key) =>
                setPerks({
                  customEvents: perks.customEvents.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, key } : item,
                  ),
                })
              }
            />
            <Field
              label="Label"
              value={entry.label}
              maxLength={80}
              onChange={(label) =>
                setPerks({
                  customEvents: perks.customEvents.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, label } : item,
                  ),
                })
              }
            />
            <PointsField
              key={entry.points}
              label="Points"
              value={entry.points}
              onCommit={(points) =>
                setPerks({
                  customEvents: perks.customEvents.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, points } : item,
                  ),
                })
              }
            />
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() =>
                setPerks({
                  customEvents: perks.customEvents.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            >
              Remove
            </Button>
          </div>
        ))}
        {(perks.customEvents ?? []).length < 12 && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              // Distinct keys: normalizeRewardsConfig keeps one entry per key,
              // so adding twice without renaming must not collide.
              const keys = new Set((perks.customEvents ?? []).map((entry) => entry.key));
              let key = "survey";
              for (let n = 2; keys.has(key); n += 1) key = `survey-${n}`;
              setPerks({
                customEvents: [
                  ...(perks.customEvents ?? []),
                  {
                    key,
                    label: "Survey completed",
                    points: 20,
                    id: crypto.randomUUID(),
                  },
                ],
              });
            }}
          >
            Add event
          </Button>
        )}
      </div>
    </div>
  );
}
