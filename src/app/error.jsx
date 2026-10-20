"use client";
import { StatusPage } from "@/components/product/status-page";

export default function ErrorPage({ retry }) {
  return (
    <StatusPage
      standalone
      code="500"
      title="Unable to load this page"
      description="Try loading the page again, or return home to continue."
      retry={retry}
    />
  );
}
