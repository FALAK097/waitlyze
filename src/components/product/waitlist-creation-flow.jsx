"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Globe2, LayoutTemplate, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import styles from "./waitlist-creation-flow.module.css";

const empty = { templateId: "saas", name: "", description: "", publicSlug: "", creationKey: "" };
const steps = ["Choose a starter", "Name your waitlist", "Review & create"];
const stepDescriptions = [
  "Choose a starting point. The preview shows real starter content, which you can change later.",
  "Give this launch a name and a short, shareable address.",
  "Your new page will be saved as a private draft. Nothing goes live until you publish.",
];

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64).replace(/-+$/g, "");
}

function PreviewSection({ section }) {
  if (section.type === "features") return <ul className={styles.previewFeatures}>{section.items.slice(0, 3).map((item) => <li key={item.title}><span aria-hidden="true"><Check size={14} /></span><div><strong>{item.title}</strong><p>{item.body}</p></div></li>)}</ul>;
  if (section.type === "faq") return <div className={styles.previewFaq}><strong>{section.items[0]?.question}</strong><p>{section.items[0]?.answer}</p></div>;
  if (section.type === "form") return <div className={styles.previewForm}><span>{section.label}</span><div><span>you@example.com</span><strong>{section.buttonText}</strong></div></div>;
  if (section.type === "footer") return <p className={styles.previewFooter}>{section.note}</p>;
  return null;
}

function PagePreview({ template, hero, name, publicSlug }) {
  return <aside className={styles.previewColumn} aria-label={`${template.name} page preview`}>
    <div className={styles.previewMeta}><span><LayoutTemplate size={15} aria-hidden="true" /> Page preview</span><span>{template.name}</span></div>
    <div className={styles.previewAddress}>
      <span><LockKeyhole size={13} aria-hidden="true" /> Private preview</span>
      <strong>/w/{publicSlug || "your-page"}</strong>
    </div>
    <div className={styles.previewPage}>
      <div className={styles.previewBrand}><span aria-hidden="true" /> {name || "Your product"}</div>
      <div className={styles.previewHero}><span className={styles.previewTag}><Sparkles size={12} aria-hidden="true" /> COMING SOON</span><h3>{hero?.heading}</h3><p>{hero?.body}</p></div>
      {template.snapshot.sections.slice(1).map((section, index) => <PreviewSection section={section} key={`${section.type}-${index}`} />)}
      <div className={styles.previewPrivacy}><LockKeyhole size={13} aria-hidden="true" /> Nothing is public until you publish.</div>
    </div>
    <p className={styles.previewNote}>Starter copy is a starting point. Review and edit every section before publishing.</p>
  </aside>;
}

function CreationStepContent({ step, templates, values, setValues, template, hero, formRef, continueFromDetails, changeName, state, setSlugEdited, workspaceName, move }) {
  if (step === 0) return <div className={styles.templateGrid}>
    <fieldset className={styles.choices}>
      <legend className={styles.srOnly}>Choose a page starter</legend>
      {templates.map((item) => <label key={item.id} className={styles.choice} data-selected={values.templateId === item.id || undefined}>
        <input type="radio" name="template" value={item.id} checked={values.templateId === item.id} onChange={() => setValues((previous) => ({ ...previous, templateId: item.id }))} />
        <span className={styles.choiceCopy}><strong>{item.name}</strong><span>{item.description}</span></span>
        <span className={styles.choiceMarker} aria-hidden="true">{values.templateId === item.id && <Check size={14} />}</span>
      </label>)}
    </fieldset>
    <PagePreview template={template} hero={hero} name={values.name} publicSlug={values.publicSlug} />
  </div>;

  if (step === 1) return <div className={styles.templateGrid}>
    <form ref={formRef} className={styles.details} onSubmit={continueFromDetails}>
      <div className={styles.field}><label htmlFor="waitlist-name">What are you launching?</label><p className={styles.fieldHint} id="name-hint">Use a working title. You can rename it any time.</p><Input id="waitlist-name" required maxLength={120} value={values.name} onChange={(event) => changeName(event.target.value)} aria-describedby={state.fields?.name ? "name-hint name-error" : "name-hint"} aria-invalid={state.fields?.name ? true : undefined} autoComplete="off" autoFocus />{state.fields?.name && <p id="name-error" className={styles.fieldError} role="alert">{state.fields.name[0]}</p>}</div>
      <div className={styles.field}><label htmlFor="waitlist-description">Internal note <span>Optional</span></label><p className={styles.fieldHint} id="description-hint">For you and your team. This won’t appear on the public page.</p><textarea id="waitlist-description" maxLength={600} value={values.description} onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))} aria-describedby="description-hint" rows={3} /></div>
      <div className={styles.field}><label htmlFor="waitlist-address">Your page address</label><p className={styles.fieldHint} id="address-hint">Private until you publish. Use 3–64 lowercase letters, numbers, or hyphens.</p><div className={styles.slugInput}><span aria-hidden="true"><Globe2 size={16} /></span><span className={styles.slugBase}>/w/</span><Input id="waitlist-address" required minLength={3} maxLength={64} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={values.publicSlug} onChange={(event) => { setSlugEdited(true); setValues((previous) => ({ ...previous, publicSlug: event.target.value })); }} aria-describedby={state.fields?.publicSlug ? "address-hint address-error" : "address-hint"} aria-invalid={state.fields?.publicSlug ? true : undefined} autoCapitalize="none" spellCheck={false} autoComplete="off" /></div>
        {state.fields?.publicSlug && <p id="address-error" className={styles.fieldError} role="alert">{state.fields.publicSlug[0]}</p>}
      </div>
      {state.message && <div className={styles.error} role="alert"><strong>There’s an issue with these details.</strong><span>{state.message}</span><span>Your entries are still here. Make a change and try again.</span></div>}
    </form>
    <PagePreview template={template} hero={hero} name={values.name} publicSlug={values.publicSlug} />
  </div>;

  return <div className={styles.templateGrid}>
    <div className={styles.review}>
      <div className={styles.reviewMain}>
        <div className={styles.reviewHeading}><div><p className={styles.reviewLabel}>WAITLIST</p><h3>{values.name}</h3></div><button type="button" className={styles.textButton} onClick={() => move(1)}>Edit details</button></div>
        {values.description && <p className={styles.reviewDescription}><strong>Internal note:</strong> {values.description}</p>}
        <div className={styles.reviewRow}><span>Page path</span><strong>/w/{values.publicSlug}</strong></div>
        <div className={styles.reviewRow}><span>Page starter</span><strong>{template.name}<button type="button" className={styles.inlineEdit} onClick={() => move(0)}>Change</button></strong></div>
        <div className={styles.reviewRow}><span>Workspace</span><strong>{workspaceName}</strong></div>
      </div>
      <aside className={styles.privacyCard}><span><LockKeyhole size={17} aria-hidden="true" /> Private draft</span><p>Only workspace members can see it. The page won’t accept signups until you publish.</p><ul><li><Check size={14} aria-hidden="true" /> Email-only signup</li><li><Check size={14} aria-hidden="true" /> No emails sent automatically</li><li><Check size={14} aria-hidden="true" /> Edit before publishing</li></ul></aside>
      {state.message && <div className={styles.error} role="alert"><strong>We couldn’t create this draft.</strong><span>{state.message}</span><span>Your details are saved here. You can retry without starting over.</span></div>}
    </div>
    <PagePreview template={template} hero={hero} name={values.name} publicSlug={values.publicSlug} />
  </div>;
}

