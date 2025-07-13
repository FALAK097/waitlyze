"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const testimonials = [
	{
		name: "Alex Johnson",
		role: "Startup Founder",
		content:
			"Waitlyze helped us launch our waitlist at the perfect time, resulting in 3x more signups!",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Sarah Lee",
		role: "Marketing Director",
		content:
			"The customizable forms and analytics from Waitlyze have revolutionized our product launch strategy. Highly recommended!",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Michael Chen",
		role: "Product Manager",
		content:
			"We've seen a 40% increase in user engagement since using Waitlyze for our waitlist management.",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Emily Rodriguez",
		role: "E-commerce Entrepreneur",
		content:
			"The ease of setting up and managing our waitlist with Waitlyze has significantly boosted our pre-launch excitement. It's a game-changer!",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "David Kim",
		role: "Tech Startup CEO",
		content:
			"Waitlyze's data-driven approach gave us the confidence to manage our waitlist effectively. Invaluable for our launch!",
		avatar: "/placeholder.svg?height=40&width=40",
	},
	{
		name: "Lisa Patel",
		role: "Growth Hacker",
		content:
			"The integration with our existing tools made the whole process seamless. Our waitlist launch with Waitlyze was a huge success!",
		avatar: "/placeholder.svg?height=40&width=40",
	},
];

export default function Testimonials() {
	return (
		<section id="testimonials" className="py-20 overflow-hidden bg-background">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="mb-12 text-4xl font-bold text-center text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/20"
				>
					What Our Users Say
				</motion.h2>
				<div className="relative">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{testimonials.map((testimonial, index) => (
							<motion.div
								key={`${testimonial.name}-${index}`}
								initial={{ opacity: 0, y: 50 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
									<CardContent className="flex flex-col justify-between h-full p-6">
										<div>
											<p className="mb-4 italic text-muted-foreground">
												&quot;{testimonial.content}&quot;
											</p>
										</div>
										<div className="flex items-center">
											<Avatar className="w-10 h-10 mr-4">
												<AvatarImage
													src={testimonial.avatar}
													alt={testimonial.name}
												/>
												<AvatarFallback>{testimonial.name[0]}</AvatarFallback>
											</Avatar>
											<div>
												<h3 className="font-semibold">{testimonial.name}</h3>
												<p className="text-sm text-muted-foreground">
													{testimonial.role}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
					<div className="absolute top-0 left-0 rounded-full w-72 h-72 bg-primary/5 mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
					<div className="absolute top-0 right-0 rounded-full w-72 h-72 bg-secondary/5 mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
					<div className="absolute rounded-full -bottom-8 left-20 w-72 h-72 bg-accent/5 mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
				</div>
			</div>
		</section>
	);
}
