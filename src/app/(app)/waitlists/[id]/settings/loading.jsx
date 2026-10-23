import { Skeleton } from "@/components/ui/skeleton";

export default function WaitlistSettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-280" aria-busy="true">
      <div className="flex items-start gap-8 max-[760px]:flex-col max-[760px]:gap-8 lg:gap-12 xl:gap-18">
        <aside
          className="sticky top-6 w-52.5 min-w-0 shrink-0 max-[760px]:static max-[760px]:w-full"
          aria-hidden="true"
        >
          <nav className="grid gap-1 max-[760px]:grid-cols-2 max-[760px]:gap-1.5">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-11 w-full rounded-lg" />
            ))}
          </nav>
        </aside>
        <div className="max-w-190 min-w-0 flex-1" aria-hidden="true">
          <header className="mb-9 max-[760px]:mb-6">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-2 h-4 w-3/5" />
          </header>
          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full max-w-140" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full max-w-140" />
            </div>
            <Skeleton className="h-9 w-32 justify-self-start" />
          </div>
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading waitlist settings…
      </p>
    </div>
  );
}
