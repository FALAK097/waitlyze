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
      <div className="product-dialog-scope product-ui">
        <DialogPrimitive.Backdrop data-slot="product-dialog-backdrop" />
        <DialogPrimitive.Popup data-slot="product-dialog-popup" {...props}>
          <div className={cn("product-dialog-panel", className)}>
            {children}
            <div className="product-dialog-close">
              <DialogClose render={<Button variant="ghost" size="icon" static />} aria-label="Close dialog">
                <X aria-hidden="true" />
              </DialogClose>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </div>
    </DialogPrimitive.Portal>
  );
}
