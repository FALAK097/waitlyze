import { ProductContentSkeleton } from "@/components/product/content-skeleton";

const pulse = "block rounded-md bg-product-bg-inset motion-safe:animate-pulse";

export default function WaitlistsLoading() {
  return (
    <section aria-label="Loading waitlists">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3" aria-hidden="true">
        <div className="grid grid-cols-4 items-center gap-1">
          {[0, 1, 2, 3].map((tab) => (
            <i key={tab} className={`${pulse} h-10 w-18`} />
          ))}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:flex-initial">
          <i className={`${pulse} h-10 w-full sm:w-64`} />
          <i className={`${pulse} h-10 w-36 shrink-0`} />
        </div>
      </div>
      <ProductContentSkeleton label="Loading waitlists" variant="table" rows={5} />
    </section>
  );
}
