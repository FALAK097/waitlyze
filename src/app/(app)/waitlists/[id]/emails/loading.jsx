import styles from "@/components/email/email-tools.module.css";

export default function Loading() {
  return <div className={styles.scope} aria-busy="true"><p className="sr-only" role="status">Loading email tools…</p><div className={styles.skeleton} aria-hidden="true"><i /><i /><i /><i /></div></div>;
}
