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
	keywords:
		"HypeItUp, HypeItUp waitlist, Pre-launch waitlist, Hype Up your pre-launch, stunning waitlist, waitlist platform, waitlist software, waitlist builder, waitlist creator, waitlist tool, waitlist app, waitlist service, waitlist builder tool, waitlist creator tool, waitlist tool for creators, waitlist tool for entrepreneurs, waitlist tool for marketers, waitlist tool for sales, waitlist tool for startups, waitlist tool for small businesses, waitlist tool for influencers, waitlist tool for YouTubers, waitlist tool for podcasters, waitlist tool for bloggers, waitlist tool for content creators, waitlist tool for online course creators, waitlist tool for event planners, waitlist tool for webinar hosts, waitlist tool for conference organizers, waitlist tool for meetup organizers, fastwaitlist, getwaitlist, waitforit,get more signups, get more email subscribers, get more leads, get more customers, get more signups for your pre-launch, get more email subscribers for your pre-launch, get more leads for your pre-launch, get more customers for your pre-launch",
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
	metadataBase: new URL("https://hypeitup.me"),
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
