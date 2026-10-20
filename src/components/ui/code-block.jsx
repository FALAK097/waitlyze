import React from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { CopyIcon } from "../shared/icons";
import { Button } from "./button";

const CodeBlock = React.forwardRef(({ className, ...props }, _ref) => {
  return (
    <div
      className={cn(
        `relative flex min-h-[80px] w-full overflow-hidden rounded border-input px-3 py-2 text-sm`,
        className,
      )}
      style={{ backgroundColor: "#ffffff" }}
    >
      <pre
        tabIndex={0}
        className="no-scrollbar w-full max-w-[380px] overflow-auto break-words whitespace-pre md:max-w-[500px] lg:max-w-[480px]"
      >
        {props.code}
      </pre>
      <Button
        variant="icon"
        aria-label="Copy code"
        className="absolute top-2 right-2 bg-primary text-white opacity-25 duration-300 ease-in-out hover:opacity-100"
        onClick={() => {
          navigator.clipboard.writeText(props.code);
          toast.success("Copied to clipboard");
        }}
      >
        <CopyIcon className="h-5 w-5" />
      </Button>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

export { CodeBlock };
