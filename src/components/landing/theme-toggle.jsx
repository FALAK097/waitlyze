"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const { resolvedTheme, setTheme } = useTheme();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <Button variant="ghost" size="icon" className="w-10 h-10" />;
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			className="w-10 h-10 hover:bg-transparent hover:text-primary"
		>
			{resolvedTheme === "dark" ? (
				<Sun className="h-[1.2rem] w-[1.2rem]" />
			) : (
				<Moon className="h-[1.2rem] w-[1.2rem]" />
			)}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
