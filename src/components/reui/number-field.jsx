"use client";
import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { cva } from "class-variance-authority";
import { createContext, useContext, useId } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const NumberFieldContext = createContext(null);

const numberFieldGroupVariants = cva(
  "relative flex w-full justify-between rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 focus-within:has-aria-invalid:border-destructive focus-within:has-aria-invalid:ring-destructive/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 dark:bg-input/30 dark:focus-within:has-aria-invalid:ring-destructive/40 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        sm: "h-7 text-sm",
        default: "h-8 text-sm",
        lg: "h-9 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const numberFieldButtonVariants = cva(
  "relative flex shrink-0 cursor-pointer items-center justify-center transition-colors hover:bg-accent pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11",
  {
    variants: {
      // Ladders restored from the pre-rename source. Rhea was added after they
      // were written, so its rungs are new: rhea tracks nova here because the
      // shadcn Input is h-8 px-2.5 in both sheets, where luma is h-9 px-3.
      size: {
        sm: ["px-1.5", "[&_svg:not([class*='size-'])]:size-3.5"],
        default: ["px-2", "[&_svg:not([class*='size-'])]:size-4"],
        lg: ["px-2.5", "[&_svg:not([class*='size-'])]:size-4"],
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const numberFieldInputVariants = cva(
  "w-full min-w-0 flex-1 bg-transparent text-center tabular-nums outline-none",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5",
        default: "px-2.5 py-1",
        lg: "px-2.5 py-1.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function NumberField({ id, className, size = "default", ...props }) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const sizeValue = size ?? "default";

  return (
    <NumberFieldContext.Provider value={{ fieldId, size: sizeValue }}>
      <NumberFieldPrimitive.Root
        className={cn("flex w-full flex-col items-start gap-2", className)}
        data-size={sizeValue}
        data-slot="number-field"
        id={fieldId}
        {...props}
      />
    </NumberFieldContext.Provider>
  );
}

function NumberFieldGroup({ className, size: sizeProp, ...props }) {
  const context = useContext(NumberFieldContext);
  if (!context) {
    throw new Error("NumberFieldGroup must be used within a NumberField component.");
  }
  const size = sizeProp ?? context.size;

  return (
    <NumberFieldPrimitive.Group
      className={cn(numberFieldGroupVariants({ size }), className)}
      data-slot="number-field-group"
      {...props}
    />
  );
}

function NumberFieldDecrement({ className, size: sizeProp, children, ...props }) {
  const context = useContext(NumberFieldContext);
  if (!context) {
    throw new Error("NumberFieldDecrement must be used within a NumberField component.");
  }
  const size = sizeProp ?? context.size;

  return (
    <NumberFieldPrimitive.Decrement
      className={cn(numberFieldButtonVariants({ size }), "rounded-s-lg border-e-0", className)}
      data-slot="number-field-decrement"
      {...props}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M3 8h10" />
        </svg>
      )}
    </NumberFieldPrimitive.Decrement>
  );
}

function NumberFieldIncrement({ className, size: sizeProp, children, ...props }) {
  const context = useContext(NumberFieldContext);
  if (!context) {
    throw new Error("NumberFieldIncrement must be used within a NumberField component.");
  }
  const size = sizeProp ?? context.size;

  return (
    <NumberFieldPrimitive.Increment
      className={cn(numberFieldButtonVariants({ size }), "rounded-e-lg border-s-0", className)}
      data-slot="number-field-increment"
      {...props}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
      )}
    </NumberFieldPrimitive.Increment>
  );
}

function NumberFieldInput({ className, size: sizeProp, ...props }) {
  const context = useContext(NumberFieldContext);
  if (!context) {
    throw new Error("NumberFieldInput must be used within a NumberField component.");
  }
  const size = sizeProp ?? context.size;

  return (
    <NumberFieldPrimitive.Input
      className={cn(numberFieldInputVariants({ size }), className)}
      data-slot="number-field-input"
      {...props}
    />
  );
}

function NumberFieldScrubArea({ className, label, ...props }) {
  const context = useContext(NumberFieldContext);
  if (!context) {
    throw new Error(
      "NumberFieldScrubArea must be used within a NumberField component for accessibility.",
    );
  }

  return (
    <NumberFieldPrimitive.ScrubArea
      className={cn("flex cursor-ew-resize", className)}
      data-slot="number-field-scrub-area"
      {...props}
    >
      <Label className="cursor-ew-resize" htmlFor={context.fieldId}>
        {label}
      </Label>
      <NumberFieldPrimitive.ScrubAreaCursor className="drop-shadow-[0_1px_1px_#0008] filter">
        <CursorGrowIcon />
      </NumberFieldPrimitive.ScrubAreaCursor>
    </NumberFieldPrimitive.ScrubArea>
  );
}

function CursorGrowIcon(props) {
  return (
    <svg
      fill="black"
      height="14"
      stroke="white"
      viewBox="0 0 24 14"
      width="26"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  );
}

export {
  NumberField,
  NumberFieldScrubArea,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldGroup,
  NumberFieldInput,
};
