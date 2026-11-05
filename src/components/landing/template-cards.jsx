import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import TemplatePreview from "./template-preview";

export default function TemplateCards({ templates }) {
  return (
    <div className="wl-template-grid">
      {templates.map((template) => (
        <Link key={template.id} href={`/templates/${template.id}`} className="wl-template-card">
          <div className="wl-template-image">
            <TemplatePreview template={template} />
          </div>
          <div className="wl-template-caption">
            <span>{template.name}</span>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
          </div>
        </Link>
      ))}
    </div>
  );
}
