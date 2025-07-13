"use client";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { CircleCheckIcon, PlayIcon, SparklesIcon } from "../shared/icons";
import { Button } from "../ui/button";
import { HoverBorderGradient } from "../ui/hover-border-gradient";
import SparkleButton from "../ui/sparkle-button";

const features = [
	{
		id: "signup",
		title: "Sign Up",
		image: "/images/waitlyze_dashboard.png",
		alt: "Waitlyze Sign Up Dashboard",
	},
	{
		id: "analytics",
		title: "Analytics",
		image: "/images/waitlyze_analytics.png",
		alt: "Waitlyze Analytics Dashboard",
	},
	{
		id: "waitlist builder",
		title: "Waitlist Builder",
		image: "/images/waitlyze_waitlist_builder.png",
		alt: "Waitlyze Customizable Waitlist Builder",
	},
	{
		id: "advanced analytics",
		title: "Advanced Analytics",
		image: "/images/waitlyze_advanced_analytics.png",
		alt: "HyperItUp Advanced Analytics Dashboard",
	},
];

export default function Hero() {
	const [selectedFeature, setSelectedFeature] = useState(features[0]);
	const [isPlaying, setIsPlaying] = useState(false);
	const videoRef = useRef(null);
	const demoSectionRef = useRef(null);

	const handleWatchDemo = () => {
		demoSectionRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const handlePlayVideo = () => {
		if (videoRef.current) {
			if (isPlaying) {
				videoRef.current.pause();
			} else {
				videoRef.current.play();
			}
			setIsPlaying(!isPlaying);
		}
	};

	return (
		<section className="flex items-center justify-center min-h-screen py-40 overflow-hidden bg-background">
			<div className="absolute inset-0 pointer-events-none bg-linear-to-b from-primary/5 to-background" />
			<div className="container relative px-4 mx-auto sm:px-6 lg:px-8">
				<div className="flex flex-col items-center justify-center max-w-6xl mx-auto space-y-16">
					<div className="flex flex-col items-center space-y-8 text-center">
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5 }}
						>
							<HoverBorderGradient
								containerClassName="rounded-full inline-flex"
								as="button"
								className="flex items-center px-3 py-1.5 text-sm font-medium bg-background text-primary"
							>
								<SparklesIcon className="w-4 h-4 mr-2" />
								Analytics Powered by Waitlyze
							</HoverBorderGradient>
						</motion.div>

						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.5 }}
							className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl text-foreground lg:leading-tight"
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
							className="max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground"
						>
							Design, launch, and manage waitlists that convert visitors into
							eager customers. Boost your pre-launch success with our powerful
							platform.
						</motion.p>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.5 }}
							className="flex flex-col w-full max-w-md gap-4 mx-auto sm:flex-row"
						>
							<Link href="/dashboard" className="w-full sm:w-auto">
								<SparkleButton className="w-full text-base sm:text-lg group" />
							</Link>
							<Button
								size="lg"
								variant="ghost"
								className="w-full text-lg sm:w-auto hover:bg-transparent hover:text-primary"
								onClick={handleWatchDemo}
							>
								<PlayIcon className="w-5 h-5 mr-2" />
								Watch Demo
							</Button>
						</motion.div>

						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6, duration: 0.5 }}
							className="flex flex-col items-center space-y-3"
						>
							{["No credit card required", "No coding required"].map(
								(feature) => (
									<div
										key={feature}
										className="flex items-center gap-2 text-muted-foreground"
									>
										<CircleCheckIcon className="shrink-0 w-5 h-5 text-primary" />
										<span className="text-sm sm:text-base">{feature}</span>
									</div>
								),
							)}
						</motion.div>
					</div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7, duration: 0.5 }}
						className="text-center"
					>
						<div className="flex justify-center mb-4 -space-x-2">
							{[...Array(4)].map((_, i) => (
								<Avatar
									key={`avatar-${i + 1}`}
									alt={`Avatar ${i + 1}`}
									className="w-8 h-8 border-2 sm:w-10 sm:h-10 border-background bg-primary/20 backdrop-blur-sm"
								/>
							))}
						</div>
						<p className="text-lg font-semibold">Join 1,000+ creators</p>
						<p className="text-sm text-muted-foreground">
							Building their audience
						</p>
					</motion.div>

					<div className="w-full">
						<div className="flex flex-wrap justify-center gap-4 pb-4 mb-8">
							{features.map((feature) => (
								<motion.button
									key={feature.id}
									type="button"
									onClick={() => setSelectedFeature(feature)}
									whileHover={{ scale: 1.05 }}
									className={`px-4 py-2 text-sm font-medium transition-colors rounded-full ${selectedFeature.id === feature.id
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
										}`}
								>
									{feature.title}
								</motion.button>
							))}
						</div>

						<div className="relative">
							<div className="absolute inset-0 rounded-3xl bg-linear-to-tr from-primary/30 to-background blur-3xl" />
							<Card className="relative overflow-hidden border-2 rounded-2xl border-border/50 bg-background/50 backdrop-blur-sm">
								<AnimatePresence mode="wait">
									<motion.div
										key={selectedFeature.id}
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
										transition={{ duration: 0.3 }}
										className="relative aspect-video"
									>
										<Image
											src={selectedFeature.image}
											alt={selectedFeature.alt}
											fill
											className="object-fill"
											priority
										/>
										<div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent" />
									</motion.div>
								</AnimatePresence>
							</Card>
						</div>
					</div>

					<motion.div
						ref={demoSectionRef}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.8, duration: 0.5 }}
						className="w-full max-w-4xl pt-40 mx-auto"
					>
						<motion.h2
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
							className="mb-12 text-4xl font-bold text-center text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-foreground"
						>
							Demo Video
						</motion.h2>
						<div className="relative overflow-hidden aspect-video rounded-2xl">
							<video
								ref={videoRef}
								width="320"
								height="240"
								preload="none"
								poster="/images/waitlyze_dashboard.png"
								className="object-cover w-full h-full"
								onClick={handlePlayVideo}
								onEnded={() => setIsPlaying(false)}
								onKeyUp={handlePlayVideo}
								onKeyDown={handlePlayVideo}
							>
								<source
									src="/images/waitlyze_Landing_Page-Demo.mp4"
									type="video/mp4"
								/>
								<track
									srcLang="en"
									kind="captions"
									src="/images/waitlyze_Landing_Page-Demo.vtt"
								/>
							</video>
							<motion.div
								className="absolute inset-0 flex items-center justify-center cursor-pointer bg-primary/20 backdrop-blur-sm"
								initial={{ opacity: 1 }}
								animate={{ opacity: isPlaying ? 0 : 1 }}
								transition={{ duration: 0.3 }}
								onClick={handlePlayVideo}
							>
								<motion.div
									className="p-4 rounded-full bg-primary text-primary-foreground"
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
								>
									<PlayIcon className="w-12 h-12" />
								</motion.div>
							</motion.div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
