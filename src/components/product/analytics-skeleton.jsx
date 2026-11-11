export function AnalyticsSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      <div className="overflow-hidden rounded-xl border border-product-border-subtle bg-product-bg-surface shadow-xs">
        <div className="grid grid-cols-3 border-b border-product-border-subtle sm:grid-cols-4 lg:grid-cols-7">
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <div
              className="grid gap-2 border-product-border-subtle p-4 [&+div]:border-s"
              key={item}
            >
              <i className="block h-3 w-3/5 rounded bg-product-bg-inset motion-safe:animate-pulse" />
              <i className="block h-6 w-3/4 rounded bg-product-bg-inset motion-safe:animate-pulse" />
              <i className="block h-2.5 w-4/5 rounded bg-product-bg-inset motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 px-4.5 pt-4.25 pb-2">
          <div className="grid gap-1.5">
            <i className="block h-4 w-24 rounded bg-product-bg-inset motion-safe:animate-pulse" />
            <i className="block h-3 w-44 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          </div>
          <i className="block h-9 w-32 rounded-lg bg-product-bg-inset motion-safe:animate-pulse" />
        </div>
        <div className="flex min-h-70 items-end gap-3 px-5 py-6">
          <i className="h-19.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-36.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-26.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-50.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-42 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-32 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          <i className="h-46 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((panel) => (
          <div
            key={panel}
            className="grid gap-3 rounded-xl border border-product-border-subtle bg-product-bg-surface p-4 shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <i className="block h-4 w-28 rounded bg-product-bg-inset motion-safe:animate-pulse" />
              <i className="block h-7 w-32 rounded-md bg-product-bg-inset motion-safe:animate-pulse" />
            </div>
            <div className="grid gap-2.5 pt-2">
              {[0, 1, 2, 3].map((bar) => (
                <i
                  key={bar}
                  className="block h-8 w-full rounded bg-product-bg-inset motion-safe:animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
