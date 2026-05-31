"use client";

import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ModeToggle } from "../mode-toggle";

export default function Header() {
	const { data: session, isPending } = useSession();
	const [isNavOpen, setIsNavOpen] = useState(false);

	const navItems = ["Demo", "How It Works", "Features", "FAQ"];

	return (
		<header className="fixed top-4 left-1/2 z-50 w-11/12 max-w-7xl -translate-x-1/2">
			<div className="rounded-full border shadow-lg backdrop-blur-md bg-background/80 border-border">
				<div className="container px-4 mx-auto">
					<div className="flex justify-between items-center h-16">
						<Link className="flex items-center" href="/">
							<Image
								src="/images/logo.png"
								alt="Logo"
								width={48}
								height={48}
								className="mr-2"
							/>
							<Logo />
						</Link>
						<nav className="hidden items-center space-x-1 md:flex">
							{navItems.map((item) => (
								<Link
									key={item}
									href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
									className="px-3 py-2 text-sm rounded-full transition duration-300 ease-in-out text-foreground hover:bg-primary/10 hover:text-primary"
								>
									{item}
								</Link>
							))}
							{/* <div className="px-1">
								<ModeToggle />
							</div> */}
							{!isPending && session && (
								<Link href="/dashboard">
									<Button className="rounded-full">Dashboard</Button>
								</Link>
							)}
							{!isPending && !session && (
								<Link href="/sign-in">
									<Button className="rounded-full">Sign in</Button>
								</Link>
							)}
						</nav>
						<div className="flex items-center md:hidden">
							{/* <ModeToggle /> */}
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
				<div className="mt-2 rounded-3xl border shadow-lg backdrop-blur-md md:hidden bg-background/80 border-border">
					<nav className="px-4 pt-2 pb-4 space-y-1">
						{navItems.map((item) => (
							<Link
								key={item}
								href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
								className="block px-3 py-2 text-sm rounded-full transition duration-300 ease-in-out text-foreground hover:bg-primary/10 hover:text-primary"
								onClick={() => setIsNavOpen(false)}
							>
								{item}
							</Link>
						))}
						<div className="flex justify-center mt-4 w-full">
							{!isPending && session && (
								<Link href="/dashboard" className="w-full" onClick={() => setIsNavOpen(false)}>
									<Button className="w-full rounded-full">Dashboard</Button>
								</Link>
							)}
							{!isPending && !session && (
								<Link href="/sign-in" className="w-full" onClick={() => setIsNavOpen(false)}>
									<Button className="w-full rounded-full">Sign in</Button>
								</Link>
							)}
						</div>
					</nav>
				</div>
			)}
		</header>
	);
}
