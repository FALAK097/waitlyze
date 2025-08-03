import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Menu } from "./menu";
import { SidebarToggle } from "./sidebar-toggle";

export function Sidebar() {
	const sidebar = useStore(useSidebarToggle, (state) => state);

	if (!sidebar) return null;

	return (
		<aside
			className={cn(
				"fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 bg-background",
				sidebar?.isOpen === false ? "w-[90px]" : "w-72",
			)}
		>
			<SidebarToggle isOpen={sidebar?.isOpen} setIsOpen={sidebar?.setIsOpen} />
			<div className="flex overflow-y-auto relative flex-col px-3 py-4 h-full shadow-md">
				<Button
					className={cn(
						"transition-transform ease-in-out duration-300 mb-1",
						sidebar?.isOpen === false ? "translate-x-1" : "translate-x-0",
					)}
					variant="link"
					asChild
				>
					<Link className="flex" href="/dashboard">
						<Image src="/images/logo.png" alt="Logo" width={48} height={48} />
						<h1
							className={cn(
								"font-bold text-xl whitespace-nowrap transition-[transform,opacity,display] ease-in-out duration-300 mr-24",
								sidebar?.isOpen === false
									? "-translate-x-96 opacity-0 hidden"
									: "translate-x-0 opacity-100",
							)}
						>
							Waitlyze
						</h1>
					</Link>
				</Button>
				<Menu isOpen={sidebar?.isOpen} />
			</div>
		</aside>
	);
}
