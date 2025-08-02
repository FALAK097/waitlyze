"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const faqs = [
	{
		question: "Is Waitlyze actually free to use?",
		answer:
			"Yes, Waitlyze is completely free to use. You can create and manage waitlists without any hidden costs.",
	},
	{
		question: "Do I need coding skills to use this tool?",
		answer:
			"Not at all! Our intuitive no-code designer allows you to create beautiful waitlist forms without any coding knowledge.",
	},
	{
		question: "Is brand customization possible?",
		answer:
			"Absolutely! You can customize colors, fonts, fields, and layout to ensure your waitlist form perfectly matches your brand identity.",
	},
	{
		question: "How do I embed the form on my website?",
		answer:
			"We provide a simple embed code that you can copy and paste into your website. If you don't have a website, you can use our hosted page option.",
	},
	{
		question: "How many subscribers can I collect?",
		answer:
			"There is no limit to the number of subscribers you can collect.",
	},
	{
		question: "Can I export my waitlist data?",
		answer:
			"Yes, you can easily export your waitlist data in CSV/PDF format for use in other tools or for your own analysis.",
	},
];

export default function FAQ() {
	return (
		<section id="faq" className="py-24 bg-background">
			<div className="container px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
				<div className="mx-auto mb-16 max-w-4xl text-center">
					<div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[#ff7e5f]/10">
						<Zap className="w-4 h-4 text-[#ff7e5f]" />
						<span className="text-xs font-light tracking-wider text-[#ff7e5f]">FREQUENTLY ASKED QUESTIONS</span>
					</div>
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mb-6 text-3xl font-medium text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/20 sm:text-4xl"
					>
						Frequently Asked Questions
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mx-auto mb-12 text-lg font-light leading-relaxed text-gray-600 dark:text-gray-300"
					>
						Find answers to common questions about Waitlyze and how it can help you build and manage your waitlist.
					</motion.p>
				</div>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="p-8 mx-auto w-full max-w-3xl rounded-2xl shadow-sm backdrop-blur-sm"
				>
					<Accordion type="single" collapsible className="space-y-4 w-full">
						{faqs.map((faq, index) => (
							<AccordionItem
								key={`accordion-item-${faq.question}-${index}`
									.replace(" ", "")
									.toLowerCase()}
								value={`item-${index}`}
							>
								<AccordionTrigger className="px-4 py-4 text-lg font-medium rounded-t-lg transition-colors duration-200 hover:bg-muted/50">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="px-4 py-3 text-base text-muted-foreground">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</motion.div>
			</div>
		</section>
	);
}
