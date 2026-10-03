"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";
import { Input } from "./input";
import { saveProfile, saveWorkspaceName, selectWorkspace } from "@/app/actions/settings";

function SubmitButton({ children, pendingLabel, disabled = false }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending || disabled}>{pending ? pendingLabel : children}</Button>;
}
export function ProfileForm({ name }) {
  const [state, action] = useActionState(saveProfile, {});
  const [value, setValue] = useState(name || "");
  return <form action={action} className="product-settings-form">
    <label htmlFor="profile-name">Display name</label><Input id="profile-name" name="name" value={value} onChange={(event) => setValue(event.target.value)} aria-invalid={!!state.error} required maxLength={80} autoComplete="name" aria-describedby="profile-name-help" />
    <p id="profile-name-help" className="product-help">Used to identify you in your workspace.</p>
    <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
    <p role={state.error ? "alert" : "status"}>{state.error || state.success}</p>
  </form>;
}
export function WorkspacePicker({ workspaces, selected }) {
  if (workspaces.length < 2) return null;
  return <form action={selectWorkspace} className="product-workspace-picker"><label htmlFor="workspace-id">Workspace</label><select id="workspace-id" name="workspaceId" defaultValue={selected}>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select><SubmitButton pendingLabel="Switching…">Switch</SubmitButton></form>;
}

export function WorkspaceNameForm({ workspaceId, name, canManage }) {
  const [state, action] = useActionState(saveWorkspaceName, {});
  const [value, setValue] = useState(name || "");
  const savedName = state.savedName ?? name ?? "";
  const unchanged = value.trim() === savedName.trim();
  if (!canManage) {
    return <>
      <dl><dt>Workspace name</dt><dd>{name}</dd></dl>
      <p className="product-help">Only workspace owners and admins can change this name.</p>
    </>;
  }
  return <form action={action} className="product-settings-form">
    <input type="hidden" name="workspaceId" value={workspaceId} />
    <label htmlFor="workspace-name">Workspace name</label>
    <Input id="workspace-name" name="name" value={value} onChange={(event) => setValue(event.target.value)} aria-invalid={!!state.error} required maxLength={80} autoComplete="organization" aria-describedby="workspace-name-help" />
    <p id="workspace-name-help" className="product-help">Shown in your workspace switcher. Up to 80 characters.</p>
    <SubmitButton disabled={unchanged} pendingLabel="Saving…">Save workspace</SubmitButton>
    <p role={state.error ? "alert" : "status"} aria-live={state.error ? "assertive" : "polite"}>{state.error || state.success}</p>
  </form>;
}
