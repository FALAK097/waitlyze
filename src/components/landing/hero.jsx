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
		<section className="flex overflow-hidden justify-center items-center py-40 min-h-screen bg-background">
			<div className="absolute inset-0 pointer-events-none bg-linear-to-b from-primary/5 to-background" />
			<div className="container relative px-4 mx-auto sm:px-6 lg:px-8">
				<div className="flex flex-col justify-center items-center mx-auto space-y-16 max-w-6xl">
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
								<SparklesIcon className="mr-2 w-4 h-4" />
								Completely Free to use
							</HoverBorderGradient>
						</motion.div>

						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.5 }}
							className="text-3xl font-thin tracking-tight sm:text-4xl md:text-5xl text-foreground lg:leading-tight"
						>
							Create Stunning Waitlists in{" "}
							<span className="inline-block relative">
								<span className="relative z-10 text-primary">
									Seconds
									<svg
										className="absolute left-0 -bottom-1 w-full sm:-bottom-2"
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
							className="max-w-2xl text-base font-light sm:text-lg md:text-xl text-muted-foreground"
						>
							Design, launch, and manage waitlists that convert visitors into
							eager customers. Boost your pre-launch success with our powerful
							platform.
						</motion.p>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.5 }}
							className="flex flex-col gap-4 mx-auto w-full max-w-md sm:flex-row"
						>
							<Link href="/dashboard" className="w-full sm:w-auto">
								<SparkleButton className="w-full text-base sm:text-lg group" />
							</Link>
							<Button
								size="lg"
								variant="ghost"
								className="w-full text-md text-muted-foreground sm:w-auto hover:bg-transparent hover:text-primary"
								onClick={handleWatchDemo}
							>
								<PlayIcon className="mr-2 w-5 h-5" />
								Watch Demo
							</Button>
						</motion.div>

						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6, duration: 0.5 }}
							className="flex flex-col items-center space-y-3"
						>
							{["No cost to use", "No coding required"].map(
								(feature) => (
									<div
										key={feature}
										className="flex gap-2 items-center font-light text-muted-foreground"
									>
										<CircleCheckIcon className="w-5 h-5 font-light shrink-0 text-primary" />
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
									className="w-8 h-8 border-2 backdrop-blur-sm sm:w-10 sm:h-10 border-background bg-primary/20"
								/>
							))}
						</div>
						<p className="text-lg font-semibold">Join 100+ creators</p>
						<p className="text-sm text-muted-foreground">
							Building their audience
						</p>
					</motion.div>

					<div className="w-full">
						<div className="flex flex-wrap gap-4 justify-center pb-4 mb-8">
							{features.map((feature) => (
								<motion.button
									key={feature.id}
									type="button"
									onClick={() => setSelectedFeature(feature)}
									whileHover={{ scale: 1.05 }}
									className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer rounded-full ${selectedFeature.id === feature.id
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
										}`}
								>
									{feature.title}
								</motion.button>
							))}
						</div>

						<div className="relative">
							<div className="absolute inset-0 rounded-3xl blur-3xl bg-linear-to-tr from-primary/30 to-background" />
							<Card className="overflow-hidden relative rounded-2xl border-2 backdrop-blur-sm border-border/50 bg-background/50">
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
										<div className="absolute inset-0 to-transparent bg-linear-to-t from-background/80" />
									</motion.div>
								</AnimatePresence>
							</Card>
						</div>
					</div>

					<motion.div
						id="demo"
						ref={demoSectionRef}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.8, duration: 0.5 }}
						className="pt-40 mx-auto w-full max-w-4xl"
					>
						<motion.h2
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
							className="mb-12 text-3xl font-medium text-center text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-foreground"
						>
							See Waitlyze in Action
						</motion.h2>
						<div className="overflow-hidden relative rounded-2xl aspect-video">
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
								className="flex absolute inset-0 justify-center items-center backdrop-blur-sm cursor-pointer bg-primary/20"
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
