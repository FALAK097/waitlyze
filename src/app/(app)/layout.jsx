import DashboardLayoutWrapper from "@/components/dashboard/dashboard-layout-wrapper";

export const metadata = {
	title: {
		template: "%s | Waitlyze",
		default:
			"Waitlyze | Create stunning waitlists to hype up your audience & get analytics on your audience",
	},
};

export default function AppLayout({ children }) {
	return (
		<DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
	);
}
