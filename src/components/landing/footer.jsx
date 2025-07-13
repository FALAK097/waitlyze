"use client";

import Logo from "@/components/shared/logo";
import { Github, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const footerSections = [
	{
		title: "Product",
		links: [
			{ name: "Features", href: "#features" },
			{ name: "How It Works", href: "#how-it-works" },
			{ name: "Testimonials", href: "#testimonials" },
			{ name: "Pricing", href: "#pricing" },
		],
	},
	{
		title: "Legal",
		links: [
			{ name: "Terms of Service", href: "/terms" },
			{ name: "Privacy Policy", href: "/privacy" },
			{ name: "Refund Policy", href: "/refund" },
		],
	},
];

const socialLinks = [
	{ icon: Github, href: "https://github.com/" },
	{ icon: Twitter, href: "https://twitter.com/" },
];

export default function Footer() {
	const [hoverStates, setHoverStates] = useState({});

	const handleMouseEnter = (key) => {
		setHoverStates((prev) => ({ ...prev, [key]: true }));
	};

	const handleMouseLeave = (key) => {
		setHoverStates((prev) => ({ ...prev, [key]: false }));
	};

	return (
		<footer className="py-8 mt-12">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<div className="p-8 border shadow-lg rounded-3xl bg-background/80 backdrop-blur-md border-border">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						<div className="space-y-4">
							<Link className="flex items-center" href="/">
								<Image
									src="/images/logo.png"
									alt="Logo"
									width={40}
									height={40}
									className="mr-2"
								/>
								<Logo />
							</Link>
							<p className="text-sm text-muted-foreground">
								Create stunning waitlists in minutes. Convert visitors into
								eager customers.
							</p>
							<div className="flex space-x-4">
								{socialLinks.map((social) => (
									<Link
										key={social.href}
										href={social.href}
										className="transition-colors duration-200 text-muted-foreground hover:text-primary"
										target="_blank"
										rel="noopener noreferrer"
										onMouseEnter={() => handleMouseEnter(social.href)}
										onMouseLeave={() => handleMouseLeave(social.href)}
									>
										<social.icon
											size={24}
											className={`transition-transform duration-200 ${hoverStates[social.href] ? "scale-110" : "scale-100"
												}`}
										/>
										<span className="sr-only">{social.icon.name}</span>
									</Link>
								))}
							</div>
						</div>
						<div className="grid grid-cols-2 gap-8 md:col-span-2">
							{footerSections.map((section) => (
								<div key={section.title}>
									<h3 className="mb-4 text-lg font-semibold text-primary">
										{section.title}
									</h3>
									<ul className="space-y-2">
										{section.links.map((link) => (
											<li key={link.name}>
												<Link
													href={link.href}
													className="text-sm transition-colors duration-200 text-muted-foreground hover:text-primary"
													onMouseEnter={() => handleMouseEnter(link.name)}
													onMouseLeave={() => handleMouseLeave(link.name)}
												>
													<span
														className={`transition-all duration-200 ${hoverStates[link.name]
																? "border-b border-primary"
																: ""
															}`}
													>
														{link.name}
													</span>
												</Link>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>
					<div className="pt-8 mt-8 text-center border-t border-border">
						<p className="text-sm text-muted-foreground">
							&copy; {new Date().getFullYear()} Waitlyze. All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
