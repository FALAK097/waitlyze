"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/product/button";

export function SettingsLoadError({ retry, title = "Settings couldn’t load", message = "Your settings are unchanged. Try loading them again." }) {
  const router = useRouter();
  const titleId = useId();
  return <section className="product-empty" role="alert" aria-labelledby={titleId}>
    <h2 id={titleId}>{title}</h2>
    <p>{message}</p>
    <Button className="mt-4" variant="outline" onClick={retry || (() => router.refresh())}>Try again</Button>
  </section>;
}
