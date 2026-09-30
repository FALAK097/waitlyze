import Link from "next/link";

export function EmailToolsNav({ waitListId, current }) {
  const root = `/wait-lists/${waitListId}/emails`;
  return <nav aria-label="Email tools" className="product-context-nav">
    <Link href={root} aria-current={current === "templates" ? "page" : undefined}>Templates</Link>
    <Link href={`${root}/broadcasts`} aria-current={current === "broadcasts" ? "page" : undefined}>Broadcasts</Link>
  </nav>;
}
