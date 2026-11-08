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
  authors: [{ name: "Waitlyze", url: SITE_URL }],
  creator: "Waitlyze",
  publisher: "Waitlyze",
  category: "technology",
  keywords: [
    "waitlist builder",
    "waitlist software",
    "waitlist forms",
    "referral waitlist",
    "pre-launch marketing",
    "email automation",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "Waitlyze Blog" }],
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Waitlyze",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
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
