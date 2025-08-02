"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

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
		<section id="faq" className="py-20 bg-background">
			<div className="container px-4 mx-auto sm:px-6 lg:px-8">
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="mb-12 text-4xl font-bold text-center text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/20"
				>
					Frequently Asked Questions
				</motion.h2>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="mx-auto w-full max-w-2xl"
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
