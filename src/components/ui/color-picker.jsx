"use client";

import { useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForwardedRef } from "@/hooks/use-forwarded-ref";
import { cn } from "@/lib/utils";
const ColorPicker = (
  { disabled, value, onChange, onBlur, name, className, ...props },
  forwardedRef,
) => {
  const ref = useForwardedRef(forwardedRef);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const parsedValue = useMemo(() => {
    return value || "#FFFFFF";
  }, [value]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        disabled={disabled}
        onBlur={onBlur}
        render={
          <Button
            {...props}
            className={cn("block", className)}
            name={name}
            onClick={() => {
              setOpen(true);
            }}
            size="icon"
            style={{
              backgroundColor: parsedValue,
            }}
            variant="outline"
          >
            <div />
          </Button>
        }
      />
      <PopoverContent className="w-60">
        <HexColorPicker color={parsedValue} onChange={onChange} />
        <Input
          aria-label="Hex color"
          maxLength={7}
          onBlur={() => setDraft(null)}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setDraft(next);
            if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next);
          }}
          ref={ref}
          value={draft ?? parsedValue}
        />
      </PopoverContent>
    </Popover>
  );
};
ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
