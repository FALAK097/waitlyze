/** Visible FAQ. The same content is emitted as FAQPage JSON-LD by the post page. */
export function PostFaq({ faqs }) {
  if (!faqs.length) return null;
  return (
    <section aria-labelledby="post-faq-title" className="mt-14">
      <h2
        id="post-faq-title"
        className="font-product-display text-3xl leading-tight font-semibold tracking-tight"
      >
        Frequently asked questions
      </h2>
      <div className="mt-5 divide-y divide-product-border-subtle border-y border-product-border-subtle">
        {faqs.map(({ question, answer }) => (
          <details key={question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 [&::-webkit-details-marker]:hidden">
              {question}
              <span
                aria-hidden="true"
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-product-bg-inset text-lg leading-none transition-transform duration-150 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-prose text-base leading-relaxed text-pretty text-product-text-secondary">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
