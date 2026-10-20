"use client";

import { useParams } from "next/navigation";

import { EmailToolsNav } from "./email-tools-nav";

import styles from "./email-tools.module.css";

const variants = {
  templates: { rail: 2, fields: 2, label: "email templates" },
  broadcasts: { rail: 3, fields: 3, label: "broadcasts" },
  automations: { rail: 3, fields: 3, label: "automations" },
  logs: { rail: 0, fields: 0, label: "email logs" },
};

export function EmailSkeleton({ variant = "templates" }) {
  const params = useParams();
  const config = variants[variant] || variants.templates;
  return (
    <div className="product-legacy-content">
      <div className={styles.scope} aria-busy="true">
        <p className="sr-only" role="status">
          Loading {config.label}…
        </p>
        <EmailToolsNav waitListId={params.id} current={variant} />
        {config.rail === 0 ? (
          <div className={styles.skelPane} aria-hidden="true">
            <i className={styles.skelHead} />
            {Array.from({ length: 8 }, (_, index) => (
              <i key={index} className={styles.skelLogRow} />
            ))}
          </div>
        ) : (
          <div className={styles.skelSplit} aria-hidden="true">
            <div className={styles.skelRail}>
              {Array.from({ length: config.rail }, (_, index) => (
                <i key={index} />
              ))}
            </div>
            <div className={styles.skelPane}>
              <i className={styles.skelHead} />
              <div className={styles.skelFields}>
                {Array.from({ length: config.fields }, (_, index) => (
                  <i key={index} />
                ))}
              </div>
              <i className={styles.skelCanvas} />
              <i className={styles.skelBar} />
              <i className={styles.skelActions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
