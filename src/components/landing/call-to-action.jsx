import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
	return (
		<section className="relative py-20 overflow-hidden bg-background">
			<div className="container relative px-4 mx-auto text-center sm:px-6 lg:px-8">
				<h2 className="mb-4 text-3xl font-extrabold text-primary md:text-4xl lg:text-5xl">
					Ready to Launch Your Waitlist?
				</h2>
				<p className="max-w-2xl mx-auto mb-8 text-xl text-muted-foreground md:text-2xl">
					Join thousands of creators and start building anticipation for your
					next big thing.
				</p>
				<Button
					size="lg"
					className="px-8 py-3 text-lg font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl group"
				>
					Get Started Now
					<ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
				</Button>
			</div>
		</section>
	);
}
