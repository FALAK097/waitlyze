export function SettingsPanelSkeleton() {
  return <div className="product-settings-panel-loading" aria-busy="true">
    <p className="sr-only" role="status">Loading settings…</p>
    <div className="product-settings-skeleton" aria-hidden="true"><i /><i /><div><i /><i /><i /></div><div><i /><i /></div></div>
  </div>;
}
