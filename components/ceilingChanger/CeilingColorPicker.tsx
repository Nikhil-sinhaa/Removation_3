"use client";

import { useState, useCallback } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAMOUS_CEILING_COLORS, ASIAN_PAINTS_CEILING_COLORS } from "@/src/config/ceilingColorPalette";

export interface ColorValue {
  name: string;
  hex: string;
}

interface CeilingColorPickerProps {
  value: ColorValue;
  onChange: (color: ColorValue) => void;
  disabled?: boolean;
}

function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

export function CeilingColorPicker({ value, onChange, disabled = false }: CeilingColorPickerProps) {
  const [activeTab, setActiveTab]   = useState<'famous' | 'asian'>('famous');
  const [customOpen, setCustomOpen] = useState(false);
  const [customHex, setCustomHex]   = useState("#E8ECF0");
  const [customName, setCustomName] = useState("Custom Color");
  const [hexInput, setHexInput]     = useState("#E8ECF0");

  const selectColor = useCallback(
    (color: ColorValue) => {
      if (!disabled) onChange(color);
    },
    [disabled, onChange]
  );

  const applyCustom = useCallback(() => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(customHex)) return;
    onChange({ name: customName.trim() || "Custom Color", hex: customHex });
  }, [customHex, customName, onChange]);

  const handleHexChange = (raw: string) => {
    setHexInput(raw);
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
      setCustomHex(normalized);
    }
  };

  const handleNativeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = e.target.value;
    setCustomHex(h);
    setHexInput(h);
  };

  const colors = activeTab === 'famous' ? FAMOUS_CEILING_COLORS : ASIAN_PAINTS_CEILING_COLORS;

  return (
    <div className={cn("space-y-3", disabled && "opacity-50 pointer-events-none")}>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab('famous')}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
            activeTab === 'famous'
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Ceiling Colors
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('asian')}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
            activeTab === 'asian'
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Asian Paints
        </button>
      </div>

      {/* Color swatch grid */}
      <div className="grid grid-cols-4 gap-2">
        {colors.map((color) => {
          const selected = value.hex === color.hex;
          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => selectColor(color)}
              className={cn(
                "flex flex-col items-center gap-1 group focus:outline-none",
                disabled && "cursor-not-allowed"
              )}
              title={`${color.name} ${color.hex}`}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-lg border-2 transition-all duration-150 flex items-center justify-center",
                  selected
                    ? "border-violet-600 ring-2 ring-violet-600 ring-offset-1 scale-105 shadow-md"
                    : "border-gray-200 hover:border-gray-400 hover:scale-105"
                )}
                style={{ backgroundColor: color.hex }}
              >
                {selected && (
                  <Check
                    className={cn(
                      "w-5 h-5 drop-shadow",
                      isLight(color.hex) ? "text-gray-800" : "text-white"
                    )}
                    strokeWidth={3}
                  />
                )}
              </div>
              <span className="text-[10px] text-center text-gray-600 leading-tight w-14 truncate">
                {color.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Asian Paints footnote */}
      {activeTab === 'asian' && (
        <p className="text-xs text-gray-400">
          Color shades are approximations for preview. Actual paint may vary.
        </p>
      )}

      {/* Selected color preview */}
      {value.hex && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div
            className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0 shadow-sm"
            style={{ backgroundColor: value.hex }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{value.name}</p>
            <p className="text-xs text-gray-500 font-mono">{value.hex.toUpperCase()}</p>
          </div>
        </div>
      )}

      {/* Custom color expander */}
      <button
        type="button"
        onClick={() => setCustomOpen(o => !o)}
        className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium"
      >
        {customOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Or pick a custom color
      </button>

      {customOpen && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          {/* Native color picker */}
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customHex}
              onChange={handleNativeColor}
              className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
              title="Pick color"
            />
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Hex code</label>
              <input
                type="text"
                value={hexInput}
                onChange={e => handleHexChange(e.target.value)}
                placeholder="#E8ECF0"
                maxLength={7}
                className="w-full px-3 py-1.5 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Color name</label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Custom Color"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <button
            type="button"
            onClick={applyCustom}
            disabled={!/^#[0-9A-Fa-f]{6}$/.test(customHex)}
            className={cn(
              "w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors",
              /^#[0-9A-Fa-f]{6}$/.test(customHex)
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            Use this color
          </button>
        </div>
      )}
    </div>
  );
}
