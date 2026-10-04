import { cva } from "class-variance-authority";

// Adapted from the shadcn Base Nova recipe; native links share these visual variants.
export const buttonVariants = cva("product-button", {
  variants: {
    variant: {
      default: "product-button-primary",
      outline: "product-button-outline",
      ghost: "product-button-ghost",
      destructive: "product-button-destructive",
    },
    size: { default: "product-button-default", icon: "product-button-icon" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
