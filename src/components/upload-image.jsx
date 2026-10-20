"use client";

import { Cancel01Icon, CloudUploadIcon, Image01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useR2Upload } from "@/utils/r2-upload";

export default function UploadImage({ value, onSuccess, onClear, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const fileInputRef = useRef(null);

  const { startUpload, isUploading, progress } = useR2Upload("imageUploader", {
    onClientUploadComplete: (files) => {
      const file = files[0];
      if (file) {
        setPreview(file.url);
        onSuccess?.(files);
      }
    },
    onUploadError: (error) => {
      console.error(`Upload failed: ${error.message}`);
      toast.error(error.message || "Failed to upload image. Please try again.");
    },
  });

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview("");
    onClear?.();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      try {
        await startUpload([files[0]]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        await startUpload([files[0]]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (preview) {
    return (
      <div className="group relative">
        <div className="relative h-40 w-full overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 transition-all duration-300 hover:border-muted-foreground/40">
          <Image
            src={preview}
            alt="Uploaded preview"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          />
          {!disabled && (
            <Button
              type="button"
              onClick={handleClear}
              className="absolute top-3 right-3 rounded-full bg-destructive/90 p-1.5 text-white shadow-md transition-all duration-200 group-hover:opacity-100 hover:scale-110 hover:bg-destructive lg:opacity-0"
              disabled={disabled}
              variant="ghost"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 px-6 py-8 text-center transition-all duration-300 hover:border-primary/50 hover:bg-muted/20",
          isDragging && "scale-[1.01] border-primary bg-primary/5 shadow-sm",
          (disabled || isUploading) &&
            "cursor-not-allowed opacity-60 hover:border-muted-foreground/20 hover:bg-muted/10",
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled || isUploading}
        />
        {isUploading ? (
          <div className="flex w-full max-w-[260px] flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <HugeiconsIcon icon={Image01Icon} className="h-10 w-10 animate-pulse text-primary" />
            </div>
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Uploading logo...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full border border-muted-foreground/10 bg-background p-3 shadow-sm transition-transform duration-300 hover:scale-110">
              <HugeiconsIcon icon={CloudUploadIcon} className="h-6 w-6 text-primary" />
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-semibold text-foreground">
                Drag & Drop your logo or{" "}
                <span className="text-primary underline decoration-2 underline-offset-2 hover:text-primary/90">
                  Browse Files
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                Max file size: 4MB (images only)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
