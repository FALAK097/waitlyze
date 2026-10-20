import { Skeleton } from "@/components/ui/skeleton";

export function SettingsPanelSkeleton() {
  return (
    <div className="product-settings-panel-loading" aria-busy="true">
      <p className="sr-only" role="status">
        Loading settings…
      </p>
      <div className="grid gap-3" aria-hidden="true">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3.5 w-3/5" />
        <div className="mt-6 grid gap-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-11 w-full max-w-120" />
          <Skeleton className="h-3.5 w-2/5" />
        </div>
        <div className="mt-6 grid gap-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
      </div>
    </div>
  );
}
