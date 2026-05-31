"use client";

import dynamic from "next/dynamic";
import { createContext, useContext, useState, useCallback } from "react";

const AuthModal = dynamic(() => import("./auth-modal"), { ssr: false });

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openAuthModal = useCallback(() => setOpen(true), []);
  const closeAuthModal = useCallback(() => setOpen(false), []);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isAuthModalOpen: open }}>
      {children}
      <AuthModal open={open} onOpenChange={setOpen} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}
