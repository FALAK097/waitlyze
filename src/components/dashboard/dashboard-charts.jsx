"use client";

import dynamic from "next/dynamic";

const InterestTime = dynamic(() => import("./charts/interest-time"), { ssr: false });
const WaitlistSignups = dynamic(() => import("./charts/waitlist-signups"), { ssr: false });
const DeviceType = dynamic(() => import("./charts/device-type"), { ssr: false });
const GeographicDistribution = dynamic(() => import("./charts/geographic-distribution"), { ssr: false });

export const DashboardCharts = ({ waitListId }) => {
  return (
    <>
      <InterestTime waitListId={waitListId} />
      <WaitlistSignups waitListId={waitListId} />
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <DeviceType waitListId={waitListId} />
        <GeographicDistribution waitListId={waitListId} />
      </div>
    </>
  );
};
