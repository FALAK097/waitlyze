"use client";

import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ModeToggle } from "../mode-toggle";

export default function Header() {
	const [isNavOpen, setIsNavOpen] = useState(false);

	const navItems = ["How It Works", "Features", "Testimonials", "Pricing"];

	return (
		<header className="fixed z-50 w-11/12 -translate-x-1/2 top-4 left-1/2 max-w-7xl">
			<div className="border rounded-full shadow-lg bg-background/80 backdrop-blur-md border-border">
				<div className="container px-4 mx-auto">
					<div className="flex items-center justify-between h-16">
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
						<nav className="items-center hidden space-x-1 md:flex">
							{navItems.map((item) => (
								<Link
									key={item}
									href={`#${item.toLowerCase().replace(/ /g, "")}`}
									className="px-3 py-2 text-sm transition duration-300 ease-in-out rounded-full text-foreground hover:bg-primary/10 hover:text-primary"
								>
									{item}
								</Link>
							))}
							<div className="px-1">
								<ModeToggle />
							</div>
							<SignedIn>
								<UserButton afterSignOutUrl="/" />
							</SignedIn>
							<SignedOut>
								<SignInButton mode="modal">
									<Button className="rounded-full">Sign in</Button>
								</SignInButton>
							</SignedOut>
						</nav>
						<div className="flex items-center md:hidden">
							<ModeToggle />
							<Button
								variant="ghost"
								size="icon"
								className="ml-2"
								onClick={() => setIsNavOpen(!isNavOpen)}
							>
								{isNavOpen ? (
									<X className="w-5 h-5" />
								) : (
									<Menu className="w-5 h-5" />
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>
			{/* Mobile menu */}
			{isNavOpen && (
				<div className="mt-2 border shadow-lg md:hidden rounded-3xl bg-background/80 backdrop-blur-md border-border">
					<nav className="px-4 pt-2 pb-4 space-y-1">
						{navItems.map((item) => (
							<Link
								key={item}
								href={`#${item.toLowerCase().replace(/ /g, "")}`}
								className="block px-3 py-2 text-sm transition duration-300 ease-in-out rounded-full text-foreground hover:bg-primary/10 hover:text-primary"
								onClick={() => setIsNavOpen(false)}
							>
								{item}
							</Link>
						))}
						<div className="flex justify-center mt-4">
							<SignedIn>
								<UserButton />
							</SignedIn>
							<SignedOut>
								<SignInButton mode="modal">
									<Button className="w-full rounded-full">Sign in</Button>
								</SignInButton>
							</SignedOut>
						</div>
					</nav>
				</div>
			)}
		</header>
	);
}
