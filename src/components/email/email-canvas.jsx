"use client";

import { EmailEditor } from "@react-email/editor";
import "@react-email/editor/themes/default.css";
import { useState } from "react";
import styles from "./email-tools.module.css";

export function EmailCanvas({ editorRef, content, onChange, editable = true }) {
  const [ready, setReady] = useState(false);
  return <div className={styles.canvas} aria-label="Email message editor" aria-busy={!ready}>
    <EmailEditor
      ref={editorRef}
      content={content}
      theme={{ extends: "basic", styles: { body: { backgroundColor: "#ffffff", color: "#17261b" }, container: { backgroundColor: "#ffffff" }, h1: { color: "#17261b" }, link: { color: "#375f3a" }, button: { backgroundColor: "#c6fe1e", color: "#17261b", borderRadius: "6px" } } }}
      placeholder="Write your message… Type / to add a block."
      editable={editable}
      onReady={() => setReady(true)}
      onUpdate={(ref) => onChange(ref.getJSON())}
    />
  </div>;
}
