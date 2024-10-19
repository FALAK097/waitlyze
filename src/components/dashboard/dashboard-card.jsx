"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DashboardCharts } from "./dashboard-charts";
import { UserSegmentation } from "./user-segmentation";

export default function DashboardCard() {
	const [activeTab, setActiveTab] = useState("analytics");

	return (
		<div className="space-y-4 sm:p-6 lg:px-8">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid grid-cols-2">
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
					<TabsTrigger value="signups">Sign-ups</TabsTrigger>
				</TabsList>
				<TabsContent value="analytics" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
								<CardTitle className="text-sm font-medium">
									Total Sign-ups
								</CardTitle>
								<Users className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">2,350</div>
								<p className="text-xs text-muted-foreground">
									+20.1% from last month
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
								<CardTitle className="text-sm font-medium">
									Conversion Rate
								</CardTitle>
								<ArrowUpRight className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">32.5%</div>
								<p className="text-xs text-muted-foreground">
									+4.5% from last week
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
								<CardTitle className="text-sm font-medium">
									Referral Conversions
								</CardTitle>
								<Users className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold">
									1,250 <span className="text-lg">/ 2,350</span>
								</p>
								<p className="text-xs text-muted-foreground">
									+15.2% from last month
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
								<CardTitle className="text-sm font-medium">
									Goal Progress
								</CardTitle>
								<UserCheck className="w-4 h-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">78%</div>
								<Progress value={78} className="mt-2" />
								<p className="mt-2 text-xs text-muted-foreground">
									550 sign-ups to early access
								</p>
							</CardContent>
						</Card>
					</div>

					<DashboardCharts />
				</TabsContent>

				<TabsContent value="signups">
					<UserSegmentation />
				</TabsContent>
			</Tabs>
		</div>
	);
}
