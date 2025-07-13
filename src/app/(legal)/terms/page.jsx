import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "Terms of Service",
	description:
		"Learn about our terms of service, including user responsibilities, acceptable use, and legal requirements for using Waitlyze's waitlist platform.",
};

export default function TermsOfService() {
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
					<h1 className="mb-6 text-3xl font-bold text-bold">
						Terms of Service
					</h1>

					<p className="mb-4 text-muted-foreground">
						Welcome to Waitlyze ("Platform," "Service," "we," "us," "our"). By
						accessing or using{" "}
						<Link href="https://waitlyze.falakgala.dev" className="text-primary">
							www.waitlyze.falakgala.dev
						</Link>
						("Website"), you agree to comply with and be bound by these Terms of
						Service ("Terms"). If you do not agree to these Terms, you may not
						use our services.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						1. Acceptance of Terms
					</h2>
					<p className="mb-4 text-muted-foreground">
						By creating an account or accessing our Platform, you accept and
						agree to be bound by these{" "}
						<Link href="/terms" className="text-primary">
							Terms
						</Link>
						, our{" "}
						<Link href="/privacy" className="text-primary">
							Privacy Policy
						</Link>
						, and any other policies or guidelines that we may implement.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						2. Description of Service
					</h2>
					<p className="mb-4 text-muted-foreground">
						Waitlyze provides a platform for creating and managing waitlists
						that help convert visitors into eager customers. The platform may
						collect analytics to enhance user experience, which is detailed in
						our{" "}
						<Link href="/privacy" className="text-primary">
							Privacy Policy
						</Link>
						.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						3. Eligibility
					</h2>
					<p className="mb-4 text-muted-foreground">
						You must be at least 18 years of age or have permission from a legal
						guardian to use our services. By using the Platform, you confirm
						that you meet these requirements.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						4. User Accounts
					</h2>
					<p className="mb-4 text-muted-foreground">
						You are responsible for maintaining the confidentiality of your
						account information. You are solely responsible for all activities
						that occur under your account.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						5. User Conduct
					</h2>
					<p className="mb-4 text-muted-foreground">
						Users agree to use the Platform responsibly and may not:
					</p>
					<ul className="pl-5 mb-4 list-disc text-muted-foreground">
						<li>Engage in any illegal or unauthorized activities</li>
						<li>
							Violate or infringe upon the rights of others, including
							intellectual property rights
						</li>
						<li>Use any automated means to access the Platform</li>
					</ul>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						6. Data Collection and Analytics
					</h2>
					<p className="mb-4 text-muted-foreground">
						To improve our service, we use analytics provided by{" "}
						<Link href="https://posthog.com" className="text-primary">
							PostHog
						</Link>{" "}
						to collect data about user behavior on the Platform. We use this
						information to monitor usage and improve features. For details on
						data handling, see our{" "}
						<Link href="/privacy" className="text-primary">
							Privacy Policy.
						</Link>
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						7. Intellectual Property
					</h2>
					<p className="mb-4 text-muted-foreground">
						All content provided on the Platform, including logos, graphics, and
						text, is owned by Waitlyze or our partners. Users are not granted
						any license to use this content without permission.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						8. Termination of Service
					</h2>
					<p className="mb-4 text-muted-foreground">
						We reserve the right to suspend or terminate access to the Platform
						without notice if you violate these Terms.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						9. Limitation of Liability
					</h2>
					<p className="mb-4 text-muted-foreground">
						To the fullest extent permitted by law, Waitlyze shall not be liable
						for any damages resulting from the use or inability to use our
						services.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						10. Modifications to Terms
					</h2>
					<p className="mb-4 text-muted-foreground">
						We reserve the right to update these Terms at any time. We will
						notify users of any material changes, and continued use of the
						Platform indicates acceptance of the revised Terms.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						11. Contact Information
					</h2>
					<p className="mb-4 text-muted-foreground">
						For questions about these Terms, please contact us at{" "}
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
