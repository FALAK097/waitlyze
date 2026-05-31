import { useState, useCallback } from "react";
import toast from "react-hot-toast";

export function useR2Upload(endpoint, options = {}) {
  const [isUploading, setIsUploading] = useState(false);

  const startUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    if (options.onUploadBegin) {
      options.onUploadBegin();
    }
    setIsUploading(true);

    try {
      const results = [];
      for (const file of files) {
        // Validate client side before hitting API
        if (file.size > 4 * 1024 * 1024) {
          throw new Error("File size exceeds the 4MB limit");
        }
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed");
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        results.push(result);
      }

      setIsUploading(false);
      if (options.onClientUploadComplete) {
        options.onClientUploadComplete(results);
      }
      return results;
    } catch (error) {
      setIsUploading(false);
      console.error("Upload error in hook:", error);
      if (options.onUploadError) {
        options.onUploadError(error);
      } else {
        toast.error(error.message || "Upload failed");
      }
      throw error;
    }
  }, [options]);

  return {
    startUpload,
    isUploading,
    permittedFileTypes: ["image/*"],
  };
}
