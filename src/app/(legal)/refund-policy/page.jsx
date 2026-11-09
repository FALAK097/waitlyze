import Link from "next/link";

import LegalDocument from "@/components/landing/legal-document";

export const metadata = {
  title: "Refund Policy",
  description: "Refunds, cancellations, and renewals for Waitlyze subscriptions.",
  alternates: { canonical: "/refund-policy" },
};

const sections = [
  { id: "no-refunds", label: "No Refunds" },
  { id: "cancel-a-subscription", label: "Cancel a Subscription" },
  { id: "billing-issues", label: "Billing Issues" },
  { id: "legal-rights", label: "Rights Required by Law" },
  { id: "contact-information", label: "Contact" },
];

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund Policy"
      description="How refunds, cancellations, and subscription renewals work at Waitlyze."
      sections={sections}
      lastUpdated="November 8, 2026"
    >
      <p>
        This policy applies to paid Waitlyze subscriptions purchased through Dodo Payments, our
        Merchant of Record. Dodo Payments processes billing and provides the receipt for each
        purchase.
      </p>

      <h2 id="no-refunds">1. No Refunds</h2>
      <p>
        <strong>Payments are non-refundable.</strong> We do not provide refunds or credits for
        partial subscription periods, unused features, unused time after cancellation, or a renewal
        that has already been charged. Your subscription remains available through the end of the
        paid billing period unless the service is terminated for a serious violation of our Terms.
      </p>

      <h2 id="cancel-a-subscription">2. Cancel a Subscription</h2>
      <p>
        You can cancel renewal at any time from Billing in your workspace settings. Cancellation
        prevents the next charge; it does not refund the current billing period. Your workspace
        keeps Pro access until the paid period ends, then returns to the Free plan. Existing
        waitlists and subscriber data are retained, and Free-plan limits apply to new activity.
      </p>

      <h2 id="billing-issues">3. Billing Issues</h2>
      <p>
        If you see a duplicate charge, an incorrect billing interval, or a technical issue that
        prevented you from accessing a paid feature, contact us promptly with the workspace name and
        the Dodo Payments receipt or transaction reference. We will investigate and correct verified
        billing or service errors. This does not change the no-refund policy for unused time or a
        change of mind.
      </p>

      <h2 id="legal-rights">4. Rights Required by Law</h2>
      <p>
        Nothing in this policy limits a refund, cancellation, or other right that cannot lawfully be
        excluded in your jurisdiction. Where mandatory law requires a refund, Dodo Payments and
        Waitlyze will follow the applicable process.
      </p>

      <h2 id="contact-information">5. Contact</h2>
      <p>
        For billing questions, contact{" "}
        <Link prefetch={false} href="mailto:support@waitlyze.com">
          support@waitlyze.com
        </Link>
        . Include the workspace name and transaction reference, but never email a full card number
        or security code.
      </p>
    </LegalDocument>
  );
}
