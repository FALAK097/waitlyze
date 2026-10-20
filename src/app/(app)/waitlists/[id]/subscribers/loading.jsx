import { ProductContentSkeleton } from "@/components/product/content-skeleton";

export default function SubscribersLoading() {
  return (
    <div className="mt-6">
      <header className="mb-7 flex items-center justify-between gap-6">
        <h1 className="mb-2!">Signups</h1>
      </header>
      <ProductContentSkeleton label="Loading subscribers" variant="table" />
    </div>
  );
}
