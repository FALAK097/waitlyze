"use client";

import { motion } from "framer-motion";
import { LineChartIcon, Wand2, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const steps = [
	{
		icon: Wand2,
		title: "Step 1: Create Your Campaign",
		description:
			"Design a custom waitlist tailored to your goals using our intuitive builder.",
		badge: "Customizable",
	},
	{
		icon: Zap,
		title: "Step 2: Launch with Ease",
		description:
			"Share your waitlist instantly via our hosted page or embed it on your website.",
		badge: "Instant Sharing",
	},
	{
		icon: LineChartIcon,
		title: "Step 3: Track and Optimize",
		description:
			"Monitor sign-ups and adjust your strategy to maximize engagement.",
		badge: "Analytics-Driven",
	},
];

const textVariant = {
	hidden: { opacity: 0, y: 50 },
	visible: { opacity: 1, y: 0 },
};

const iconVariant = {
	hidden: { opacity: 0, scale: 0.5 },
	visible: { opacity: 1, scale: 1 },
};

export default function HowItWorks() {
	return (
		<section id="how-it-works" className="py-24 bg-background">
			<div className="container px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
				<div className="mx-auto mb-16 max-w-3xl text-center">
					<div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[#ff7e5f]/10">
						<Zap className="w-4 h-4 text-[#ff7e5f]" />
						<span className="text-xs font-light tracking-wider text-[#ff7e5f]">HOW IT WORKS</span>
					</div>
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mb-6 text-3xl font-medium text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/20 sm:text-4xl"
					>
						Simple Three-Step Process
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mx-auto mb-12 text-lg font-light leading-relaxed text-gray-600 dark:text-gray-300"
					>
						Get started in seconds with our simple three-step process to launch and grow your waitlist campaign.
					</motion.p>
				</div>
				<div className="grid gap-16 md:gap-12 lg:gap-16 md:grid-cols-3">
					{steps.map((step, index) => (
						<motion.div
							key={`${step.title}-${index}`}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, amount: 0.3 }}
							transition={{ duration: 0.6, delay: index * 0.2 }}
							className="flex flex-col items-center text-center"
						>
							<motion.div
								className="p-3 mb-4 rounded-full bg-primary/10"
								variants={iconVariant}
							>
								<step.icon className="w-8 h-8 text-primary" />
							</motion.div>
							<motion.h3
								className="mb-2 text-xl font-light"
								variants={textVariant}
							>
								{step.title}
							</motion.h3>
							<motion.div variants={textVariant}>
								<Badge
									className="px-3 py-1 mb-4 text-xs font-medium rounded-full text-primary bg-primary/10"
									variant="outline"
								>
									{step.badge}
								</Badge>
							</motion.div>
							<motion.p
								className="mb-4 font-light text-muted-foreground"
								variants={textVariant}
							>
								{step.description}
							</motion.p>
						</motion.div>
					))}
				</div>
				<motion.div
					className="mt-12 text-center"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.6 }}
				>
					<Link href="/dashboard">
						<Button size="lg" className="px-8 py-3 text-lg">
							Get Started Now
						</Button>
					</Link>
				</motion.div>
			</div>
		</section>
	);
}
