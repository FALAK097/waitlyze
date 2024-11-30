"use client";

import { env } from "@/lib/env.mjs";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Toaster } from "react-hot-toast";

if (typeof window !== "undefined") {
	posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
		api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
		person_profiles: "identified_only",
	});
}

export function Providers({ children }) {
	return (
		<PostHogProvider client={posthog}>
			<NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
				<ProgressBar
					height="4px"
					color="#7c3aed"
					options={{ showSpinner: false }}
					shallowRouting
				/>
				<Toaster position="top-right" />
				{children}
			</NextThemesProvider>
		</PostHogProvider>
	);
}
