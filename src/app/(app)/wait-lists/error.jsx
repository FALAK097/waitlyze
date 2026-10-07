"use client";

import { SettingsLoadError } from "@/components/product/settings-load-error";

export default function WaitlistsError({ reset }) {
  return <SettingsLoadError
    retry={reset}
    title="Waitlists couldn’t load"
    message="Your workspace and waitlist data are unchanged. Try loading this page again."
  />;
}
