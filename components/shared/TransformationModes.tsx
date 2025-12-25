"use client";

import { motion } from "framer-motion";
import {
  Wand2,
  Paintbrush,
  Eraser,
  Maximize2,
  Sofa,
  Trash2,
  Palette,
  Sparkles,
  Sun,
  Building2,
  PenTool,
  RefreshCcw,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/hooks/useLanguage";

export type TransformMode =
  | "redesign"
  | "inpaint"
  | "remove-object"
  | "upscale"
  | "fill-room"
  | "empty-room"
  | "change-material"
  | "enhance"
  | "change-lighting"
  | "outdoor"
  | "sketch-to-render"
  | "style-transfer";

interface TransformationMode {
  id: TransformMode;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  icon: any;
  isPremium: boolean;
  tier?: "pro" | "teams";
  color: string;
  credits: number;
}

const TRANSFORMATION_MODES: TransformationMode[] = [
  {
    id: "redesign",
    name: "Redesign Room",
    nameHi: "कमरा पुनर्डिज़ाइन",
    description: "Transform your room with a new style",
    descriptionHi: "नई शैली के साथ अपने कमरे को बदलें",
    icon: Wand2,
    isPremium: false,
    color: "violet",
    credits: 1,
  },
  {
    id: "inpaint",
    name: "Smart Inpaint",
    nameHi: "स्मार्ट इनपेंट",
    description: "Paint over areas to redesign",
    descriptionHi: "पुनर्डिज़ाइन करने के लिए क्षेत्रों पर पेंट करें",
    icon: Paintbrush,
    isPremium: false,
    color: "blue",
    credits: 1,
  },
  {
    id: "remove-object",
    name: "Remove Object",
    nameHi: "वस्तु हटाएं",
    description: "Remove unwanted items from image",
    descriptionHi: "छवि से अवांछित वस्तुओं को हटाएं",
    icon: Eraser,
    isPremium: false,
    color: "rose",
    credits: 1,
  },
  {
    id: "fill-room",
    name: "Fill Empty Room",
    nameHi: "खाली कमरा भरें",
    description: "Add furniture to empty spaces",
    descriptionHi: "खाली जगहों में फर्नीचर जोड़ें",
    icon: Sofa,
    isPremium: true,
    tier: "pro",
    color: "amber",
    credits: 2,
  },
  {
    id: "empty-room",
    name: "Empty Room",
    nameHi: "खाली कमरा",
    description: "Remove all furniture from room",
    descriptionHi: "कमरे से सभी फर्नीचर हटाएं",
    icon: Trash2,
    isPremium: true,
    tier: "pro",
    color: "orange",
    credits: 2,
  },
  {
    id: "change-material",
    name: "Change Material",
    nameHi: "मटेरियल बदलें",
    description: "Replace floors, walls, surfaces",
    descriptionHi: "फर्श, दीवारें, सतहें बदलें",
    icon: Palette,
    isPremium: true,
    tier: "pro",
    color: "emerald",
    credits: 2,
  },
  {
    id: "upscale",
    name: "4K Upscale",
    nameHi: "4K अपस्केल",
    description: "Enhance resolution to 4K",
    descriptionHi: "रिज़ॉल्यूशन को 4K तक बढ़ाएं",
    icon: Maximize2,
    isPremium: true,
    tier: "pro",
    color: "cyan",
    credits: 3,
  },
  {
    id: "enhance",
    name: "AI Enhance",
    nameHi: "AI एन्हांस",
    description: "Improve lighting and quality",
    descriptionHi: "प्रकाश और गुणवत्ता में सुधार करें",
    icon: Sparkles,
    isPremium: false,
    color: "pink",
    credits: 1,
  },
  {
    id: "change-lighting",
    name: "Change Lighting",
    nameHi: "प्रकाश बदलें",
    description: "Adjust time of day and mood",
    descriptionHi: "दिन का समय और मूड समायोजित करें",
    icon: Sun,
    isPremium: true,
    tier: "pro",
    color: "yellow",
    credits: 1,
  },
  {
    id: "outdoor",
    name: "Outdoor Design",
    nameHi: "आउटडोर डिज़ाइन",
    description: "Transform gardens and exteriors",
    descriptionHi: "बगीचों और बाहरी क्षेत्रों को बदलें",
    icon: Building2,
    isPremium: true,
    tier: "pro",
    color: "green",
    credits: 2,
  },
  {
    id: "sketch-to-render",
    name: "Sketch to Render",
    nameHi: "स्केच से रेंडर",
    description: "Turn hand drawings into renders",
    descriptionHi: "हाथ के चित्रों को रेंडर में बदलें",
    icon: PenTool,
    isPremium: true,
    tier: "teams",
    color: "indigo",
    credits: 3,
  },
  {
    id: "style-transfer",
    name: "Style Transfer",
    nameHi: "स्टाइल ट्रांसफर",
    description: "Copy style from reference image",
    descriptionHi: "संदर्भ छवि से शैली कॉपी करें",
    icon: RefreshCcw,
    isPremium: true,
    tier: "teams",
    color: "purple",
    credits: 2,
  },
];

interface TransformationModesProps {
  selectedMode: TransformMode | null;
  onModeSelect: (mode: TransformMode) => void;
  disabled?: boolean;
  variant?: "grid" | "list" | "compact";
}

export function TransformationModes({
  selectedMode,
  onModeSelect,
  disabled = false,
  variant = "grid",
}: TransformationModesProps) {
  const { isPro, isTeams } = useSubscription();
  const { language } = useLanguage();

  const canUseMode = (mode: TransformationMode) => {
    if (!mode.isPremium) return true;
    if (mode.tier === "pro" && (isPro || isTeams)) return true;
    if (mode.tier === "teams" && isTeams) return true;
    return false;
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      violet: {
        bg: "bg-violet-500",
        border: "border-violet-500",
        text: "text-violet-500",
      },
      blue: {
        bg: "bg-blue-500",
        border: "border-blue-500",
        text: "text-blue-500",
      },
      rose: {
        bg: "bg-rose-500",
        border: "border-rose-500",
        text: "text-rose-500",
      },
      amber: {
        bg: "bg-amber-500",
        border: "border-amber-500",
        text: "text-amber-500",
      },
      orange: {
        bg: "bg-orange-500",
        border: "border-orange-500",
        text: "text-orange-500",
      },
      emerald: {
        bg: "bg-emerald-500",
        border: "border-emerald-500",
        text: "text-emerald-500",
      },
      cyan: {
        bg: "bg-cyan-500",
        border: "border-cyan-500",
        text: "text-cyan-500",
      },
      pink: {
        bg: "bg-pink-500",
        border: "border-pink-500",
        text: "text-pink-500",
      },
      yellow: {
        bg: "bg-yellow-500",
        border: "border-yellow-500",
        text: "text-yellow-500",
      },
      green: {
        bg: "bg-green-500",
        border: "border-green-500",
        text: "text-green-500",
      },
      indigo: {
        bg: "bg-indigo-500",
        border: "border-indigo-500",
        text: "text-indigo-500",
      },
      purple: {
        bg: "bg-purple-500",
        border: "border-purple-500",
        text: "text-purple-500",
      },
    };
    return colorMap[color] || colorMap.violet;
  };

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {TRANSFORMATION_MODES.slice(0, 6).map((mode) => {
          const isSelected = selectedMode === mode.id;
          const isLocked = !canUseMode(mode);
          const colors = getColorClasses(mode.color, isSelected);
          const Icon = mode.icon;

          return (
            <Tooltip key={mode.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => !isLocked && onModeSelect(mode.id)}
                  disabled={disabled || isLocked}
                  className={cn(
                    "relative p-2.5 rounded-lg transition-all duration-200",
                    "border-2",
                    isSelected
                      ? `${colors.border} ${colors.bg} text-white`
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                    isLocked && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {isLocked && (
                    <Lock className="absolute -top-1 -right-1 w-3 h-3 text-zinc-500" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  {language === "hi" ? mode.nameHi : mode.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {language === "hi" ? mode.descriptionHi : mode.description}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-2">
        {TRANSFORMATION_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const isLocked = !canUseMode(mode);
          const colors = getColorClasses(mode.color, isSelected);
          const Icon = mode.icon;

          return (
            <motion.button
              key={mode.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => !isLocked && onModeSelect(mode.id)}
              disabled={disabled || isLocked}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200",
                "border-2",
                isSelected
                  ? `${colors.border} bg-white dark:bg-zinc-900`
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                isLocked && "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? `${colors.bg} text-white` : "bg-zinc-100 dark:bg-zinc-800"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "font-medium",
                      isSelected ? colors.text : "text-zinc-900 dark:text-white"
                    )}
                  >
                    {language === "hi" ? mode.nameHi : mode.name}
                  </p>
                  {mode.isPremium && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5",
                        mode.tier === "teams"
                          ? "border-purple-500 text-purple-500"
                          : "border-amber-500 text-amber-500"
                      )}
                    >
                      {mode.tier === "teams" ? "TEAMS" : "PRO"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-500 line-clamp-1">
                  {language === "hi" ? mode.descriptionHi : mode.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  {mode.credits} {mode.credits === 1 ? "credit" : "credits"}
                </span>
                {isLocked && <Lock className="w-4 h-4 text-zinc-400" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Default: Grid variant
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {TRANSFORMATION_MODES.map((mode, index) => {
        const isSelected = selectedMode === mode.id;
        const isLocked = !canUseMode(mode);
        const colors = getColorClasses(mode.color, isSelected);
        const Icon = mode.icon;

        return (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: isLocked ? 1 : 1.02 }}
            whileTap={{ scale: isLocked ? 1 : 0.98 }}
            onClick={() => !isLocked && onModeSelect(mode.id)}
            disabled={disabled || isLocked}
            className={cn(
              "relative p-4 rounded-xl transition-all duration-200",
              "border-2 text-left",
              isSelected
                ? `${colors.border} bg-white dark:bg-zinc-900 shadow-lg shadow-${mode.color}-500/20`
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900",
              isLocked && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Premium Badge */}
            {mode.isPremium && (
              <div className="absolute top-2 right-2">
                <Badge
                  className={cn(
                    "text-[10px] px-1.5",
                    mode.tier === "teams"
                      ? "bg-purple-500 text-white"
                      : "bg-amber-500 text-white"
                  )}
                >
                  {mode.tier === "teams" ? "TEAMS" : "PRO"}
                </Badge>
              </div>
            )}

            {/* Icon */}
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                isSelected
                  ? `${colors.bg} text-white`
                  : "bg-zinc-100 dark:bg-zinc-800"
              )}
            >
              <Icon className="w-6 h-6" />
            </div>

            {/* Content */}
            <h3
              className={cn(
                "font-semibold text-sm mb-1",
                isSelected ? colors.text : "text-zinc-900 dark:text-white"
              )}
            >
              {language === "hi" ? mode.nameHi : mode.name}
            </h3>
            <p className="text-xs text-zinc-500 line-clamp-2">
              {language === "hi" ? mode.descriptionHi : mode.description}
            </p>

            {/* Credits */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {mode.credits} {language === "hi" ? "क्रेडिट" : "credits"}
              </span>
              {isLocked && <Lock className="w-4 h-4 text-zinc-400" />}
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <motion.div
                layoutId="selected-mode"
                className={cn(
                  "absolute inset-0 rounded-xl border-2",
                  colors.border
                )}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export { TRANSFORMATION_MODES };
export default TransformationModes;