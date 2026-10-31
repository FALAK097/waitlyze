import { AnalyticsSkeleton } from "@/components/product/waitlist-analytics";

export default function AnalyticsLoading() {
  return (
    <section className="mt-7 grid gap-4 max-[600px]:mt-6" aria-busy="true">
      <p role="status" className="sr-only">
        Loading analytics…
      </p>
      <header
        className="flex items-end justify-between gap-5 pb-1 max-[600px]:flex-col max-[600px]:items-stretch"
        aria-hidden="true"
      >
        <div className="grid gap-2">
          <i className="block h-7 w-32 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="block h-4 w-80 max-w-full rounded bg-product-bg-inset motion-safe:animate-pulse" />
        </div>
        <i className="block h-10 w-40 rounded-lg bg-product-bg-inset motion-safe:animate-pulse" />
      </header>
      <AnalyticsSkeleton />
    </section>
  );
}
