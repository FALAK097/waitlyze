"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SavedTemplateSelect({ value, onValueChange, templates, disabled = false }) {
  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => onValueChange(nextValue || "")}
      disabled={disabled}
    >
      <SelectTrigger className="min-h-9 min-w-52" aria-label="Start from a saved email template">
        <SelectValue placeholder="Start from a saved template…" />
      </SelectTrigger>
      <SelectContent align="start">
        {Object.entries(templates).map(([key, template]) => (
          <SelectItem key={key} value={key}>
            {template.type || key}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
