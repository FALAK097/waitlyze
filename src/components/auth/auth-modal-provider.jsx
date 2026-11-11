"use client";

import dynamic from "next/dynamic";
import { create } from "zustand";

const AuthModal = dynamic(() => import("./auth-modal").then((m) => m.AuthModal), { ssr: false });

// The modal is shared by landing and pricing buttons. Keep its state outside the
// page tree so opening it only updates the modal host, not every consumer.
const useAuthModalStore = create((set) => ({
  open: false,
  hasOpened: false,
  returnFocus: null,
  openAuthModal: () => set({ open: true, hasOpened: true, returnFocus: document.activeElement }),
  setOpen: (open) => set({ open }),
}));

export function AuthModalProvider({ children }) {
  const open = useAuthModalStore((state) => state.open);
  const hasOpened = useAuthModalStore((state) => state.hasOpened);
  const setOpen = useAuthModalStore((state) => state.setOpen);

  return (
    <>
      {children}
      {hasOpened && (
        <AuthModal
          open={open}
          onOpenChange={setOpen}
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
