"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { leaveWorkspace } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function LeaveWorkspace({ workspaceId, workspaceName }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(leaveWorkspace, null);
  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);
  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-product-border-subtle pt-7">
      <div className="grid min-w-0 gap-1">
        <p className="m-0">
          <strong className="text-base">Leave this workspace?</strong>
        </p>
        <p className="m-0 text-product-text-secondary">
          You’ll lose access to {workspaceName} and its waitlists until you’re invited again.
        </p>
      </div>
      <Button type="button" variant="outline-destructive" onClick={() => setOpen(true)}>
        Leave workspace
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <DialogContent>
          <DialogTitle>Leave {workspaceName}?</DialogTitle>
          <DialogDescription>
            You’ll lose access to this workspace immediately. An owner or admin can invite you back.
          </DialogDescription>
          <form action={action} className="product-form">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <div className="product-actions">
              <DialogClose render={<Button variant="outline" />} disabled={pending}>
                Cancel
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Leaving…" : "Leave workspace"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
