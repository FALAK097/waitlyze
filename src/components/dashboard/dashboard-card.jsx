"use client";

import { motion } from "framer-motion";
import { ListPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DashboardCharts } from "./dashboard-charts";
import { UserSegmentation } from "./user-segmentation";

export default function DashboardCard({ waitListIds }) {
	const [activeTab, setActiveTab] = useState("signups");
	const [selectedWaitlistId, setSelectedWaitlistId] = useState("");
	const router = useRouter();

	useEffect(() => {
		const savedWaitlistId = localStorage.getItem("selectedWaitlist");
		if (savedWaitlistId) {
			setSelectedWaitlistId(savedWaitlistId);
		}
	}, []);

	const isUserWaitlist = (waitlistId) => {
		return waitListIds.includes(waitlistId);
	};

	return (
		<div className="space-y-4 sm:p-6 lg:px-8">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid grid-cols-2">
					<TabsTrigger value="signups">Sign-ups</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="signups">
					{selectedWaitlistId && isUserWaitlist(selectedWaitlistId) ? (
						<UserSegmentation waitlistId={selectedWaitlistId} />
					) : (
						<Card className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
							<div className="relative w-40 h-40 mb-4">
								<motion.div
									className="absolute inset-0"
									animate={{
										scale: [1, 1.05, 1],
									}}
									transition={{
										duration: 3,
										repeat: Number.POSITIVE_INFINITY,
										repeatType: "reverse",
									}}
								>
									<div className="w-40 h-40 rounded-full bg-linear-to-tr from-purple-500/20 to-blue-500/20" />
								</motion.div>
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 }}
									className="absolute inset-0 flex items-center justify-center"
								>
									<ListPlus className="w-16 h-16 text-muted-foreground" />
								</motion.div>
							</div>
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
							>
								<h3 className="mb-2 text-xl font-semibold">
									No Waitlist Selected
								</h3>
								<p className="mb-6 text-sm text-muted-foreground">
									Please select a waitlist from the dropdown above to view
									sign-ups and analytics.
								</p>
								<Button
									variant="outline"
									onClick={() => router.push("/wait-lists/new")}
								>
									Create New Waitlist
								</Button>
							</motion.div>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="analytics" className="space-y-4">
					<DashboardCharts />
				</TabsContent>
			</Tabs>
		</div>
	);
}
