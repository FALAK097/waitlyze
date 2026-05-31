"use client";

import { cn } from "@/lib/utils";
import { useR2Upload } from "@/utils/r2-upload";
import { X, UploadCloud, FileImage } from "lucide-react";
import Image from "next/image";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

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
      <div className="relative group">
        <div className="relative w-full h-40 overflow-hidden transition-all duration-300 border-2 border-dashed rounded-xl border-muted-foreground/20 bg-muted/10 hover:border-muted-foreground/40">
          <Image
            src={preview}
            alt="Uploaded preview"
            fill
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-3 rounded-full bg-destructive/90 p-1.5 text-white shadow-md transition-all duration-200 hover:bg-destructive hover:scale-110 group-hover:opacity-100 lg:opacity-0"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
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
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 px-6 py-8 text-center transition-all duration-300 cursor-pointer hover:border-primary/50 hover:bg-muted/20",
          isDragging && "border-primary bg-primary/5 scale-[1.01] shadow-sm",
          (disabled || isUploading) && "opacity-60 cursor-not-allowed hover:border-muted-foreground/20 hover:bg-muted/10"
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
          <div className="flex flex-col items-center gap-4 w-full max-w-[260px]">
            <div className="relative flex items-center justify-center">
              <FileImage className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Uploading logo...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full transition-all duration-300 ease-out rounded-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 transition-transform duration-300 border rounded-full shadow-sm bg-background border-muted-foreground/10 hover:scale-110">
              <UploadCloud className="w-6 h-6 text-primary" />
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-semibold text-foreground">
                Drag & Drop your logo or{" "}
                <span className="underline text-primary hover:text-primary/90 decoration-2 underline-offset-2">
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
