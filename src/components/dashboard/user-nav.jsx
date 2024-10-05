"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { SignedIn, UserButton } from "@clerk/nextjs";

export function UserNav() {
	return (
		<TooltipProvider disableHoverableContent>
			<Tooltip delayDuration={100}>
				<TooltipTrigger asChild>
					<div className="flex items-center justify-center w-10 h-10 ">
						<SignedIn>
							<UserButton className="p-2 text-white transition duration-300 rounded-md bg-primary hover:bg-primary-dark" />
						</SignedIn>
					</div>
				</TooltipTrigger>
				<TooltipContent side="bottom">Profile</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
