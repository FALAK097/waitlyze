import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

export const Spinner = ({ className }) => {
	return <Loader className={cn("h-4 w-4 mr-2 animate-spin", className)} />;
};
