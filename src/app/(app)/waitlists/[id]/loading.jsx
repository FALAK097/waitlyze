import { ProductContentSkeleton } from "@/components/product/content-skeleton";

export default function WaitlistLoading() {
  return <section className="product-ui" aria-label="Loading waitlist">
    <ProductContentSkeleton label="Loading waitlist" variant="campaign" />
  </section>;
}
