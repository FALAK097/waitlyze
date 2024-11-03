"use client";

import { DeviceType } from "./charts/device-type";
import { GeographicDistribution } from "./charts/geographic-distribution";
import { InterestTime } from "./charts/interest-time";
import { WaitlistSignups } from "./charts/waitlist-signups";

export const DashboardCharts = () => {
	return (
		<>
			<InterestTime />
			<WaitlistSignups />
			{/* <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
				<UserEngagementMetrics />
				<TrafficSource />
			</div> */}
			<div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
				<DeviceType />
				<GeographicDistribution />
			</div>
		</>
	);
};
