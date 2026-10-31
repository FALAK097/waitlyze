const pulse = "block rounded-md bg-product-bg-inset motion-safe:animate-pulse";

export default function SubscribersLoading() {
  return (
    <div className="min-w-0" aria-busy="true">
      <p role="status" className="sr-only">
        Loading signups…
      </p>
      <div aria-hidden="true">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4 pt-6">
          <div className="grid gap-2">
            <i className={`${pulse} h-7 w-28`} />
            <i className={`${pulse} h-4 w-72 max-w-full`} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <i className={`${pulse} h-10 w-24`} />
            <i className={`${pulse} h-10 w-32`} />
            <i className={`${pulse} h-10 w-32`} />
            <i className={`${pulse} h-10 w-28`} />
          </div>
        </header>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <i className={`${pulse} h-10 w-full sm:max-w-sm`} />
          <i className={`${pulse} h-10 w-52 max-[640px]:w-full`} />
        </div>
        <div className="grid divide-y divide-product-border-subtle border-t border-product-border-subtle">
          <div className="flex h-11 items-center gap-4">
            <i className={`${pulse} size-4`} />
            <i className={`${pulse} h-3 w-36`} />
            <i className={`${pulse} h-3 w-20`} />
            <i className={`${pulse} h-3 w-16 max-sm:hidden`} />
            <i className={`${pulse} h-3 w-16 max-sm:hidden`} />
            <i className={`${pulse} ml-auto h-3 w-20 max-sm:hidden`} />
          </div>
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex h-15 items-center gap-4">
              <i className={`${pulse} size-4`} />
              <i className={`${pulse} h-4 w-48`} />
              <i className={`${pulse} h-5.5 w-20 rounded-full`} />
              <i className={`${pulse} h-3.5 w-12 max-sm:hidden`} />
              <i className={`${pulse} h-3.5 w-12 max-sm:hidden`} />
              <i className={`${pulse} ml-auto h-3.5 w-24 max-sm:hidden`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
