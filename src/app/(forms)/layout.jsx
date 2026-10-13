import "../globals.css";
import "./public-page.css";

export const metadata = {
	title: {
		template: "%s | Waitlyze",
		default: "Waitlyze | Create stunning waitlists to hype up your audience",
	},
	description:
		"Create beautiful waitlist pages, collect signups, and get insights on your audience with Waitlyze's powerful waitlist platform.",
};

export default function FormsLayout({ children }) {
	return <>{children}</>;
}
