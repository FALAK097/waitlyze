"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// Adapted from shadcn base-nova/dialog, preserving Base UI focus and composition.
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({ children, className, container, ...props }) {
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Backdrop className="product-backdrop" />
      <DialogPrimitive.Popup className={cn("product-ui product-dialog", className)} {...props}>
        {children}
        <div className="product-dialog-close">
          <DialogClose render={<Button variant="ghost" size="icon" static />} aria-label="Close dialog">
            <X aria-hidden="true" />
          </DialogClose>
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}
