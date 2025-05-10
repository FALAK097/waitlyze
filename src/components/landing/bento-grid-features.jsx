"use client";

import { BarChart3, Database, Globe, Share2, Smartphone } from "lucide-react";
import { Badge } from "../ui/badge";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";

const items = [
	{
		title: "Analytics Dashboard",
		description:
			"Track sign-up performance in real-time. Gain valuable insights into your waitlist's growth and engagement metrics.",
		badge: "Real-Time Data",
		header: (
			<div className="flex items-center justify-center w-full h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-xl">
				<BarChart3 className="w-12 h-12 text-white" />
			</div>
		),
		className: "md:col-span-2",
		icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
	},
	{
		title: "Custom Domain",
		description:
			"Use our subdomain or connect your own domain. Enhance brand consistency and trust with a personalized waitlist URL.",
		badge: "Branding",
		header: (
			<div className="flex items-center justify-center w-full h-full bg-linear-to-br from-green-400 to-teal-500 rounded-xl">
				<Globe className="w-12 h-12 text-white" />
			</div>
		),
		className: "md:col-span-1",
		icon: <Globe className="w-6 h-6 text-teal-500" />,
	},
	{
		title: "Social Integrations",
		description:
			"Share waitlists directly on social platforms. Amplify your reach and make it easy for users to spread the word.",
		badge: "Multi-Platform",
		header: (
			<div className="flex items-center justify-center w-full h-full bg-linear-to-r from-indigo-500 to-purple-600 rounded-xl">
				<Share2 className="w-12 h-12 text-white" />
			</div>
		),
		className: "md:col-span-1",
		icon: <Share2 className="w-6 h-6 text-indigo-500" />,
	},
	{
		title: "Responsive Design",
		description:
			"Optimize for desktop and mobile. Ensure a seamless experience for users signing up on any device, anywhere.",
		badge: "Cross-Device",
		header: (
			<div className="flex items-center justify-center w-full h-full bg-linear-to-r from-orange-400 to-red-500 rounded-xl">
				<Smartphone className="w-12 h-12 text-white" />
			</div>
		),
		className: "md:col-span-1",
		icon: <Smartphone className="w-6 h-6 text-orange-500" />,
	},
	{
		title: "Data Management",
		description:
			"Easily export and import user signups data. Manage your waitlist data efficiently",
		badge: "Flexibility",
		header: (
			<div className="flex items-center justify-center w-full h-full bg-linear-to-br from-yellow-400 to-orange-500 rounded-xl">
				<Database className="w-12 h-12 text-white" />
			</div>
		),
		className: "md:col-span-1",
		icon: <Database className="w-6 h-6 text-orange-500" />,
	},
];

export default function BentoGridFeatures() {
	return (
		<section className="py-20 bg-background">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<h2 className="mb-12 text-4xl font-bold text-center text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/30">
					All-in-One Toolkit for SaaS Validation
				</h2>
				<BentoGrid className="max-w-6xl mx-auto grid auto-rows-[15rem] md:auto-rows-[20rem] gap-6">
					{items.map((item) => (
						<BentoGridItem
							key={item.title}
							title={
								<h3 className="text-lg font-semibold">
									{item.title}{" "}
									<Badge className="ml-2 text-xs text-purple-700 bg-purple-100 cursor-default hover:bg-purple-200">
										{item.badge}
									</Badge>
								</h3>
							}
							description={item.description}
							header={item.header}
							className={item.className}
							icon={item.icon}
						/>
					))}
				</BentoGrid>
			</div>
		</section>
	);
}
