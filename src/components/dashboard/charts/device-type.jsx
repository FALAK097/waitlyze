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
import { chartConfig, chartData } from "@/utils/chart";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

export const DeviceType = () => {
	const [activeChart, setActiveChart] = useState("desktop");
	const total = useMemo(
		() => ({
			desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
			mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
		}),
		[],
	);

	return (
		<>
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
