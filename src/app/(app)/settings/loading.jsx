import { SettingsPanelSkeleton } from "@/components/product/settings-panel-skeleton";
import { SettingsSectionNavigation } from "@/components/product/settings-section-nav";

export default function SettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-280">
      <div className="flex items-start gap-8 max-[760px]:flex-col max-[760px]:gap-8 lg:gap-12 xl:gap-18">
        <aside className="sticky top-6 w-52.5 min-w-0 shrink-0 max-[760px]:static max-[760px]:w-full">
          <h1 className="mt-0! mb-7.5! text-xl! max-[760px]:mb-4!">Settings</h1>
          <SettingsSectionNavigation />
        </aside>
        <SettingsPanelSkeleton />
      </div>
    </div>
  );
}
