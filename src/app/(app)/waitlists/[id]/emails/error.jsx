"use client";

import { Button } from "@/components/ui/button";

const errorScope = "min-w-0 max-w-120 bg-white px-0 py-12 text-product-text-primary";
const errorTitle = "m-0 mb-2! text-section";
const errorBody = "m-0 mb-4.5! leading-relaxed text-product-text-secondary";

export default function Error({ retry }) {
  return (
    <section className={errorScope} role="alert">
      <h2 className={errorTitle}>Email tools couldn’t load</h2>
      <p className={errorBody}>
        Your saved templates and drafts are safe. Check your connection and try again.
      </p>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </section>
  );
}
