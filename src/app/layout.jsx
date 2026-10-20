import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { publicFontClasses } from "@/lib/public-fonts";
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/site-metadata";

import { Providers } from "./_providers";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | Waitlyze" },
  description: SITE_DESCRIPTION,
  applicationName: "Waitlyze",
  keywords: [
    "waitlist builder",
    "waitlist forms",
    "product launch",
    "referral tracking",
    "email automation",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Waitlyze",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  appleWebApp: { title: "Waitlyze", capable: true, statusBarStyle: "default" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={publicFontClasses} data-scroll-behavior="smooth">
      <body className={publicFontClasses}>
        <NuqsAdapter>
          <Providers>{children}</Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
