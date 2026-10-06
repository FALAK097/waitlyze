export function WaitlistsTableSkeleton() {
  return (
    <>
      <p className="product-visually-hidden" role="status">Loading waitlists…</p>
      <div className="product-waitlists-loading" aria-busy="true">
        <div className="product-table-wrap product-waitlists-skeleton" aria-hidden="true">
          <div className="product-waitlists-skeleton-header">
            <span className="product-skeleton-block product-skeleton-heading" />
            <span className="product-skeleton-block product-skeleton-heading" />
          </div>
          {Array.from({ length: 4 }, (_, index) => (
            <div className="product-waitlists-skeleton-row" key={index}>
              <div className="product-waitlists-skeleton-name">
                <span className="product-skeleton-block product-skeleton-name" />
                <span className="product-skeleton-block product-skeleton-status" />
                <span className="product-skeleton-block product-skeleton-description" />
              </div>
              <span className="product-skeleton-block product-skeleton-count" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
