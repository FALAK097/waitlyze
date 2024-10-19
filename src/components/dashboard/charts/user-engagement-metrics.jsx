"use client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { userMetricData } from "@/utils/chart";
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from "recharts";

export const UserEngagementMetrics = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>User Engagement Metrics</CardTitle>
				<CardDescription>Comparison of key engagement metrics</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center">
				<ChartContainer
					config={{
						A: { label: "This Week", color: "hsl(var(--chart-1))" },
						B: { label: "Last Week", color: "hsl(var(--chart-2))" },
					}}
					className="h-[400px] w-full"
				>
					<ResponsiveContainer width="100%" height="100%">
						<RadarChart
							cx="50%"
							cy="50%"
							outerRadius="80%"
							data={userMetricData}
						>
							<PolarGrid stroke="hsl(var(--foreground) / 0.2)" />
							<PolarAngleAxis
								dataKey="metric"
								tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
							/>
							<PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} />
							<Radar
								name="This Week"
								dataKey="A"
								stroke="hsl(var(--chart-1))"
								fill="hsl(var(--chart-1))"
								fillOpacity={0.6}
							/>
							<Radar
								name="Last Week"
								dataKey="B"
								stroke="hsl(var(--chart-2))"
								fill="hsl(var(--chart-2))"
								fillOpacity={0.6}
							/>
							<ChartTooltip content={<ChartTooltipContent />} />
							<ChartLegend
								align="right"
								verticalAlign="bottom"
								iconType="circle"
								wrapperStyle={{
									paddingTop: "20px",
									margin: "2px",
								}}
							/>
						</RadarChart>
					</ResponsiveContainer>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
