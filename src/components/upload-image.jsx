"use client";

import { cn } from "@/lib/utils";
import { useR2Upload } from "@/utils/r2-upload";
import { X, UploadCloud, Loader } from "lucide-react";
import Image from "next/image";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

export default function UploadImage({ value, onSuccess, onClear, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const fileInputRef = useRef(null);

  const { startUpload, isUploading } = useR2Upload("imageUploader", {
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
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 px-6 py-8 text-center transition-all duration-150 cursor-pointer hover:bg-muted/50",
          isDragging && "border-primary/50 bg-primary/5",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed"
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
          <div className="flex flex-col items-center gap-2">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Uploading image...
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <div className="grid gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Drag & Drop your logo or{" "}
                <span className="text-primary hover:text-primary/90 font-semibold">
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
