import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import Features from "@/components/landing/features";
import Testimonials from "@/components/landing/testimonials";
import Pricing from "@/components/landing/pricing";
import FAQ from "@/components/landing/faq";
import CallToAction from "@/components/landing/call-to-action";
import Footer from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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
}
