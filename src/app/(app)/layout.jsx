import DashboardLayoutWrapper from "@/components/dashboard/dashboard-layout-wrapper";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "../api/uploadthing/core";

export const metadata = {
	title: {
		template: "%s | Waitlyze",
		default:
			"Waitlyze | Create stunning waitlists to hype up your audience & get analytics on your audience",
	},
};

export default function AppLayout({ children }) {
	return (
		<>
			<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
			<DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
		</>
	);
}
