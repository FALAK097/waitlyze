"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";

const AuthModal = dynamic(
  () => import("./auth-modal").then((m) => m.AuthModal),
  { ssr: false },
);

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const openAuthModal = useCallback(() => {
    triggerRef.current = document.activeElement;
    setOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ openAuthModal, closeAuthModal, isAuthModalOpen: open }),
    [openAuthModal, closeAuthModal, open],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        open={open}
        onOpenChange={setOpen}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (triggerRef.current?.isConnected) triggerRef.current.focus();
        }}
      />
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
