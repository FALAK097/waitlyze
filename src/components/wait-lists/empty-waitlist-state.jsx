"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmptyWaitlistState() {
	const router = useRouter();

	const handleCreateWaitlist = () => {
		router.push("/wait-lists/new");
	};

	return (
		<div className="flex min-h-[400px] w-full flex-col items-center justify-center px-4 text-center">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="mb-8"
			>
				<svg
					className="w-40 h-40 mx-auto text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						vectorEffect="non-scaling-stroke"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={0.5}
						d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
					/>
				</svg>
			</motion.div>
			<motion.h3
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.5 }}
				className="mb-2 text-2xl font-semibold text-foreground"
			>
				No waitlists yet
			</motion.h3>
			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.3, duration: 0.5 }}
				className="max-w-md mb-8 text-muted-foreground"
			>
				Get started by creating your first waitlist. It's easy and only takes a
				few minutes.
			</motion.p>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4, duration: 0.5 }}
			>
				<Button onClick={handleCreateWaitlist} size="lg">
					<PlusCircle className="w-5 h-5" />
					Create Your First Waitlist
				</Button>
			</motion.div>
		</div>
	);
}
