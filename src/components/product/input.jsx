import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }) {
  return <input data-slot="product-input" type={type} className={cn("product-input", className)} {...props} />;
}
