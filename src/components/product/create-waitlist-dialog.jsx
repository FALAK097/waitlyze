"use client";

import { Add01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createWaitlistDraft } from "@/app/actions/waitLists";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function CreateWaitlistDialog({ initialOpen = false, first = false }) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const suggestedSlug = useMemo(() => slugify(name), [name]);
  const currentSlug = slugTouched ? slug : suggestedSlug;

  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || currentSlug.length < 3) return;
    setBusy(true);
    setError("");
    const result = await createWaitlistDraft({ name: name.trim(), publicSlug: currentSlug });
    if (result?.ok) {
      router.push(`/waitlists/${result.id}`);
      return;
    }
    setBusy(false);
    setError(result?.message || "We couldn't create the waitlist. Try again.");
  }

  function changeOpen(next) {
    if (busy) return;
    setOpen(next);
    if (!next) setError("");
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button size="default" />}>
        <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
        {first ? "Create your first waitlist" : "New waitlist"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
        <div className="grid gap-7 p-3">
          <div className="grid gap-2 pr-8 [&_[data-slot=dialog-description]]:max-w-ch65 [&_[data-slot=dialog-description]]:leading-relaxed [&_[data-slot=dialog-title]]:text-xl [&_[data-slot=dialog-title]]:tracking-tight">
            <DialogTitle>Start a waitlist</DialogTitle>
            <DialogDescription>
              Name it now. The page stays private until you publish.
            </DialogDescription>
          </div>
          <form className="grid gap-6" onSubmit={submit}>
            <div className="grid gap-2 [&_input]:h-11 [&_input]:text-body [&_label]:text-caption [&_label]:font-semibold">
              <Label htmlFor="new-waitlist-name">Waitlist name</Label>
              <Input
                id="new-waitlist-name"
                autoFocus
                autoComplete="off"
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Atlas early access"
                required
                disabled={busy}
              />
            </div>
            <div className="grid gap-2 [&_label]:text-caption [&_label]:font-semibold">
              <Label htmlFor="new-waitlist-slug">Page address</Label>
              <div className="flex min-h-11 items-center overflow-hidden rounded-lg bg-product-bg-inset pl-3 text-caption text-product-text-secondary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-product-focus [&_input]:h-11 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:pl-0.5 [&_input]:shadow-none [&_input]:outline-none">
                <span className="shrink-0">waitlyze.falakgala.dev/w/</span>
                <Input
                  id="new-waitlist-slug"
                  autoComplete="off"
                  maxLength={48}
                  value={currentSlug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(slugify(event.target.value));
                  }}
                  placeholder="atlas"
                  required
                  disabled={busy}
                  aria-describedby={error ? "new-waitlist-error" : undefined}
                  aria-invalid={!!error}
                />
              </div>
            </div>
            {error && (
              <p
                className="-mt-2 text-caption leading-relaxed text-product-danger-text"
                id="new-waitlist-error"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="flex justify-end pt-0.5">
              <Button
                type="submit"
                size="lg"
                disabled={busy || !name.trim() || currentSlug.length < 3}
              >
                {busy ? "Creating…" : "Create and open Builder"}
                {!busy && <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
