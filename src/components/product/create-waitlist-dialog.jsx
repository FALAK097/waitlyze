"use client";

import { Add01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { checkWaitlistSlug, createWaitlistDraft } from "@/app/actions/waitLists";
import { UpgradeButton } from "@/components/shared/upgrade-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { isTemplateId } from "@/lib/templates/gallery.mjs";

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
  initialBlueprint = null,
  workspaceId = null,
  canManageBilling = false,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [activeBlueprint, setActiveBlueprint] = useState(initialBlueprint);
  const [name, setName] = useState(initialBlueprint?.campaignName || "");
  const [description, setDescription] = useState(initialBlueprint?.campaignDescription || "");
  const [slug, setSlug] = useState(initialBlueprint?.suggestedSlug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialBlueprint?.suggestedSlug));
  const templateId = isTemplateId(activeBlueprint?.templateId)
    ? activeBlueprint.templateId
    : isTemplateId(initialTemplateId)
      ? initialTemplateId
      : "simple";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blueprintUnavailable, setBlueprintUnavailable] = useState(false);
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
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

  async function clearPendingBlueprintCookie() {
    try {
      await fetch("/api/tools/blueprint", { method: "DELETE" });
    } catch {
      // Best-effort cookie dismissal
    }
  }

  async function dismissBlueprint() {
    setActiveBlueprint(null);
    setBlueprintUnavailable(false);
    setError("");
    setCreationKey(crypto.randomUUID());
    await clearPendingBlueprintCookie();
  }

  async function submit(event) {
    event.preventDefault();
    const publicSlug = slugify(currentSlug);
    if (busy || !name.trim() || publicSlug.length < 3) return;
    setBusy(true);
    setError("");
    setBlueprintUnavailable(false);
    setUpgradeNeeded(false);
    try {
      const result = await createWaitlistDraft({
        name: name.trim(),
        description: description.trim(),
        publicSlug,
        creationKey,
        templateId,
        blueprintId: activeBlueprint?.id || null,
        showReferrals: activeBlueprint?.showReferrals,
      });
      if (result?.ok) {
        setCreationKey(crypto.randomUUID());
        router.push(`/waitlists/${result.id}`);
        return;
      }
      setError(result?.message || "We couldn't create the waitlist. Try again.");
      setBlueprintUnavailable(result?.code === "BLUEPRINT_UNAVAILABLE");
      setUpgradeNeeded(result?.code === "PLAN_UPGRADE_REQUIRED");
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
      if (activeBlueprint) {
        void clearPendingBlueprintCookie();
      }
      setCreationKey(crypto.randomUUID());
      setDescription("");
      setError("");
      setBlueprintUnavailable(false);
      setUpgradeNeeded(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button size="md" />}>
        <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
        {first ? "Create your first waitlist" : "New waitlist"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
        <div className="grid min-w-0 gap-6 p-2">
          <div className="[&_[data-slot=dialog-description]]:max-w-ch55 grid min-w-0 gap-1.5 pr-8 [&_[data-slot=dialog-description]]:leading-relaxed [&_[data-slot=dialog-title]]:text-xl [&_[data-slot=dialog-title]]:tracking-tight">
            <DialogTitle>
              {activeBlueprint ? "Create waitlist from Launch Lab" : "Create a waitlist"}
            </DialogTitle>
            <DialogDescription>
              {activeBlueprint
                ? `Prefilled from ${activeBlueprint.toolTitle}. Confirm your name and page address—your draft stays private until you publish.`
                : "Choose a name and page address. You can customize it before publishing."}
            </DialogDescription>
          </div>
          {activeBlueprint && (
            <div className="grid gap-2 rounded-lg border border-product-border-subtle bg-product-bg-inset p-3.5 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-caption font-semibold text-product-text-primary">
                  Blueprint from {activeBlueprint.toolTitle}
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-product-bg-surface px-2 py-0.5 font-product-mono text-micro text-product-text-secondary">
                    Template: {templateId}
                  </span>
                  <button
                    type="button"
                    onClick={dismissBlueprint}
                    disabled={busy}
                    className="text-micro font-medium text-product-text-secondary underline underline-offset-4 hover:text-product-text-primary"
                  >
                    Start blank
                  </button>
                </div>
              </div>
              {activeBlueprint.summaryBullets?.length > 0 && (
                <ul className="grid list-disc gap-1 pl-4 text-caption text-product-text-secondary">
                  {activeBlueprint.summaryBullets.slice(0, 4).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <form className="grid min-w-0 gap-5" onSubmit={submit}>
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
            <div className="grid gap-2 [&_input]:h-11 [&_input]:text-body [&_label]:text-caption [&_label]:font-semibold">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-waitlist-description">Description</Label>
                <span className="text-caption text-product-text-secondary">Optional</span>
              </div>
              <Input
                id="new-waitlist-description"
                autoComplete="off"
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A short summary for your dashboard"
                disabled={busy}
              />
            </div>
            <div className="grid gap-2 [&_label]:text-caption [&_label]:font-semibold">
              <Label htmlFor="new-waitlist-slug">Page address</Label>
              <InputGroup className="h-11">
                <InputGroupAddon className="shrink-0 whitespace-nowrap">
                  waitlyze.com/w/
                </InputGroupAddon>
                <InputGroupInput
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
                  className="min-w-0"
                />
              </InputGroup>
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
            {error && (
              <div className="-mt-1 grid gap-2" id="new-waitlist-error" role="alert">
                <p className="text-caption leading-relaxed text-product-danger-text">{error}</p>
                {blueprintUnavailable && (
                  <Button
                    type="button"
                    variant="product-outline"
                    size="sm"
                    onClick={dismissBlueprint}
                  >
                    Continue with blank draft
                  </Button>
                )}
                {upgradeNeeded && (
                  <UpgradeButton
                    label="Compare Pro plans"
                    feature="More waitlists"
                    workspaceId={workspaceId}
                    canManageBilling={canManageBilling}
                    size="md"
                    className="justify-self-stretch"
                  />
                )}
              </div>
            )}
            <div className="flex justify-end pt-2">
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
