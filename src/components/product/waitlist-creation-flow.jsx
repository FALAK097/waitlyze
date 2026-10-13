"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, CodeIcon, GlobeIcon, Layout01Icon, LockKeyIcon, Share01Icon, SparklesIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { THEME_ACCENTS, THEME_FONTS, THEME_PRESETS, normalizeTheme } from "@/lib/templates/theme.mjs";

// Every style prop in this file is an inline literal of --page-* custom
// properties only (never color/background/font properties). The module
// stylesheet consumes them, which keeps dynamic theme colors lint-clean.
function themeParts(theme) {
  const normalized = normalizeTheme(theme);
  return { preset: THEME_PRESETS[normalized.preset], accent: THEME_ACCENTS[normalized.accent], font: THEME_FONTS[normalized.font] };
}

function pageVars(theme) {
  const { preset, accent, font } = themeParts(theme);
  return { bg: preset.bg, text: preset.text, muted: preset.muted, card: preset.card, border: preset.border, accent: accent.solid, accentHover: accent.hover, accentLabel: accent.text, font: font.stack };
}
import styles from "./waitlist-creation-flow.module.css";

const empty = { templateId: "saas", name: "", description: "", publicSlug: "", creationKey: "", themePreset: "", themeAccent: "", themeFont: "", showReferrals: false, showSocialProof: false };
const steps = ["Choose a template", "Style your page", "Choose how to collect", "Review & create"];
const stepDescriptions = [
  "Pick a starter with real copy. Every template is editable after creation.",
  "Name the launch, set its address, and make the page yours.",
  "The launch page is always included. Turn on the growth levers you want from day one.",
  "Check the details. Your page stays private until you publish.",
];

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64).replace(/-+$/g, "");
}

function themeOf(values) {
  return { preset: values.themePreset || "light", accent: values.themeAccent || "lime", font: values.themeFont || "sans" };
}

function PreviewSection({ section }) {
  if (section.type === "features") return <ul className={styles.previewFeatures}>{section.items.slice(0, 3).map((item) => <li key={item.title}><span aria-hidden="true"><HugeiconsIcon icon={Tick01Icon} size={14} /></span><div><strong>{item.title}</strong><p>{item.body}</p></div></li>)}</ul>;
  if (section.type === "faq") return <div className={styles.previewFaq}><strong>{section.items[0]?.question}</strong><p>{section.items[0]?.answer}</p></div>;
  if (section.type === "form") return <div className={styles.previewForm}><span>{section.label}</span><div><span>you@example.com</span><strong>{section.buttonText}</strong></div></div>;
  if (section.type === "footer") return <p className={styles.previewFooter}>{section.note}</p>;
  return null;
}

function PagePreview({ template, hero, name, publicSlug, theme }) {
  const v = pageVars(theme);
  return <aside className={styles.previewColumn} aria-label={`${template.name} page preview`}>
    <div className={styles.previewMeta}><span><HugeiconsIcon icon={Layout01Icon} size={15} aria-hidden="true" /> Page preview</span></div>
    <div className={styles.previewAddress}>
      <span><HugeiconsIcon icon={LockKeyIcon} size={13} aria-hidden="true" /> Private preview</span>
      <strong>/w/{publicSlug || "your-page"}</strong>
    </div>
    <div className={styles.previewPage} style={{ "--page-bg": v.bg, "--page-text": v.text, "--page-muted": v.muted, "--page-card": v.card, "--page-border": v.border, "--page-accent": v.accent, "--page-accent-hover": v.accentHover, "--page-accent-label": v.accentLabel, "--page-font": v.font }}>
      <div className={styles.previewBrand}><span aria-hidden="true" /> {name || "Your product"}</div>
      <div className={styles.previewHero}><span className={styles.previewTag}><HugeiconsIcon icon={SparklesIcon} size={12} aria-hidden="true" /> COMING SOON</span><h3>{hero?.heading}</h3><p>{hero?.body}</p></div>
      {template.snapshot.sections.slice(1).map((section, index) => <PreviewSection section={section} key={`${section.type}-${index}`} />)}

    </div>

  </aside>;
}

