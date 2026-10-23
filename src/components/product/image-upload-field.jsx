"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body: formData });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.url)
    throw new Error(result.error || "The image could not be uploaded. Try a smaller file.");
  return result.url;
}

/**
 * Image picker for the builder: upload a file, or paste a URL. Shows the
 * upload and failure states the founder needs to trust the result.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  hint = "",
  previewClassName = "aspect-1200/630 object-cover",
}) {
  const id = useId();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={value}
          placeholder="https://…"
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void pick(event)}
        />
      </div>
      {value ? (
        <div className="relative mt-1">
          <img
            alt=""
            className={cn(
              "w-full rounded-lg border border-product-border-subtle",
              previewClassName,
            )}
            src={value}
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Remove ${label.toLowerCase()}`}
            title="Remove image"
            className="absolute top-2 right-2"
            onClick={() => onChange("")}
          >
            <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
          </Button>
        </div>
      ) : null}
      {error ? (
        <p className="m-0 text-caption text-product-danger-text" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="m-0 text-micro text-product-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
