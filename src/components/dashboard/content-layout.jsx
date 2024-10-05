import { Navbar } from "./navbar";

export function ContentLayout({ title, children }) {
	return (
		<div>
			<Navbar title={title} />
			<div className="container px-4 pt-8 pb-8 sm:px-8">{children}</div>
		</div>
	);
}
