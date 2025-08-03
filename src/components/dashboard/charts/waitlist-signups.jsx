import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { signUpData } from "@/utils/chart";
import { format, parseISO } from "date-fns";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export const WaitlistSignups = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Waitlist Signups Over Time</CardTitle>
				<CardDescription>Cumulative total signups</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={signUpData} className="h-[300px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={signUpData}
							margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tick={{ fontSize: 12 }}
								tickFormatter={(date) => format(parseISO(date), "MMM dd")}
							/>
							<YAxis tickLine={false} axisLine={false} />
							<Tooltip content={<ChartTooltipContent />} />
							<Line
								type="monotone"
								dataKey="totalSignups"
								stroke="#FF6B4A"
								strokeWidth={2}
								dot={{ r: 4 }}
								activeDot={{ r: 6 }}
							/>
							<ChartTooltip
								content={<ChartTooltipContent className="w-[150px]" />}
							/>
						</LineChart>
					</ResponsiveContainer>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
