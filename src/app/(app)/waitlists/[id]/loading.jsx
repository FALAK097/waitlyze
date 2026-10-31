const pulse = "block rounded-md bg-product-bg-inset motion-safe:animate-pulse";

export default function WaitlistLoading() {
  return (
    <section className="product-ui grid min-w-0" aria-label="Loading waitlist" aria-busy="true">
      <p role="status" className="sr-only">
        Loading waitlist builder…
      </p>
      <div aria-hidden="true">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2.5 border-b border-product-border-subtle bg-product-bg-surface px-4 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <i className={`${pulse} h-9 w-24`} />
            <i className={`${pulse} h-9 w-28`} />
            <i className={`${pulse} h-9 w-28`} />
          </div>
          <div className="flex items-center gap-1 max-[680px]:hidden">
            <i className={`${pulse} size-8`} />
            <i className={`${pulse} size-8`} />
          </div>
          <div className="flex items-center gap-2">
            <i className={`${pulse} size-8`} />
            <i className={`${pulse} size-8`} />
            <i className={`${pulse} h-9 w-24`} />
          </div>
        </div>
        <div className="grid h-studio min-h-studio grid-cols-[18.5rem_1fr_21.5rem] overflow-hidden bg-product-bg-inset max-[1180px]:h-studio-compact max-[1180px]:grid-cols-[16.5rem_1fr_19.5rem] max-[900px]:h-auto max-[900px]:min-h-0 max-[900px]:grid-cols-1">
          <aside className="flex flex-col gap-3 border-r border-product-border-subtle bg-product-bg-surface p-3.5 max-[900px]:hidden">
            <i className={`${pulse} h-3.5 w-20`} />
            {[0, 1, 2, 3, 4].map((item) => (
              <i key={item} className={`${pulse} h-10 w-full`} />
            ))}
            <div className="mt-2 grid gap-2 border-t border-product-border-subtle pt-3">
              <i className={`${pulse} h-10 w-full`} />
              <i className={`${pulse} h-10 w-full`} />
            </div>
          </aside>
          <div className="min-w-0 overflow-hidden p-10 max-[900px]:p-6">
            <div className="mx-auto grid max-w-4xl gap-5 rounded-xl bg-white p-10 shadow-surface">
              <i className={`${pulse} h-4 w-28`} />
              <i className={`${pulse} h-11 w-3/4`} />
              <i className={`${pulse} h-5 w-2/3`} />
              <div className="mt-2 flex max-w-md gap-2">
                <i className={`${pulse} h-12 flex-1`} />
                <i className={`${pulse} h-12 w-32`} />
              </div>
            </div>
          </div>
          <aside className="flex flex-col gap-4 border-l border-product-border-subtle bg-product-bg-surface p-4 max-[900px]:hidden">
            <i className={`${pulse} h-5 w-32`} />
            {[0, 1, 2, 3].map((field) => (
              <div key={field} className="grid gap-1.5">
                <i className={`${pulse} h-3.5 w-24`} />
                <i className={`${pulse} h-10 w-full`} />
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
