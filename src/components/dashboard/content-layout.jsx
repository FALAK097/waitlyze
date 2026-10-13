export function ContentLayout({ title, children }) {
  return <section className="product-legacy-content" aria-label={title}>{children}</section>;
}
