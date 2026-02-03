"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Pipette, Copy, RotateCcw } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presetColors?: string[];
  showInput?: boolean;
  showPresets?: boolean;
  showGradient?: boolean;
  className?: string;
  disabled?: boolean;
}

// Default preset colors for interior design
const defaultPresetColors = [
  // Neutrals
  "#FFFFFF", "#F5F5F5", "#E5E5E5", "#D4D4D4", "#A3A3A3",
  "#737373", "#525252", "#404040", "#262626", "#171717",
  // Warm tones
  "#FEF3C7", "#FDE68A", "#FCD34D", "#FBBF24", "#F59E0B",
  "#D97706", "#B45309", "#92400E", "#78350F", "#451A03",
  // Cool tones
  "#DBEAFE", "#BFDBFE", "#93C5FD", "#60A5FA", "#3B82F6",
  "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A", "#172554",
  // Greens
  "#DCFCE7", "#BBF7D0", "#86EFAC", "#4ADE80", "#22C55E",
  "#16A34A", "#15803D", "#166534", "#14532D", "#052E16",
  // Reds
  "#FEE2E2", "#FECACA", "#FCA5A5", "#F87171", "#EF4444",
  "#DC2626", "#B91C1C", "#991B1B", "#7F1D1D", "#450A0A",
  // Purples
  "#F3E8FF", "#E9D5FF", "#D8B4FE", "#C084FC", "#A855F7",
  "#9333EA", "#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95",
];

export function ColorPicker({
  value,
  onChange,
  label,
  presetColors = defaultPresetColors,
  showInput = true,
  showPresets = true,
  showGradient = true,
  className,
  disabled = false,
}: ColorPickerProps) {
  const { t, language } = useLanguage();
  const [localValue, setLocalValue] = useState(value);
  const [copied, setCopied] = useState(false);
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (newColor: string) => {
      setLocalValue(newColor);
      onChange(newColor);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      if (!newValue.startsWith("#")) {
        newValue = "#" + newValue;
      }
      setLocalValue(newValue);
      if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const handleGradientClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!gradientRef.current) return;
      const rect = gradientRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Convert position to HSL
      const hue = x * 360;
      const saturation = 100;
      const lightness = 100 - y * 100;

      // Convert HSL to HEX
      const color = hslToHex(hue, saturation, lightness);
      handleChange(color);
    },
    [handleChange]
  );

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(localValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [localValue]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 h-10",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <div
              className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
              style={{ backgroundColor: localValue }}
            />
            <span className="font-mono text-sm">{localValue.toUpperCase()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <Tabs defaultValue="presets">
            <TabsList className="w-full grid grid-cols-2 mb-3">
              <TabsTrigger value="presets">
                {language === "hi" ? "प्रीसेट" : "Presets"}
              </TabsTrigger>
              <TabsTrigger value="custom">
                {language === "hi" ? "कस्टम" : "Custom"}
              </TabsTrigger>
            </TabsList>

            {/* Presets Tab */}
            <TabsContent value="presets" className="space-y-3">
              {showPresets && (
                <div className="grid grid-cols-10 gap-1">
                  {presetColors.map((color) => (
                    <motion.button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700 relative",
                        "hover:scale-110 transition-transform",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => handleChange(color)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {localValue.toLowerCase() === color.toLowerCase() && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check
                            className={cn(
                              "w-4 h-4",
                              isLightColor(color) ? "text-gray-800" : "text-white"
                            )}
                          />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Custom Tab */}
            <TabsContent value="custom" className="space-y-3">
              {/* Color Gradient Picker */}
              {showGradient && (
                <div
                  ref={gradientRef}
                  className="h-36 rounded-lg cursor-crosshair relative overflow-hidden"
                  style={{
                    background: `
                      linear-gradient(to bottom, transparent, black),
                      linear-gradient(to right, white, hsl(${getHueFromHex(localValue)}, 100%, 50%))
                    `,
                  }}
                  onClick={handleGradientClick}
                >
                  {/* Hue slider */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-4 cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - rect.left) / rect.width;
                      const hue = x * 360;
                      const color = hslToHex(hue, 100, 50);
                      handleChange(color);
                    }}
                  />
                </div>
              )}

              {/* Hex Input */}
              {showInput && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={localValue}
                      onChange={handleInputChange}
                      className="font-mono uppercase pl-8"
                      maxLength={7}
                    />
                    <div
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: localValue }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              {/* Native color picker fallback */}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localValue}
                  onChange={(e) => handleChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-500">
                  {language === "hi" ? "सिस्टम कलर पिकर" : "System color picker"}
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Compact color swatch selector
interface ColorSwatchProps {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ColorSwatch({
  colors,
  value,
  onChange,
  size = "md",
  className,
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {colors.map((color) => (
        <motion.button
          key={color}
          className={cn(
            sizeClasses[size],
            "rounded-full border-2 relative",
            value === color
              ? "border-primary shadow-md"
              : "border-gray-200 dark:border-gray-700"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {value === color && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Check
                className={cn(
                  "w-3 h-3",
                  isLightColor(color) ? "text-gray-800" : "text-white"
                )}
              />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

// Color palette for room themes
interface ColorPalettePickerProps {
  palettes: {
    name: string;
    nameHindi?: string;
    colors: string[];
  }[];
  value: string[];
  onChange: (colors: string[]) => void;
  className?: string;
}

export function ColorPalettePicker({
  palettes,
  value,
  onChange,
  className,
}: ColorPalettePickerProps) {
  const { language } = useLanguage();

  const isSelected = (paletteColors: string[]) =>
    JSON.stringify(paletteColors) === JSON.stringify(value);

  return (
    <div className={cn("space-y-3", className)}>
      {palettes.map((palette, index) => (
        <motion.button
          key={index}
          className={cn(
            "w-full p-3 rounded-lg border-2 transition-all text-left",
            isSelected(palette.colors)
              ? "border-primary bg-primary/5"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          )}
          onClick={() => onChange(palette.colors)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {language === "hi" && palette.nameHindi
                ? palette.nameHindi
                : palette.name}
            </span>
            {isSelected(palette.colors) && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex gap-1">
            {palette.colors.map((color, colorIndex) => (
              <div
                key={colorIndex}
                className="h-6 flex-1 first:rounded-l-md last:rounded-r-md"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// Helper functions
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getHueFromHex(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return h * 360;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

export default ColorPicker;