"use client";

import { Toaster as Sonner } from "sonner";

// Sonner hides an icon only when its entry is explicitly null.
const noIcons = { success: null, info: null, warning: null, error: null, loading: null };

const style = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "1rem",
};

function Toaster(props) {
  return <Sonner theme="light" position="bottom-right" icons={noIcons} style={style} {...props} />;
}

export { Toaster };
