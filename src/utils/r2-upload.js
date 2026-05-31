import { useState, useCallback } from "react";
import toast from "react-hot-toast";

export function useR2Upload(endpoint, options = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    if (options.onUploadBegin) {
      options.onUploadBegin();
    }
    setIsUploading(true);
    setProgress(0);

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

        // Upload using XMLHttpRequest to get real progress updates
        const result = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setProgress(percentComplete);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error("Failed to parse server response"));
              }
            } else {
              try {
                const response = JSON.parse(xhr.responseText);
                reject(new Error(response.error || `Upload failed with status ${xhr.status}`));
              } catch (e) {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network upload error"));
          });

          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        results.push(result);
      }

      setIsUploading(false);
      setProgress(100);
      if (options.onClientUploadComplete) {
        options.onClientUploadComplete(results);
      }
      return results;
    } catch (error) {
      setIsUploading(false);
      setProgress(0);
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
    progress,
    permittedFileTypes: ["image/*"],
  };
}
