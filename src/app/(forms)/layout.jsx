import "../globals.css";

export const metadata = {
	title: {
		template: "%s | HypeItUp",
		default: "HypeItUp | Create stunning waitlists to hype up your audience",
	},
	description:
		"Create beautiful waitlist pages, collect signups, and get insights on your audience with HypeItUp's powerful waitlist platform.",
};

export default function FormsLayout({ children }) {
	return <>{children}</>;
}
