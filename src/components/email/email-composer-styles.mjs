export const emailComposerStyles = Object.freeze({
  pane: "min-w-0 max-w-195 flex flex-col gap-5 lg:flex-1",
  paneHead: "flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-stretch",
  paneTitle: "m-0 text-section font-semibold",
  paneMeta: "m-0 text-caption leading-normal text-product-text-secondary",
  paneActions: "flex shrink-0 flex-wrap items-center justify-end gap-2 max-sm:justify-start",
  fieldCard: "overflow-hidden rounded-lg border border-product-border-subtle bg-white",
  fieldRow:
    "relative flex min-h-13 items-center gap-3 px-4 [&+&]:border-t border-product-border-subtle focus-within:bg-product-bg-inset focus-within:before:absolute focus-within:before:inset-y-0 focus-within:before:left-0 focus-within:before:w-0.5 focus-within:before:bg-product-success-text",
  fieldInput:
    "min-w-0 flex-1 border-0 bg-transparent py-3.5 text-body text-product-text-primary focus-visible:outline-none!",
  canvasShell: "overflow-hidden rounded-lg border border-product-border-subtle bg-white",
  metaBar:
    "flex flex-wrap items-center justify-between gap-3.5 max-sm:flex-col max-sm:items-stretch",
});
