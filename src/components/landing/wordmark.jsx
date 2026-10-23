export default function Wordmark() {
  return (
    <span className="inline-flex items-center font-product-display text-2xl leading-none font-bold tracking-tighter">
      <span className="mr-2 inline-flex h-7 -skew-x-12 items-center gap-0.5" aria-hidden="true">
        <i className="block h-4 w-1 rounded-sm bg-product-accent-solid" />
        <i className="block h-6 w-1 rounded-sm bg-product-accent-solid" />
        <i className="block h-5 w-1 rounded-sm bg-product-accent-solid" />
      </span>
      waitlyze<span className="text-product-success-text">.</span>
    </span>
  );
}
