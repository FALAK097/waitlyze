"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function ModeToggle() {
	const { setTheme, theme } = useTheme();
	const audioRef = useRef(null);

	useEffect(() => {
		audioRef.current = new Audio("/assets/click.mp3");
	}, []);

	const handleToggle = () => {
		if (audioRef.current) {
			audioRef.current.play();
		}
		setTheme(theme === "dark" ? "light" : "dark");
	};

	return (
		<TooltipProvider disableHoverableContent>
			<Tooltip delayDuration={100}>
				<TooltipTrigger asChild>
					<Button
						className="w-8 h-8 mr-2 rounded-full bg-background hover:bg-transparent"
						variant="outline"
						size="icon"
						onClick={handleToggle}
					>
						<SunIcon className="w-[1.2rem] h-[1.2rem] rotate-90 scale-0 transition-transform ease-in-out duration-500 dark:rotate-0 dark:scale-100" />
						<MoonIcon className="absolute w-[1.2rem] h-[1.2rem] rotate-0 scale-1000 transition-transform ease-in-out duration-500 text-black dark:-rotate-90 dark:scale-0" />
						<span className="sr-only">Switch Theme</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">Switch Theme</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
