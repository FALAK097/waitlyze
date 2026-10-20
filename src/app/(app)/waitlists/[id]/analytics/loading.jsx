export default function AnalyticsLoading() {
  return (
    <section className="mt-7 grid gap-4 max-[600px]:mt-6" aria-busy="true">
      <p role="status">Loading analytics…</p>
      <div
        className="grid gap-4 rounded-xl border border-product-border-subtle p-4.5"
        aria-hidden="true"
      >
        <div className="grid grid-cols-5 gap-4 max-[840px]:grid-cols-3">
          {[0, 1, 2, 3].map((item) => (
            <div className="grid gap-2.5" key={item}>
              <i className="block h-2.75 w-3/5 rounded bg-product-bg-inset motion-safe:animate-pulse" />
              <i className="block h-6.25 w-3/4 rounded bg-product-bg-inset motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex min-h-70 items-end gap-3 px-5 py-6">
          <i className="h-19.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-36.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-26.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-50.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-42 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
        </div>
      </div>
    </section>
  );
}
