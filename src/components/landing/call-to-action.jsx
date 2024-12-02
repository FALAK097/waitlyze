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
		<section className="py-20 overflow-hidden" ref={ref}>
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<motion.div
					className="relative p-8 text-center"
					variants={containerVariants}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
				>
					<motion.h2
						className="mb-4 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/20 md:text-4xl lg:text-5xl"
						variants={childVariants}
					>
						Ready to Launch Your Waitlist?
					</motion.h2>
					<motion.p
						className="max-w-2xl mx-auto mb-8 text-xl text-muted-foreground md:text-2xl"
						variants={childVariants}
					>
						Join thousands of creators and start building anticipation for your
						next big thing with HypeItUp.
					</motion.p>
					<motion.div variants={childVariants}>
						<Link href="/dashboard">
							<Button
								size="lg"
								className="w-full text-base sm:text-xl group bg-gradient-to-r from-primary to-primary/30 text-primary-foreground sm:w-auto"
							>
								Create Your Waitlist Now
								<Rocket className="w-4 h-4 ml-2 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
							</Button>
						</Link>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
