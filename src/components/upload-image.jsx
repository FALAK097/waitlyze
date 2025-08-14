"use client";

import { cn } from "@/lib/utils";
import { UploadDropzone } from "@/utils/uploadthing";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

export default function UploadImage({ value, onSuccess, onClear, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(value || "");

  const handleUploadComplete = (files) => {
    const file = files[0];
    if (file) {
      setPreview(file.url);
      onSuccess?.(files);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview("");
    onClear?.();
  };

  const handleUploadError = (error) => {
    console.error(`Upload failed: ${error.message}`);
    toast.error("Failed to upload image. Please try again.");
  };

  if (preview) {
    return (
      <div className="relative group">
        <div className="relative w-full h-40 overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/20">
          <Image
            src={preview}
            alt="Uploaded preview"
            fill
            className="object-contain p-2"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-white shadow-sm transition-opacity group-hover:opacity-100 lg:opacity-0"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <UploadDropzone
        appearance={{
          button: cn(
            "ut-ready:bg-primary ut-uploading:cursor-not-allowed rounded-md px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm",
            disabled && "opacity-50 cursor-not-allowed"
          ),
          container: cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 px-6 py-8 text-center transition-all duration-150 hover:bg-muted/50",
            isDragging && "border-primary/50 bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          ),
          allowedContent: "text-sm text-muted-foreground mt-2",
        }}
        endpoint="imageUploader"
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onDragOver={() => !disabled && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        content={{
          label: (
            <div className="grid gap-2">
              <div className="grid gap-1">
                <span className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Drag & Drop your logo or{" "}
                  <span className="text-primary hover:text-primary/90">
                    Browse Files
                  </span>
                </span>
              </div>
            </div>
          ),
        }}
        disabled={disabled}
      />
    </div>
  );
}
