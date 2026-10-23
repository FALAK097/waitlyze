"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  pendingLabel,
  variant = "destructive",
  onConfirm,
}) {
  const [pending, setPending] = useState(false);

  function changeOpen(next) {
    if (pending && next) return;
    onOpenChange(next);
    if (!next) setPending(false);
  }

  async function confirm() {
    try {
      setPending(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="product-actions">
          <DialogClose render={<Button variant="outline" />} disabled={pending}>
            {cancelLabel}
          </DialogClose>
          <Button variant={variant} onClick={confirm} disabled={pending}>
            {pending && pendingLabel ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
