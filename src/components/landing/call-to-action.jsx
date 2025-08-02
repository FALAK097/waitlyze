"use client";

import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { Rocket } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export default function CallToAction() {
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.1 });

	const containerVariants = {
		hidden: { opacity: 0, y: 50 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.5,
				staggerChildren: 0.2,
			},
		},
	};

	const childVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.5,
			},
		},
	};

	return (
		<section className="overflow-hidden py-20 bg-background" ref={ref}>
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<motion.div
					className="relative p-8 text-center"
					variants={containerVariants}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
				>
					<motion.h2
						className="mb-4 text-xl font-light text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/20 md:text-4xl lg:text-5xl"
						variants={childVariants}
					>
						Ready to Launch Your Waitlist?
					</motion.h2>
					<motion.p
						className="mx-auto mb-8 text-base font-light text-muted-foreground md:text-lg text-wrap"
						variants={childVariants}
					>
						Join thousands of creators and start building anticipation for your
						next big thing with Waitlyze.
					</motion.p>
					<motion.div variants={childVariants}>
						<Link href="/dashboard">
							<Button
								size="lg"
								className="w-full text-base sm:text-xl group bg-linear-to-r from-primary to-primary/20 text-primary-foreground sm:w-auto"
							>
								Create Your Waitlist Now
								<Rocket className="ml-2 w-4 h-4 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
							</Button>
						</Link>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
