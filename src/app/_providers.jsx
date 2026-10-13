"use client";

import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "@/components/ui/sonner";
import { Agentation } from "agentation";

// No endpoint: annotations stay in localStorage (copy/paste into an agent).
// Set NEXT_PUBLIC_AGENTATION_ENDPOINT and run `pnpm agentation` for MCP sync.
const agentationEndpoint = process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT;

export function Providers({ children }) {
	return (
			<AuthModalProvider>
				<ProgressBar
					height="4px"
					color="#C6FE1E"
					options={{ showSpinner: false }}
					shallowRouting
				/>
				<Toaster />
				{children}
				{process.env.NODE_ENV === "development" && <Agentation {...(agentationEndpoint ? { endpoint: agentationEndpoint } : {})} />}
			</AuthModalProvider>
	);
}
