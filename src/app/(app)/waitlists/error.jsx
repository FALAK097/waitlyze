"use client";

import { StatusPage } from "@/components/product/status-page";

export default function WaitlistsError({ reset }) {
  return (
    <StatusPage
      code="500"
      title="Waitlists couldn’t load"
      description="Try loading your waitlists again."
      retry={reset}
      href="/waitlists"
      linkLabel="Back to waitlists"
    />
  );
}
