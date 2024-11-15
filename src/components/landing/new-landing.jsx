import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
				<section className="px-6 py-32 md:px-12 lg:px-24 bg-background">
					<div className="grid items-center max-w-6xl gap-8 mx-auto md:grid-cols-2">
						<div>
							<h1 className="mb-4 text-4xl font-bold">
								Create Stunning Waitlists in{" "}
								<s className="text-primary">Minutes</s> Seconds
							</h1>
							<p className="mb-6 text-xl">
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
								Create Your Waitlist Now
							</Link>
						</div>
						<div className="bg-gray-300 rounded-lg aspect-video" />
					</div>
				</section>

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
