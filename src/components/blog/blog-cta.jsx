import SignupButton from "@/components/landing/signup-button";

/** End-of-article call to action, shared by posts and the blog index. */
export function BlogCta({
  title = "Ready to build your waitlist?",
  body = "Pick a template, publish a hosted page or embed a form, and start collecting signups with referrals, email, and analytics in one place.",
}) {
  return (
    <section
      aria-labelledby="blog-cta-title"
      className="bg-product-neutral-900 relative overflow-hidden rounded-2xl px-6 py-10 text-white sm:px-10 sm:py-12"
    >
      <span
        className="pointer-events-none absolute -top-6 right-8 hidden h-40 -skew-x-12 items-end gap-2 opacity-90 sm:inline-flex"
        aria-hidden="true"
      >
        <i className="block h-24 w-3 rounded-sm bg-product-accent-solid" />
        <i className="block h-36 w-3 rounded-sm bg-product-accent-solid" />
        <i className="block h-28 w-3 rounded-sm bg-product-accent-solid" />
      </span>
      <h2
        id="blog-cta-title"
        className="max-w-xl font-product-display text-3xl leading-tight font-semibold tracking-tight text-balance"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-base text-pretty text-white/75">{body}</p>
      <div className="mt-7">
        <SignupButton>Create your waitlist</SignupButton>
      </div>
    </section>
  );
}
