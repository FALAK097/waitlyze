import "@/components/product/settings-page.css";
import "@/components/product/waitlist-settings.css";
import { Skeleton } from "@/components/ui/skeleton";

export default function WaitlistSettingsLoading() {
  return (
    <div className="product-settings-page product-waitlist-settings-page" aria-busy="true">
      <div className="product-settings-layout">
        <aside className="product-settings-menu" aria-hidden="true">
          <nav className="product-settings-section-nav">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-11 w-full rounded-lg" />
            ))}
          </nav>
        </aside>
        <div className="product-settings-content" aria-hidden="true">
          <header>
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
