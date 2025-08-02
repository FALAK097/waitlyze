import BentoGridFeatures from "@/components/landing/bento-grid-features";
import CallToAction from "@/components/landing/call-to-action";
import FAQ from "@/components/landing/faq";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import Pricing from "@/components/landing/pricing";
import Testimonials from "@/components/landing/testimonials";

export const metadata = {
	title: "Waitlyze | Create stunning waitlists to hype up your audience",
	description:
		"Create beautiful waitlist pages, collect signups, and get insights on your audience with Waitlyze's powerful waitlist platform.",
};

export default function LandingPage() {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />

			<Hero />
			<main className="grow">
				<Features />

				<HowItWorks />

				<BentoGridFeatures />

				{/* <Testimonials /> */}

				{/* <Pricing /> */}

				<FAQ />

				<CallToAction />
			</main>
			<Footer />
		</div>
	);
}
