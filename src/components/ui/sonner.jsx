"use client";

import { Toaster as Sonner } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, CheckmarkCircle02Icon, InformationCircleIcon, Loading03Icon, MultiplicationSignCircleIcon } from "@hugeicons/core-free-icons";

const icons = {
  success: <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />,
  info: <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />,
  warning: <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />,
  error: <HugeiconsIcon icon={MultiplicationSignCircleIcon} aria-hidden="true" />,
  loading: <HugeiconsIcon icon={Loading03Icon} className="animate-spin" aria-hidden="true" />,
};

const style = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "1rem",
};

function Toaster(props) {
  return <Sonner theme="light" position="bottom-right" icons={icons} style={style} closeButton {...props} />;
}

export { Toaster };
