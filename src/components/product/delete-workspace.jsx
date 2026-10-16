"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { deleteWorkspace } from "@/app/actions/settings";

export function DeleteWorkspace({ workspaceId, workspaceName, isPersonal }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteWorkspace, null);
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);
  function changeOpen(next) {
    if (pending) return;
    setOpen(next);
    if (!next) setConfirmation("");
  }
  if (isPersonal) {
    return <p className="product-help">The personal workspace cannot be deleted. It holds your unassigned waitlists and is recreated automatically.</p>;
  }
  return <div className="product-danger-inline">
    <div><p><strong>If you no longer wish to use this workspace.</strong></p><p>This decision is permanent and can&rsquo;t be undone.</p></div>
    <Button type="button" variant="outline-destructive" onClick={() => changeOpen(true)}>Delete workspace</Button>
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogTitle>Delete {workspaceName}?</DialogTitle>
        <DialogDescription>This permanently deletes the workspace, its waitlists, subscribers and settings. This cannot be undone.</DialogDescription>
        <form action={action} className="product-form">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="product-field">
            <Label htmlFor="delete-workspace-confirmation">Type &ldquo;{workspaceName}&rdquo; to confirm</Label>
            <Input id="delete-workspace-confirmation" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} autoComplete="off" aria-invalid={!!state?.error} />
          </div>
          <div className="product-actions">
            <DialogClose render={<Button variant="outline" />} disabled={pending}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending || confirmation.trim() !== workspaceName}>{pending ? "Deleting…" : "Delete workspace"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
