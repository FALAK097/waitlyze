import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "../api/uploadthing/core";

export default function AppLayout({ children }) {
	return (
		<>
			<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
			<DashboardLayout>{children}</DashboardLayout>
		</>
	);
}
