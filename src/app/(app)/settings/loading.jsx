import { SettingsSectionNavigation } from "@/components/product/settings-section-nav";
import { SettingsPanelSkeleton } from "@/components/product/settings-panel-skeleton";
import "@/components/product/settings-page.css";

export default function SettingsLoading() {
  return <div className="product-settings-page"><div className="product-settings-layout">
    <aside className="product-settings-menu"><h1 className="product-page-title">Settings</h1><SettingsSectionNavigation /></aside>
    <SettingsPanelSkeleton />
  </div></div>;
}
