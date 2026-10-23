"use client";

import { useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForwardedRef } from "@/hooks/use-forwarded-ref";
import { cn } from "@/lib/utils";

const HEX6 = /^#[0-9a-f]{6}$/i;
const HEX3 = /^#[0-9a-f]{3}$/i;

const RGB_FIELDS = [
  ["r", "Red", 255],
  ["g", "Green", 255],
  ["b", "Blue", 255],
];
const HSL_FIELDS = [
  ["h", "Hue", 360],
  ["s", "Saturation", 100],
  ["l", "Lightness", 100],
];

function normalizeHex(input) {
  const hex = input?.startsWith("#") ? input : `#${input ?? ""}`;
  if (HEX6.test(hex)) return hex;
  if (HEX3.test(hex)) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return "#FFFFFF";
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;
  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
  }
  return {
    h: Math.round(hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function hslToRgb({ h, s, l }) {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  let channels;
  if (segment < 1) channels = [chroma, x, 0];
  else if (segment < 2) channels = [x, chroma, 0];
  else if (segment < 3) channels = [0, chroma, x];
  else if (segment < 4) channels = [0, x, chroma];
  else if (segment < 5) channels = [x, 0, chroma];
  else channels = [chroma, 0, x];
  const match = lightness - chroma / 2;
  return {
    r: Math.round((channels[0] + match) * 255),
    g: Math.round((channels[1] + match) * 255),
    b: Math.round((channels[2] + match) * 255),
  };
}

const ColorPicker = (
  { disabled, value, onChange, onBlur, name, className, ...props },
  forwardedRef,
) => {
  const ref = useForwardedRef(forwardedRef);
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState({});

  const color = useMemo(() => normalizeHex(value), [value]);
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);

  const numberField = ([key, label, max], channels, convert) => (
    <Input
      aria-label={label}
      className="px-1 text-center"
      inputMode="numeric"
      key={key}
      value={drafts[key] ?? String(channels[key])}
      onBlur={() =>
        setDrafts((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        })
      }
      onChange={(event) => {
        const raw = event.target.value;
        setDrafts((current) => ({ ...current, [key]: raw }));
        if (!/^\d{1,3}$/.test(raw)) return;
        const next = { ...channels, [key]: Math.max(0, Math.min(max, Number(raw))) };
        onChange(convert(next));
      }}
    />
  );

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
              backgroundColor: color,
            }}
            variant="outline"
          >
            <div />
          </Button>
        }
      />
      <PopoverContent className="w-64">
        <HexColorPicker color={color} onChange={onChange} />
        <div className="grid gap-1.5">
          <Input
            aria-label="Hex color"
            maxLength={7}
            value={drafts.hex ?? color}
            onBlur={() =>
              setDrafts((current) => {
                const next = { ...current };
                delete next.hex;
                return next;
              })
            }
            onChange={(event) => {
              const raw = event.target.value;
              setDrafts((current) => ({ ...current, hex: raw }));
              const normalized = raw.startsWith("#") ? raw : `#${raw}`;
              if (HEX6.test(normalized)) onChange(normalized);
            }}
            ref={ref}
          />
          <div className="grid grid-cols-4 items-center gap-1.5">
            <span className="text-xs text-muted-foreground">RGB</span>
            {RGB_FIELDS.map((field) => numberField(field, rgb, rgbToHex))}
          </div>
          <div className="grid grid-cols-4 items-center gap-1.5">
            <span className="text-xs text-muted-foreground">HSL</span>
            {HSL_FIELDS.map((field) => numberField(field, hsl, (next) => rgbToHex(hslToRgb(next))))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
