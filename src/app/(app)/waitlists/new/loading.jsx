import { ProductContentSkeleton } from "@/components/product/content-skeleton";

export default function NewWaitlistLoading() {
  return (
    <section className="product-ui" aria-label="Loading new waitlist">
      <ProductContentSkeleton label="Loading new waitlist" variant="create" />
    </section>
  );
}
