import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { Inter } from "next/font/google";
import { extractRouterConfig } from "uploadthing/server";
import { Providers } from "./_providers";
import { ourFileRouter } from "./api/uploadthing/core";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "Waitlist",
	description: "Wait for the perfect moment",
};

export default function RootLayout({ children }) {
	return (
		<ClerkProvider telemetry={false}>
			<html lang="en" suppressHydrationWarning>
				<body className={inter.className}>
					<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
					<Providers>{children}</Providers>
				</body>
			</html>
		</ClerkProvider>
	);
}