function TemplatePicker({ templates, values, onSelect }) {
  return <fieldset className="grid min-w-0 grid-cols-1 gap-3 border-0 m-0 p-0 sm:grid-cols-2">
    <legend className="sr-only">Choose a page starter</legend>
    {templates.map((item) => {
      const selected = values.templateId === item.id;
      const hero = item.snapshot.sections.find((section) => section.type === "hero");
      const v = pageVars(item.theme);
      return <label key={item.id} className={`relative grid cursor-pointer gap-2.5 rounded-xl bg-white p-3 transition-shadow ${selected ? "ring-2 ring-primary" : "ring-1 ring-black/10 hover:ring-black/20"}`}>
        <input type="radio" name="template" value={item.id} checked={selected} onChange={() => onSelect(item)} className="peer sr-only" />
        <span aria-hidden="true" className={`grid gap-1.5 overflow-hidden rounded-lg p-3.5 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary ${styles.miniPreview}`} style={{ "--page-bg": v.bg, "--page-text": v.text, "--page-muted": v.muted, "--page-card": v.card, "--page-border": v.border, "--page-accent": v.accent, "--page-accent-hover": v.accentHover, "--page-accent-label": v.accentLabel, "--page-font": v.font }}>
          <span className={`h-1.5 w-9 rounded-full ${styles.miniBrand}`} />
          <span className="block truncate text-sm font-semibold tracking-tight">{hero?.heading}</span>
          <span className={`block truncate text-xs ${styles.miniBody}`}>{hero?.body}</span>
          <span className="mt-1 flex items-center gap-1.5">
            <span className={`h-5.5 flex-1 rounded border ${styles.miniEmail}`} />
            <span className={`rounded px-2.5 py-1 text-xs font-semibold ${styles.miniButton}`}>Join</span>
          </span>
        </span>
        <span className="grid gap-1 pr-6">
          <strong className="text-sm font-semibold text-neutral-900">{item.name}</strong>
          <span className="text-xs leading-relaxed text-neutral-500">{item.description}</span>
        </span>
        <span className="absolute top-3 right-3 text-neutral-900" aria-hidden="true">{selected && <HugeiconsIcon icon={Tick01Icon} size={14} />}</span>
      </label>;
    })}
  </fieldset>;
}

function ThemeControls({ values, setValues }) {
  const selectedRing = "border-primary ring-1 ring-primary";
  const swatchButton = "inline-flex min-h-10 items-center gap-2 rounded-full border bg-white py-1.5 pr-3 pl-1.5 text-xs text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  return <>
    <div className="grid gap-2">
      <Label id="theme-preset-label">Page theme</Label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="theme-preset-label">
        {Object.entries(THEME_PRESETS).map(([id, preset]) => <button key={id} type="button" role="radio" aria-checked={values.themePreset === id} title={preset.name} onClick={() => setValues((previous) => ({ ...previous, themePreset: id }))} className={`${swatchButton} ${values.themePreset === id ? selectedRing : "border-neutral-300"}`}>
          <span className={`inline-flex h-5.5 w-8.5 items-center justify-center gap-0.75 rounded-full border ${styles.swatchChip}`} style={{ "--page-bg": preset.bg, "--page-text": preset.text, "--page-border": preset.border, "--page-accent": (THEME_ACCENTS[values.themeAccent] || THEME_ACCENTS.lime).solid }} aria-hidden="true"><i className="h-1.5 w-1.5 rounded-full" /><i className="h-1.5 w-1.5 rounded-full" /></span>
          {preset.name}
        </button>)}
      </div>
    </div>
    <div className="grid gap-2">
      <Label id="theme-accent-label">Button color</Label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="theme-accent-label">
        {Object.entries(THEME_ACCENTS).map(([id, accent]) => <button key={id} type="button" role="radio" aria-checked={values.themeAccent === id} title={accent.name} onClick={() => setValues((previous) => ({ ...previous, themeAccent: id }))} className={`${swatchButton} ${values.themeAccent === id ? selectedRing : "border-neutral-300"}`}>
          <span className={`h-4.5 w-4.5 rounded-full ${styles.swatchDot}`} style={{ "--swatch": accent.solid }} aria-hidden="true" />
          {accent.name}
        </button>)}
      </div>
    </div>
    <div className="grid gap-2">
      <Label id="theme-font-label">Font</Label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="theme-font-label">
        {Object.entries(THEME_FONTS).map(([id, font]) => <button key={id} type="button" role="radio" aria-checked={values.themeFont === id} onClick={() => setValues((previous) => ({ ...previous, themeFont: id }))} className={`inline-flex min-h-10 items-center gap-2 rounded-lg border bg-white px-3.5 py-1.5 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${values.themeFont === id ? selectedRing : "border-neutral-300"}`}>
          <span className={`text-base font-semibold ${id === "serif" ? "font-serif" : id === "mono" ? "font-mono" : "font-sans"}`} aria-hidden="true">Ag</span>
          {font.name}
        </button>)}
      </div>
    </div>
  </>;
}

