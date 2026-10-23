"use client";

import { EmailEditor } from "@react-email/editor";

import "@react-email/editor/themes/default.css";
import { useState } from "react";

// The editor reads its chrome colours from the --re-* custom properties.
// The email palette is intentionally close to the product surface colours.
const editorTheme = {
  "--re-bg": "#fff",
  "--re-text": "#17261b",
  "--re-text-muted": "#667469",
  "--re-border": "#e5e9e4",
  "--re-hover": "#f4f7ee",
  "--re-radius": "8px",
};

const canvas =
  "min-h-105 py-5.5 px-7 pb-7.5 max-sm:p-4.5 [&_.tiptap]:min-h-90 [&_.tiptap]:text-body [&_.tiptap]:leading-relaxed [&_.tiptap_p]:mb-4";

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
    <div
      className={canvas}
      style={editorTheme}
      aria-label="Email message editor"
      aria-busy={!ready}
    >
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
