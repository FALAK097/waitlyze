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
import { trafficData } from "@/utils/chart";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";

const COLORS = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
	"hsl(var(--chart-6))",
];

export const TrafficSource = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Traffic Sources</CardTitle>
				<CardDescription>Where users are coming from</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={trafficData} className="h-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={trafficData}
							layout="horizontal"
							margin={{ top: 20, right: 30, bottom: 10, left: 10 }}
						>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis
								dataKey="name"
								type="category"
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								type="number"
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => `${value}`}
							/>
							<ChartTooltip
								content={<ChartTooltipContent className="w-[150px]" />}
							/>
							<Bar dataKey="user" barSize={20} radius={[4, 4, 0, 0]}>
								{trafficData.map((entry) => (
									<Cell
										key={entry.name}
										fill={COLORS[trafficData.indexOf(entry) % COLORS.length]}
										cursor={"pointer"}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