function DetailsForm({ values, setValues, changeName, setSlugEdited, state, formRef, continueFromDetails }) {
  return <form ref={formRef} className={styles.details} onSubmit={continueFromDetails}>
    <div className={styles.field}><Label htmlFor="waitlist-name">What are you launching?</Label><p className={styles.fieldHint} id="name-hint">Use a working title. You can rename it any time.</p><Input id="waitlist-name" required maxLength={120} value={values.name} onChange={(event) => changeName(event.target.value)} aria-describedby={state.fields?.name ? "name-hint name-error" : "name-hint"} aria-invalid={state.fields?.name ? true : undefined} autoComplete="off" autoFocus />{state.fields?.name && <p id="name-error" className={styles.fieldError} role="alert">{state.fields.name[0]}</p>}</div>
    <div className={styles.field}><Label htmlFor="waitlist-description">Internal note <span>Optional</span></Label><p className={styles.fieldHint} id="description-hint">For you and your team. This won’t appear on the public page.</p><Textarea id="waitlist-description" maxLength={600} value={values.description} onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))} aria-describedby="description-hint" rows={3} /></div>
    <div className={styles.field}><Label htmlFor="waitlist-address">Your page address</Label><p className={styles.fieldHint} id="address-hint">Private until you publish. Use 3–64 lowercase letters, numbers, or hyphens.</p><div className={styles.slugInput}><span aria-hidden="true"><HugeiconsIcon icon={GlobeIcon} size={16} /></span><span className={styles.slugBase}>/w/</span><Input id="waitlist-address" required minLength={3} maxLength={64} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={values.publicSlug} onChange={(event) => { setSlugEdited(true); setValues((previous) => ({ ...previous, publicSlug: event.target.value })); }} aria-describedby={state.fields?.publicSlug ? "address-hint address-error" : "address-hint"} aria-invalid={state.fields?.publicSlug ? true : undefined} autoCapitalize="none" spellCheck={false} autoComplete="off" /></div>
      {state.fields?.publicSlug && <p id="address-error" className={styles.fieldError} role="alert">{state.fields.publicSlug[0]}</p>}
    </div>
    {state.message && <div className={styles.error} role="alert"><strong>There’s an issue with these details.</strong><span>{state.message}</span><span>Your entries are still here. Make a change and try again.</span></div>}
  </form>;
}

function MethodToggle({ on }) {
  return <span aria-hidden="true" className={`relative h-6 w-10 flex-none self-center rounded-full transition-colors ${on ? "bg-primary" : "bg-neutral-300"}`}>
    <i className={`absolute top-0.75 h-4.5 w-4.5 rounded-full bg-white transition-all ${on ? "left-4.75" : "left-0.75"}`} />
  </span>;
}

