"use client";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { CircleCheckIcon, PlayIcon, SparklesIcon } from "../shared/icons";
import { Button } from "../ui/button";
import { HoverBorderGradient } from "../ui/hover-border-gradient";
import SparkleButton from "../ui/sparkle-button";

export default function Hero() {
	return (
		<section className="relative py-40 overflow-hidden">
			<div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/5 to-background" />
			<div className="container relative px-4 mx-auto sm:px-6 lg:px-8">
				<div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5 }}
						className="text-center lg:text-left"
					>
						<HoverBorderGradient
							containerClassName="rounded-full inline-flex"
							as="button"
							className="flex items-center px-3 py-1.5 text-sm font-medium bg-background text-primary"
						>
							<SparklesIcon className="w-4 h-4 mr-2" />
							Analytics Powered by HypeItUp
						</HoverBorderGradient>
						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.5 }}
							className="mt-6 mb-4 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl text-foreground lg:leading-tight"
						>
							Create Stunning Waitlists in{" "}
							<span className="relative inline-block">
								<span className="relative z-10 text-primary">
									Seconds
									<svg
										className="absolute left-0 w-full -bottom-1 sm:-bottom-2"
										viewBox="0 0 100 20"
										preserveAspectRatio="none"
										height="20"
										aria-hidden="true"
									>
										<motion.path
											initial={{ pathLength: 0 }}
											animate={{ pathLength: 1 }}
											transition={{ delay: 0.5, duration: 1 }}
											d="M0 12.5c35-5 70-5 100 0"
											stroke="currentColor"
											strokeWidth="4"
											fill="none"
											className="text-primary/30"
										/>
									</svg>
								</span>
							</span>
						</motion.h1>
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.5 }}
							className="max-w-2xl mx-auto mb-8 text-base sm:text-lg md:text-xl text-muted-foreground lg:mx-0"
						>
							Design, launch, and manage waitlists that convert visitors into
							eager customers. Boost your pre-launch success with our powerful
							platform.
						</motion.p>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.5 }}
							className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
						>
							<Link href="/dashboard" className="w-full sm:w-auto">
								<SparkleButton className="w-full text-base sm:text-lg group" />
							</Link>
							<Button
								size="lg"
								variant="outline"
								className="w-full text-lg sm:w-auto"
							>
								<PlayIcon className="w-5 h-5 mr-2" />
								Watch Demo
							</Button>
						</motion.div>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6, duration: 0.5 }}
							className="mt-8 space-y-3"
						>
							{["No credit card required", "No coding required"].map(
								(feature) => (
									<div
										key={feature}
										className="flex items-center justify-center gap-2 lg:justify-start text-muted-foreground"
									>
										<CircleCheckIcon className="flex-shrink-0 w-5 h-5 text-primary" />
										<span className="text-sm sm:text-base">{feature}</span>
									</div>
								),
							)}
						</motion.div>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2, duration: 0.5 }}
						className="relative mt-8 lg:mt-0"
					>
						<div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 to-background blur-3xl" />
						<Card className="relative overflow-hidden border-2 rounded-2xl border-border/50 bg-background/50 backdrop-blur-sm">
							<div className="relative">
								<div className="aspect-[4/3] sm:aspect-[16/10]">
									<Image
										src="/images/hypeitup_dashboard.png"
										alt="Waitlist Dashboard Preview"
										fill
										className="object-fill"
										priority
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
								</div>
								<div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
									<div className="flex items-center gap-3 sm:gap-4">
										<div className="flex -space-x-2">
											{[...Array(4)].map((_, i) => (
												<div
													key={`avatar-${i + 1}`}
													className="w-6 h-6 border-2 rounded-full sm:w-8 sm:h-8 border-background bg-primary/20 backdrop-blur-sm"
												/>
											))}
										</div>
										<div className="text-xs sm:text-sm">
											<p className="font-medium">Join 1,000+ creators</p>
											<p className="text-muted-foreground">
												Building their audience
											</p>
										</div>
									</div>
								</div>
							</div>
						</Card>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
