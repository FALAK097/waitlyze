import { SheetMenu } from "./sheet-menu";
import { UserNav } from "./user-nav";

export function Navbar({ title }) {
	return (
		<header className="sticky top-0 z-10 w-full shadow backdrop-blur bg-background/95 supports-backdrop-filter:bg-background/60 dark:shadow-primary">
			<div className="flex justify-between items-center mx-4 h-14 sm:mx-8">
				<div className="flex items-center space-x-4 lg:space-x-0">
					<SheetMenu />
					<h1 className="font-medium text-secondary-foreground">{title}</h1>
				</div>
				<div className="flex items-center space-x-4">
					<UserNav />
				</div>
			</div>
		</header>
	);
}
