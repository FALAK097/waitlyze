"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { deleteWorkspace } from "@/app/actions/settings";

export function DeleteWorkspace({ workspaceId, workspaceName, isPersonal }) {
  const [state, action, pending] = useActionState(deleteWorkspace, null);
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => {
    if (state?.error) toast.add({ title: state.error, type: "error" });
  }, [state]);
  if (isPersonal) {
    return <div className="product-danger-zone">
      <div><h3>Delete workspace</h3><p>The personal workspace cannot be deleted. It holds your unassigned waitlists and is recreated automatically.</p></div>
    </div>;
  }
  return <div className="product-danger-zone">
    <div><h3>Delete workspace</h3><p>If you no longer wish to use this workspace, delete it along with its waitlists, subscribers, and settings.</p><p>This decision is permanent and can&rsquo;t be undone.</p></div>
    <form action={action} className="product-danger-form">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="product-field">
        <Label htmlFor="delete-workspace-confirmation">Type &ldquo;{workspaceName}&rdquo; to confirm</Label>
        <Input id="delete-workspace-confirmation" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} autoComplete="off" aria-invalid={!!state?.error} aria-describedby={state?.error ? "delete-workspace-error" : undefined} />
      </div>
      {state?.error && <p id="delete-workspace-error" role="alert" className="product-field-error">{state.error}</p>}
      <div className="product-actions">
        <Button type="submit" variant="destructive" disabled={pending || confirmation.trim() !== workspaceName}>{pending ? "Deleting…" : "Delete workspace"}</Button>
      </div>
    </form>
  </div>;
}
