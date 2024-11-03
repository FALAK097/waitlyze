"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DashboardCharts } from "./dashboard-charts";
import { UserSegmentation } from "./user-segmentation";

export default function DashboardCard() {
	const [activeTab, setActiveTab] = useState("signups");
	const [selectedWaitlistId, setSelectedWaitlistId] = useState("");

	useEffect(() => {
		const savedWaitlistId = localStorage.getItem("selectedWaitlist");
		if (savedWaitlistId) {
			setSelectedWaitlistId(savedWaitlistId);
		}
	}, []);

	return (
		<div className="space-y-4 sm:p-6 lg:px-8">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid grid-cols-2">
					<TabsTrigger value="signups">Sign-ups</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="signups">
					{selectedWaitlistId ? (
						<UserSegmentation waitlistId={selectedWaitlistId} />
					) : (
						<div>Please select a waitlist.</div>
					)}
				</TabsContent>

				<TabsContent value="analytics" className="space-y-4">
					<DashboardCharts />
				</TabsContent>
			</Tabs>
		</div>
	);
}
