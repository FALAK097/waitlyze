import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SidebarToggle({ isOpen, setIsOpen }) {
	return (
		<div className="invisible lg:visible absolute top-[12px] -right-[16px] z-20">
			<Button
				onClick={() => setIsOpen?.()}
				className="w-8 h-8 rounded-md hover:bg-transparent text-primary hover:text-primary-dark dark:hover:text-white"
				variant="outline"
				size="icon"
			>
				<ChevronLeft
					className={cn(
						"h-4 w-4 transition-transform ease-in-out duration-700",
						isOpen === false ? "rotate-180" : "rotate-0",
					)}
				/>
			</Button>
		</div>
	);
}
