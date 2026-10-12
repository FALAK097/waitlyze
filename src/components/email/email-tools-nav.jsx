import Link from "next/link";
import styles from "./email-tools.module.css";

export function EmailToolsNav({ waitListId, current }) {
  const root = `/wait-lists/${waitListId}/emails`;
  return <div className={styles.scope}><nav aria-label="Email tools" className="product-context-nav">
    <Link href={root} aria-current={current === "templates" ? "page" : undefined}>Templates</Link>
    <Link href={`${root}/broadcasts`} aria-current={current === "broadcasts" ? "page" : undefined}>Broadcasts</Link>
    <Link href={`${root}/automations`} aria-current={current === "automations" ? "page" : undefined}>Automations</Link>
  </nav></div>;
}
