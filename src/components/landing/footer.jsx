import Logo from "@/components/custom/logo";
import { Github, Twitter } from "lucide-react";
import Link from "next/link";

const footerSections = [
	{
		title: "Product",
		links: [
			{ name: "Process", href: "#process" },
			{ name: "Features", href: "#features" },
			{ name: "Testimonials", href: "#testimonials" },
			{ name: "Pricing", href: "#pricing" },
		],
	},
	{
		title: "Legal",
		links: [
			{ name: "Privacy Policy", href: "#" },
			{ name: "Terms of Service", href: "#" },
			{ name: "Cookie Policy", href: "#" },
		],
	},
];

const socialLinks = [
	{ icon: Github, href: "https://github.com/FALAK097" },
	{ icon: Twitter, href: "https://x.com/falakgala097" },
];

export default function Footer() {
	return (
		<footer className="py-12 border-t bg-background border-border">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					<div className="space-y-4">
						<Link href="/">
							<Logo />
						</Link>
						<p className="text-muted-foreground">
							Create stunning waitlists in minutes. Convert visitors into eager
							customers.
						</p>
						<div className="flex space-x-4">
							{socialLinks.map((social) => (
								<Link
									key={social.icon}
									href={social.href}
									className="transition-colors duration-200 text-muted-foreground hover:text-primary"
									target="_blank"
									rel="noopener noreferrer"
								>
									<social.icon size={24} />
								</Link>
							))}
						</div>
					</div>
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
											className="transition-colors duration-200 text-muted-foreground hover:text-primary"
										>
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<div className="pt-8 mt-8 text-center border-t border-border">
					<p className="text-muted-foreground">
						&copy; {new Date().getFullYear()} Waitlist Creator. All rights
						reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
