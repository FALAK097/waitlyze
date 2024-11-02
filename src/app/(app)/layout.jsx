import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "../api/uploadthing/core";

export default function AppLayout({ children }) {
	return (
		<ClerkProvider telemetry={false}>
			<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
			<DashboardLayout>{children}</DashboardLayout>
		</ClerkProvider>
	);
}
