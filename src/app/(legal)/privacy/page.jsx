import Link from "next/link";

import LegalDocument from "@/components/landing/legal-document";

export const metadata = {
  title: "Privacy Policy",
  description: "How Waitlyze collects, uses, shares, and protects information.",
  alternates: {
    canonical: "/privacy",
    types: { "text/markdown": [{ url: "/privacy.md", title: "Privacy Policy (Markdown)" }] },
  },
  openGraph: {
    type: "website",
    url: "/privacy",
    title: "Privacy Policy | Waitlyze",
    description: "How Waitlyze collects, uses, shares, and protects information.",
    images: ["/opengraph-image"],
  },
};

const sections = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-information", label: "How We Use Information" },
  { id: "ai-clients", label: "AI Clients and MCP" },
  { id: "sharing", label: "Sharing" },
  { id: "retention", label: "Retention" },
  { id: "security", label: "Security" },
  { id: "your-choices", label: "Your Choices" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How we collect, use, share, and retain information."
      sections={sections}
      lastUpdated="November 18, 2026"
    >
      <p>
        This policy applies to Waitlyze websites, waitlist pages, dashboards, APIs, and our Model
        Context Protocol (MCP) integration. It explains how Waitlyze ("we," "us," or "our") handles
        information when you use the service.
      </p>

      <h2 id="information-we-collect">1. Information We Collect</h2>
      <ul>
        <li>
          <span>Account and workspace data:</span> name, email address, authentication records,
          workspace membership, plan, and billing status.
        </li>
        <li>
          <span>Campaign and audience data:</span> waitlist content, subscriber details, consent and
          verification status, referral activity, broadcasts, and analytics you ask us to process.
        </li>
        <li>
          <span>Integration data:</span> OAuth grants, requested scopes, connected-client details,
          tool name, execution status, and timing for MCP requests.
        </li>
        <li>
          <span>Usage, device, and support data:</span> IP address, browser and device information,
          pages and features used, security events, and messages you send to support.
        </li>
      </ul>

      <h2 id="how-we-use-information">2. How We Use Information</h2>
      <p>
        We use information to provide and secure Waitlyze, authenticate users and integrations,
        execute requested campaign actions, send service or campaign messages, provide analytics,
        troubleshoot problems, prevent abuse, comply with law, and improve the service.
      </p>

      <h2 id="ai-clients">3. AI Clients and MCP</h2>
      <p>
        When you connect ChatGPT or another AI client, that client can request the Waitlyze data and
        actions covered by the permissions you approve. We return requested data to that client at
        your direction. The client processes that data under its own terms and privacy policy.
      </p>
      <p>
        Our MCP telemetry is deliberately limited to operational metadata such as the tool name,
        duration, outcome, and basic client type. Tool inputs, tool outputs, conversation text,
        model identifiers, access tokens, API keys, and webhook signing secrets are not recorded in
        MCP analytics. You can revoke a connected client's access from Waitlyze or the client.
      </p>

      <h2 id="sharing">4. Sharing</h2>
      <p>We do not sell or rent personal information. We may share information with:</p>
      <ul>
        <li>ChatGPT or another AI client when you connect it and request an action;</li>
        <li>
          service providers supporting hosting, databases, storage, email, analytics,
          authentication, customer support, and payments;
        </li>
        <li>workspace members according to their role and permissions;</li>
        <li>authorities or other parties when required by law or needed to protect rights; and</li>
        <li>a successor in connection with a merger, acquisition, or sale of assets.</li>
      </ul>

      <h2 id="retention">5. Retention</h2>
      <p>
        Account, campaign, and audience data is generally retained while your account is active and
        for a reasonable period after deletion to complete recovery, security, legal, and backup
        processes. MCP access tokens expire after one hour and refresh tokens after 30 days unless
        revoked earlier. We generally retain MCP operational metadata for up to 12 months, security
        logs for up to 90 days, and support correspondence for up to 24 months. Billing records may
        be retained longer where law requires it. Deleted data may remain in encrypted backups until
        those backups age out.
      </p>

      <h2 id="security">6. Security</h2>
      <p>
        We use reasonable technical and organizational safeguards, including encrypted transport,
        scoped OAuth access, access controls, and secret handling protections. No internet service
        can guarantee absolute security.
      </p>

      <h2 id="your-choices">7. Your Choices</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, restrict, object
        to, or export personal information. You may also disconnect an AI client, revoke OAuth
        access, unsubscribe from marketing messages, or delete campaign data through Waitlyze.
        Contact us to exercise a right that is not available in the product.
      </p>

      <h2 id="changes">8. Changes</h2>
      <p>
        We may update this policy as the service changes. We will update the date above and provide
        additional notice when required.
      </p>

      <h2 id="contact">9. Contact</h2>
      <p>
        Privacy questions and requests can be sent to{" "}
        <Link prefetch={false} href="mailto:support@waitlyze.com">
          support@waitlyze.com
        </Link>
        .
      </p>
    </LegalDocument>
  );
}
