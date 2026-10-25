"use client";

import { Image01Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useR2Upload } from "@/utils/r2-upload";

import { Button } from "./button";

export function UploadButton({ onSuccess, disabled }) {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useR2Upload("imageUploader", {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      if (onSuccess) {
        onSuccess(res);
      }
    },
    onUploadError: (error) => {
      setIsUploading(false);
      console.error("Upload error:", error);
      toast.error("Upload failed");
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  const handleFileChange = useCallback(
    async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        await startUpload(Array.from(files));
      } catch (err) {
        console.error("Upload failed:", err);
        setIsUploading(false);
      }
    },
    [startUpload],
  );

  return (
    <div className="absolute top-0 right-0 flex h-full w-full items-center gap-4">
      <Button
        className="h-full w-full border-dotted border-black bg-white p-0 opacity-35 transition-all duration-300 ease-in-out hover:border-2 hover:opacity-55"
        variant="ghost"
        disabled={isUploading || disabled}
        aria-label={isUploading ? "Uploading image" : "Upload image"}
        onClick={() => document.getElementById("file-input").click()}
      >
        {isUploading ? (
          <HugeiconsIcon icon={Loading01Icon} className="h-12 w-12 animate-spin bg-primary" />
        ) : (
          <HugeiconsIcon icon={Image01Icon} className="h-12 w-12" />
        )}
      </Button>
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
