import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
const productCardBase =
  "group text-inherit transition-[filter,background-color] focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus active:not-aria-[haspopup]:translate-y-0";
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        filter:
          "rounded-none border-0 border-b-2 border-transparent bg-transparent font-normal text-product-text-secondary transition-colors hover:bg-transparent hover:text-product-text-primary active:not-aria-[haspopup]:translate-y-0 aria-[pressed=true]:border-product-accent-solid aria-[pressed=true]:font-semibold aria-[pressed=true]:text-product-text-primary",
        "product-ghost":
          "border border-transparent bg-transparent text-product-text-secondary transition-colors hover:bg-product-bg-inset hover:text-product-text-primary focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 active:not-aria-[haspopup]:translate-y-0 aria-[current=page]:bg-product-bg-inset aria-[current=page]:text-product-text-primary aria-[pressed=true]:bg-product-bg-inset aria-[pressed=true]:font-medium aria-[pressed=true]:text-product-text-primary",
        "product-card-danger": `${productCardBase} bg-product-danger-bg text-product-danger-text hover:brightness-95`,
        "product-card-muted": `${productCardBase} bg-product-bg-inset hover:bg-product-border-subtle`,
        "product-toggle":
          "rounded-product-control border border-product-border-control bg-white font-semibold text-product-text-primary transition-colors hover:bg-white hover:text-product-text-primary focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text! active:not-aria-[haspopup]:translate-y-0 aria-[pressed=true]:bg-product-bg-inset aria-[pressed=true]:hover:bg-product-bg-inset",
        "product-outline":
          "border-product-border-subtle bg-product-bg-surface text-product-text-primary transition-colors hover:border-product-text-secondary hover:bg-product-bg-inset focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900",
        "product-pill":
          "rounded-full border-product-border-subtle bg-transparent text-product-text-secondary transition-colors hover:bg-product-bg-inset focus-visible:ring-2 focus-visible:ring-product-success-text focus-visible:outline-none focus-visible:ring-inset active:not-aria-[haspopup]:translate-y-0 aria-[pressed=true]:border-product-text-primary aria-[pressed=true]:text-product-text-primary",
        "product-option":
          "border-0 bg-transparent text-product-text-primary transition-colors hover:bg-product-bg-inset focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus active:not-aria-[haspopup]:translate-y-0 aria-[pressed=true]:bg-product-bg-inset",
        "product-inline-link":
          "border-0 bg-transparent font-normal text-product-text-primary underline underline-offset-4 transition-colors hover:bg-transparent hover:text-product-text-secondary focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus active:not-aria-[haspopup]:translate-y-0",
        "table-sort":
          "bg-transparent text-inherit transition-colors hover:bg-transparent hover:text-product-text-primary active:not-aria-[haspopup]:translate-y-0",
        "outline-destructive":
          "border-border bg-background text-destructive hover:bg-destructive/10 hover:text-destructive aria-expanded:bg-destructive/10 aria-expanded:text-destructive dark:border-input dark:bg-input/30 dark:hover:bg-destructive/20",
        "ghost-destructive":
          "text-muted-foreground hover:bg-destructive/10 hover:text-destructive aria-expanded:bg-destructive/10 aria-expanded:text-destructive dark:hover:bg-destructive/20",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        filter: "h-auto min-h-11 px-0 py-2.5 text-sm",
        "table-sort": "h-auto min-h-11 gap-1.5 px-1 text-sm",
        "icon-navigation": "h-10 w-10 rounded-md p-0 max-sm:w-9",
        "metric-switch":
          "h-auto min-h-7 gap-1 rounded-lg px-1.5 py-0.5 ps-2 text-micro [&_svg]:opacity-70",
        dimension:
          "h-auto min-h-8.5 border-0 px-2.25 py-1.25 text-micro focus-visible:ring-2 focus-visible:ring-product-success-text focus-visible:outline-none focus-visible:ring-inset",
        "product-toggle": "h-auto min-h-8.5 px-3 text-caption",
        "menu-item": "h-auto min-h-9 w-full justify-start px-2.5 py-1.5 text-left text-caption",
        "navigation-item":
          "h-auto min-h-11 w-full min-w-0 justify-start gap-3 px-3 py-2.5 text-item font-normal whitespace-normal aria-[current=page]:font-medium max-[760px]:gap-2 max-[760px]:px-2.5",
        card: "h-auto w-full flex-wrap items-start justify-between gap-4 rounded-lg border-0 px-3 py-2.5 text-left font-normal whitespace-normal",
        "auth-provider": "h-auto min-h-12 gap-3 px-4 text-sm",
        "font-category": "h-auto min-h-7 shrink-0 px-2.5 text-micro font-normal capitalize",
        "font-option":
          "h-auto w-full justify-start gap-2 rounded-md px-2.5 py-2 text-left font-normal whitespace-normal",
        "inline-link":
          "h-auto w-full min-w-0 justify-start rounded-none p-0 text-left whitespace-normal",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xl: "h-11 gap-2 px-5",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
function Button({ className, variant = "default", size = "default", ...props }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
export { Button, buttonVariants };
