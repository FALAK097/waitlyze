"use client";

import dynamic from "next/dynamic";
import { createContext, use, useCallback, useMemo, useState } from "react";

const AuthModal = dynamic(() => import("./auth-modal").then((m) => m.AuthModal), { ssr: false });

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openAuthModal = useCallback(() => setOpen(true), []);
  const closeAuthModal = useCallback(() => setOpen(false), []);

  const ctxValue = useMemo(() => ({ openAuthModal, closeAuthModal, isAuthModalOpen: open }), [openAuthModal, closeAuthModal, open]);

  return (
    <AuthModalContext.Provider value={ctxValue}>
      {children}
      <AuthModal open={open} onOpenChange={setOpen} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = use(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}
