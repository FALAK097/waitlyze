/** Sticky table of contents. Server-rendered anchors, so it works without JavaScript. */
export function PostToc({ toc }) {
  const items = toc.filter((item) => item.depth <= 3);
  if (items.length < 3) return null;
  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 text-micro font-semibold tracking-widest text-product-text-secondary uppercase">
        On this page
      </p>
      <ul className="flex flex-col gap-2 border-l border-product-border-subtle">
        {items.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              className={`-ml-px block border-l border-transparent py-0.5 leading-snug text-product-text-secondary transition-colors hover:border-product-text-primary hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                item.depth === 3 ? "pl-7" : "pl-4"
              }`}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
