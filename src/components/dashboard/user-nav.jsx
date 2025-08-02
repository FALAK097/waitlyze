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
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<SignedIn>
						<UserButton className="p-2 text-white rounded-md bg-primary" />
					</SignedIn>
				</TooltipTrigger>
				<TooltipContent side="bottom">Profile</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
