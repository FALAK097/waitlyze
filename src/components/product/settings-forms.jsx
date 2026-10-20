"use client";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { saveProfile, saveWorkspaceName } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SubmitButton({ children, pendingLabel, disabled = false }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
export function ProfileForm({ name }) {
  const [state, action] = useActionState(saveProfile, {});
  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (typeof state?.success === "string") toast.success(state.success);
  }, [state]);
  const [value, setValue] = useState(name || "");
  const savedName = state.savedName ?? name ?? "";
  const unchanged = value.trim() === savedName.trim();
  return (
    <form action={action} className="m-0 grid max-w-120 grid-cols-1 gap-2.5">
      <label htmlFor="profile-name" className="text-sm font-medium">
        Display name
      </label>
      <Input
        id="profile-name"
        name="name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={!!state.error}
        required
        maxLength={80}
        autoComplete="name"
        aria-describedby="profile-name-help"
      />
      <p id="profile-name-help" className="m-0 text-sm leading-relaxed text-product-text-secondary">
        Used to identify you in your workspace.
      </p>
      <div className="mt-2 justify-self-start">
        <SubmitButton disabled={unchanged} pendingLabel="Saving…">
          Save profile
        </SubmitButton>
      </div>
    </form>
  );
}

export function WorkspaceNameForm({ workspaceId, name, canManage }) {
  const [state, action] = useActionState(saveWorkspaceName, {});
  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (typeof state?.success === "string") toast.success(state.success);
  }, [state]);
  const [value, setValue] = useState(name || "");
  const savedName = state.savedName ?? name ?? "";
  const unchanged = value.trim() === savedName.trim();
  if (!canManage) {
    return (
      <>
        <dl>
          <dt>Workspace name</dt>
          <dd>{name}</dd>
        </dl>
        <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
          Only workspace owners and admins can rename this workspace.
        </p>
      </>
    );
  }
  return (
    <form action={action} className="m-0 grid max-w-120 grid-cols-1 gap-2.5">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label htmlFor="workspace-name" className="text-sm font-medium">
        Workspace name
      </label>
      <Input
        id="workspace-name"
        name="name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={!!state.error}
        required
        maxLength={80}
        autoComplete="organization"
        aria-describedby="workspace-name-help"
      />
      <p
        id="workspace-name-help"
        className="m-0 text-sm leading-relaxed text-product-text-secondary"
      >
        Shown in your workspace switcher. Up to 80 characters.
      </p>
      <div className="mt-2 justify-self-start">
        <SubmitButton disabled={unchanged} pendingLabel="Saving…">
          Save workspace
        </SubmitButton>
      </div>
    </form>
  );
}
