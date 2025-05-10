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
            <SunIcon className="absolute w-[1.2rem] h-[1.2rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 dark:opacity-0" />
            <MoonIcon className="absolute w-[1.2rem] h-[1.2rem] rotate-90 scale-0 transition-all duration-500 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100" />
            <span className="sr-only">Switch Theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Switch Theme</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
