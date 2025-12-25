"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  BookOpen,
  Compass,
  Shield,
  Zap,
  ChevronDown,
  Check,
  X,
  Lightbulb,
  Star,
  Eye,
  Bookmark,
  Share2,
  Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { VastuRule, VastuCategory, VastuPriority } from "@/types/vastu";

interface VastuRuleCardProps {
  rule: VastuRule;
  isCompliant: boolean;
  language: "en" | "hi";
  onLearnMore?: () => void;
  onApplyRemedy?: (remedyId: string) => void;
  className?: string;
}

export function VastuRuleCard({
  rule,
  isCompliant,
  language,
  onLearnMore,
  onApplyRemedy,
  className,
}: VastuRuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const getCategoryColor = (category: VastuCategory) => {
    const colors = {
      entrance: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      bedroom: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      kitchen: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      bathroom: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      puja: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      living: "bg-green-500/10 text-green-500 border-green-500/20",
      direction: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      elements: "bg-red-500/10 text-red-500 border-red-500/20",
      colors: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      furniture: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      lighting: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      plants: "bg-lime-500/10 text-lime-500 border-lime-500/20",
      mirrors: "bg-violet-500/10 text-violet-500 border-violet-500/20",
      water: "bg-sky-500/10 text-sky-500 border-sky-500/20",
      storage: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[category] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const getPriorityIcon = (priority: VastuPriority) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "medium":
        return <Info className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <Info className="w-4 h-4 text-blue-500" />;
      case "informational":
        return <Lightbulb className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getPriorityLabel = (priority: VastuPriority, lang: "en" | "hi") => {
    const labels = {
      en: {
        critical: "Critical",
        high: "High",
        medium: "Medium",
        low: "Low",
        informational: "Info",
      },
      hi: {
        critical: "गंभीर",
        high: "उच्च",
        medium: "मध्यम",
        low: "कम",
        informational: "जानकारी",
      },
    };
    return labels[lang][priority] || priority;
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 8) return "text-red-500";
    if (weight >= 6) return "text-orange-500";
    if (weight >= 4) return "text-yellow-500";
    if (weight >= 2) return "text-blue-500";
    return "text-gray-500";
  };

  const handleCopyRule = async () => {
    const ruleText = `
${language === "hi" ? rule.titleHi : rule.title}
${language === "hi" ? rule.descriptionHi : rule.description}

Rule Code: ${rule.code}
Category: ${rule.category}
Priority: ${rule.priority}
Weight: ${rule.weight}/10

Source: ${rule.source}
${rule.isTraditional ? "Traditional Vastu Rule" : "Modern Adaptation"}
    `.trim();

    await navigator.clipboard.writeText(ruleText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      className={cn(
        "border rounded-xl overflow-hidden transition-all bg-card",
        isCompliant ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-accent/50 transition-colors"
      >
        {/* Status Icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            isCompliant ? "bg-green-500/20" : "bg-red-500/20"
          )}
        >
          {isCompliant ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <X className="w-5 h-5 text-red-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">
                {language === "hi" ? rule.titleHi : rule.title}
              </h4>
              {getPriorityIcon(rule.priority)}
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {rule.code}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {language === "hi" ? rule.descriptionHi : rule.description}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs capitalize", getCategoryColor(rule.category))}>
              {rule.category}
            </Badge>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className={cn("w-3 h-3", getWeightColor(rule.weight))} />
                  <span className={cn("font-medium", getWeightColor(rule.weight))}>
                    Weight: {rule.weight}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Impact on overall Vastu score (1-10)
              </TooltipContent>
            </Tooltip>

            {rule.isTraditional && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                <BookOpen className="w-3 h-3 mr-1" />
                Traditional
              </Badge>
            )}

            {rule.isModernAdaptation && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                <Star className="w-3 h-3 mr-1" />
                Modern
              </Badge>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t"
          >
            <div className="p-4 space-y-4">
              {/* Conditions */}
              {rule.conditions && rule.conditions.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Conditions:</p>
                  <div className="space-y-2">
                    {rule.conditions.map((condition, idx) => (
                      <div key={idx} className="text-sm bg-muted/50 p-2 rounded">
                        <div className="font-medium capitalize">{condition.type}</div>
                        {condition.element && (
                          <div className="text-xs text-muted-foreground">Element: {condition.element}</div>
                        )}
                        {condition.direction && (
                          <div className="text-xs text-muted-foreground">
                            Direction: {Array.isArray(condition.direction) 
                              ? condition.direction.join(", ")
                              : condition.direction}
                          </div>
                        )}
                        {condition.operator && (
                          <div className="text-xs text-muted-foreground">Operator: {condition.operator}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remedies */}
              {rule.remedies && rule.remedies.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Remedies:</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleCopyRule}
                    >
                      {copied ? (
                        <Check className="w-3 h-3 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copy Rule
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {rule.remedies.slice(0, 3).map((remedy, idx) => (
                      <div
                        key={remedy.id}
                        className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-orange-600">
                            {language === "hi" ? remedy.nameHi : remedy.name}
                          </p>
                          {onApplyRemedy && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => onApplyRemedy(remedy.id)}
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Apply
                            </Button>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {language === "hi" ? remedy.descriptionHi : remedy.description}
                        </p>
                        
                        {/* Remedy Items */}
                        {remedy.items && remedy.items.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Required Items:</p>
                            <div className="flex flex-wrap gap-1">
                              {remedy.items.slice(0, 3).map((item, itemIdx) => (
                                <Badge key={itemIdx} variant="outline" className="text-xs">
                                  {language === "hi" ? item.nameHi : item.name}
                                  {item.quantity > 1 && ` (${item.quantity})`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cost */}
                        {remedy.estimatedCost && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Estimated Cost:</span>
                            <span className="font-medium">
                              ₹{remedy.estimatedCost.INR.min.toLocaleString()} - ₹{remedy.estimatedCost.INR.max.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Effectiveness */}
                        <div className="flex items-center justify-between text-xs mt-2">
                          <span className="text-muted-foreground">Effectiveness:</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              remedy.effectiveness === "high" && "bg-green-500/10 text-green-600 border-green-500/20",
                              remedy.effectiveness === "medium" && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                              remedy.effectiveness === "low" && "bg-red-500/10 text-red-600 border-red-500/20"
                            )}
                          >
                            {remedy.effectiveness === "high"
                              ? "High"
                              : remedy.effectiveness === "medium"
                              ? "Medium"
                              : "Low"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Reference */}
              {rule.source && (
                <div className="p-2 rounded bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Source Reference:</p>
                  <p className="text-sm">{rule.source}</p>
                </div>
              )}

              {/* Applicable Rooms */}
              {rule.applicableRoomTypes && rule.applicableRoomTypes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Applicable Rooms:</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.applicableRoomTypes.map((room, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {room}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Applicable Property Types */}
              {rule.applicablePropertyTypes && rule.applicablePropertyTypes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Property Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.applicablePropertyTypes.map((type, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Learn More Button */}
              {onLearnMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLearnMore}
                  className="w-full"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Learn More About This Rule
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}