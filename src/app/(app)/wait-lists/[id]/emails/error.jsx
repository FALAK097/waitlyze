"use client";

import { Button } from "@/components/product/button";
import styles from "@/components/email/email-tools.module.css";

export default function Error({ retry }) {
  return <section className={`${styles.scope} ${styles.error}`} role="alert"><h2>Email tools couldn’t load</h2><p>Your saved templates and drafts are safe. Check your connection and try again.</p><Button variant="outline" onClick={retry}>Try again</Button></section>;
}
