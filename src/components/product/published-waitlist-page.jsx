import { WaitlistPageContent } from "@/components/product/waitlist-page-content";

export function PublishedWaitlistPage({
  page,
  hideCounts = false,
  impressionTracker,
  renderSignupForm,
}) {
  if (page.paused) {
    return (
      <main className="grid min-h-screen place-items-center bg-product-bg-page px-6 py-12 text-center font-product-sans text-product-text-primary xl:py-30">
        <section className="w-full max-w-160">
          <p className="mb-9 text-lg font-semibold text-product-text-secondary">
            {page.waitList.name || "Waitlist"}
          </p>
          <h1 className="mb-5 font-product-display text-5xl leading-none font-semibold tracking-tighter text-balance lg:text-7xl">
            This waitlist is paused
          </h1>
          <p className="mx-auto max-w-155 text-lg leading-relaxed text-product-text-secondary">
            Signups aren’t open right now. Please check back later.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="product-ui">
      {impressionTracker}
      <WaitlistPageContent
        snapshot={page.snapshot}
        name={page.waitList.name}
        signupCount={page.waitList._count.signUps}
        hideCounts={hideCounts}
        renderSignupForm={renderSignupForm}
      />
    </main>
  );
}
