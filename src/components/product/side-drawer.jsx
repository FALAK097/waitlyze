"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "./button";
import "./side-drawer.css";

export function SideDrawer({ open, onOpenChange, title, description, children, trigger }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    {trigger && <Dialog.Trigger render={trigger} />}
    <Dialog.Portal>
      <div className="product-ui product-drawer-scope">
        <Dialog.Backdrop className="product-drawer-backdrop" />
        <Dialog.Popup className="product-drawer" initialFocus={true}>
          <header className="product-drawer-heading">
            <div><Dialog.Title>{title}</Dialog.Title>{description && <Dialog.Description>{description}</Dialog.Description>}</div>
            <Dialog.Close render={<Button variant="ghost" size="icon" static />} aria-label="Close panel"><X size={18} aria-hidden="true" /></Dialog.Close>
          </header>
          <div className="product-drawer-body">{children}</div>
        </Dialog.Popup>
      </div>
    </Dialog.Portal>
  </Dialog.Root>;
}
