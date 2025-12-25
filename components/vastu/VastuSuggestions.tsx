"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  ChevronDown,
  Wand2,
  Check,
  ArrowRight,
  Sparkles,
  Compass,
  Palette,
  LayoutGrid,
  Sofa,
  Flame,
  Droplets,
  Home,
  Moon,
  Users,
  Brain,
  Shield,
  Heart,
  Wallet,
  TrendingUp,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { VastuAnalysis, VastuSuggestion, VastuPriority } from "@/types/vastu";

interface VastuSuggestionsProps {
  analysis: VastuAnalysis;
  language: "en" | "hi";
  onApply?: (suggestionId: string) => void;
}

const translations = {
  en: {
    criticalIssues: "Critical Issues",
    warnings: "Warnings",
    improvements: "Improvements",
    noSuggestions: "No suggestions needed - your space is Vastu compliant!",
    apply: "Apply Fix",
    applied: "Applied",
    impact: "Impact",
    difficulty: "Difficulty",
    type: "Type",
    priority: "Priority",
    easy: "Easy",
    moderate: "Moderate",
    difficult: "Difficult",
    highImpact: "High Impact",
    mediumImpact: "Medium Impact",
    lowImpact: "Low Impact",
    autoFixAvailable: "Auto Fix Available",
    applyWithAI: "Apply with AI",
    preview: "Preview",
    scoreImpact: "Score Impact",
    estimatedCost: "Estimated Cost",
    currentState: "Current State",
    suggestedState: "Suggested State",
  },
  hi: {
    criticalIssues: "गंभीर समस्याएं",
    warnings: "चेतावनियां",
    improvements: "सुधार",
    noSuggestions: "कोई सुझाव की आवश्यकता नहीं - आपका स्थान वास्तु अनुकूल है!",
    apply: "लागू करें",
    applied: "लागू किया गया",
    impact: "प्रभाव",
    difficulty: "कठिनाई",
    type: "प्रकार",
    priority: "प्राथमिकता",
    easy: "आसान",
    moderate: "मध्यम",
    difficult: "कठिन",
    highImpact: "उच्च प्रभाव",
    mediumImpact: "मध्यम प्रभाव",
    lowImpact: "कम प्रभाव",
    autoFixAvailable: "ऑटो फिक्स उपलब्ध",
    applyWithAI: "AI से लागू करें",
    preview: "पूर्वावलोकन",
    scoreImpact: "स्कोर प्रभाव",
    estimatedCost: "अनुमानित लागत",
    currentState: "वर्तमान स्थिति",
    suggestedState: "सुझाई गई स्थिति",
  },
};

const suggestionIcons: Record<string, React.ReactNode> = {
  relocate: <ArrowRight className="w-5 h-5" />,
  reorient: <Compass className="w-5 h-5" />,
  add: <Plus className="w-5 h-5" />,
  remove: <Minus className="w-5 h-5" />,
  replace: <RefreshCw className="w-5 h-5" />,
  'color-change': <Palette className="w-5 h-5" />,
  'material-change': <Layers className="w-5 h-5" />,
  remedy: <Shield className="w-5 h-5" />,
};

const priorityConfig: Record<VastuPriority, { 
  color: string; 
  bg: string; 
  icon: React.ReactNode;
  label: string;
  labelHi: string;
}> = {
  critical: { 
    color: "text-red-500", 
    bg: "bg-red-500/10 border-red-500/20", 
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "Critical",
    labelHi: "गंभीर",
  },
  high: { 
    color: "text-orange-500", 
    bg: "bg-orange-500/10 border-orange-500/20", 
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "High",
    labelHi: "उच्च",
  },
  medium: { 
    color: "text-yellow-500", 
    bg: "bg-yellow-500/10 border-yellow-500/20", 
    icon: <Info className="w-4 h-4" />,
    label: "Medium",
    labelHi: "मध्यम",
  },
  low: { 
    color: "text-blue-500", 
    bg: "bg-blue-500/10 border-blue-500/20", 
    icon: <Info className="w-4 h-4" />,
    label: "Low",
    labelHi: "कम",
  },
  informational: { 
    color: "text-gray-500", 
    bg: "bg-gray-500/10 border-gray-500/20", 
    icon: <Lightbulb className="w-4 h-4" />,
    label: "Info",
    labelHi: "जानकारी",
  },
};

