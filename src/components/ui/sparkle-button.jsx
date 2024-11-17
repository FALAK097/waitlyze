"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { GripIcon } from "../shared/icons";

export default function SparkleButton({
	className,
	particleCount = 12,
	attractRadius = 50,
	...props
}) {
	const [isAttracting, setIsAttracting] = useState(false);
	const [particles, setParticles] = useState([]);
	const particlesControl = useAnimation();

	useEffect(() => {
		const newParticles = Array.from({ length: particleCount }, (_, i) => ({
			id: i,
			x: Math.random() * 360 - 180,
			y: Math.random() * 360 - 180,
		}));
		setParticles(newParticles);
	}, [particleCount]);

	const handleInteractionStart = useCallback(async () => {
		setIsAttracting(true);
		await particlesControl.start({
			x: 0,
			y: 0,
			transition: {
				type: "spring",
				stiffness: 50,
				damping: 10,
			},
		});
	}, [particlesControl]);

	const handleInteractionEnd = useCallback(async () => {
		setIsAttracting(false);
		await particlesControl.start((i) => ({
			x: particles[i].x,
			y: particles[i].y,
			transition: {
				type: "spring",
				stiffness: 100,
				damping: 15,
			},
		}));
	}, [particlesControl, particles]);

	return (
		<Button
			className={cn(
				"min-w-40 relative touch-none",
				"bg-violet-100 dark:bg-violet-900",
				"hover:bg-violet-200 dark:hover:bg-violet-800",
				"text-violet-600 dark:text-violet-300",
				"border border-violet-300 dark:border-violet-700",
				"transition-all duration-300",
				className,
			)}
			onMouseEnter={handleInteractionStart}
			onMouseLeave={handleInteractionEnd}
			onTouchStart={handleInteractionStart}
			onTouchEnd={handleInteractionEnd}
			{...props}
		>
			{particles.map((particle, index) => (
				<motion.div
					key={particle.id}
					custom={index}
					initial={{ x: particle.x, y: particle.y }}
					animate={particlesControl}
					className={cn(
						"absolute w-1.5 h-1.5 rounded-full",
						"bg-violet-400 dark:bg-violet-300",
						"transition-opacity duration-300",
						isAttracting ? "opacity-100" : "opacity-40",
					)}
				/>
			))}
			<span className="relative flex items-center justify-center w-full gap-2">
				<GripIcon
					className={cn(
						"w-4 h-4 transition-transform duration-300",
						isAttracting && "scale-110",
					)}
				/>
				{isAttracting ? "Go To Dashboard" : "Create Your Waitlist"}
			</span>
		</Button>
	);
}
