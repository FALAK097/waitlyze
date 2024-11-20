"use client";

import { EyeIcon, FormInput, LinkIcon, RocketIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";

export default function BentoGridFeatures() {
	return (
		<section className="py-20 bg-background">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<h2 className="mb-12 text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-foreground">
					Why Choose HypeItUp?
				</h2>
				<BentoGrid className="max-w-6xl mx-auto grid auto-rows-[15rem] md:auto-rows-[20rem] gap-6">
					{items.map((item) => (
						<BentoGridItem
							key={item.title}
							title={
								<h3 className="text-lg font-semibold">
									{item.title}{" "}
									<Badge className="ml-2 text-xs text-purple-700 bg-purple-100">
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

const Skeleton = () => (
	<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl dark:bg-dot-white/[0.2] bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black" />
);

const items = [
	{
		title: "No-Code Form Builder",
		description:
			"Effortlessly design custom waitlist forms that match your brand without writing a single line of code.",
		badge: "Intuitive",
		header: (
			<div className="flex items-center justify-center w-full h-full bg-gradient-to-r from-primary to-primary-foreground rounded-xl">
				<FormInput className="w-12 h-12 text-white" />
			</div>
		),
		className: "md:col-span-2",
		icon: <FormInput className="w-6 h-6 text-primary" />,
	},
	{
		title: "Launch in Minutes",
		description:
			"Embed your waitlist widget or share a hosted page. It's simple, fast, and seamless to get started.",
		badge: "Fast Integration",
		header: (
			<div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-green-400 to-teal-500 rounded-xl">
				<RocketIcon className="w-12 h-12 text-white" />
			</div>
		),
		className: "md:col-span-1",
		icon: <RocketIcon className="w-6 h-6 text-teal-500" />,
	},
	{
		title: "Real-Time Preview",
		description:
			"Visualize your changes as you make them, ensuring every detail aligns with your vision.",
		badge: "Live Editing",
		header: (
			<div className="flex items-center justify-center w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
				<EyeIcon className="w-12 h-12 text-white" />
			</div>
		),
		className: "md:col-span-1",
		icon: <EyeIcon className="w-6 h-6 text-indigo-500" />,
	},
	{
		title: "Customizable Links",
		description:
			"Generate unique, shareable links to drive sign-ups and track performance effortlessly.",
		badge: "Dynamic URLs",
		header: (
			<div className="flex items-center justify-center w-full h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-xl">
				<LinkIcon className="w-12 h-12 text-white" />
			</div>
		),
		className: "md:col-span-2",
		icon: <LinkIcon className="w-6 h-6 text-orange-500" />,
	},
];
