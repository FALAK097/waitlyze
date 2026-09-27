"use client";

import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function Providers({ children }) {
	return (
		<NextThemesProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
			<AuthModalProvider>
				<ProgressBar
					height="4px"
					color="#7c3aed"
					options={{ showSpinner: false }}
					shallowRouting
				/>
				<Toaster position="top-right" />
				{children}
			</AuthModalProvider>
		</NextThemesProvider>
	);
}
