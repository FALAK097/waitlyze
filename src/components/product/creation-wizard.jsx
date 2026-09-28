"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Input } from "./input";

const empty = { templateId: "saas", name: "", description: "", publicSlug: "", creationKey: "" };
const steps = ["Choose a starter", "Add details", "Create your draft"];

export function CreationWizard({ templates, workspaceId, workspaceName, submitDraft }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitDraft, {});
  const [values, setValues] = useState(empty);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const heading = useRef(null);
  const details = useRef(null);
  const storageKey = `waitlyze:create:${workspaceId}`;
  const template = templates.find((item) => item.id === values.templateId) || templates[0];

  useEffect(() => {
    let restored;
    try { restored = JSON.parse(sessionStorage.getItem(storageKey)); } catch { setStorageUnavailable(true); }
    const safe = restored && templates.some((item) => item.id === restored.templateId) &&
      ["name", "description", "publicSlug", "creationKey"].every((key) => typeof restored[key] === "string") &&
      /^[0-9a-f-]{36}$/i.test(restored.creationKey);
    setValues(safe ? Object.fromEntries(Object.keys(empty).map((key) => [key, restored[key]])) : { ...empty, creationKey: crypto.randomUUID() });
    setReady(true);
  }, [storageKey, templates]);

  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(values)); } catch { setStorageUnavailable(true); }
  }, [values, ready, storageKey]);

  useEffect(() => {
    if (!state.id) return;
    try { sessionStorage.removeItem(storageKey); } catch { /* Creation succeeded; storage is optional. */ }
    router.push(`/wait-lists/${state.id}/edit`);
  }, [state.id, storageKey, router]);

  function move(next) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function change(key, value) { setValues((previous) => ({ ...previous, [key]: value })); }
  function next() {
    if (step === 1 && !details.current.reportValidity()) return;
    move(step + 1);
  }
  const hero = template.snapshot.sections[0];

  return <section className="product-create">
    <Link href="/wait-lists" className="product-back-link">← Back to waitlists</Link>
    <h1 className="product-page-title">New waitlist</h1>
    <ol className="product-create-steps" aria-label="Creation progress">{steps.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined}><span aria-hidden="true">{index + 1}</span>{label}</li>)}</ol>
    <h2 ref={heading} tabIndex={-1} className="product-create-heading">{steps[step]}</h2>
    <p className="product-help">{step === 0 ? "Start with a useful layout. Make it yours in the page editor." : step === 1 ? `Creating in ${workspaceName}. Your address is reserved when you create the draft.` : "Your waitlist starts private. Review and publish it when you're ready."}</p>
    {!ready ? <p role="status">Loading your details…</p> : <>
      {storageUnavailable && <p className="product-help" role="status">Details are kept while this page is open. This browser cannot restore them after a reload.</p>}
      {step === 0 && <div className="product-template-layout"><fieldset className="product-template-choices"><legend className="product-visually-hidden">Starter template</legend>{templates.map((item) => <label key={item.id} className="product-template-choice"><input type="radio" name="starter" value={item.id} checked={values.templateId === item.id} onChange={() => change("templateId", item.id)} /><span><strong>{item.name}</strong><span>{item.description}</span></span></label>)}</fieldset><section className="product-template-preview" aria-label={`${template.name} starter preview`}><p className="product-help">Starter preview · editable placeholder copy</p><h3>{hero.heading}</h3><p>{hero.body}</p>{template.snapshot.sections.slice(1).map((section, index) => <div key={`${section.type}-${index}`}>{section.type === "features" && section.items.map((item) => <p key={item.title}><strong>{item.title}</strong><br />{item.body}</p>)}{section.type === "form" && <div className="product-template-form" aria-label="Signup form preview"><span>{section.label}</span><span className="product-template-email">you@example.com</span><span className="product-template-submit">{section.buttonText}</span></div>}{section.type === "faq" && section.items.map((item) => <p key={item.question}><strong>{item.question}</strong><br />{item.answer}</p>)}{section.type === "footer" && <p>{section.note}</p>}</div>)}</section></div>}
      {step === 1 && <form ref={details} className="product-create-details" onSubmit={(event) => { event.preventDefault(); next(); }}>
        <label htmlFor="waitlist-name">Waitlist name</label><Input id="waitlist-name" required maxLength={120} value={values.name} onChange={(event) => change("name", event.target.value)} autoComplete="off" />
        <label htmlFor="waitlist-description">Description <span className="product-help">(optional)</span></label><textarea id="waitlist-description" maxLength={600} value={values.description} onChange={(event) => change("description", event.target.value)} rows={3} />
        <label htmlFor="waitlist-address">Page address</label><Input id="waitlist-address" required minLength={3} maxLength={64} pattern="[a-z0-9]+(-[a-z0-9]+)*" aria-describedby="address-help" value={values.publicSlug} onChange={(event) => change("publicSlug", event.target.value)} autoCapitalize="none" spellCheck={false} autoComplete="off" /><p id="address-help" className="product-help">3–64 lowercase letters, numbers or hyphens. This address stays private until publication.</p>
        <Button type="submit">Review draft</Button>
      </form>}
      {step === 2 && <form action={action} className="product-create-review">
        {Object.entries(values).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
        <dl><dt>Name</dt><dd>{values.name}</dd><dt>Starter</dt><dd>{template.name}</dd><dt>Address</dt><dd>{values.publicSlug}</dd><dt>Workspace</dt><dd>{workspaceName}</dd></dl>
        <p className="product-help">Referrals, email verification and signup emails start off. Your starter contains placeholder copy for you to edit.</p>
        {state.message && <div role="alert"><p>{state.message}</p>{state.fields?.publicSlug && <p>Go back to details to change the page address.</p>}</div>}
        <Button type="submit" disabled={pending || !!state.id}>{pending ? "Creating draft…" : state.id ? "Opening draft…" : "Create draft"}</Button>
      </form>}
      <div className="product-create-actions">{step > 0 && <Button variant="outline" type="button" disabled={pending || !!state.id} onClick={() => move(step - 1)}>Back</Button>}{step === 0 && <Button type="button" onClick={next}>Continue with {template.name}</Button>}</div>
    </>}
  </section>;
}
