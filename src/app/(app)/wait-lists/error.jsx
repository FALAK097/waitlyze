"use client";

import { StatusPage } from "@/components/product/status-page";

export default function WaitlistsError({ retry }) {
  return <StatusPage code="500" title="Waitlists couldn’t load" description="Try loading your waitlists again." retry={retry} href="/wait-lists" linkLabel="Back to waitlists" />;
}
