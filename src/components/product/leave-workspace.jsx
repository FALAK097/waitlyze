"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { leaveWorkspace } from "@/app/actions/settings";

export function LeaveWorkspace({ workspaceId, workspaceName }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(leaveWorkspace, null);
  useEffect(() => {
    if (state?.error) toast.add({ title: state.error, type: "error" });
  }, [state]);
  return <div className="product-danger-inline">
    <div><p><strong>Leave this workspace?</strong></p><p>You’ll lose access to {workspaceName} and its waitlists until you’re invited again.</p></div>
    <Button type="button" variant="outline-destructive" onClick={() => setOpen(true)}>Leave workspace</Button>
    <Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next); }}>
      <DialogContent>
        <DialogTitle>Leave {workspaceName}?</DialogTitle>
        <DialogDescription>You’ll lose access to this workspace immediately. An owner or admin can invite you back.</DialogDescription>
        <form action={action} className="product-form">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          {state?.error && <p role="alert" className="product-field-error">{state.error}</p>}
          <div className="product-actions">
            <DialogClose render={<Button variant="outline" />} disabled={pending}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Leaving…" : "Leave workspace"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
