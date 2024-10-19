"use client";

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
import { chartConfig, chartData, peakInterestData } from "@/utils/chart";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const DashboardCharts = () => {
	const [view, setView] = useState("daily");
	const [activeChart, setActiveChart] = useState("desktop");
	const total = useMemo(
		() => ({
			desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
			mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
		}),
		[],
	);

	const CustomTooltip = ({ active, payload, label }) => {
		if (active && payload && payload.length) {
			return (
				<div className="p-2 border rounded-md shadow-md bg-background border-border">
					<p className="text-sm font-medium">
						{view === "daily" ? `Hours: ${label}` : `Date: ${label}`}
					</p>
					<p className="text-sm">{`Users: ${payload[0].value}`}</p>
				</div>
			);
		}
		return null;
	};

	const CustomLegend = () => (
		<div className="flex justify-end mb-2 space-x-4">
			<div className="flex items-center">
				<div className="w-3 h-3 mr-2 bg-primary" />
				<span className="text-sm">{view === "daily" ? "Hours" : "Date"}</span>
			</div>
			<div className="flex items-center">
				<div className="w-3 h-3 mr-2 bg-secondary" />
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
							<ChartTooltip cursor={false} content={<CustomTooltip />} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-col items-stretch p-0 space-y-0 border-b sm:flex-row">
					<div className="flex flex-col justify-center flex-1 gap-1 px-6 py-5 sm:py-6">
						<CardTitle>Total Visitors by Device</CardTitle>
						<CardDescription>
							Chart showing total visitors by device type
						</CardDescription>
					</div>
					<div className="flex">
						{["desktop", "mobile"].map((key) => {
							const chart = key;
							return (
								// biome-ignore lint/a11y/useButtonType: <explanation>
								<button
									key={chart}
									data-active={activeChart === chart}
									className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
									onClick={() => setActiveChart(chart)}
								>
									<span className="text-xs text-muted-foreground">
										{chartConfig[chart].label}
									</span>
									<span className="text-lg font-bold leading-none sm:text-3xl">
										{total[key].toLocaleString()}
									</span>
								</button>
							);
						})}
					</div>
				</CardHeader>
				<CardContent className="px-2 sm:p-6">
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-[250px] w-full"
					>
						<BarChart
							accessibilityLayer
							data={chartData}
							margin={{
								left: 12,
								right: 12,
							}}
						>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={32}
								tickFormatter={(value) => {
									const date = new Date(value);
									return date.toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									});
								}}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										className="w-[150px]"
										nameKey="views"
										labelFormatter={(value) => {
											return new Date(value).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: "numeric",
											});
										}}
									/>
								}
							/>
							<Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>
		</>
	);
};
