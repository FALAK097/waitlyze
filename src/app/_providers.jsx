"use client";

import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";

export function Providers({ children }) {
	return (
			<AuthModalProvider>
				<ProgressBar
					height="4px"
					color="#C6FE1E"
					options={{ showSpinner: false }}
					shallowRouting
				/>
				<Toaster position="top-right" />
				{children}
			</AuthModalProvider>
	);
}
