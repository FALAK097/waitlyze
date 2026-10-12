"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { deleteWaitlist } from "@/app/actions/delete-waitlist";

export function WaitlistRowActions({ id, name }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const displayName = name || "Untitled waitlist";
  async function remove(event) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await deleteWaitlist(id, confirmation);
      if (result.error) { setError(result.error); setPending(false); return; }
      toast.add({ title: "Waitlist deleted.", type: "success" });
      setConfirmOpen(false);
      setConfirmation("");
      router.refresh();
    } catch {
      setError("Could not delete this waitlist. Try again.");
      setPending(false);
    }
  }
  return <>
    <Button type="button" variant="ghost-destructive" size="icon-sm" aria-label={`Delete ${displayName}`} onClick={() => { setConfirmation(""); setError(""); setConfirmOpen(true); }}><HugeiconsIcon icon={Delete02Icon} aria-hidden="true" /></Button>
    <Dialog open={confirmOpen} onOpenChange={(open) => { if (!pending) { setConfirmOpen(open); setConfirmation(""); setError(""); } }}>
      <DialogContent>
        <DialogTitle>Delete {displayName}?</DialogTitle>
        <DialogDescription>This permanently deletes the waitlist, subscribers and analytics. This cannot be undone.</DialogDescription>
        <form onSubmit={remove} className="product-form">
          <div className="product-field">
            <Label htmlFor={`delete-confirm-${id}`}>Type &ldquo;{displayName}&rdquo; to confirm</Label>
            <Input id={`delete-confirm-${id}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} autoComplete="off" aria-invalid={!!error} aria-describedby={error ? `delete-error-${id}` : undefined} />
            {error && <p id={`delete-error-${id}`} role="alert">{error}</p>}
          </div>
          <div className="product-actions">
            <DialogClose render={<Button variant="outline" />} disabled={pending}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending || confirmation !== displayName}>{pending ? "Deleting…" : "Permanently delete"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
