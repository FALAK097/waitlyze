"use client";

import { BarChart3, Database, Globe, Share2, Smartphone, Zap, Mail, Settings, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { BentoGrid } from "../ui/bento-grid";
import { Button } from "../ui/button";

const items = [
	{
		title: "Advanced Analytics",
		description:
			"Gain deep insights into your waitlist performance with real-time metrics, conversion tracking, and user behavior analysis to optimize your launch strategy.",
		header: (
			<div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#ff7e5f]/10">
				<BarChart3 className="w-6 h-6 text-[#ff7e5f]" />
			</div>
		),
		className: "group md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-[#ff7e5f]/30 transition-all duration-300 hover:-translate-y-1",
	},
	{
		title: "Custom Branding",
		description:
			"Create a seamless brand experience with custom colors, logos, and domain that align with your unique identity and messaging.",
		header: (
			<div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#ff7e5f]/10">
				<Globe className="w-6 h-6 text-[#ff7e5f]" />
			</div>
		),
		className: "group md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-[#ff7e5f]/30 transition-all duration-300 hover:-translate-y-1",
	},
	{
		title: "Developer Friendly API",
		description:
			"Powerful RESTful APIs and webhooks to seamlessly integrate Waitlyze with your existing tech stack and workflows.",
		header: (
			<div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#ff7e5f]/10">
				<Share2 className="w-6 h-6 text-[#ff7e5f]" />
			</div>
		),
		className: "group md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-[#ff7e5f]/30 transition-all duration-300 hover:-translate-y-1",
	},
	{
		title: "Email & Referral System",
		description:
			"Customize email templates, set up referral programs, and automate your communication to maximize conversions.",
		header: (
			<div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#ff7e5f]/10">
				<Mail className="w-6 h-6 text-[#ff7e5f]" />
			</div>
		),
		className: "group md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-[#ff7e5f]/30 transition-all duration-300 hover:-translate-y-1",
	},
	{
		title: "Pre-built Templates",
		description:
			"Get started quickly with our professionally designed templates, or customize them to match your brand perfectly.",
		header: (
			<div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#ff7e5f]/10">
				<LayoutTemplate className="w-6 h-6 text-[#ff7e5f]" />
			</div>
		),
		className: "group md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-[#ff7e5f]/30 transition-all duration-300 hover:-translate-y-1",
	},
	{
		title: "Data Management",
		description:
			"Export your waitlist data in multiple formats, integrate with analytics tools, and maintain full control over your user data.",
		header: (
			<div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#ff7e5f]/10">
				<Database className="w-6 h-6 text-[#ff7e5f]" />
			</div>
		),
		className: "group md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-[#ff7e5f]/30 transition-all duration-300 hover:-translate-y-1",
	},
];

export default function BentoGridFeatures() {
	return (
		<section id="features" className="py-20 bg-background">
			<div className="container px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
				<div className="mx-auto max-w-3xl text-center">
					<div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#ff7e5f]/10">
						<Zap className="w-4 h-4 text-[#ff7e5f]" />
						<span className="text-xs font-light text-[#ff7e5f]">POWERFUL CUSTOMIZATION TOOLS</span>
					</div>
					<h2 className="mb-4 text-3xl font-medium text-center text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/20 sm:text-4xl">
						Build, Launch & Scale Your Waitlist
					</h2>
					<p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-300">
						Everything you need to create high-converting waitlists that drive growth and engagement for your product launch
					</p>
				</div>

				<BentoGrid className="grid-cols-1 gap-6 mt-16 md:grid-cols-2 lg:grid-cols-3">
					{items.map((item) => (
						<div key={item.title} className={item.className}>
							<div className="flex flex-col h-full">
								{item.header}
								<h3 className="mt-6 text-lg font-medium text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/20">
									{item.title}
								</h3>
								<p className="mt-2 text-gray-600 dark:text-gray-400">
									{item.description}
								</p>
							</div>
						</div>
					))}
				</BentoGrid>
			</div>
		</section>
	);
}
