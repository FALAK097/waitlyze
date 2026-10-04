"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

// Adapted from shadcn base-nova/button: https://ui.shadcn.com/r/styles/base-nova/button.json
// Keep navigation as real links; Base UI Button always supplies button semantics.
export function Button({ className, variant, size, static: staticFeedback = false, ...props }) {
  return <ButtonPrimitive data-slot="product-button" data-static={staticFeedback || undefined}
    className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
