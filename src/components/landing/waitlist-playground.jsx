"use client";

import { useState } from "react";

export default function WaitlistPlayground({ form }) {
  const [submitted, setSubmitted] = useState(false);

  function submitPreview(event) {
    event.preventDefault();
    event.currentTarget.reset();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="grid gap-3 text-wl-text">
        <output className="font-wl-heading text-xl font-bold">This was just a preview.</output>
        <p className="text-sm text-wl-muted">No email was collected, stored, or sent.</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="min-h-11 w-fit font-semibold text-wl-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-text"
        >
          Try the form again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submitPreview} aria-label="Demo waitlist form" className="grid gap-3">
      <label htmlFor="demo-waitlist-email" className="text-caption font-bold text-wl-text">
        {form.label}
      </label>
      <div className="flex gap-2 max-sm:flex-col">
        <input
          id="demo-waitlist-email"
          type="email"
          required
          placeholder={form.placeholder}
          autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-wl border border-wl-input-border bg-wl-input px-4 text-wl-text placeholder:text-wl-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-text"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-wl bg-wl-button px-5 font-bold text-wl-button-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-text"
        >
          {form.buttonText}
        </button>
      </div>
      <p className="text-xs text-wl-muted">Demo only · No email is collected, stored, or sent.</p>
    </form>
  );
}