function CollectStep({ values, setValues, publicSlug }) {
  const card = "relative flex items-start gap-3 rounded-xl bg-white p-3.5 ring-1 ring-black/10";
  const icon = "grid h-8.5 w-8.5 flex-none place-items-center rounded-lg bg-neutral-100 text-neutral-900";
  return <div className="grid min-w-0 content-start gap-2.5">
    <div className={card}>
      <span className={icon} aria-hidden="true"><HugeiconsIcon icon={GlobeIcon} size={18} /></span>
      <div className="grid min-w-0 flex-1 gap-1"><strong className="text-sm font-semibold text-neutral-900">Launch page</strong><p className="m-0 text-xs leading-relaxed text-neutral-500">Always included. Hosted at <code className="font-mono text-xs">/w/{publicSlug || "your-page"}</code>, or on your own domain after creation.</p></div>
      <span className="flex-none rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-500">Included</span>
    </div>
    <label className={`${card} cursor-pointer ${values.showReferrals ? "ring-2 ring-primary" : ""}`}>
      <input type="checkbox" checked={values.showReferrals} onChange={(event) => setValues((previous) => ({ ...previous, showReferrals: event.target.checked }))} className="peer sr-only" />
      <span className={icon} aria-hidden="true"><HugeiconsIcon icon={Share01Icon} size={18} /></span>
      <div className="grid min-w-0 flex-1 gap-1 rounded peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary"><strong className="text-sm font-semibold text-neutral-900">Referral links</strong><p className="m-0 text-xs leading-relaxed text-neutral-500">Every signup gets a personal link. Friends who join move them up the queue.</p></div>
      <MethodToggle on={values.showReferrals} />
    </label>
    <label className={`${card} cursor-pointer ${values.showSocialProof ? "ring-2 ring-primary" : ""}`}>
      <input type="checkbox" checked={values.showSocialProof} onChange={(event) => setValues((previous) => ({ ...previous, showSocialProof: event.target.checked }))} className="peer sr-only" />
      <span className={icon} aria-hidden="true"><HugeiconsIcon icon={SparklesIcon} size={18} /></span>
      <div className="grid min-w-0 flex-1 gap-1 rounded peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary"><strong className="text-sm font-semibold text-neutral-900">Social proof</strong><p className="m-0 text-xs leading-relaxed text-neutral-500">Show the subscriber count on the page once people start joining.</p></div>
      <MethodToggle on={values.showSocialProof} />
    </label>
    <div className={card}>
      <span className={icon} aria-hidden="true"><HugeiconsIcon icon={Layout01Icon} size={18} /></span>
      <div className="grid min-w-0 flex-1 gap-1"><strong className="text-sm font-semibold text-neutral-900">Inline, popup, or your own form</strong><p className="m-0 text-xs leading-relaxed text-neutral-500">Embed the signup form on any site after creation. No rebuild needed.</p></div>
      <Link prefetch={false} className="flex-none self-center whitespace-nowrap text-xs font-semibold text-neutral-900 underline underline-offset-4" href="/docs/embed" target="_blank" rel="noreferrer">Embed docs</Link>
    </div>
    <div className={card}>
      <span className={icon} aria-hidden="true"><HugeiconsIcon icon={CodeIcon} size={18} /></span>
      <div className="grid min-w-0 flex-1 gap-1"><strong className="text-sm font-semibold text-neutral-900">API</strong><p className="m-0 text-xs leading-relaxed text-neutral-500">Create signups from your own app with the signup API.</p></div>
      <Link prefetch={false} className="flex-none self-center whitespace-nowrap text-xs font-semibold text-neutral-900 underline underline-offset-4" href="/docs/api" target="_blank" rel="noreferrer">API docs</Link>
    </div>
  </div>;
}

function CreationStepContent({ step, templates, values, setValues, template, hero, formRef, continueFromDetails, changeName, selectTemplate, state, setSlugEdited, move }) {
  if (step === 0) return <div className={styles.templateGrid}>
    <TemplatePicker templates={templates} values={values} onSelect={selectTemplate} />
    <PagePreview template={template} hero={hero} name={values.name} publicSlug={values.publicSlug} theme={themeOf(values)} />
  </div>;

  if (step === 1) return <div className={styles.templateGrid}>
    <div className="grid min-w-0 content-start gap-5.5">
      <DetailsForm values={values} setValues={setValues} changeName={changeName} setSlugEdited={setSlugEdited} state={state} formRef={formRef} continueFromDetails={continueFromDetails} />
      <ThemeControls values={values} setValues={setValues} />
    </div>
    <PagePreview template={template} hero={hero} name={values.name} publicSlug={values.publicSlug} theme={themeOf(values)} />
  </div>;

  if (step === 2) return <div className={styles.templateGrid}>
    <CollectStep values={values} setValues={setValues} publicSlug={values.publicSlug} />
    <PagePreview template={template} hero={hero} name={values.name} publicSlug={values.publicSlug} theme={themeOf(values)} />
  </div>;

  return <div className={styles.templateGrid}>
    <div className={styles.review}>
      <div className={styles.reviewMain}>
        <div className={styles.reviewHeading}><div><p className={styles.reviewLabel}>WAITLIST</p><h3>{values.name}</h3></div><Button type="button" className={styles.textButton} onClick={() => move(1)}>Edit details</Button></div>
        {values.description && <p className={styles.reviewDescription}><strong>Internal note:</strong> {values.description}</p>}
        <div className={styles.reviewRow}><span>Page path</span><strong>/w/{values.publicSlug}</strong></div>
        <div className={styles.reviewRow}><span>Template</span><strong>{template.name}<Button type="button" className={styles.inlineEdit} onClick={() => move(0)}>Change</Button></strong></div>
        <div className={styles.reviewRow}><span>Style</span><strong>{THEME_PRESETS[values.themePreset]?.name} · {THEME_ACCENTS[values.themeAccent]?.name} · {THEME_FONTS[values.themeFont]?.name}<Button type="button" className={styles.inlineEdit} onClick={() => move(1)}>Change</Button></strong></div>
        <div className={styles.reviewRow}><span>Collect</span><strong>Launch page{values.showReferrals ? " · Referrals" : ""}{values.showSocialProof ? " · Social proof" : ""}<Button type="button" className={styles.inlineEdit} onClick={() => move(2)}>Change</Button></strong></div>
      </div>
      <aside className={styles.privacyCard}><span><HugeiconsIcon icon={LockKeyIcon} size={17} aria-hidden="true" /> Private draft</span><p>Only workspace members can see it. The page won’t accept signups until you publish.</p><ul><li><HugeiconsIcon icon={Tick01Icon} size={14} aria-hidden="true" /> Email-only signup</li><li><HugeiconsIcon icon={Tick01Icon} size={14} aria-hidden="true" /> No emails sent automatically</li><li><HugeiconsIcon icon={Tick01Icon} size={14} aria-hidden="true" /> Edit before publishing</li></ul></aside>
      {state.message && <div className={styles.error} role="alert"><strong>We couldn’t create this draft.</strong><span>{state.message}</span><span>Your details are saved here. You can retry without starting over.</span></div>}
    </div>
    <PagePreview template={template} hero={hero} name={values.name} publicSlug={values.publicSlug} theme={themeOf(values)} />
  </div>;
}

