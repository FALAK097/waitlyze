import Link from "next/link";
import LegalDocument from "@/components/landing/legal-document";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Waitlyze protects and handles your data, including what information we collect, how we use it, and your privacy rights.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    id: "information-we-collect",
    label: "Information We Collect",
  },
  {
    id: "use-of-information",
    label: "Use of Information",
  },
  {
    id: "sharing-of-information",
    label: "Sharing of Information",
  },
  {
    id: "data-retention",
    label: "Data Retention",
  },
  {
    id: "security",
    label: "Security",
  },
  {
    id: "your-rights",
    label: "Your Rights",
  },
  {
    id: "changes-to-this-privacy-policy",
    label: "Changes to This Privacy Policy",
  },
  {
    id: "contact-us",
    label: "Contact Us",
  },
];

export default function LegalPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How we collect, use, and handle your information."
      sections={sections}
    >
      <p>
        At Waitlyze ("we," "us," "our"), accessible from{" "}
        <Link href="https://waitlyze.falakgala.dev">
          www.waitlyze.falakgala.dev
        </Link>
        , we are committed to protecting your privacy. This Privacy Policy
        outlines our practices regarding data collection, usage, and sharing
        when you access our platform.
      </p>

      <h2 id="information-we-collect">1. Information We Collect</h2>
      <p>
        We collect certain information from you when you use our platform. This
        includes:
      </p>
      <ul>
        <li>
          <span>Personal Information:</span> When you create an account, we
          collect personal information such as your name, email address, and any
          other details you choose to provide.
        </li>
        <li>
          <span>Usage Data:</span> We automatically collect information about
          your interactions with our platform. This data includes your IP
          address, browser type, pages viewed, and the time and duration of your
          visits. We use this information to monitor and improve our services.
        </li>
      </ul>

      <h2 id="use-of-information">2. Use of Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide and improve our platform's services.</li>
        <li>
          Personalize your experience and deliver content relevant to your
          interests.
        </li>
        <li>
          Monitor platform performance and usage to identify trends and enhance
          functionality.
        </li>
      </ul>

      <h2 id="sharing-of-information">3. Sharing of Information</h2>
      <p>
        We do not sell or rent your personal information. However, we may share
        information in the following cases:
      </p>
      <ul>
        <li>
          <span>Service Providers:</span> We may share information with trusted
          third-party service providers who perform services on our behalf.
        </li>
        <li>
          <span>Legal Requirements:</span> We may disclose information if
          required by law, such as in response to a subpoena, court order, or
          other legal processes.
        </li>
      </ul>

      <h2 id="data-retention">4. Data Retention</h2>
      <p>
        We retain your personal data only for as long as necessary to fulfill
        the purposes outlined in this Privacy Policy unless a longer retention
        period is required or permitted by law.
      </p>

      <h2 id="security">5. Security</h2>
      <p>
        We take data security seriously and implement reasonable measures to
        protect your information. However, no online service is completely
        secure, and we cannot guarantee the security of your data.
      </p>

      <h2 id="your-rights">6. Your Rights</h2>
      <p>
        Depending on your location, you may have rights regarding your personal
        information, including:
      </p>
      <ul>
        <li>Access to your data</li>
        <li>Correction of inaccurate data</li>
        <li>Deletion of data</li>
        <li>Restriction of processing</li>
        <li>Data portability</li>
      </ul>

      <h2 id="changes-to-this-privacy-policy">
        7. Changes to This Privacy Policy
      </h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify
        users of any material changes and indicate the effective date at the top
        of this policy. Your continued use of our platform after any changes
        constitutes your acceptance of the revised policy.
      </p>

      <h2 id="contact-us">8. Contact Us</h2>
      <p>
        If you have questions or concerns about this Privacy Policy or our data
        practices, please contact us at{" "}
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
