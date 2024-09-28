"use client";

import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./theme-toggle";

export default function Header() {
	const [isNavOpen, setIsNavOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm border-border">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center">
						<Link href="/">
							<Logo />
						</Link>
					</div>
					<nav className="items-center hidden space-x-4 md:flex">
						<Link
							href="#howitworks"
							className="text-foreground hover:text-primary"
						>
							Process
						</Link>
						<Link
							href="#features"
							className="text-foreground hover:text-primary"
						>
							Features
						</Link>
						<Link
							href="#testimonials"
							className="text-foreground hover:text-primary"
						>
							Testimonials
						</Link>
						<Link
							href="#pricing"
							className="text-foreground hover:text-primary"
						>
							Pricing
						</Link>
						<ThemeToggle />
						<Link href="/login">
							<Button
								variant="outline"
								className="px-4 py-2 font-semibold transition-all duration-300 border-2 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
							>
								Sign Up
							</Button>
						</Link>
					</nav>
					<div className="flex items-center md:hidden">
						<ThemeToggle />
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsNavOpen(!isNavOpen)}
						>
							{isNavOpen ? (
								<X className="w-6 h-6" />
							) : (
								<Menu className="w-6 h-6" />
							)}
						</Button>
					</div>
				</div>
			</div>
			{/* Mobile menu */}
			{isNavOpen && (
				<div className="border-t md:hidden bg-background dark:bg-black border-border">
					<ul className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
						<li>
							<Link
								href="#process"
								className="block px-3 py-2 rounded-md hover:bg-muted"
							>
								Process
							</Link>
							<Link
								href="#features"
								className="block px-3 py-2 rounded-md hover:bg-muted"
							>
								Features
							</Link>
							<Link
								href="#testimonials"
								className="block px-3 py-2 rounded-md hover:bg-muted"
							>
								Testimonials
							</Link>
						</li>
						<li>
							<Link
								href="#pricing"
								className="block px-3 py-2 rounded-md hover:bg-muted"
							>
								Pricing
							</Link>
						</li>
						<li>
							<Link href="/login">
								<Button className="w-full mt-2">Sign Up</Button>
							</Link>
						</li>
					</ul>
				</div>
			)}
		</header>
	);
}
