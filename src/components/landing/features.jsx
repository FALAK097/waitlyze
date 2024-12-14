"use client";

import { motion } from "framer-motion";
import { Eye, Paintbrush, Share2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const features = [
	{
		icon: Paintbrush,
		title: "Design Your Form",
		description:
			"Create waitlist forms that match your brand with our intuitive no-code designer.",
		iframe: "/images/HypeItUp_Landing_Page-Demo.mp4",
		badge: "No-Code Designer",
	},
	{
		icon: Share2,
		title: "Launch Your Waitlist",
		description:
			"Embed our waitlist widget into your site or use our hosted page if you don't have a website.",
		iframe: "/images/HypeItUp_Landing_Page-Demo.mp4",
		badge: "Easy Integration",
	},
	{
		icon: Eye,
		title: "Live Demo View",
		description:
			"See changes in real-time with our live demo view while editing your waitlist form.",
		iframe: "/images/HypeItUp_Landing_Page-Demo.mp4",
		badge: "Instant Preview",
	},
];

const textVariant = {
	hidden: { opacity: 0, y: 50 },
	visible: { opacity: 1, y: 0 },
};

const imageVariant = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: { opacity: 1, scale: 1 },
};

const childVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
		},
	},
};

export default function Features() {
	return (
		<section id="features" className="py-20 bg-background">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="mb-12 text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/20"
				>
					Powerful Features
				</motion.h2>
				<div className="space-y-12">
					{features.map((feature, index) => (
						<motion.div
							key={`${feature.title}-${index}`}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, amount: 0.3 }}
							transition={{ duration: 0.6, staggerChildren: 0.2 }}
							className={`flex flex-col md:flex-row ${
								index % 2 === 0 ? "md:flex-row-reverse" : ""
							} items-center gap-8`}
						>
							<motion.div
								className="flex justify-center w-full md:w-1/2"
								variants={imageVariant}
								transition={{ duration: 0.8 }}
							>
								<div className="p-4 rounded-lg shadow-lg bg-background">
									<video
										src={feature.iframe}
										className="w-full h-auto rounded-lg"
										autoPlay
										loop
										muted
									/>
								</div>
							</motion.div>

							<motion.div
								className="w-full text-center md:w-1/2 md:text-left"
								variants={textVariant}
								transition={{ duration: 0.8 }}
							>
								<div className="flex flex-col items-center text-center md:items-start md:text-left">
									<motion.div
										className="p-3 mb-4 rounded-full bg-primary/10"
										whileHover={{ scale: 1.2 }}
										whileTap={{ scale: 0.95 }}
									>
										<feature.icon className="w-8 h-8 text-primary" />
									</motion.div>
									<h3 className="mb-2 text-xl font-semibold">
										{feature.title}
									</h3>
									<Badge
										className="px-3 py-1 mb-4 text-xs font-medium text-purple-700 bg-purple-100 rounded-full"
										variant="outline"
									>
										{feature.badge}
									</Badge>
									<p className="mb-4 text-muted-foreground">
										{feature.description}
									</p>
									<motion.div variants={childVariants}>
										<Link href="/dashboard">
											<motion.div
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
											>
												<Button className="px-6 py-2 group">
													Create Waitlist Now
												</Button>
											</motion.div>
										</Link>
									</motion.div>
								</div>
							</motion.div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
