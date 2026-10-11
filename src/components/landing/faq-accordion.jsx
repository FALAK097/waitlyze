"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

export default function FAQAccordion({ items }) {
  const [open, setOpen] = useState(0);
  const prefix = useId();
  return <div className="wl-faq-list">{items.map(([question, answer], index) => {
    const expanded = open === index;
    const triggerId = `${prefix}-question-${index}`;
    const panelId = `${prefix}-answer-${index}`;
    return <div className="wl-faq-item" key={question} data-open={expanded}>
      <h3><button id={triggerId} type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setOpen(expanded ? null : index)}>{question}<Plus size={18} aria-hidden="true" /></button></h3>
      <div className="wl-faq-panel" id={panelId} role="region" aria-labelledby={triggerId} inert={!expanded} aria-hidden={!expanded}><div><p>{answer}</p></div></div>
    </div>;
  })}</div>;
}
