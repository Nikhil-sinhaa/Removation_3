// components/vastu/VastuScore.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Star,
  Shield,
  Heart,
  Coins,
  BookOpen,
  Users
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

interface SubScore {
  id: string;
  name: string;
  nameHi: string;
  score: number;
  icon: string;
  description: string;
  descriptionHi: string;
}

interface VastuScoreProps {
  score: number;
  category: "excellent" | "good" | "average" | "poor" | "critical";
  subScores: SubScore[];
}

const iconMap: Record<string, React.ElementType> = {
  health: Heart,
  wealth: Coins,
  relationships: Users,
  education: BookOpen,
  protection: Shield
};

const categoryConfig = {
  excellent: {
    color: "text-green-500",
    bgColor: "bg-green-500",
    gradient: "from-green-500 to-emerald-500",
    label: "Excellent",
    labelHi: "उत्कृष्ट",
    ring: "ring-green-500/30"
  },
  good: {
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    label: "Good",
    labelHi: "अच्छा",
    ring: "ring-blue-500/30"
  },
  average: {
    color: "text-amber-500",
    bgColor: "bg-amber-500",
    gradient: "from-amber-500 to-yellow-500",
    label: "Average",
    labelHi: "औसत",
    ring: "ring-amber-500/30"
  },
  poor: {
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    gradient: "from-orange-500 to-red-500",
    label: "Needs Work",
    labelHi: "सुधार जरूरी",
    ring: "ring-orange-500/30"
  },
  critical: {
    color: "text-red-500",
    bgColor: "bg-red-500",
    gradient: "from-red-500 to-rose-500",
    label: "Critical",
    labelHi: "गंभीर",
    ring: "ring-red-500/30"
  }
};

export function VastuScore({ score, category, subScores }: VastuScoreProps) {
  const { isHindi } = useLanguage();
  const config = categoryConfig[category];

  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getTrendIcon = (score: number) => {
    if (score >= 70) return TrendingUp;
    if (score >= 40) return Minus;
    return TrendingDown;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Main Score Circle */}
      <div className="flex items-center justify-center">
        <div className="relative">
          {/* Background Circle */}
          <svg className="w-36 h-36 -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-muted/20"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="72"
              cy="72"
              r="54"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className={cn("stop-color-current", config.color)} />
                <stop offset="100%" className="stop-color-current text-orange-400" />
              </linearGradient>
            </defs>
          </svg>

          {/* Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className={cn("text-4xl font-bold", config.color)}
            >
              {score}
            </motion.span>
            <span className="text-xs text-muted-foreground">
              {isHindi ? "में से 100" : "out of 100"}
            </span>
          </div>

          {/* Decorative Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "absolute inset-[-8px] rounded-full ring-4",
              config.ring
            )}
          />
        </div>
      </div>

      {/* Category Badge */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={cn(
            "px-4 py-2 rounded-full bg-gradient-to-r text-white font-medium text-sm flex items-center gap-2",
            config.gradient
          )}
        >
          <Star className="h-4 w-4" />
          {isHindi ? config.labelHi : config.label}
        </motion.div>
      </div>

      {/* Sub Scores */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          {isHindi ? "श्रेणी अनुसार स्कोर" : "Category Scores"}
        </h4>
        <TooltipProvider>
          {subScores.map((subScore, index) => {
            const Icon = iconMap[subScore.icon] || Star;
            const TrendIcon = getTrendIcon(subScore.score);
            const scoreColor = getScoreColor(subScore.score);

            return (
              <motion.div
                key={subScore.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 1 }}
                className="group"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className={cn(
                        "p-2 rounded-lg bg-muted",
                        scoreColor
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">
                            {isHindi ? subScore.nameHi : subScore.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <TrendIcon className={cn("h-3 w-3", scoreColor)} />
                            <span className={cn("text-sm font-semibold", scoreColor)}>
                              {subScore.score}%
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={subScore.score} 
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px]">
                    <p className="text-xs">
                      {isHindi ? subScore.descriptionHi : subScore.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}