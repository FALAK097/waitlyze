import SignupButton from "@/components/landing/signup-button";

/** End-of-article call to action, shared by posts and the blog index. */
export function BlogCta({
  title = "Ready to build your waitlist?",
  body = "Pick a template, publish a hosted page or embed a form, and start collecting signups with referrals, email, and analytics in one place.",
}) {
  return (
    <section
      aria-labelledby="blog-cta-title"
      className="flex flex-col gap-6 pt-8 pb-4 sm:pt-10 md:flex-row md:items-end md:justify-between md:gap-12"
    >
      <div className="max-w-xl">
        <h2
          id="blog-cta-title"
          className="font-product-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-3 text-base text-pretty text-product-text-secondary">{body}</p>
      </div>
      <div className="shrink-0">
        <SignupButton>Create your waitlist</SignupButton>
      </div>
    </section>
  );
}
