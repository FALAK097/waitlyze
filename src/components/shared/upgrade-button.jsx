import Pricing from "@/components/landing/pricing";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Lock, X } from "lucide-react";

export function UpgradeButton({ className }) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={`px-2 text-xs bg-transparent h-7 text-primary hover:bg-transparent hover:text-primary/80 ${className}`}
				>
					<Lock className="w-3 h-3 mr-1" />
					Upgrade
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-5xl">
				<DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
					<X className="w-4 h-4" />
					<span className="sr-only">Close</span>
				</DialogClose>
				<Pricing isModal />
			</DialogContent>
		</Dialog>
	);
}
