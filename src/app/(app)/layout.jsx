import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "../api/uploadthing/core";

export const metadata = {
	title: {
		template: "%s | HypeItUp",
		default:
			"HypeItUp | Create stunning waitlists to hype up your audience & get analytics on your audience",
	},
};

export default function AppLayout({ children }) {
	return (
		<>
			<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
			<DashboardLayout>{children}</DashboardLayout>
		</>
	);
}
