import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import React from "react";
import toast from "react-hot-toast";
import { CopyIcon } from "../shared/icons";
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
			<pre tabIndex={0} className="w-full max-w-[380px] md:max-w-[500px] lg:max-w-[480px] overflow-auto break-words whitespace-pre no-scrollbar">
				{props.code}
			</pre>
			<Button
				variant="icon"
				aria-label="Copy code"
				className="absolute text-white duration-300 ease-in-out opacity-25 top-2 right-2 bg-primary hover:opacity-100"
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
