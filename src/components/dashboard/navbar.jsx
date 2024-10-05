import { ModeToggle } from "@/components/mode-toggle";
import { SheetMenu } from "./sheet-menu";
import { UserNav } from "./user-nav";

export function Navbar({ title }) {
	return (
		<header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-primary">
			<div className="flex items-center mx-4 sm:mx-8 h-14">
				<div className="flex items-center space-x-4 lg:space-x-0">
					<SheetMenu />
					<h1 className="font-bold">{title}</h1>
				</div>
				<div className="flex items-center justify-end flex-1">
					<ModeToggle />
					<UserNav />
				</div>
			</div>
		</header>
	);
}
