import Link from "next/link";
import LegalDocument from "@/components/landing/legal-document";

export const metadata = {
  title: "Terms of Service",
  description:
    "Learn about our terms of service, including user responsibilities, acceptable use, and legal requirements for using Waitlyze's waitlist platform.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    id: "acceptance-of-terms",
    label: "Acceptance of Terms",
  },
  {
    id: "description-of-service",
    label: "Description of Service",
  },
  {
    id: "eligibility",
    label: "Eligibility",
  },
  {
    id: "user-accounts",
    label: "User Accounts",
  },
  {
    id: "user-conduct",
    label: "User Conduct",
  },
  {
    id: "intellectual-property",
    label: "Intellectual Property",
  },
  {
    id: "termination-of-service",
    label: "Termination of Service",
  },
  {
    id: "limitation-of-liability",
    label: "Limitation of Liability",
  },
  {
    id: "modifications-to-terms",
    label: "Modifications to Terms",
  },
  {
    id: "contact-information",
    label: "Contact Information",
  },
];

export default function LegalPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description="The terms that apply when you use Waitlyze."
      sections={sections}
    >
      <p>
        Welcome to Waitlyze ("Platform," "Service," "we," "us," "our"). By
        accessing or using{" "}
        <Link href="https://waitlyze.falakgala.dev">
          www.waitlyze.falakgala.dev
        </Link>
        ("Website"), you agree to comply with and be bound by these Terms of
        Service ("Terms"). If you do not agree to these Terms, you may not use
        our services.
      </p>

      <h2 id="acceptance-of-terms">1. Acceptance of Terms</h2>
      <p>
        By creating an account or accessing our Platform, you accept and agree
        to be bound by these <Link href="/terms">Terms</Link>, our{" "}
        <Link href="/privacy">Privacy Policy</Link>, and any other policies or
        guidelines that we may implement.
      </p>

      <h2 id="description-of-service">2. Description of Service</h2>
      <p>
        Waitlyze provides a platform for creating and managing waitlists that
        help convert visitors into eager customers. The platform may collect
        analytics to enhance user experience, which is detailed in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2 id="eligibility">3. Eligibility</h2>
      <p>
        You must be at least 18 years of age or have permission from a legal
        guardian to use our services. By using the Platform, you confirm that
        you meet these requirements.
      </p>

      <h2 id="user-accounts">4. User Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account
        information. You are solely responsible for all activities that occur
        under your account.
      </p>

      <h2 id="user-conduct">5. User Conduct</h2>
      <p>Users agree to use the Platform responsibly and may not:</p>
      <ul>
        <li>Engage in any illegal or unauthorized activities</li>
        <li>
          Violate or infringe upon the rights of others, including intellectual
          property rights
        </li>
        <li>Use any automated means to access the Platform</li>
      </ul>

      <h2 id="intellectual-property">6. Intellectual Property</h2>
      <p>
        All content provided on the Platform, including logos, graphics, and
        text, is owned by Waitlyze or our partners. Users are not granted any
        license to use this content without permission.
      </p>

      <h2 id="termination-of-service">7. Termination of Service</h2>
      <p>
        We reserve the right to suspend or terminate access to the Platform
        without notice if you violate these Terms.
      </p>

      <h2 id="limitation-of-liability">8. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Waitlyze shall not be liable for
        any damages resulting from the use or inability to use our services.
      </p>

      <h2 id="modifications-to-terms">9. Modifications to Terms</h2>
      <p>
        We reserve the right to update these Terms at any time. We will notify
        users of any material changes, and continued use of the Platform
        indicates acceptance of the revised Terms.
      </p>

      <h2 id="contact-information">10. Contact Information</h2>
      <p>
        For questions about these Terms, please contact us at{" "}
        <Link
          href="mailto:hi@falakgala.dev"
          className="text-purple-600 hover:text-purple-800"
        >
          hi@falakgala.dev
        </Link>
        .
      </p>
    </LegalDocument>
  );
}
