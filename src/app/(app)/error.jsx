"use client";
import { StatusPage } from "@/components/product/status-page";
export default function ProductError({ reset }) {
  return (
    <StatusPage
      code="500"
      title="Unable to load this page"
      description="Try loading the page again, or return to your waitlists."
      href="/waitlists"
      linkLabel="Back to waitlists"
      retry={reset}
    />
  );
}
