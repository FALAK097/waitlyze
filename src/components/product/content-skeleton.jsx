export function ProductContentSkeleton({ label, variant = "detail", rows = 5 }) {
  return <div className={`product-content-loading product-content-loading-${variant}`}>
    <p role="status" aria-live="polite">{label}…</p>
    <div className="product-content-loading-region" aria-busy="true">
      <div className="product-content-loading-shape" aria-hidden="true">
      {variant === "campaign" ? <>
        <div className="product-content-loading-campaign-back"><i /></div>
        <div className="product-content-loading-campaign-heading"><i /><i /></div>
        <div className="product-content-loading-campaign-nav">{[1, 2, 3, 4, 5].map((item) => <i key={item} />)}</div>
        <div className="product-content-loading-page-panel"><i /><i /><i /><i /></div>
      </> : variant === "page" ? <>
        <div className="product-content-loading-page-heading"><i /><i /></div>
        <div className="product-content-loading-page-panel"><i /><i /><i /><i /></div>
        <div className="product-content-loading-page-panel product-content-loading-page-panel-secondary"><i /><i /><i /></div>
      </> : variant === "table" ? <>
        <div className="product-content-loading-table-head"><i /><i /><i /><i /></div>
        {Array.from({ length: rows }, (_, index) => <div className="product-content-loading-table-row" key={index}><i /><i /><i /><i /></div>)}
      </> : variant === "settings" ? [1, 2, 1, 1, 1].map((panelCount, index) => <div className="product-content-loading-settings-group" key={index}>
        <div className="product-content-loading-settings-heading"><i /><i /></div>
        {Array.from({ length: panelCount }, (_, panelIndex) => <div className="product-content-loading-settings-panel" key={panelIndex}><i /><i /><i /></div>)}
      </div>) : <>
        <div className="product-content-loading-panel"><i /><i /><i /><i /></div>
        <div className="product-content-loading-columns"><i /><i /><i /></div>
        <div className="product-content-loading-panel product-content-loading-chart"><i /><i /><i /><i /><i /></div>
      </>}
      </div>
    </div>
  </div>;
}
