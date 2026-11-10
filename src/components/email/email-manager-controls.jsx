import { Button } from "@/components/ui/button";

export const emailManagerScope = "min-w-0 bg-white text-product-text-primary";
export const emailManagerSplit =
  "flex flex-col gap-6 md:gap-8 xl:gap-10 lg:flex-row lg:items-start";
export const emailManagerRail =
  "flex w-full shrink-0 flex-col gap-1 self-start sticky top-22 max-lg:static max-lg:flex-row max-lg:flex-wrap max-lg:gap-1.5 lg:w-52";
const emailManagerRailItem =
  "h-auto min-h-11 flex w-full flex-col items-start justify-start gap-0.75 whitespace-normal rounded-product-control border-0 bg-transparent p-3 text-left cursor-pointer hover:bg-product-bg-inset aria-[current=true]:bg-product-bg-inset disabled:cursor-default disabled:opacity-60 max-lg:min-w-38 max-lg:flex-1 max-lg:shrink focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text!";
export const emailManagerRailTitle = "text-body font-semibold wrap-anywhere";
export const emailManagerRailMeta = "text-micro leading-normal text-product-text-secondary";
export const emailManagerRailTime = "text-micro text-product-text-secondary";
export const emailManagerRailEmpty =
  "m-0 px-3 py-1 text-caption leading-relaxed text-product-text-secondary max-lg:px-1 max-lg:py-0";

export function EmailManagerRailButton({ current, children, ...props }) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-current={current ? "true" : undefined}
      className={emailManagerRailItem}
      {...props}
    >
      {children}
    </Button>
  );
}

export function EmailUnsavedNotice({ children, firstAction, secondAction, className = "" }) {
  return (
    <div
      className={`mb-5.5 flex flex-wrap items-center gap-3 rounded-product-control bg-product-warning-bg px-4 py-3 text-caption ${className}`.trim()}
      role="alert"
    >
      <span className="min-w-45 flex-1">{children}</span>
      {[firstAction, secondAction].map((action) => (
        <Button
          key={action.label}
          type="button"
          variant={action.variant === "outline" ? "outline" : "ghost"}
          className={
            action.variant === "outline"
              ? "min-h-8.5 cursor-pointer rounded-product-control border-product-border-subtle bg-white px-3 text-caption font-semibold text-product-text-primary focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text!"
              : "min-h-8.5 cursor-pointer rounded-product-control border-0 bg-transparent px-3 text-caption font-semibold text-product-text-primary focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text!"
          }
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
