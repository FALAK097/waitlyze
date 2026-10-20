import Link from "next/link";

import styles from "./email-tools.module.css";

export function EmailToolsNav({ waitListId, current }) {
  const root = `/waitlists/${waitListId}/emails`;
  return (
    <div className={styles.scope}>
      <nav aria-label="Email tools" className="product-context-nav">
        <Link
          prefetch={false}
          href={root}
          aria-current={current === "templates" ? "page" : undefined}
        >
          Templates
        </Link>
        <Link
          prefetch={false}
          href={`${root}/broadcasts`}
          aria-current={current === "broadcasts" ? "page" : undefined}
        >
          Broadcasts
        </Link>
        <Link
          prefetch={false}
          href={`${root}/automations`}
          aria-current={current === "automations" ? "page" : undefined}
        >
          Automations
        </Link>
        <Link
          prefetch={false}
          href={`${root}/logs`}
          aria-current={current === "logs" ? "page" : undefined}
        >
          Logs
        </Link>
      </nav>
    </div>
  );
}
