"use client";

import { env } from "@/lib/env.mjs";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

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
				{children}
			</NextThemesProvider>
		</PostHogProvider>
	);
}
