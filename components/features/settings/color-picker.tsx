"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, Pipette } from "lucide-react";
import { isValidHexColor, getContrastColor, colorPresets } from "@/types/branding";

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  presets?: { name: string; color: string }[];
  showPresets?: boolean;
  disabled?: boolean;
  className?: string;
}

// Common colors for quick selection
const quickColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#78716c", // stone
  "#71717a", // zinc
  "#64748b", // slate
  "#0f172a", // dark
];

export function ColorPicker({
  label,
  value,
  onChange,
  presets,
  showPresets = true,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = useCallback(
    (newValue: string) => {
      setInputValue(newValue);

      // Only call onChange if valid hex color
      if (isValidHexColor(newValue)) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const handleInputBlur = useCallback(() => {
    // If invalid, revert to previous value
    if (!isValidHexColor(inputValue)) {
      setInputValue(value);
    }
  }, [inputValue, value]);

  const handleColorSelect = useCallback(
    (color: string) => {
      setInputValue(color);
      onChange(color);
    },
    [onChange]
  );

  const contrastColor = getContrastColor(value);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
          >
            <div
              className="mr-2 h-5 w-5 rounded border"
              style={{ backgroundColor: value }}
            />
            <span className="flex-1">{value}</span>
            <Pipette className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="space-y-4">
            {/* Color Input */}
            <div className="flex items-center gap-2">
              <div
                className="h-10 w-10 rounded-lg border-2 shrink-0"
                style={{ backgroundColor: value }}
              >
                <div
                  className="h-full w-full flex items-center justify-center"
                  style={{ color: contrastColor }}
                >
                  {isValidHexColor(inputValue) && (
                    <Check className="h-5 w-5" />
                  )}
                </div>
              </div>
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                placeholder="#000000"
                className="font-mono"
              />
            </div>

            {/* Native Color Picker */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">
                Pick color:
              </Label>
              <input
                type="color"
                value={value}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border-0 p-0"
              />
            </div>

            {/* Quick Colors */}
            <div>
              <Label className="text-sm text-muted-foreground">
                Quick colors
              </Label>
              <div className="mt-2 grid grid-cols-10 gap-1">
                {quickColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-6 w-6 rounded border-2 transition-transform hover:scale-110",
                      color === value
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </div>

            {/* Presets */}
            {showPresets && (presets || colorPresets) && (
              <div>
                <Label className="text-sm text-muted-foreground">Presets</Label>
                <div className="mt-2 space-y-1">
                  {(presets || colorPresets.map((p) => ({ name: p.name, color: p.primary }))).map(
                    (preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                          preset.color === value && "bg-accent"
                        )}
                        onClick={() => handleColorSelect(preset.color)}
                      >
                        <div
                          className="h-4 w-4 rounded border"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span>{preset.name}</span>
                        {preset.color === value && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Dual color picker for primary/secondary pairs
interface DualColorPickerProps {
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryValue: string;
  secondaryValue: string;
  onPrimaryChange: (color: string) => void;
  onSecondaryChange: (color: string) => void;
  disabled?: boolean;
}

export function DualColorPicker({
  primaryLabel = "Primary Color",
  secondaryLabel = "Secondary Color",
  primaryValue,
  secondaryValue,
  onPrimaryChange,
  onSecondaryChange,
  disabled = false,
}: DualColorPickerProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorPicker
          label={primaryLabel}
          value={primaryValue}
          onChange={onPrimaryChange}
          disabled={disabled}
        />
        <ColorPicker
          label={secondaryLabel}
          value={secondaryValue}
          onChange={onSecondaryChange}
          disabled={disabled}
        />
      </div>

      {/* Preview */}
      <div className="rounded-lg border p-4">
        <Label className="text-sm text-muted-foreground">Preview</Label>
        <div className="mt-2 flex gap-2">
          <Button
            style={{
              backgroundColor: primaryValue,
              color: getContrastColor(primaryValue),
            }}
          >
            Primary Button
          </Button>
          <Button
            variant="outline"
            style={{
              borderColor: primaryValue,
              color: primaryValue,
            }}
          >
            Outline Button
          </Button>
          <Button
            style={{
              backgroundColor: secondaryValue,
              color: getContrastColor(secondaryValue),
            }}
          >
            Secondary
          </Button>
        </div>
      </div>
    </div>
  );
}

// Theme preset selector
interface ThemePresetSelectorProps {
  value: { primary: string; secondary: string };
  onChange: (preset: { primary: string; secondary: string }) => void;
  disabled?: boolean;
}

export function ThemePresetSelector({
  value,
  onChange,
  disabled = false,
}: ThemePresetSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Theme Presets</Label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {colorPresets.map((preset) => {
          const isSelected =
            value.primary === preset.primary &&
            value.secondary === preset.secondary;

          return (
            <button
              key={preset.name}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({ primary: preset.primary, secondary: preset.secondary })
              }
              className={cn(
                "relative rounded-lg border-2 p-3 transition-all hover:border-primary/50",
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-muted",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <div className="flex gap-2 mb-2">
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: preset.primary }}
                />
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: preset.secondary }}
                />
              </div>
              <span className="text-sm font-medium">{preset.name}</span>
              {isSelected && (
                <div className="absolute -right-1 -top-1 rounded-full bg-primary p-0.5">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
