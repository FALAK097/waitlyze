"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { submitFeedback } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const FEEDBACK_LABELS = ["Idea", "Issue", "Question", "Feature Request", "Complaint", "Other"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Feedback sheet with optional screenshot upload for signed-in Waitlyze users. */
export function FeedbackForm({ user, open, onOpenChange }) {
  const [state, action, pending] = useActionState(submitFeedback, null);
  const [label, setLabel] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [page, setPage] = useState("");
  const formRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open && typeof window !== "undefined") setPage(`${window.location.pathname}${window.location.search}`);
  }, [open]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
      setLabel("");
      setPreviewUrl("");
      if (fileRef.current) fileRef.current.value = "";
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  /** Validates and previews an image selected for the feedback submission. */
  function chooseImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a PNG, JPEG, WebP, or GIF image.");
      event.target.value = "";
      setPreviewUrl("");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Keep screenshots under 3 MB.");
      event.target.value = "";
      setPreviewUrl("");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  /** Clears the selected screenshot and its local preview. */
  function removeImage() {
    setPreviewUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  /** Keeps the sheet open while its feedback request is pending. */
  function handleOpenChange(nextOpen) {
    if (!nextOpen && pending) return;
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Send feedback</SheetTitle>
          <SheetDescription>Share an idea, report an issue, or tell us how to improve Waitlyze.</SheetDescription>
        </SheetHeader>
        <form ref={formRef} action={action} className="grid gap-4 overflow-y-auto px-4 pb-4">
          <input type="hidden" name="label" value={label} />
          <input type="hidden" name="page" value={page} />

          <div className="product-field">
            <Label htmlFor="feedback-name">Name</Label>
            <Input id="feedback-name" value={user?.name || ""} disabled />
          </div>
          <div className="product-field">
            <Label htmlFor="feedback-email">Email</Label>
            <Input id="feedback-email" type="email" value={user?.email || ""} disabled />
          </div>
          <div className="product-field">
            <Label htmlFor="feedback-title">Title</Label>
            <Input id="feedback-title" name="title" required minLength={3} maxLength={150} placeholder="A short summary" disabled={pending} />
          </div>
          <div className="product-field">
            <Label htmlFor="feedback-type">Type</Label>
            <Select name="feedback-type" value={label || null} onValueChange={setLabel} disabled={pending}>
              <SelectTrigger id="feedback-type" className="w-full" aria-label="Feedback type">
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_LABELS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="product-field">
            <Label htmlFor="feedback-message">Feedback</Label>
            <Textarea id="feedback-message" name="feedback" required minLength={10} maxLength={5000} placeholder="Tell us a little more…" className="min-h-36" disabled={pending} />
          </div>
          <div className="product-field">
            <span className="text-sm font-medium">Screenshot (optional)</span>
            <input
              ref={fileRef}
              className="sr-only"
              type="file"
              name="image"
              accept="image/png,image/jpeg,image/webp,image/gif"
              aria-label="Attach a screenshot"
              onChange={chooseImage}
              disabled={pending}
            />
            {previewUrl ? (
              <div className="flex items-center gap-3">
                <img src={previewUrl} alt="Screenshot preview" className="h-16 w-16 rounded-lg border object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm">{fileRef.current?.files?.[0]?.name}</span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove screenshot" onClick={removeImage} disabled={pending}>
                  <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-fit" onClick={() => fileRef.current?.click()} disabled={pending}>
                <HugeiconsIcon icon={Image01Icon} aria-hidden="true" />
                Attach image
              </Button>
            )}
            <p className="product-help">PNG, JPEG, WebP, or GIF up to 3 MB.</p>
          </div>
          <Button type="submit" disabled={pending || !label}>
            {pending ? "Sending…" : "Send feedback"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
