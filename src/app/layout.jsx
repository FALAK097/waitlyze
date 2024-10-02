import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Providers } from "./_providers";

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
					<Providers>{children}</Providers>
				</body>
			</html>
		</ClerkProvider>
	);
}
