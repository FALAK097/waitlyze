import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "Privacy Policy",
	description:
		"Learn how Waitlyze protects and handles your data, including what information we collect, how we use it, and your privacy rights.",
};

export default function PrivacyPolicy() {
	return (
		<div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
			<div className="max-w-3xl mx-auto">
				<Link
					href="/"
					className="inline-flex items-center mb-6 text-purple-600 hover:text-purple-800"
				>
					<ArrowLeft className="w-5 h-5 mr-2" />
					Back to Home
				</Link>
				<div className="px-4 py-5 sm:p-6">
					<h1 className="mb-6 text-3xl font-bold text-bold">Privacy Policy</h1>

					<p className="mb-4 text-muted-foreground">
						At Waitlyze ("we," "us," "our"), accessible from{" "}
						<Link href="https://waitlyze.falakgala.dev" className="text-primary">
							www.waitlyze.falakgala.dev
						</Link>
						, we are committed to protecting your privacy. This Privacy Policy
						outlines our practices regarding data collection, usage, and sharing
						when you access our platform.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						1. Information We Collect
					</h2>
					<p className="mb-4 text-muted-foreground">
						We collect certain information from you when you use our platform.
						This includes:
					</p>
					<ul className="pl-5 mb-4 list-disc text-muted-foreground">
						<li className="mb-2">
							<span className="font-medium">Personal Information:</span> When
							you create an account, we collect personal information such as
							your name, email address, and any other details you choose to
							provide.
						</li>
						<li>
							<span className="font-medium">Usage Data:</span> We automatically
							collect information about your interactions with our platform.
							This data includes your IP address, browser type, pages viewed,
							and the time and duration of your visits. We use this information
							to monitor and improve our services.
						</li>
					</ul>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						2. Use of Information
					</h2>
					<p className="mb-4 text-muted-foreground">
						We use your information to:
					</p>
					<ul className="pl-5 mb-4 list-disc text-muted-foreground">
						<li>Provide and improve our platform's services.</li>
						<li>
							Personalize your experience and deliver content relevant to your
							interests.
						</li>
						<li>
							Monitor platform performance and usage to identify trends and
							enhance functionality.
						</li>
					</ul>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						3. Analytics with{" "}
						<Link href="https://posthog.com" className="text-primary">
							PostHog
						</Link>
					</h2>
					<p className="mb-4 text-muted-foreground">
						We use PostHog for analytics on user behavior to enhance the
						platform experience. PostHog tracks user interactions to help us
						understand usage patterns, optimize features, and troubleshoot
						issues. PostHog may collect and process data such as:
					</p>
					<ul className="pl-5 mb-4 list-disc text-muted-foreground">
						<li>User interactions with various features</li>
						<li>Aggregated usage statistics</li>
						<li>
							Information about your device, browser, and operating system
						</li>
					</ul>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						4. Sharing of Information
					</h2>
					<p className="mb-4 text-muted-foreground">
						We do not sell or rent your personal information. However, we may
						share information in the following cases:
					</p>
					<ul className="pl-5 mb-4 list-disc text-muted-foreground">
						<li>
							<span className="font-medium">Service Providers:</span> We may
							share information with trusted third-party service providers who
							perform services on our behalf, including analytics services like
							PostHog.
						</li>
						<li>
							<span className="font-medium">Legal Requirements:</span> We may
							disclose information if required by law, such as in response to a
							subpoena, court order, or other legal processes.
						</li>
					</ul>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						5. Data Retention
					</h2>
					<p className="mb-4 text-muted-foreground">
						We retain your personal data only for as long as necessary to
						fulfill the purposes outlined in this Privacy Policy unless a longer
						retention period is required or permitted by law.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						6. Security
					</h2>
					<p className="mb-4 text-muted-foreground">
						We take data security seriously and implement reasonable measures to
						protect your information. However, no online service is completely
						secure, and we cannot guarantee the security of your data.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						7. Your Rights
					</h2>
					<p className="mb-4 text-muted-foreground">
						Depending on your location, you may have rights regarding your
						personal information, including:
					</p>
					<ul className="pl-5 mb-4 list-disc text-muted-foreground">
						<li>Access to your data</li>
						<li>Correction of inaccurate data</li>
						<li>Deletion of data</li>
						<li>Restriction of processing</li>
						<li>Data portability</li>
					</ul>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						8. Changes to This Privacy Policy
					</h2>
					<p className="mb-4 text-muted-foreground">
						We may update this Privacy Policy from time to time. We will notify
						users of any material changes and indicate the effective date at the
						top of this policy. Your continued use of our platform after any
						changes constitutes your acceptance of the revised policy.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						9. Contact Us
					</h2>
					<p className="mb-4 text-muted-foreground">
						If you have questions or concerns about this Privacy Policy or our
						data practices, please contact us at{" "}
						<Link
							href="mailto:falakgala09@gmail.com"
							className="text-purple-600 hover:text-purple-800"
						>
							falakgala09@gmail.com
						</Link>
						.
					</p>

					<p className="mt-8 text-sm text-gray-500">
						Last updated: July 13, 2025
					</p>
				</div>
			</div>
		</div>
	);
}
