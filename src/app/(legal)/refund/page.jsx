import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RefundPolicy() {
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
					<h1 className="mb-6 text-3xl font-bold text-bold">Refund Policy</h1>

					<p className="mb-4 text-muted-foreground">
						Thank you for purchasing a product or service from Hype It Up. We
						are committed to providing a positive experience, and we understand
						that sometimes things may not work out. This Refund Policy outlines
						the conditions under which refunds are granted.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						1. Refund Eligibility
					</h2>
					<p className="mb-4 text-muted-foreground">
						We offer a 7-day refund period from the date of purchase. If you are
						not satisfied with your purchase, you may request a refund within
						this period.
					</p>
					<p className="mb-4 text-muted-foreground">
						To be eligible for a refund, please ensure that:
					</p>
					<ul className="pl-5 mb-4 list-disc text-muted-foreground">
						<li>
							The refund request is made within 7 days of the purchase date.
						</li>
						<li>You provide proof of purchase.</li>
					</ul>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						2. Refund Process
					</h2>
					<p className="mb-4 text-muted-foreground">
						To request a refund, please contact us at{" "}
						<Link
							href="mailto:info@hypeitup.me"
							className="text-purple-600 hover:text-purple-800"
						>
							info@hypeitup.me
						</Link>{" "}
						with the following information:
					</p>
					<ul className="pl-5 mb-4 list-disc text-muted-foreground">
						<li>Your name and contact information</li>
						<li>Order number and proof of purchase</li>
						<li>Reason for the refund request</li>
					</ul>
					<p className="mb-4 text-muted-foreground">
						Upon receiving your request, we will review it and notify you of the
						status of your refund. Approved refunds will be processed to your
						original payment method within 5-10 business days, depending on your
						bank or payment provider.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						3. No Refunds After 7 Days
					</h2>
					<p className="mb-4 text-muted-foreground">
						Refund requests made after the 7-day refund period are not eligible.
						We encourage you to fully evaluate our services within this time
						frame to ensure satisfaction.
					</p>

					<h2 className="mt-6 mb-3 text-xl font-semibold text-bold">
						4. Contact Us
					</h2>
					<p className="mb-4 text-muted-foreground">
						For any questions about this Refund Policy, please contact us at{" "}
						<Link
							href="mailto:info@hypeitup.me"
							className="text-purple-600 hover:text-purple-800"
						>
							info@hypeitup.me
						</Link>
						.
					</p>

					<p className="mt-8 text-sm text-gray-500">
						Last updated: November 10, 2024
					</p>
				</div>
			</div>
		</div>
	);
}
