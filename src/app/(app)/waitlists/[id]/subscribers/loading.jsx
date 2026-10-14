import { ProductContentSkeleton } from "@/components/product/content-skeleton";
import "@/components/dashboard/audience.css";

export default function SubscribersLoading() {
  return <div className="product-section product-audience"><header className="product-page-heading"><h1>Signups</h1></header><ProductContentSkeleton label="Loading subscribers" variant="table" /></div>;
}
