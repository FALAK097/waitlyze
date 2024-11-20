"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Eye, Paintbrush, Rocket, Sliders } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";

const steps = [
	{
		icon: Paintbrush,
		title: "Design",
		description: "Use our no-code designer to create a branded waitlist form.",
		color: "from-pink-500 to-rose-500",
	},
	{
		icon: Sliders,
		title: "Customize",
		description: "Add fields, change colors, and set up email notifications.",
		color: "from-purple-500 to-indigo-500",
	},
	{
		icon: Eye,
		title: "Preview",
		description: "See your changes in real-time with our live demo view.",
		color: "from-blue-500 to-cyan-500",
	},
	{
		icon: Rocket,
		title: "Launch",
		description: "Embed the form on your site or share our hosted page.",
		color: "from-orange-500 to-amber-500",
	},
];

export default function HowItWorks() {
	const [hoveredIndex, setHoveredIndex] = useState(null);

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
			},
		},
	};

	const cardVariants = {
		hidden: { opacity: 0, y: 40 },
		visible: { opacity: 1, y: 0 },
	};

	return (
		<section
			id="howitworks"
			className="relative py-20 overflow-hidden bg-gradient-to-t from-primary/5 to-background"
		>
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-foreground"
				>
					How It Works
				</motion.h2>
				<div className="flex justify-center mt-4 mb-12">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<Badge
							variant="outline"
							className="px-4 py-2 font-medium text-center rounded-full text-md"
						>
							Simple 4-Step Process
						</Badge>
					</motion.div>
				</div>
				<motion.div
					className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
					variants={containerVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true }}
				>
					{steps.map((step, index) => (
						<motion.div
							key={`${step.title}-${index}`}
							variants={cardVariants}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<Card
								className="overflow-hidden transition-all duration-300 bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20"
								onMouseEnter={() => setHoveredIndex(index)}
								onMouseLeave={() => setHoveredIndex(null)}
							>
								<motion.div
									className={`h-2 bg-gradient-to-r ${step.color}`}
									initial={{ width: "0%" }}
									animate={{ width: hoveredIndex === index ? "100%" : "0%" }}
									transition={{ duration: 0.3 }}
								/>
								<CardHeader className="relative pt-16">
									<div
										className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-3 mt-10 rounded-full bg-gradient-to-br ${step.color}`}
									>
										<step.icon className="w-8 h-8 text-white" />
									</div>
									<CardTitle className="text-xl font-semibold text-center">
										{step.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-center text-muted-foreground">
										{step.description}
									</p>
								</CardContent>
								<div className="flex justify-center pb-6">
									<motion.span
										className={`px-4 py-2 text-sm font-medium text-white rounded-md bg-gradient-to-r ${step.color}`}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										Step {index + 1}
									</motion.span>
								</div>
							</Card>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
