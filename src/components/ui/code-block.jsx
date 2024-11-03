import { cn } from "@/lib/utils";
import { CopyIcon } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";
import toast from "react-hot-toast";
import { Button } from "./button";

const CodeBlock = React.forwardRef(({ className, ...props }, ref) => {
	const { theme } = useTheme();
	return (
		<div
			className={cn(
				`relative flex min-h-[80px] w-full rounded border-input px-3 py-2
          text-sm overflow-hidden`,
				className,
			)}
			style={{ backgroundColor: theme !== "light" ? "#282a36" : "#ffffff" }}
		>
			<pre className="w-full max-w-[380px] md:max-w-[500px] lg:max-w-[480px] overflow-auto break-words whitespace-pre no-scrollbar">
				{props.code}
			</pre>
			<Button
				variant="icon"
				className="absolute top-2 right-2 bg-primary text-white opacity-25 hover:opacity-100 ease-in-out duration-300"
				onClick={() => {
					navigator.clipboard.writeText(props.code);
					toast.success("Copied to clipboard");
				}}
			>
				<CopyIcon className="w-5 h-5" />
			</Button>
		</div>
	);
});

CodeBlock.displayName = "CodeBlock";

export { CodeBlock };
