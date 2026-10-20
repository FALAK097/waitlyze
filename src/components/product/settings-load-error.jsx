"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";

import { Button } from "@/components/ui/button";

export function SettingsLoadError({
  retry,
  title = "Settings couldn’t load",
  message = "Your settings are unchanged. Try loading them again.",
}) {
  const router = useRouter();
  const titleId = useId();
  return (
    <section
      className="rounded-xl border border-product-border-subtle bg-product-bg-surface px-6 py-16 text-center"
      role="alert"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="mb-2! text-xl">
        {title}
      </h2>
      <p className="text-sm text-product-text-secondary">{message}</p>
      <div className="mt-5">
        <Button variant="outline" onClick={retry || (() => router.refresh())}>
          Try again
        </Button>
      </div>
    </section>
  );
}
