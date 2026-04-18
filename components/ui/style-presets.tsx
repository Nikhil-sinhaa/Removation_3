// components/ui/style-presets.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Palette, 
  Factory, 
  TreePine, 
  Sparkles, 
  Crown, 
  Building,
  Check,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  loraName?: string;
  promptSuffix: string;
  negativeSuffix?: string;
  popular?: boolean;
  premium?: boolean;
}

const stylePresets: StylePreset[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean lines, minimalist furniture, neutral colors",
    icon: <Home className="w-5 h-5" />,
    color: "bg-gradient-to-br from-gray-500 to-gray-700",
    loraName: "modern_interior.safetensors",
    promptSuffix: ", modern interior design, clean lines, minimalist furniture, contemporary style",
    negativeSuffix: ", ornate, vintage, traditional, cluttered",
    popular: true,
  },
  {
    id: "industrial",
    name: "Industrial",
    description: "Exposed brick, metal elements, raw materials",
    icon: <Factory className="w-5 h-5" />,
    color: "bg-gradient-to-br from-gray-700 to-gray-900",
    loraName: "industrial_style.safetensors",
    promptSuffix: ", industrial interior, exposed brick, metal elements, raw materials, urban loft",
    negativeSuffix: ", polished, refined, delicate, soft colors",
  },
  {
    id: "bohemian",
    name: "Bohemian",
    description: "Eclectic decor, plants, textiles, warm colors",
    icon: <TreePine className="w-5 h-5" />,
    color: "bg-gradient-to-br from-green-500 to-emerald-700",
    loraName: "bohemian_style.safetensors",
    promptSuffix: ", bohemian interior, eclectic decor, plants, textiles, warm colors, artistic",
    negativeSuffix: ", minimalist, stark, monochromatic, rigid",
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    description: "Light wood, cozy, functional, hygge",
    icon: <Sparkles className="w-5 h-5" />,
    color: "bg-gradient-to-br from-blue-300 to-blue-500",
    loraName: "scandinavian_style.safetensors",
    promptSuffix: ", scandinavian interior, hygge, light wood, cozy, functional, nordic design",
    negativeSuffix: ", dark, heavy, ornate, traditional",
    popular: true,
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "High-end materials, elegant, sophisticated",
    icon: <Crown className="w-5 h-5" />,
    color: "bg-gradient-to-br from-amber-500 to-amber-700",
    loraName: "luxury_interior.safetensors",
    promptSuffix: ", luxury interior, high-end materials, elegant, sophisticated, premium",
    negativeSuffix: ", cheap, basic, simple, ordinary",
    premium: true,
  },
  {
    id: "indian",
    name: "Indian",
    description: "Traditional elements, vibrant colors, intricate patterns",
    icon: <Building className="w-5 h-5" />,
    color: "bg-gradient-to-br from-orange-500 to-red-700",
    loraName: "indian_style.safetensors",
    promptSuffix: ", indian interior, traditional elements, vibrant colors, intricate patterns",
    negativeSuffix: ", western, minimalist, monochromatic, plain",
  },
];

interface StylePresetsProps {
  selectedStyle?: string;
  onStyleSelect: (style: StylePreset) => void;
  className?: string;
  showPremium?: boolean;
  columns?: number;
}

export function StylePresets({
  selectedStyle,
  onStyleSelect,
  className = "",
  showPremium = true,
  columns = 3,
}: StylePresetsProps) {
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

  const filteredPresets = showPremium 
    ? stylePresets 
    : stylePresets.filter(preset => !preset.premium);

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Choose Your Style</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Click to preview and select</span>
          </div>
        </div>

        <div 
          className={`grid gap-4`}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {filteredPresets.map((preset) => (
            <motion.div
              key={preset.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredStyle(preset.id)}
              onHoverEnd={() => setHoveredStyle(null)}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  selectedStyle === preset.id
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => onStyleSelect(preset)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Style Icon */}
                    <div className={`p-2 rounded-lg ${preset.color} text-white`}>
                      {preset.icon}
                    </div>

                    {/* Style Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-sm">{preset.name}</h4>
                        {preset.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        {preset.premium && (
                          <Badge variant="outline" className="text-xs">
                            Premium
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {preset.description}
                      </p>

                      {/* LoRA Status */}
                      {preset.loraName && (
                        <div className="flex items-center space-x-1 mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">LoRA Available</span>
                        </div>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    <AnimatePresence>
                      {selectedStyle === preset.id && (
                        <motion.div
                          key={`selected-${preset.id}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hover Preview */}
                  <AnimatePresence>
                    {hoveredStyle === preset.id && (
                      <motion.div
                        key={`hover-${preset.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t"
                      >
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium">Prompt Enhancement:</span>
                            <p className="text-xs text-gray-600 mt-1">{preset.promptSuffix}</p>
                          </div>
                          {preset.negativeSuffix && (
                            <div>
                              <span className="text-xs font-medium">Avoid:</span>
                              <p className="text-xs text-gray-600 mt-1">{preset.negativeSuffix}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Selected Style Summary */}
        <AnimatePresence>
          {selectedStyle && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  stylePresets.find(p => p.id === selectedStyle)?.color
                } text-white`}>
                  {stylePresets.find(p => p.id === selectedStyle)?.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">
                    {stylePresets.find(p => p.id === selectedStyle)?.name} Style Selected
                  </h4>
                  <p className="text-sm text-blue-700">
                    {stylePresets.find(p => p.id === selectedStyle)?.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStyleSelect(stylePresets[0])} // Reset to first style
                >
                  Change
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

// Style Selector Component for Quick Selection
export function StyleSelector({
  selectedStyle,
  onStyleSelect,
  className = "",
}: {
  selectedStyle?: string;
  onStyleSelect: (styleId: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {stylePresets.map((preset) => (
        <Tooltip key={preset.id}>
          <TooltipTrigger asChild>
            <Button
              variant={selectedStyle === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => onStyleSelect(preset.id)}
              className="relative"
            >
              <div className={`w-3 h-3 rounded-full ${preset.color.replace('bg-', 'bg-')}`} />
              <span className="ml-2">{preset.name}</span>
              {preset.popular && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{preset.name}</p>
            <p className="text-sm text-gray-600">{preset.description}</p>
            {preset.loraName && (
              <p className="text-xs text-green-600">✓ LoRA Enhanced</p>
            )}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export default stylePresets;
