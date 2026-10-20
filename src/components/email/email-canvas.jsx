"use client";

import { EmailEditor } from "@react-email/editor";

import "@react-email/editor/themes/default.css";
import { useState } from "react";

import styles from "./email-tools.module.css";

async function uploadEditorImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body: formData });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.url) {
    throw new Error(result.error || "Image upload failed. Try a smaller image.");
  }
  return { url: result.url };
}

export function EmailCanvas({ editorRef, content, onChange, editable = true }) {
  const [ready, setReady] = useState(false);
  return (
    <div className={styles.canvas} aria-label="Email message editor" aria-busy={!ready}>
      <EmailEditor
        ref={editorRef}
        content={content}
        theme={{
          extends: "basic",
          styles: {
            body: { backgroundColor: "#ffffff", color: "#17261b" },
            container: { backgroundColor: "#ffffff" },
            p: { color: "#17261b" },
            h1: { color: "#17261b" },
            h2: { color: "#17261b" },
            link: { color: "#375f3a" },
            blockquote: { color: "#5d6b60", borderColor: "#c6fe1e" },
            button: { backgroundColor: "#c6fe1e", color: "#17261b", borderRadius: "6px" },
          },
        }}
        placeholder="Write your message… Type / to add a block."
        editable={editable}
        onUploadImage={uploadEditorImage}
        onReady={() => setReady(true)}
        onUpdate={(ref) => onChange(ref.getJSON())}
      />
    </div>
  );
}