function CreationActions({ step, move, pending, state, template, formRef, action, values }) {
  return <footer className={styles.actions}>
    {step > 0 ? <Button type="button" variant="outline" disabled={pending || Boolean(state.id)} onClick={() => move(step - 1)}><ArrowLeft size={16} aria-hidden="true" /> Back</Button> : <span className={styles.actionHint}>7 starters · change it anytime</span>}
    {step === 0 && <Button type="button" onClick={() => move(1)}>Continue with {template.name}<ArrowRight size={16} aria-hidden="true" /></Button>}
    {step === 1 && <Button type="button" onClick={() => formRef.current?.requestSubmit()}>Review draft<ArrowRight size={16} aria-hidden="true" /></Button>}
    {step === 2 && <form action={action} className={styles.submitForm}>{Object.entries(values).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}<Button type="submit" disabled={pending || Boolean(state.id)}>{pending ? "Creating draft…" : state.id ? "Opening editor…" : "Create private draft"}<ArrowRight size={16} aria-hidden="true" /></Button></form>}
  </footer>;
}

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

  useEffect(() => {
    let restored;
    try { restored = JSON.parse(sessionStorage.getItem(storageKey)); } catch { setStorageUnavailable(true); }
    const valid = restored && templates.some((item) => item.id === restored.templateId) &&
      ["name", "description", "publicSlug", "creationKey"].every((key) => typeof restored[key] === "string") &&
      /^[0-9a-f-]{36}$/i.test(restored.creationKey);
    setValues(valid ? Object.fromEntries(Object.keys(empty).map((key) => [key, restored[key]])) : { ...empty, creationKey: crypto.randomUUID() });
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
    router.push(`/wait-lists/${state.id}/edit`);
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
    <Link href="/wait-lists" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> All waitlists</Link>
    <header className={styles.header}>
      <p className={styles.eyebrow}>New waitlist <span aria-hidden="true">/</span> {workspaceName}</p>
      <h1>Create a waitlist</h1>
      <p>Start with a page that fits your launch. You can edit every section before you publish.</p>
    </header>

    <ol className={styles.progress} aria-label="Creation steps">
      {steps.map((label, index) => <li className={styles.progressStep} aria-current={step === index ? "step" : undefined} data-current={step === index || undefined} data-complete={step > index || undefined} key={label}>
        <span className={styles.progressNumber}>{step > index ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
        <span>{label}</span>
        {index < steps.length - 1 && <span className={styles.progressLine} aria-hidden="true" />}
      </li>)}
    </ol>

    <section className={styles.stepHeader} aria-labelledby="step-title">
      <div><p className={styles.stepEyebrow}>Step {step + 1} of {steps.length}</p><h2 ref={headingRef} id="step-title" tabIndex={-1}>{steps[step]}</h2></div>
      <p>{stepDescriptions[step]}</p>
    </section>

    {!ready ? <div className={styles.loading} role="status">Restoring your setup…</div> : <>
      {storageUnavailable && <p className={styles.storageNotice} role="status">This browser can’t save your progress between reloads. Keep this tab open while you create your draft.</p>}

      <CreationStepContent step={step} templates={templates} values={values} setValues={setValues} template={template} hero={hero} formRef={formRef} continueFromDetails={continueFromDetails} changeName={changeName} state={state} setSlugEdited={setSlugEdited} workspaceName={workspaceName} move={move} />
      <CreationActions step={step} move={move} pending={pending} state={state} template={template} formRef={formRef} action={action} values={values} />
    </>}
  </div>;
}