export function VastuSuggestions({ analysis, language, onApply }: VastuSuggestionsProps) {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["critical"]);
  
  const t = translations[language] || translations.en;

  const handleApply = (suggestionId: string) => {
    setAppliedSuggestions((prev) => new Set([...prev, suggestionId]));
    onApply?.(suggestionId);
  };

  // Group suggestions by priority
  const groupedSuggestions = {
    critical: analysis.suggestions.filter((s) => s.priority === "critical"),
    high: analysis.suggestions.filter((s) => s.priority === "high"),
    medium: analysis.suggestions.filter((s) => s.priority === "medium"),
    low: analysis.suggestions.filter((s) => s.priority === "low"),
    informational: analysis.suggestions.filter((s) => s.priority === "informational"),
  };

  const totalSuggestions = analysis.suggestions.length;

  if (totalSuggestions === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-green-600 font-medium">{t.noSuggestions}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-4">
          {groupedSuggestions.critical.length > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">{groupedSuggestions.critical.length}</span>
            </div>
          )}
          {groupedSuggestions.high.length > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">{groupedSuggestions.high.length}</span>
            </div>
          )}
          {groupedSuggestions.medium.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">{groupedSuggestions.medium.length}</span>
            </div>
          )}
          {groupedSuggestions.low.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">{groupedSuggestions.low.length}</span>
            </div>
          )}
        </div>
        <Badge variant="outline">
          {appliedSuggestions.size}/{totalSuggestions} {t.applied}
        </Badge>
      </div>

      {/* Accordion */}
      <Accordion
        type="multiple"
        value={expandedCategories}
        onValueChange={setExpandedCategories}
        className="space-y-2"
      >
        {/* Critical Issues */}
        {groupedSuggestions.critical.length > 0 && (
          <AccordionItem value="critical" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-red-500/10 hover:bg-red-500/15">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="font-medium text-red-600">
                  {language === "hi" ? priorityConfig.critical.labelHi : priorityConfig.critical.label}
                </span>
                <Badge variant="destructive" className="ml-2">
                  {groupedSuggestions.critical.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="divide-y divide-border">
                {groupedSuggestions.critical.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    language={language}
                    isApplied={appliedSuggestions.has(suggestion.id)}
                    onApply={() => handleApply(suggestion.id)}
                    t={t}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* High Priority */}
        {groupedSuggestions.high.length > 0 && (
          <AccordionItem value="high" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-orange-500/10 hover:bg-orange-500/15">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-orange-600">
                  {language === "hi" ? priorityConfig.high.labelHi : priorityConfig.high.label}
                </span>
                <Badge className="ml-2 bg-orange-500">
                  {groupedSuggestions.high.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="divide-y divide-border">
                {groupedSuggestions.high.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    language={language}
                    isApplied={appliedSuggestions.has(suggestion.id)}
                    onApply={() => handleApply(suggestion.id)}
                    t={t}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Medium Priority */}
        {groupedSuggestions.medium.length > 0 && (
          <AccordionItem value="medium" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-yellow-500/10 hover:bg-yellow-500/15">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-yellow-600">
                  {language === "hi" ? priorityConfig.medium.labelHi : priorityConfig.medium.label}
                </span>
                <Badge className="ml-2 bg-yellow-500">
                  {groupedSuggestions.medium.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="divide-y divide-border">
                {groupedSuggestions.medium.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    language={language}
                    isApplied={appliedSuggestions.has(suggestion.id)}
                    onApply={() => handleApply(suggestion.id)}
                    t={t}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Low Priority */}
        {groupedSuggestions.low.length > 0 && (
          <AccordionItem value="low" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-blue-500/10 hover:bg-blue-500/15">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-blue-600">
                  {language === "hi" ? priorityConfig.low.labelHi : priorityConfig.low.label}
                </span>
                <Badge className="ml-2 bg-blue-500">
                  {groupedSuggestions.low.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="divide-y divide-border">
                {groupedSuggestions.low.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    language={language}
                    isApplied={appliedSuggestions.has(suggestion.id)}
                    onApply={() => handleApply(suggestion.id)}
                    t={t}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Informational */}
        {groupedSuggestions.informational.length > 0 && (
          <AccordionItem value="informational" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-gray-500/10 hover:bg-gray-500/15">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-600">
                  {language === "hi" ? priorityConfig.informational.labelHi : priorityConfig.informational.label}
                </span>
                <Badge className="ml-2 bg-gray-500">
                  {groupedSuggestions.informational.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="divide-y divide-border">
                {groupedSuggestions.informational.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    language={language}
                    isApplied={appliedSuggestions.has(suggestion.id)}
                    onApply={() => handleApply(suggestion.id)}
                    t={t}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: VastuSuggestion;
  index: number;
  language: "en" | "hi";
  isApplied: boolean;
  onApply: () => void;
  t: typeof translations.en;
}

function SuggestionCard({ suggestion, index, language, isApplied, onApply, t }: SuggestionCardProps) {
  const config = priorityConfig[suggestion.priority];
  const icon = suggestionIcons[suggestion.type] || <Lightbulb className="w-5 h-5" />;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "p-4 transition-colors",
        isApplied && "bg-green-500/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          config.bg,
          "border"
        )}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm">
                {language === "hi" ? suggestion.titleHi : suggestion.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {suggestion.type.replace('-', ' ')}
                </Badge>
                <Badge variant="outline" className={cn(
                  "text-xs",
                  suggestion.priority === "critical" && "bg-red-500/10 text-red-700",
                  suggestion.priority === "high" && "bg-orange-500/10 text-orange-700",
                  suggestion.priority === "medium" && "bg-yellow-500/10 text-yellow-700",
                  suggestion.priority === "low" && "bg-blue-500/10 text-blue-700",
                  suggestion.priority === "informational" && "bg-gray-500/10 text-gray-700",
                )}>
                  {language === "hi" ? priorityConfig[suggestion.priority].labelHi : priorityConfig[suggestion.priority].label}
                </Badge>
                <Badge
                  className={cn(
                    "text-xs",
                    suggestion.difficulty === "easy"
                      ? "bg-green-500/10 text-green-700"
                      : suggestion.difficulty === "moderate"
                      ? "bg-yellow-500/10 text-yellow-700"
                      : "bg-red-500/10 text-red-700"
                  )}
                >
                  {suggestion.difficulty === "easy"
                    ? t.easy
                    : suggestion.difficulty === "moderate"
                    ? t.moderate
                    : t.difficult}
                </Badge>
              </div>
            </div>
            {isApplied && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 shrink-0">
                <Check className="w-3 h-3 mr-1" />
                {t.applied}
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            {language === "hi" ? suggestion.descriptionHi : suggestion.description}
          </p>

          {/* Current State & Suggested State */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="p-2 rounded-md bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">{t.currentState}:</p>
              <p className="text-sm">{suggestion.currentState}</p>
            </div>
            <div className="p-2 rounded-md bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-green-600 mb-1">{t.suggestedState}:</p>
              <p className="text-sm">{suggestion.suggestedState}</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                +{suggestion.scoreImpact} {t.scoreImpact}
              </span>
            </div>
            {suggestion.estimatedCost && (
              <div className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">
                  ₹{suggestion.estimatedCost.INR.min.toLocaleString()} - ₹{suggestion.estimatedCost.INR.max.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Apply Button */}
          {!isApplied && suggestion.canAutoFix && (
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={onApply}
                className="flex-1"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                {t.applyWithAI}
              </Button>
              <Button size="sm" variant="outline">
                <Eye className="w-3 h-3 mr-1.5" />
                {t.preview}
              </Button>
            </div>
          )}

          {/* Auto Fix Available Badge */}
          {suggestion.canAutoFix && !isApplied && (
            <div className="mt-2">
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                <Wand2 className="w-3 h-3 mr-1" />
                {t.autoFixAvailable}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}