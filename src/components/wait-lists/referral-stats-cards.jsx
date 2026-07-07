"use client";

import { Card } from "@/components/ui/card";
import { m } from "framer-motion";
import { Loader2 } from "lucide-react";

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export const ReferralStatsCards = ({ rank, totalSignUps }) => {
	return (
		<m.div variants={item} className="grid grid-cols-2 gap-4">
			<Card className="p-6 shadow-lg">
				<div className="space-y-2 text-center">
					<p className="text-sm font-medium text-muted-foreground">
						Your Position
					</p>
					<m.p
						className="text-5xl font-bold"
						initial={{ scale: 0.01 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 200, damping: 10 }}
						style={{ transformOrigin: "center" }}
					>
						{rank}
					</m.p>
				</div>
			</Card>
			<Card className="p-6 shadow-lg">
				<div className="space-y-2 text-center">
					<p className="text-sm font-medium text-muted-foreground">
						Total Sign Ups
					</p>
					<m.p
						className="text-5xl font-bold"
						initial={{ scale: 0.01 }}
						animate={{ scale: 1 }}
						transition={{
							type: "spring",
							stiffness: 200,
							damping: 10,
							delay: 0.1,
						}}
						style={{ transformOrigin: "center" }}
					>
						{totalSignUps > 0 ? (
							totalSignUps
						) : (
							<span className="flex justify-center items-center">
								<Loader2 className="w-8 h-8 animate-spin" />
							</span>
						)}
					</m.p>
				</div>
			</Card>
		</m.div>
	);
};
