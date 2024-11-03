import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Script from "next/script";
import CallToAction from "./call-to-action";
import FAQ from "./faq";
import Features from "./features";
import Footer from "./footer";
import Header from "./header";
import HowItWorks from "./how-it-works";
import Pricing from "./pricing";
import Testimonials from "./testimonials";

export const NewLanding = () => {
	return (
		<div className="flex flex-col min-h-screen">
			<div className="py-6">
				<Header />
			</div>

			<main className="flex-grow">
				<section className="py-32 px-6 md:px-12 lg:px-24 bg-background">
					<div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
						<div>
							<h1 className="text-4xl font-bold mb-4">
								Create Stunning Waitlists in{" "}
								<s className="text-primary">Minutes</s> Seconds
							</h1>
							<p className="text-xl mb-6">
								Design, launch, and manage waitlists that convert visitors into
								eager customers.
							</p>
							<Link
								href="/dashboard"
								className={cn(
									buttonVariants({
										variant: "default",
									}),
								)}
							>
								Get Started
							</Link>
						</div>
						<div className="aspect-video bg-gray-300 rounded-lg" />
					</div>
				</section>

				<Script src="https://www.hypeitup.me/js/embed.js" defer />
				<Script src="https://getlaunchlist.com/js/widget.js" defer />
				<div
					className="hypeitup-widget"
					data-key-id="cm31kakv80001ub62sklgva4f"
					data-height="380px"
				/>
				<div
					className="launchlist-widget"
					data-key-id="W0zujI"
					data-height="180px"
				/>
				<HowItWorks />

				<Features />

				<Testimonials />

				<Pricing />

				<FAQ />

				<CallToAction />
			</main>
			<Footer />
		</div>
	);
};
