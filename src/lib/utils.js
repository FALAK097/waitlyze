import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function waitFor(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