function CreationActions({ step, move, pending, state, template, formRef, action, values }) {
  return <footer className={styles.actions}>
    {step > 0 ? <Button type="button" variant="outline" disabled={pending || Boolean(state.id)} onClick={() => move(step - 1)}><HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" /> Back</Button> : <span className={styles.actionHint}>Every template is editable after creation.</span>}
    {step === 0 && <Button type="button" onClick={() => move(1)}>Continue with {template.name}<HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /></Button>}
    {step === 1 && <Button type="button" onClick={() => formRef.current?.requestSubmit()}>Choose how to collect<HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /></Button>}
    {step === 2 && <Button type="button" onClick={() => move(3)}>Review draft<HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /></Button>}
    {step === 3 && <form action={action} className={styles.submitForm}>
      <input type="hidden" name="name" value={values.name} /><input type="hidden" name="description" value={values.description} /><input type="hidden" name="publicSlug" value={values.publicSlug} /><input type="hidden" name="templateId" value={values.templateId} /><input type="hidden" name="creationKey" value={values.creationKey} /><input type="hidden" name="themePreset" value={values.themePreset} /><input type="hidden" name="themeAccent" value={values.themeAccent} /><input type="hidden" name="themeFont" value={values.themeFont} /><input type="hidden" name="showReferrals" value={values.showReferrals ? "1" : ""} /><input type="hidden" name="showSocialProof" value={values.showSocialProof ? "1" : ""} />
      <Button type="submit" disabled={pending || Boolean(state.id)}>{pending ? "Creating draft…" : state.id ? "Opening editor…" : "Create private draft"}<HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /></Button></form>}
  </footer>;
}

const KNOWN_PRESETS = Object.keys(THEME_PRESETS);
const KNOWN_ACCENTS = Object.keys(THEME_ACCENTS);
const KNOWN_FONTS = Object.keys(THEME_FONTS);

export function WaitlistCreationFlow({ templates, workspaceId, workspaceName, submitDraft }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitDraft, {});
  const [values, setValues] = useState(empty);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const headingRef = useRef(null);
  const formRef = useRef(null);
  const storageKey = `waitlyze:create:${workspaceId}`;
  const template = useMemo(() => templates.find((item) => item.id === values.templateId) || templates[0], [templates, values.templateId]);
  const hero = template?.snapshot.sections.find((section) => section.type === "hero");

  function themeForTemplate(item) {
    return {
      themePreset: KNOWN_PRESETS.includes(item.theme?.preset) ? item.theme.preset : "light",
      themeAccent: KNOWN_ACCENTS.includes(item.theme?.accent) ? item.theme.accent : "lime",
      themeFont: KNOWN_FONTS.includes(item.theme?.font) ? item.theme.font : "sans",
    };
  }

  function selectTemplate(item) {
    setValues((previous) => ({ ...previous, templateId: item.id, ...themeForTemplate(item) }));
  }

  useEffect(() => {
    let restored;
    try { restored = JSON.parse(sessionStorage.getItem(storageKey)); } catch { setStorageUnavailable(true); }
    const stringKeys = ["name", "description", "publicSlug", "creationKey", "themePreset", "themeAccent", "themeFont"];
    const valid = restored && templates.some((item) => item.id === restored.templateId) &&
      [...stringKeys, "templateId"].every((key) => typeof restored[key] === "string") &&
      typeof restored.showReferrals === "boolean" && typeof restored.showSocialProof === "boolean" &&
      /^[0-9a-f-]{36}$/i.test(restored.creationKey);
    if (valid) {
      const picked = templates.find((item) => item.id === restored.templateId);
      setValues({
        ...Object.fromEntries([...stringKeys, "templateId"].map((key) => [key, restored[key]])),
        showReferrals: restored.showReferrals, showSocialProof: restored.showSocialProof,
        ...(!KNOWN_PRESETS.includes(restored.themePreset) || !KNOWN_ACCENTS.includes(restored.themeAccent) || !KNOWN_FONTS.includes(restored.themeFont) ? themeForTemplate(picked) : {}),
      });
    } else {
      const first = templates.find((item) => item.id === "saas") || templates[0];
      setValues({ ...empty, creationKey: crypto.randomUUID(), templateId: first.id, ...themeForTemplate(first) });
    }
    setSlugEdited(Boolean(valid && restored.slugEdited));
    setStep(valid && Number.isInteger(restored.step) && restored.step >= 0 && restored.step < steps.length ? restored.step : 0);
    setReady(true);
  }, [storageKey, templates]);

  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ ...values, slugEdited, step })); } catch { setStorageUnavailable(true); }
  }, [values, slugEdited, step, ready, storageKey]);

  useEffect(() => {
    if (!state.id) return;
    try { sessionStorage.removeItem(storageKey); } catch { /* Storage is optional after creation. */ }
    router.push(`/waitlists/${state.id}/edit`);
  }, [state.id, storageKey, router]);

  useEffect(() => {
    if (!state.fields || !state.message) return;
    setStep(1);
    requestAnimationFrame(() => {
      const target = state.fields.name ? "#waitlist-name" : state.fields.publicSlug ? "#waitlist-address" : "input:invalid";
      formRef.current?.querySelector(target)?.focus();
    });
  }, [state]);

  function move(nextStep) {
    setStep(nextStep);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function changeName(name) {
    setValues((previous) => ({ ...previous, name, publicSlug: slugEdited ? previous.publicSlug : slugify(name) }));
  }

  function continueFromDetails(event) {
    event.preventDefault();
    if (!formRef.current.reportValidity()) return;
    move(2);
  }

  return <div className={styles.page}>
    <header className={styles.header}>
      <p className={styles.eyebrow}>{workspaceName}</p>
      <h1>Create a waitlist</h1>
      <p>Choose a starter, style it, pick how you collect signups, then open the editor.</p>
    </header>

    <ol className="m-0 mb-9 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4" aria-label="Creation steps">
      {steps.map((label, index) => <li className={styles.progressStep} aria-current={step === index ? "step" : undefined} data-current={step === index || undefined} data-complete={step > index || undefined} key={label}>
        <span className={styles.progressNumber}>{step > index ? <HugeiconsIcon icon={Tick01Icon} size={14} aria-hidden="true" /> : index + 1}</span>
        <span>{label}</span>
        {index < steps.length - 1 && <span className={styles.progressLine} aria-hidden="true" />}
      </li>)}
    </ol>

    <section className={styles.stepHeader} aria-labelledby="step-title">
      <div><p className={styles.stepEyebrow}>Step {step + 1} of {steps.length}</p><h2 ref={headingRef} id="step-title" tabIndex={-1}>{steps[step]}</h2></div>
      <p>{stepDescriptions[step]}</p>
    </section>

    {!ready ? <div className={styles.loading} role="status" aria-label="Loading your draft setup"><span className={styles.skeleton} /><span className={styles.skeleton} /><span className={styles.skeleton} /><span className={styles.srOnly}>Restoring your setup…</span></div> : <>
      {storageUnavailable && <p className={styles.storageNotice} role="status">This browser can’t save your progress between reloads. Keep this tab open while you create your draft.</p>}

      <CreationStepContent step={step} templates={templates} values={values} setValues={setValues} template={template} hero={hero} formRef={formRef} continueFromDetails={continueFromDetails} changeName={changeName} selectTemplate={selectTemplate} state={state} setSlugEdited={setSlugEdited} move={move} />
      <CreationActions step={step} move={move} pending={pending} state={state} template={template} formRef={formRef} action={action} values={values} />
    </>}
  </div>;
}
