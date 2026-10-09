"use client";

import { SettingsLoadError } from "@/components/product/settings-load-error";

export default function SettingsError({ reset }) {
  return <SettingsLoadError retry={reset} />;
}
