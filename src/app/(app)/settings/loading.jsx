import { ProductContentSkeleton } from "@/components/product/content-skeleton";
import "@/components/product/settings-page.css";

export default function SettingsLoading() {
  return <div className="product-settings-page">
    <header className="product-settings-heading">
      <p className="product-settings-eyebrow">Preferences and access</p>
      <h1 className="product-page-title">Settings</h1>
      <p className="product-settings-intro">Manage your account, workspace, connections, and data in one place.</p>
    </header>
    <div className="product-settings-layout" aria-busy="true">
      <div className="product-settings-loading-nav product-content-loading-shape" aria-hidden="true">
        {[1, 2, 1, 1, 1].map((itemCount, group) => <div className="product-settings-loading-nav-group" key={group}><i />{Array.from({ length: itemCount }, (_, index) => <i key={index} />)}</div>)}
      </div>
      <div className="product-settings-loading-nav-mobile product-content-loading-shape" aria-hidden="true"><i /></div>
      <ProductContentSkeleton label="Loading settings" variant="settings" />
    </div>
  </div>;
}
