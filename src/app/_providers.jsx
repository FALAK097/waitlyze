"use client";

import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "@/components/ui/toast";
import { Agentation } from "agentation";

const agentationEndpoint = process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT || "http://localhost:4747";

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
				{process.env.NODE_ENV === "development" && <Agentation endpoint={agentationEndpoint} />}
			</AuthModalProvider>
	);
}
