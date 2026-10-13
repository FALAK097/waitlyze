"use client";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { saveProfile, saveWorkspaceName } from "@/app/actions/settings";

function SubmitButton({ children, pendingLabel, disabled = false }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending || disabled}>{pending ? pendingLabel : children}</Button>;
}
export function ProfileForm({ name }) {
  const [state, action] = useActionState(saveProfile, {});
  useEffect(() => {
    if (state?.error) toast.add({ title: state.error, type: "error" });
    else if (typeof state?.success === "string") toast.add({ title: state.success, type: "success" });
  }, [state]);
  const [value, setValue] = useState(name || "");
  const savedName = state.savedName ?? name ?? "";
  const unchanged = value.trim() === savedName.trim();
  return <form action={action} className="product-settings-form">
    <label htmlFor="profile-name">Display name</label><Input id="profile-name" name="name" value={value} onChange={(event) => setValue(event.target.value)} aria-invalid={!!state.error} required maxLength={80} autoComplete="name" aria-describedby={state.error ? "profile-name-help profile-name-error" : "profile-name-help"} />
    <p id="profile-name-help" className="product-help">Used to identify you in your workspace.</p>
    <SubmitButton disabled={unchanged} pendingLabel="Saving…">Save profile</SubmitButton>
    {state.error && <p id="profile-name-error" role="alert" aria-live="assertive">{state.error}</p>}

  </form>;
}

export function WorkspaceNameForm({ workspaceId, name, canManage }) {
  const [state, action] = useActionState(saveWorkspaceName, {});
  useEffect(() => {
    if (state?.error) toast.add({ title: state.error, type: "error" });
    else if (typeof state?.success === "string") toast.add({ title: state.success, type: "success" });
  }, [state]);
  const [value, setValue] = useState(name || "");
  const savedName = state.savedName ?? name ?? "";
  const unchanged = value.trim() === savedName.trim();
  if (!canManage) {
    return <><dl><dt>Workspace name</dt><dd>{name}</dd></dl><p className="product-help">Only workspace owners and admins can rename this workspace.</p></>;
  }
  return <form action={action} className="product-settings-form">
    <input type="hidden" name="workspaceId" value={workspaceId} />
    <label htmlFor="workspace-name">Workspace name</label>
    <Input id="workspace-name" name="name" value={value} onChange={(event) => setValue(event.target.value)} aria-invalid={!!state.error} required maxLength={80} autoComplete="organization" aria-describedby={state.error ? "workspace-name-help workspace-name-error" : "workspace-name-help"} />
    <p id="workspace-name-help" className="product-help">Shown in your workspace switcher. Up to 80 characters.</p>
    <SubmitButton disabled={unchanged} pendingLabel="Saving…">Save workspace</SubmitButton>
    {state.error && <p id="workspace-name-error" role="alert" aria-live="assertive">{state.error}</p>}
  </form>;
}

