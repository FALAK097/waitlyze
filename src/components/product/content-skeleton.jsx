const shape = "block rounded bg-product-bg-inset motion-safe:animate-pulse";

const campaignBack = "flex h-6 items-center";
const campaignHeading = "mt-2 mb-4 grid gap-2.5";
const campaignNav = "flex gap-2 overflow-hidden border-b border-product-border-subtle";
const createPanel =
  "mx-auto grid w-full max-w-2xl justify-items-center gap-3 rounded-xl border border-product-border-subtle bg-product-bg-surface px-6 py-16 text-center";
const pageHeading = "mt-3 mb-2 grid gap-2.5";
const pagePanel =
  "grid grid-cols-3 gap-3.5 rounded-xl border border-product-border-subtle bg-product-bg-surface p-5 max-[600px]:grid-cols-2 max-[600px]:p-4";
const pagePanelSecondary = "grid-cols-1";
const tableHead =
  "flex min-h-12 items-center gap-4 rounded-t-xl border border-b-0 border-product-border-subtle bg-product-bg-surface px-5 max-[520px]:gap-2.5 max-[520px]:px-3";
const tableRow =
  "flex min-h-16 items-center gap-4 border-x border-b-0 border-product-border-subtle bg-product-bg-surface px-5 last:rounded-b-xl last:border-b max-[520px]:gap-2.5 max-[520px]:px-3";
const panel =
  "grid grid-cols-4 gap-4 rounded-xl border border-product-border-subtle bg-product-bg-surface p-5 max-[600px]:grid-cols-2 max-[600px]:gap-3 max-[600px]:p-4";
const columns = "grid grid-cols-3 gap-3 max-[600px]:grid-cols-2";
const chart = "min-h-44 items-end";
const settingsGroup = "grid gap-3";
const settingsHeading = "grid gap-2 pt-2 pb-1";
const settingsPanel =
  "grid gap-3.5 rounded-xl border border-product-border-subtle bg-product-bg-surface p-5";

export function ProductContentSkeleton({ label, variant = "detail", rows = 5 }) {
  return (
    <div className="mt-6 grid gap-3">
      <p role="status" aria-live="polite" className="text-sm text-product-text-secondary">
        {label}…
      </p>
      <div className="grid gap-3" aria-busy="true">
        <div className="grid gap-3" aria-hidden="true">
          {variant === "create" ? (
            <div className={createPanel}>
              <i className={`${shape} h-7.5 w-2/5`} />
              <i className={`${shape} h-3.5 w-3/4`} />
              <i className={`${shape} mt-2 h-11 w-36`} />
              <i className={`${shape} mt-2 h-3 w-28`} />
            </div>
          ) : variant === "campaign" ? (
            <>
              <div className={campaignBack}>
                <i className={`${shape} h-3 w-36`} />
              </div>
              <div className={campaignHeading}>
                <i className={`${shape} h-7.5 w-3/5`} />
                <i className={`${shape} h-3.5 w-3/4`} />
              </div>
              <div className={campaignNav}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <i key={item} className={`${shape} h-10 w-22 shrink-0`} />
                ))}
              </div>
              <div className={`${pagePanel} mt-4.5`}>
                <i className={`${shape} col-span-full h-3.5 w-1/6`} />
                <i className={`${shape} h-12`} />
                <i className={`${shape} h-12`} />
                <i className={`${shape} h-12 max-[600px]:hidden`} />
              </div>
            </>
          ) : variant === "page" ? (
            <>
              <div className={pageHeading}>
                <i className={`${shape} h-7.5 w-1/2`} />
                <i className={`${shape} h-3.5 w-3/4`} />
              </div>
              <div className={pagePanel}>
                <i className={`${shape} col-span-full h-3.5 w-1/6`} />
                <i className={`${shape} h-12`} />
                <i className={`${shape} h-12`} />
                <i className={`${shape} h-12 max-[600px]:hidden`} />
              </div>
              <div className={`${pagePanel} ${pagePanelSecondary}`}>
                <i className={`${shape} h-4.5 w-1/4`} />
                <i className={`${shape} h-3.5 w-3/4`} />
                <i className={`${shape} h-3.5 w-1/2`} />
              </div>
            </>
          ) : variant === "table" ? (
            <>
              <div className={tableHead}>
                <i className={`${shape} h-2.75 w-1/3`} />
                <i className={`${shape} h-2.75 w-1/8`} />
                <i className={`${shape} h-2.75 w-1/8 max-[520px]:hidden`} />
              </div>
              {Array.from({ length: rows }, (_, index) => (
                <div key={index} className={tableRow}>
                  <i className={`${shape} h-3.5 w-1/2`} />
                  <i className={`${shape} h-3.5 w-1/6`} />
                  <i className={`${shape} h-3.5 w-1/6 max-[520px]:hidden`} />
                </div>
              ))}
            </>
          ) : variant === "settings" ? (
            [1, 2, 1, 1, 1].map((panelCount, index) => (
              <div className={settingsGroup} key={index}>
                <div className={settingsHeading}>
                  <i className={`${shape} h-4.5 w-1/5`} />
                  <i className={`${shape} h-3 w-2/3`} />
                </div>
                {Array.from({ length: panelCount }, (_, panelIndex) => (
                  <div className={settingsPanel} key={panelIndex}>
                    <i className={`${shape} h-4 w-1/4`} />
                    <i className={`${shape} h-3 w-5/6`} />
                    <i className={`${shape} mt-1 h-9 w-1/2`} />
                  </div>
                ))}
              </div>
            ))
          ) : (
            <>
              <div className={panel}>
                <i className={`${shape} col-span-full h-3 w-1/5`} />
                <i className={`${shape} h-13`} />
                <i className={`${shape} h-13`} />
                <i className={`${shape} h-13 max-[600px]:hidden`} />
              </div>
              <div className={columns}>
                <i className="h-22 rounded-lg border border-product-border-subtle bg-product-bg-surface motion-safe:animate-pulse" />
                <i className="h-22 rounded-lg border border-product-border-subtle bg-product-bg-surface motion-safe:animate-pulse" />
                <i className="h-22 rounded-lg border border-product-border-subtle bg-product-bg-surface motion-safe:animate-pulse max-[600px]:hidden" />
              </div>
              <div className={`${panel} ${chart}`}>
                <i className={`${shape} col-span-full h-3 w-1/5`} />
                <i className={`${shape} h-15.5`} />
                <i className={`${shape} h-11.5`} />
                <i className={`${shape} h-22`} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
