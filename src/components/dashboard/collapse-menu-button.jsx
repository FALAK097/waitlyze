"use client";

import { ChevronDown, Dot } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";
import { usePathname } from "next/navigation";

export function CollapseMenuButton({
	icon: Icon,
	label,
	active,
	submenus,
	isOpen,
}) {
	const pathname = usePathname();
	const isSubmenuActive = submenus.some((submenu) =>
		submenu.active === undefined ? submenu.href === pathname : submenu.active,
	);
	const [isCollapsed, setIsCollapsed] = useState(isSubmenuActive);

	return isOpen ? (
		<Collapsible
			open={isCollapsed}
			onOpenChange={setIsCollapsed}
			className="w-full"
		>
			<CollapsibleTrigger
				className="[&[data-state=open]>div>div>svg]:rotate-180 mb-1"
				asChild
			>
				<Button
					variant={active ? "secondary" : "ghost"}
					className="justify-start w-full h-10"
				>
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center">
							<span className="mr-4">
								<Icon size={18} />
							</span>
							<p
								className={cn(
									"max-w-[150px] truncate",
									isOpen
										? "translate-x-0 opacity-100"
										: "-translate-x-96 opacity-0",
								)}
							>
								{label}
							</p>
						</div>
						<div
							className={cn(
								"whitespace-nowrap",
								isOpen
									? "translate-x-0 opacity-100"
									: "-translate-x-96 opacity-0",
							)}
						>
							<ChevronDown
								size={18}
								className="transition-transform duration-200"
							/>
						</div>
					</div>
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
				{submenus.map(({ href, label, active }, i) => (
					<Button
						key={`collapsible-${label}-${href}-${i}`
							.replaceAll(" ", "")
							.toLowerCase()}
						variant={
							(active === undefined && pathname === href) || active
								? "secondary"
								: "ghost"
						}
						className="justify-start w-full h-10 mb-1"
						asChild
					>
						<Link href={href}>
							<span className="ml-2 mr-4">
								<Dot size={18} />
							</span>
							<p
								className={cn(
									"max-w-[170px] truncate",
									isOpen
										? "translate-x-0 opacity-100"
										: "-translate-x-96 opacity-0",
								)}
							>
								{label}
							</p>
						</Link>
					</Button>
				))}
			</CollapsibleContent>
		</Collapsible>
	) : (
		<DropdownMenu>
			<TooltipProvider disableHoverableContent>
				<Tooltip delayDuration={100}>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<Button
								variant={active ? "secondary" : "ghost"}
								className="justify-start w-full h-10 mb-1"
							>
								<div className="flex items-center justify-between w-full">
									<div className="flex items-center">
										<span className={cn(isOpen === false ? "" : "mr-4")}>
											<Icon size={18} />
										</span>
										<p
											className={cn(
												"max-w-[200px] truncate",
												isOpen === false ? "opacity-0" : "opacity-100",
											)}
										>
											{label}
										</p>
									</div>
								</div>
							</Button>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent side="right" align="start" alignOffset={2}>
						{label}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<DropdownMenuContent side="right" sideOffset={25} align="start">
				<DropdownMenuLabel className="max-w-[190px] truncate">
					{label}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{submenus.map(({ href, label, active }, i) => (
					<DropdownMenuItem
						key={`drop-down-${href}-${label}-${i}`
							.replaceAll(" ", "")
							.toLowerCase()}
						asChild
					>
						<Link
							className={`cursor-pointer ${
								((active === undefined && pathname === href) || active) &&
								"bg-secondary"
							}`}
							href={href}
						>
							<p className="max-w-[180px] truncate">{label}</p>
						</Link>
					</DropdownMenuItem>
				))}
				<DropdownMenuArrow className="fill-border" />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
