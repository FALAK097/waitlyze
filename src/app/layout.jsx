import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Providers } from "./_providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: {
		default: "HypeItUp | Create Engaging Waitlists for Your Product",
		template: "%s | HypeItUp",
	},
	description:
		"Create beautiful, customizable waitlist pages to build anticipation and convert visitors into eager customers. Get powerful analytics to understand your audience better.",
	openGraph: {
		title: "HypeItUp | Create Engaging Waitlists for Your Product",
		description:
			"Create beautiful, customizable waitlist pages to build anticipation and convert visitors into eager customers. Get powerful analytics to understand your audience better.",
		images: [
			{
				url: "/opengraph-image.png",
				width: 1200,
				height: 630,
				alt: "HypeItUp Preview",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "HypeItUp | Create Engaging Waitlists for Your Product",
		description:
			"Create beautiful, customizable waitlist pages to build anticipation and convert visitors into eager customers. Get powerful analytics to understand your audience better.",
		images: ["/opengraph-image.png"],
	},
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<ClerkProvider telemetry={false}>
					<Providers>{children}</Providers>
				</ClerkProvider>
			</body>
		</html>
	);
}
