"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const plans = [
	{
		name: "Starter",
		price: "$16",
		originalPrice: "$23",
		features: [
			{ name: "Up to 500 signups", available: true },
			{ name: "Unlimited Projects", available: true },
			{ name: "Waitlist Widget", available: true },
			{ name: "Hosted Page", available: true },
			{ name: "Realtime Social Proof", available: false },
			{ name: "Email Verification", available: false },
			{ name: "Waitlist Analytics", available: false },
			{ name: "Gamified Referrals", available: false },
		],
		highlight: false,
		color: "from-pink-500 to-rose-500",
	},
	{
		name: "Pro",
		price: "$35",
		originalPrice: "$50",
		features: [
			{ name: "Up to 2K signups", available: true },
			{ name: "Unlimited Projects", available: true },
			{ name: "Waitlist Widget", available: true },
			{ name: "Hosted Page", available: true },
			{ name: "Realtime Social Proof", available: true },
			{ name: "Email Verification", available: true },
			{ name: "Waitlist Analytics", available: false },
			{ name: "Gamified Referrals", available: false },
		],
		highlight: true,
		color: "from-primary to-primary-foreground",
	},
	{
		name: "Hacker",
		price: "$69",
		originalPrice: "$99",
		features: [
			{ name: "Up to 5K signups", available: true },
			{ name: "Unlimited Projects", available: true },
			{ name: "Waitlist Widget", available: true },
			{ name: "Hosted Page", available: true },
			{ name: "Realtime Social Proof", available: true },
			{ name: "Email Verification", available: true },
			{ name: "Waitlist Analytics", available: true },
			{ name: "Gamified Referrals", available: true },
		],
		highlight: false,
		color: "from-blue-500 to-cyan-500",
	},
];

export default function Pricing() {
	return (
		<section id="pricing" className="py-20 bg-background">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="mb-12 text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/20"
				>
					Choose Your Plan
				</motion.h2>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					{plans.map((plan, index) => (
						<motion.div
							key={plan.name}
							initial={{ opacity: 0, y: 50 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
						>
							<Card
								className={`flex flex-col h-full transition-all duration-300 ${
									plan.highlight
										? "shadow-lg hover:shadow-xl"
										: "shadow hover:shadow-md"
								} relative overflow-hidden`}
							>
								{plan.highlight && (
									<div className="absolute top-0 right-0 px-3 py-1 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-foreground">
										Popular
									</div>
								)}
								<div className={`h-2 bg-gradient-to-r ${plan.color}`} />
								<CardHeader className="text-center">
									<CardTitle className="text-2xl font-bold">
										{plan.name}
									</CardTitle>
									<div className="flex items-baseline justify-center mt-4 space-x-2">
										<p className="text-5xl font-extrabold text-primary">
											{plan.price}
										</p>
										<p className="text-xl text-muted-foreground">/mo</p>
									</div>
									{plan.originalPrice && (
										<p className="mt-1 text-sm text-muted-foreground">
											<span className="line-through">{plan.originalPrice}</span>{" "}
											Save{" "}
											{Math.round(
												(1 -
													Number.parseInt(plan.price.slice(1)) /
														Number.parseInt(plan.originalPrice.slice(1))) *
													100,
											)}
											%
										</p>
									)}
								</CardHeader>
								<CardContent className="flex-grow">
									<ul className="space-y-3">
										{plan.features.map((feature, featureIndex) => (
											<motion.li
												key={feature.name}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{
													duration: 0.3,
													delay: featureIndex * 0.1,
												}}
												className="flex items-center"
											>
												{feature.available ? (
													<Check className="w-5 h-5 mr-2 text-green-500" />
												) : (
													<X className="w-5 h-5 mr-2 text-red-500" />
												)}
												<span
													className={`text-sm ${
														feature.available
															? "text-foreground"
															: "text-muted-foreground line-through"
													}`}
												>
													{feature.name}
												</span>
											</motion.li>
										))}
									</ul>
								</CardContent>
								<CardFooter>
									<Button
										className={`w-full text-white bg-gradient-to-r ${plan.color} hover:opacity-90 transition-opacity duration-300`}
									>
										Get Started
									</Button>
								</CardFooter>
							</Card>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
