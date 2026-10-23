export function ContentLayout({ title, children }) {
  return (
    <section className="mt-2" aria-label={title}>
      {children}
    </section>
  );
}
