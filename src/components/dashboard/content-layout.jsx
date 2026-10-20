export function ContentLayout({ title, children }) {
  return (
    <section className="mt-6" aria-label={title}>
      {children}
    </section>
  );
}
