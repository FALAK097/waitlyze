"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteWaitlist } from "@/app/actions/delete-waitlist";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteWaitlist({ id, name }) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  function changeOpen(next) {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setConfirmation("");
      setError("");
    }
  }
  async function remove(event) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await deleteWaitlist(id, confirmation.trim());
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        setPending(false);
        return;
      }
      toast.success("Waitlist deleted.");
      setOpen(false);
      router.replace("/waitlists");
      router.refresh();
    } catch {
      setError("Could not delete this waitlist. Try again.");
      toast.error("Could not delete this waitlist. Try again.");
      setPending(false);
    }
  }
  return (
    <div className="product-danger-inline">
      <div>
        <p>
          <strong>If you no longer wish to use this waitlist.</strong>
        </p>
        <p>
          Export any subscriber data you want to keep first. This decision is permanent and
          can&rsquo;t be undone.
        </p>
      </div>
      <Button type="button" variant="outline-destructive" onClick={() => changeOpen(true)}>
        Delete waitlist
      </Button>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the waitlist, subscribers and analytics. This cannot be undone.
          </DialogDescription>
          <form onSubmit={remove} className="product-form">
            <div className="product-field">
              <Label htmlFor="delete-confirmation">Type &ldquo;{name}&rdquo; to confirm</Label>
              <Input
                id="delete-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={pending}
                autoComplete="off"
                aria-invalid={!!error}
              />
            </div>
            <div className="product-actions">
              <DialogClose render={<Button variant="outline" />} disabled={pending}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                disabled={pending || confirmation.trim() !== name}
              >
                {pending ? "Deleting…" : "Delete waitlist"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
