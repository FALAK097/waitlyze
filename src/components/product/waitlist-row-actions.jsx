"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteWaitlist } from "@/app/actions/delete-waitlist";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WaitlistRowActions({ id, name }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const displayName = name || "Untitled waitlist";
  async function remove(event) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await deleteWaitlist(id, confirmation);
      if (result.error) {
        toast.error(result.error);
        setPending(false);
        return;
      }
      toast.success("Waitlist deleted.");
      setConfirmOpen(false);
      setConfirmation("");
      router.refresh();
    } catch {
      toast.error("Could not delete this waitlist. Try again.");
      setPending(false);
    }
  }
  return (
    <>
      <Button
        type="button"
        variant="ghost-destructive"
        size="icon-sm"
        aria-label={`Delete ${displayName}`}
        onClick={() => {
          setConfirmation("");
          setConfirmOpen(true);
        }}
      >
        <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
      </Button>
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!pending) {
            setConfirmOpen(open);
            setConfirmation("");
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Delete {displayName}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the waitlist, subscribers and analytics. This cannot be undone.
          </DialogDescription>
          <form onSubmit={remove} className="product-form">
            <div className="product-field">
              <Label htmlFor={`delete-confirm-${id}`}>
                Type &ldquo;{displayName}&rdquo; to confirm
              </Label>
              <Input
                id={`delete-confirm-${id}`}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={pending}
                autoComplete="off"
              />
            </div>
            <div className="product-actions">
              <DialogClose render={<Button variant="outline" />} disabled={pending}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                disabled={pending || confirmation !== displayName}
              >
                {pending ? "Deleting…" : "Permanently delete"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
