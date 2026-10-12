import "@/components/product/waitlist-settings.css";

export default function WaitlistSettingsLoading() {
  return <div className="product-section product-waitlist-settings" aria-busy="true">
    <header className="product-waitlist-settings-heading"><h1>Settings</h1><p>Manage sharing and connections for this waitlist.</p></header>
    <p className="sr-only" role="status">Loading waitlist settings…</p>
    <div className="product-waitlist-settings-skeleton" aria-hidden="true">{[0, 1, 2, 3].map((item) => <div key={item}><i /><i /></div>)}</div>
  </div>;
}
