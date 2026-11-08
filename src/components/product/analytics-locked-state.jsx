import { LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { UpgradeButton } from "@/components/shared/upgrade-button";

const previewBars = [42, 58, 49, 71, 62, 82, 67, 92, 75, 100, 80, 88];

export function AnalyticsLockedState({ waitlistName, canManageBilling }) {
  return (
    <main
      className="mx-auto w-full max-w-280 px-4 py-7 sm:px-7 lg:px-10"
      aria-labelledby="analytics-title"
    >
      <header className="mb-7">
        <p className="product-eyebrow">WORKSPACE INSIGHTS</p>
        <h1 id="analytics-title" className="mb-1! text-2xl! font-semibold! tracking-tight!">
          Analytics
        </h1>
        <p className="text-sm text-product-text-secondary">
          {waitlistName
            ? `See how ${waitlistName} is growing.`
            : "See how your waitlists are growing."}
        </p>
      </header>

      <div className="relative overflow-hidden rounded-2xl border border-product-border-subtle bg-product-bg-surface">
        <div className="pointer-events-none p-4 blur-sm select-none sm:p-6" aria-hidden="true">
          <div className="grid grid-cols-2 border border-product-border-subtle bg-product-bg-surface sm:grid-cols-4">
            {[
              ["Visitors", "2,481"],
              ["Signups", "318"],
              ["Conversion", "12.8%"],
              ["Verified", "76.4%"],
            ].map(([label, value]) => (
              <div
                className="border-b border-product-border-subtle p-4 sm:border-r sm:border-b-0"
                key={label}
              >
                <p className="text-xs text-product-text-secondary">{label}</p>
                <p className="mt-2 font-product-display text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-product-border-subtle p-4">
              <p className="font-medium">Visitors and signups</p>
              <div className="mt-6 flex h-44 items-end gap-2">
                {previewBars.map((height, index) => (
                  <span
                    className="h-(--bar-height) flex-1 rounded-t-sm bg-product-accent-solid"
                    key={index}
                    style={{ "--bar-height": `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-product-border-subtle p-4">
              <p className="font-medium">Top sources</p>
              <div className="mt-6 grid gap-4">
                {["Direct", "Social", "Referral", "Search"].map((source, index) => (
                  <div className="flex items-center gap-3" key={source}>
                    <span className="w-24 shrink-0 text-xs text-product-text-secondary">
                      {source}
                    </span>
                    <span className="h-2 flex-1 rounded-full bg-product-bg-inset">
                      <span
                        className="block h-full w-(--bar-width) rounded-full bg-product-accent-solid"
                        style={{ "--bar-width": `${82 - index * 14}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-xs">{82 - index * 14}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 grid place-items-center bg-product-bg-page/68 p-5 text-center backdrop-blur-sm">
          <section className="w-full max-w-md rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6 shadow-xl sm:p-8">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-product-bg-inset text-product-text-primary">
              <HugeiconsIcon icon={LockIcon} size={20} aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-semibold tracking-widest text-product-success-text uppercase">
              Pro feature
            </p>
            <h2 className="mt-2 font-product-display text-2xl font-semibold tracking-tight">
              Turn activity into a clearer picture.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-product-text-secondary">
              Pro unlocks traffic trends, conversion, geography, devices and referral insights. This
              preview uses sample data; your workspace analytics stay private until you upgrade.
            </p>
            <UpgradeButton
              label={canManageBilling ? "Compare Pro plans" : "See Pro plans"}
              feature="Advanced analytics"
              canManageBilling={canManageBilling}
              size="md"
              className="mt-6 justify-center"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
