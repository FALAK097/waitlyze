"use client";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
	const { isSignedIn } = useAuth();

	const text = "Create Stunning Waitlists in Minutes";

	const typewriterVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.05,
			},
		},
	};

	const letterVariants = {
		hidden: { opacity: 0, y: 50 },
		visible: {
			opacity: 1,
			y: 0,
		},
	};

	return (
		<section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-background">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<div className="text-center">
					<motion.h1
						className="mb-4 text-4xl font-bold md:text-6xl text-primary"
						variants={typewriterVariants}
						initial="hidden"
						animate="visible"
					>
						{text.split("").map((char) => (
							<motion.span key={char} variants={letterVariants}>
								{char}
							</motion.span>
						))}
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="mb-8 text-xl md:text-2xl text-muted-foreground"
					>
						Design, launch, and manage waitlists that convert visitors into
						eager customers.
					</motion.p>
					<div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
						<Link
							href="/dashboard"
							size="lg"
							className="w-full px-8 py-3 text-lg font-semibold transition-all duration-300 rounded-full shadow-lg sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl"
						>
							{isSignedIn ? "Dashboard" : "Get Started"}
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
