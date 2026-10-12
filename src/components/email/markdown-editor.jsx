"use client";

import { useRef, useState } from "react";
import { Bold, Italic, List, Link as LinkIcon, Undo, Redo } from "lucide-react";
import { Button } from "@/components/product/button";
import styles from "./markdown-editor.module.css";

export function MarkdownEditor({ value = "", onChange, placeholder, disabled, ...props }) {
  const textarea = useRef(null);
  const [history, setHistory] = useState([value]);
  const [position, setPosition] = useState(0);
  function update(next) {
    onChange(next);
    const steps = [...history.slice(0, position + 1), next].slice(-100);
    setHistory(steps); setPosition(steps.length - 1);
  }
  function insert(before, after = "") {
    const field = textarea.current;
    if (!field || disabled) return;
    const start = field.selectionStart, end = field.selectionEnd;
    update(value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end));
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start + before.length, end + before.length); });
  }
  function move(next) { setPosition(next); onChange(history[next]); textarea.current?.focus(); }
  return <div className={styles.editor}>
    <div role="group" aria-label="Message formatting" className={styles.toolbar}>
      {[["Bold", Bold, "**", "**"], ["Italic", Italic, "*", "*"], ["Bullet list", List, "- ", ""], ["Insert link", LinkIcon, "[", "](url)"]].map(([title, Icon, before, after]) => <Button key={title} type="button" variant="ghost" size="icon" static aria-label={title} title={title} disabled={disabled} onClick={() => insert(before, after)}><Icon size={16} aria-hidden="true" /></Button>)}
      <Button type="button" variant="ghost" size="icon" static aria-label="Undo edit" disabled={disabled || position === 0} onClick={() => move(position - 1)}><Undo size={16} aria-hidden="true" /></Button>
      <Button type="button" variant="ghost" size="icon" static aria-label="Redo edit" disabled={disabled || position >= history.length - 1} onClick={() => move(position + 1)}><Redo size={16} aria-hidden="true" /></Button>
      <Button type="button" variant="ghost" static disabled={disabled} onClick={() => insert("{{waitlist}}")}>+ Waitlist</Button>
    </div>
    <textarea {...props} ref={textarea} value={value} onChange={(event) => update(event.target.value)} placeholder={placeholder || "Write your message…"} maxLength={5000} rows={8} disabled={disabled} />
  </div>;
}
