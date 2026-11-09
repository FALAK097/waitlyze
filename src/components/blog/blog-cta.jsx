import FinalCta from "@/components/landing/final-cta";

/** End-of-article call to action, shared by posts and the blog index. */
export function BlogCta({ compact = false }) {
  return <FinalCta compact={compact} />;
}
