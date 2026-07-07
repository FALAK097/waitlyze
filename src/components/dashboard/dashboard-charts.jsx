"use client";

import { DeviceType } from "./charts/device-type";
import { GeographicDistribution } from "./charts/geographic-distribution";
import { InterestTime } from "./charts/interest-time";
import { WaitlistSignups } from "./charts/waitlist-signups";

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
