import BentoGridFeatures from "@/components/landing/bento-grid-features";
import CallToAction from "@/components/landing/call-to-action";
import FAQ from "@/components/landing/faq";
import Footer from "@/components/landing/footer";
import HeaderWrapper from "@/components/landing/header-wrapper";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";

export const metadata = {
	title: "Waitlyze | Create stunning waitlists to hype up your audience",
	description:
		"Create beautiful waitlist pages, collect signups, and get insights on your audience with Waitlyze's powerful waitlist platform.",
};

export default function LandingPage() {
	return (
		<div className="flex flex-col min-h-screen">
			<HeaderWrapper />

			<Hero />
			<main className="grow">
				{/* <Features /> */}

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
