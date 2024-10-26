import CallToAction from "./call-to-action";
import FAQ from "./faq";
import Features from "./features";
import Footer from "./footer";
import Header from "./header";
import Hero from "./hero";
import HowItWorks from "./how-it-works";
import Pricing from "./pricing";
import Testimonials from "./testimonials";

export const Landing = () => {
	return (
		<div className="min-h-screen">
			<Header />
			<Hero />
			<HowItWorks />
			<Features />
			<Testimonials />
			<Pricing />
			<FAQ />
			<CallToAction />
			<Footer />
		</div>
	);
};
