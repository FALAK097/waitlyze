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
	title: "HypeItUp | Create stunning waitlists to hype up your audience",
	description:
		"Create beautiful waitlist pages, collect signups, and get insights on your audience with HypeItUp's powerful waitlist platform.",
	keywords:
		"HypeItUp, HypeItUp waitlist, Pre-launch waitlist, Hype Up your pre-launch, stunning waitlist, waitlist platform, waitlist software, waitlist builder, waitlist creator, waitlist tool, waitlist app, waitlist service, waitlist builder tool, waitlist creator tool, waitlist tool for creators, waitlist tool for entrepreneurs, waitlist tool for marketers, waitlist tool for sales, waitlist tool for startups, waitlist tool for small businesses, waitlist tool for influencers, waitlist tool for YouTubers, waitlist tool for podcasters, waitlist tool for bloggers, waitlist tool for content creators, waitlist tool for online course creators, waitlist tool for event planners, waitlist tool for webinar hosts, waitlist tool for conference organizers, waitlist tool for meetup organizers, fastwaitlist, getwaitlist, waitforit,get more signups, get more email subscribers, get more leads, get more customers, get more signups for your pre-launch, get more email subscribers for your pre-launch, get more leads for your pre-launch, get more customers for your pre-launch",
};

export default function LandingPage() {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />

			<Hero />
			<main className="flex-grow">
				<Features />

				<HowItWorks />

				<BentoGridFeatures />

				<Testimonials />

				<Pricing />

				<FAQ />

				<CallToAction />
			</main>
			<Footer />
		</div>
	);
}
