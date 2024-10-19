import { Button } from "@/components/ui/button";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { peakInterestData } from "@/utils/chart";
import { useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

export const InterestTime = () => {
	const [view, setView] = useState("daily");

	const CustomLegend = () => (
		<div className="flex justify-end mb-2 space-x-4">
			<div className="flex items-center">
				<div className="w-3 h-3 mr-2 bg-orange-400 rounded-xl" />
				<span className="text-sm">{view === "daily" ? "Hours" : "Date"}</span>
			</div>
			<div className="flex items-center">
				<div className="w-3 h-3 mr-2 bg-primary rounded-xl" />
				<span className="text-sm">Users</span>
			</div>
		</div>
	);

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Peak Interest Times for Waitlist</CardTitle>
					<CardDescription>Chart showing user activity trends</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between mb-4">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">
									View: {view === "daily" ? "Hourly" : "Weekly"}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => setView("daily")}
								>
									Hourly View
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => setView("weekly")}
								>
									Weekly View
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<CustomLegend />
					</div>
					<ChartContainer
						config={{
							users: {
								label: "Users",
								color: "hsl(var(--primary))",
							},
						}}
						className="h-[300px] w-full"
					>
						<BarChart data={peakInterestData[view]}>
							<XAxis
								dataKey={view === "daily" ? "hour" : "date"}
								tickLine={false}
								axisLine={false}
								fontSize={12}
								textAnchor="middle"
								height={50}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => `${value}`}
								fontSize={12}
							/>
							<Bar
								dataKey="users"
								fill="hsl(var(--primary))"
								radius={[4, 4, 0, 0]}
							/>
							<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>
		</>
	);
};
