import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const CHART_COLORS = {
	primary: '#FF9D7A',
	primaryLight: '#FFC9B8',
	grid: '#E5E7EB',
	text: '#374151',
};

const fetchSignupData = async (waitListId) => {
	const response = await fetch(`/api/signups?waitListId=${waitListId}`);
	const data = await response.json();
	return data;
};

const processSignupData = (data) => {
	const signupsByDate = data.data.reduce((acc, signup) => {
		const date = new Date(signup.createdAt).toISOString().split('T')[0];
		acc[date] = (acc[date] || 0) + 1;
		return acc;
	}, {});

	const sortedDates = Object.keys(signupsByDate).sort();

	let cumulativeTotal = 0;
	return sortedDates.map(date => ({
		date,
		dailySignups: signupsByDate[date],
		totalSignups: cumulativeTotal += signupsByDate[date]
	}));
};

export const WaitlistSignups = ({ waitListId }) => {
	const { data, isLoading } = useQuery({
		queryKey: ["waitlist-signups", waitListId],
		queryFn: () => fetchSignupData(waitListId),
		enabled: !!waitListId,
	});

	const signupData = useMemo(() => {
		if (!data?.success || !data?.data) return [];
		return processSignupData(data);
	}, [data]);

	if (!signupData.length) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Waitlist Signups Over Time</CardTitle>
					<CardDescription>{isLoading ? "Loading..." : "No signup data available"}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Waitlist Signups Over Time</CardTitle>
				<CardDescription>Cumulative total signups</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={signupData} className="h-[300px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={signupData}
							margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickFormatter={(date) => format(parseISO(date), "MMM dd")}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								allowDecimals={false}
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
							/>
							<Tooltip
								content={
									<ChartTooltipContent
										formatter={(value, name) => {
											if (name === 'totalSignups') return [value, 'Total Signups'];
											if (name === 'dailySignups') return [value, 'Daily Signups'];
											return [value, name];
										}}
									/>
								}
							/>
							<Line
								type="monotone"
								dataKey="totalSignups"
								name="Total Signups"
								stroke={CHART_COLORS.primary}
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								dot={{ r: 4, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }}
								activeDot={{ r: 6, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
