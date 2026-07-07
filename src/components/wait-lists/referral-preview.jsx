"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { m } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ReferralStatsCards } from "./referral-stats-cards";
import { ShareButtons } from "./share-buttons";

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export const ReferralPreview = ({
	signUp,
	waitList,
	getTotalSignUpsOnWaitList,
	initialSignUpsCount,
}) => {
	const referralLink = `${window.location.origin}/forms/${waitList.id}?r=${signUp.uniqueUserId}`;
	const [totalSignUps, setTotalSignUps] = useState(initialSignUpsCount || 0);

	useEffect(() => {
		const fetchTotalSignUps = async () => {
			try {
				const count = await getTotalSignUpsOnWaitList();
				setTotalSignUps(count);
			} catch (error) {
				console.error("Error fetching total sign ups:", error);
			}
		};

		fetchTotalSignUps();
		const interval = setInterval(fetchTotalSignUps, 10000);
		return () => clearInterval(interval);
	}, [getTotalSignUpsOnWaitList]);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(referralLink);
		toast.success("Copied to clipboard");
	};

	return (
		<div className="p-4 min-h-screen bg-linear-to-b from-primary/5 to-background">
			<m.div
				className="pt-12 mx-auto space-y-8 max-w-md"
				variants={container}
				initial="hidden"
				animate="show"
			>
				<m.div variants={item} className="space-y-2 text-center">
					<h1 className="text-4xl font-bold tracking-tight">
						Signed up for{" "}
						<span className="text-primary">
							{waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)}
						</span>
					</h1>
					<p className="text-muted-foreground">
						Share your referral link to move up in line!
					</p>
				</m.div>

				<m.div variants={item}>
					<Card className="p-6 shadow-lg">
						<div className="space-y-4">
							<div className="space-y-2">
								<p className="text-sm font-medium text-center">
									Your Unique Referral Link
								</p>
								<div className="flex">
									<Input
										value={referralLink}
										readOnly
										className="rounded-r-none border-r-0 bg-muted"
									/>
									<Button
										className="px-8 rounded-l-none"
										onClick={copyToClipboard}
									>
										Copy
									</Button>
								</div>
							</div>
						</div>
					</Card>
				</m.div>

				<ReferralStatsCards rank={signUp.rank} totalSignUps={totalSignUps} />

				<ShareButtons waitList={waitList} referralLink={referralLink} />
			</m.div>
		</div>
	);
};
