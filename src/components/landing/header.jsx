"use client";

import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ModeToggle } from "../mode-toggle";

export default function Header() {
	const [isNavOpen, setIsNavOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 right-0 z-50 border-b shadow-lg bg-background/80 backdrop-blur-sm border-border">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center">
						<Link href="/">
							<Logo />
						</Link>
					</div>
					<nav className="items-center hidden space-x-6 md:flex">
						{["Process", "Features", "Testimonials", "Pricing"].map((item) => (
							<Link
								key={item}
								href={`#${item.toLowerCase()}`}
								className="transition duration-300 ease-in-out text-foreground hover:text-primary hover:underline"
							>
								{item}
							</Link>
						))}
						<ModeToggle />
						<SignedIn>
							<UserButton className="p-2 text-white transition duration-300 rounded-md bg-primary hover:bg-primary-dark" />
						</SignedIn>
						<SignedOut>
							<Button className="w-full mt-2 text-white transition duration-300 bg-primary hover:bg-primary-dark">
								<SignInButton />
							</Button>
						</SignedOut>
					</nav>
					<div className="flex items-center md:hidden">
						<ModeToggle />
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
				<div className="border-t shadow-lg md:hidden bg-background dark:bg-black border-border">
					<ul className="px-4 pt-4 pb-3 space-y-2">
						{["Process", "Features", "Testimonials", "Pricing"].map((item) => (
							<li key={item}>
								<Link
									href={`#${item.toLowerCase()}`}
									className="block px-4 py-2 transition duration-300 ease-in-out rounded-md text-foreground hover:bg-muted hover:underline"
								>
									{item}
								</Link>
							</li>
						))}
						<SignedIn>
							<div className="ml-3">
								<UserButton />
							</div>
						</SignedIn>
						<SignedOut>
							<Button className="mt-2 ml-3 text-white transition duration-300 bg-primary hover:bg-primary-dark">
								<SignInButton />
							</Button>
						</SignedOut>
					</ul>
				</div>
			)}
		</header>
	);
}
