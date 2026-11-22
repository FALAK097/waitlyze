import Link from "next/link";

import LegalDocument from "@/components/landing/legal-document";

export const metadata = {
  title: "Support",
  description: "Get help with Waitlyze accounts, campaigns, billing, and integrations.",
  alternates: {
    canonical: "/support",
    types: { "text/markdown": [{ url: "/support.md", title: "Waitlyze Support (Markdown)" }] },
  },
  openGraph: {
    type: "website",
    url: "/support",
    title: "Support | Waitlyze",
    description: "Get help with Waitlyze accounts, campaigns, billing, and integrations.",
    images: ["/opengraph-image"],
  },
};

const sections = [
  { id: "contact", label: "Contact Support" },
  { id: "include", label: "What to Include" },
  { id: "chatgpt", label: "ChatGPT Plugin Help" },
  { id: "privacy", label: "Privacy and Accounts" },
];

export default function SupportPage() {
  return (
    <LegalDocument
      title="Waitlyze Support"
      description="Help with your account, campaigns, billing, and connected AI clients."
      sections={sections}
      lastUpdated="November 18, 2026"
    >
      <h2 id="contact">Contact Support</h2>
      <p>
        Email{" "}
        <Link prefetch={false} href="mailto:support@waitlyze.com">
          support@waitlyze.com
        </Link>{" "}
        for product, account, billing, or integration help. We aim to reply within two business
        days.
      </p>

      <h2 id="include">What to Include</h2>
      <p>
        Include your Waitlyze account email, workspace or waitlist name, what you expected to
        happen, and any visible error message. Do not send passwords, access tokens, API keys, or
        webhook secrets.
      </p>

      <h2 id="chatgpt">ChatGPT Plugin Help</h2>
      <p>
        If the Waitlyze plugin cannot connect, disconnect it in ChatGPT and connect it again. Check
        the requested permissions before approving access. For an unexpected tool result, include
        the approximate time and tool or action name in your support message, but do not include
        private conversation content.
      </p>

      <h2 id="privacy">Privacy and Accounts</h2>
      <p>
        To request access, correction, export, or deletion of account data, email support from the
        address associated with your account. See our{" "}
        <Link prefetch={false} href="/privacy">
          Privacy Policy
        </Link>{" "}
        for details.
      </p>
    </LegalDocument>
  );
}
