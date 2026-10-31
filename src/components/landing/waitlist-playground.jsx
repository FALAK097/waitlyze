"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WaitlistPlayground() {
  return (
    <div className="w-full max-w-2xl scroll-mt-28" id="preview">
      <div className="bg-product-bg-surface p-0">
        <div className="bg-product-bg-surface p-0 text-center text-product-text-primary">
          <div className="inline-flex items-center gap-2 font-product-display text-body font-bold tracking-tight text-product-text-primary">
            <span
              className="grid size-6 place-items-center rounded-t-lg rounded-br-sm font-serif text-sm text-product-success-text italic"
              aria-hidden="true"
            >
              w.
            </span>
            <span>weekend</span>
          </div>
          <h2 className="mx-auto mt-3 max-w-72 font-product-display text-4xl leading-tight tracking-tighter">
            Go outside.
          </h2>
          <p className="mx-auto mt-3 max-w-70 text-sm leading-relaxed text-product-text-secondary">
            A fresh way to find your next weekend escape.
          </p>
          <div className="mx-auto max-w-100 pt-6">
            <form
              noValidate
              onSubmit={(event) => event.preventDefault()}
              aria-label="Example waitlist form"
              className="grid gap-2.5"
            >
              <label className="sr-only" htmlFor="preview-example-email">
                Example email address
              </label>
              <Input
                id="preview-example-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-product-border-subtle bg-white px-3 py-2.5 text-sm text-product-text-primary placeholder:text-product-text-muted focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              />
              <Button type="submit" variant="product-accent" size="xl" className="w-full">
                Join the waitlist
              </Button>
            </form>
            <p className="mt-2.5 mb-0 text-center text-xs leading-normal text-product-text-secondary">
              Demo form · No email is collected or sent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
