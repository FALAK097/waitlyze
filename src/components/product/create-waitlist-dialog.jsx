"use client";

import { Add01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { checkWaitlistSlug, createWaitlistDraft } from "@/app/actions/waitLists";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listTemplates } from "@/lib/templates/catalog.mjs";
import { isTemplateId } from "@/lib/templates/gallery.mjs";

const templateOptions = listTemplates();

function normalizeSlugInput(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 48);
}

function slugify(value) {
  return normalizeSlugInput(value).replace(/-+$/, "");
}

export function CreateWaitlistDialog({
  initialOpen = false,
  first = false,
  initialTemplateId = "simple",
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [templateId, setTemplateId] = useState(
    isTemplateId(initialTemplateId) ? initialTemplateId : "simple",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [slugStatus, setSlugStatus] = useState({ state: "idle", message: "" });
  const [creationKey, setCreationKey] = useState(() => crypto.randomUUID());
  const suggestedSlug = useMemo(() => slugify(name), [name]);
  const currentSlug = slugTouched ? slug : suggestedSlug;
  const slugHint =
    name.trim() && slugify(currentSlug).length < 3
      ? "Enter a page address with at least 3 letters or numbers. Your waitlist name can stay as it is."
      : "";

  useEffect(() => {
    const publicSlug = slugify(currentSlug);
    if (publicSlug.length < 3) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkWaitlistSlug(publicSlug);
        if (active)
          setSlugStatus({
            state: result.available ? "available" : "taken",
            message: result.message,
          });
      } catch {
        if (active) setSlugStatus({ state: "idle", message: "Availability could not be checked." });
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [currentSlug]);

  async function submit(event) {
    event.preventDefault();
    const publicSlug = slugify(currentSlug);
    if (busy || !name.trim() || publicSlug.length < 3) return;
    setBusy(true);
    setError("");
    try {
      const result = await createWaitlistDraft({
        name: name.trim(),
        publicSlug,
        creationKey,
        templateId,
      });
      if (result?.ok) {
        setCreationKey(crypto.randomUUID());
        router.push(`/waitlists/${result.id}`);
        return;
      }
      setError(result?.message || "We couldn't create the waitlist. Try again.");
      if (result?.field === "publicSlug")
        setSlugStatus({ state: "taken", message: result.message });
    } catch {
      setError("We couldn't create the waitlist. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function changeOpen(next) {
    if (busy) return;
    setOpen(next);
    if (!next) {
      setCreationKey(crypto.randomUUID());
      setError("");
    }
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
                autoComplete="off"
                maxLength={120}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugTouched)
                    setSlugStatus({ state: "checking", message: "Checking availability…" });
                }}
                placeholder="Atlas early access"
                required
                disabled={busy}
              />
            </div>
            <div className="grid gap-2 [&_label]:text-caption [&_label]:font-semibold">
              <Label htmlFor="new-waitlist-slug">Page address</Label>
              <div className="flex min-h-11 items-center overflow-hidden rounded-lg bg-product-bg-inset pl-3 text-caption text-product-text-secondary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-product-focus [&_input]:h-11 [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:pl-0.5 [&_input]:shadow-none [&_input]:outline-none">
                <span className="shrink text-xs sm:shrink-0 sm:text-caption">
                  waitlyze.falakgala.dev/w/
                </span>
                <Input
                  id="new-waitlist-slug"
                  autoComplete="off"
                  maxLength={48}
                  value={currentSlug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    const nextSlug = normalizeSlugInput(event.target.value);
                    setSlug(nextSlug);
                    setSlugStatus(
                      slugify(nextSlug).length >= 3
                        ? { state: "checking", message: "Checking availability…" }
                        : { state: "idle", message: "" },
                    );
                  }}
                  placeholder="atlas"
                  required
                  disabled={busy}
                  aria-describedby={
                    error
                      ? "new-waitlist-error"
                      : slugHint
                        ? "new-waitlist-slug-hint"
                        : slugStatus.message
                          ? "new-waitlist-slug-status"
                          : undefined
                  }
                  aria-invalid={!!error || slugStatus.state === "taken"}
                />
              </div>
              {slugHint && (
                <p id="new-waitlist-slug-hint" className="text-caption text-product-text-secondary">
                  {slugHint}
                </p>
              )}
              {!slugHint && slugStatus.message && (
                <p
                  id="new-waitlist-slug-status"
                  className={
                    slugStatus.state === "available"
                      ? "text-caption text-product-success-text"
                      : slugStatus.state === "taken"
                        ? "text-caption text-product-danger-text"
                        : "text-caption text-product-text-secondary"
                  }
                  aria-live="polite"
                >
                  {slugStatus.message}
                </p>
              )}
            </div>
            <div className="grid gap-2 [&_label]:text-caption [&_label]:font-semibold">
              <Label htmlFor="new-waitlist-template">Template</Label>
              <Select
                value={templateId}
                onValueChange={(value) => {
                  if (isTemplateId(value)) setTemplateId(value);
                }}
                disabled={busy}
              >
                <SelectTrigger id="new-waitlist-template" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {templateOptions.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-caption text-product-text-secondary">
                The new page starts from this template.{" "}
                <a
                  href="/templates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  Browse the gallery
                </a>
                .
              </p>
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
                disabled={
                  busy ||
                  !name.trim() ||
                  slugify(currentSlug).length < 3 ||
                  slugStatus.state !== "available"
                }
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
