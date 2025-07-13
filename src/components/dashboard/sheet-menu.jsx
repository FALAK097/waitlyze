import { MenuIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import { Menu } from "./menu";

export function SheetMenu() {
	return (
		<Sheet>
			<SheetTrigger className="lg:hidden" asChild>
				<Button
					className="h-8 hover:bg-background"
					variant="outline"
					size="icon"
				>
					<MenuIcon className="text-black dark:text-white" size={20} />
				</Button>
			</SheetTrigger>
			<SheetContent
				className="flex flex-col h-full px-3 sm:w-72 dark:bg-black"
				side="left"
			>
				<SheetHeader>
					<Button
						className="flex items-center justify-center pt-1 pb-2"
						variant="link"
						asChild
					>
						<Link href="/dashboard" className="gap-2">
							<Image src="/images/logo.png" alt="Logo" width={60} height={60} />
							<SheetTitle className="text-lg font-bold">Waitlyze</SheetTitle>
						</Link>
					</Button>
				</SheetHeader>
				<Menu isOpen />
			</SheetContent>
		</Sheet>
	);
}
