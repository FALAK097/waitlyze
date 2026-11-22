"use client";

import dynamic from "next/dynamic";
import { create } from "zustand";

const AuthModal = dynamic(() => import("./auth-modal").then((m) => m.AuthModal), { ssr: false });

function sanitizeCallbackUrl(value) {
  if (typeof value !== "string") return "/waitlists";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/waitlists";
  return trimmed;
}

// The modal is shared by landing, pricing, and Launch Lab tool buttons. Keep its
// state outside the page tree so opening it only updates the modal host.
const useAuthModalStore = create((set) => ({
  open: false,
  hasOpened: false,
  returnFocus: null,
  callbackURL: "/waitlists",
  heading: null,
  description: null,
  openAuthModal: (options) => {
    const isOptionsObj = options && typeof options === "object" && !("nativeEvent" in options);
    set({
      open: true,
      hasOpened: true,
      returnFocus: document.activeElement,
      callbackURL: isOptionsObj ? sanitizeCallbackUrl(options.callbackURL) : "/waitlists",
      heading: isOptionsObj && typeof options.heading === "string" ? options.heading : null,
      description:
        isOptionsObj && typeof options.description === "string" ? options.description : null,
    });
  },
  setOpen: (open) => set({ open }),
}));

export function AuthModalProvider({ children }) {
  const open = useAuthModalStore((state) => state.open);
  const hasOpened = useAuthModalStore((state) => state.hasOpened);
  const callbackURL = useAuthModalStore((state) => state.callbackURL);
  const heading = useAuthModalStore((state) => state.heading);
  const description = useAuthModalStore((state) => state.description);
  const returnFocus = useAuthModalStore((state) => state.returnFocus);
  const setOpen = useAuthModalStore((state) => state.setOpen);

  return (
    <>
      {children}
      {hasOpened && (
        <AuthModal
          open={open}
          triggerElement={returnFocus}
          onOpenChange={setOpen}
          callbackURL={callbackURL}
          heading={heading}
          description={description}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = useAuthModalStore.getState().returnFocus;
            if (trigger?.isConnected) trigger.focus();
          }}
        />
      )}
    </>
  );
}

export function useOpenAuthModal() {
  return useAuthModalStore((state) => state.openAuthModal);
}
