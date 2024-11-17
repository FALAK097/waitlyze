import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Providers } from "./_providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "HypeItUp",
	description: "Wait for the perfect moment",
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
