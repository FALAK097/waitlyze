import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(function Input({ className, type = "text", ...props }, ref) {
  return <input ref={ref} data-slot="product-input" type={type} className={cn("product-input", className)} {...props} />;
});
