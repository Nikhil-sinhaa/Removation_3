"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Compass,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Sparkles,
  ChevronRight,
  Download,
  Share2,
  Home,
  Flame,
  Moon,
  Droplets,
  Users,
  Brain,
  Eye,
  Filter,
  Settings,
  Copy,
  Printer,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { VastuSuggestions } from "./VastuSuggestions";
import { VastuGrid } from "./VastuGrid";
import { VastuCompass } from "./VastuCompass";
import { cn } from "@/lib/utils";
import type { VastuAnalysis, CompassDirection, VastuCategory } from "@/types/vastu";

interface VastuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  roomType: string;
  projectId: string;
  analysis?: VastuAnalysis | null;
  isLoading?: boolean;
  error?: string | null;
  onApplySuggestion?: (suggestionId: string) => void;
  onExport?: (format: "pdf" | "json" | "image") => void;
}

const translations = {
  en: {
    title: "Vastu Analysis",
    subtitle: "Ancient wisdom meets modern AI",
    analyzing: "Analyzing your space...",
    overview: "Overview",
    suggestions: "Suggestions",
    grid: "Vastu Grid",
    compass: "Compass",
    report: "Report",
    autoFix: "Auto-Fix All",
    applyAll: "Apply All Suggestions",
    exportReport: "Export Report",
    share: "Share Analysis",
    noImage: "Upload an image to analyze Vastu",
    noAnalysis: "Run analysis to see Vastu insights",
    score: "Vastu Score",
    issues: "Issues Found",
    positive: "Positive Aspects",
    critical: "Critical",
    warning: "Warning",
    good: "Good",
    direction: "Primary Direction",
    roomAnalysis: "Room Analysis",
    elementBalance: "Element Balance",
    energyFlow: "Energy Flow",
    remedies: "Remedies",
    showHindi: "Show in Hindi",
    categories: "Categories",
    rules: "Rules",
    violations: "Violations",
    confidence: "Confidence",
    generateReport: "Generate Report",
    applySelected: "Apply Selected",
    viewDetails: "View Details",
  },
  hi: {
    title: "वास्तु विश्लेषण",
    subtitle: "प्राचीन ज्ञान और आधुनिक AI का संगम",
    analyzing: "आपके स्थान का विश्लेषण हो रहा है...",
    overview: "अवलोकन",
    suggestions: "सुझाव",
    grid: "वास्तु ग्रिड",
    compass: "दिशा",
    report: "रिपोर्ट",
    autoFix: "ऑटो-फिक्स",
    applyAll: "सभी सुझाव लागू करें",
    exportReport: "रिपोर्ट डाउनलोड करें",
    share: "विश्लेषण साझा करें",
    noImage: "वास्तु विश्लेषण के लिए छवि अपलोड करें",
    noAnalysis: "वास्तु अंतर्दृष्टि देखने के लिए विश्लेषण चलाएं",
    score: "वास्तु स्कोर",
    issues: "समस्याएं मिलीं",
    positive: "सकारात्मक पहलू",
    critical: "गंभीर",
    warning: "चेतावनी",
    good: "अच्छा",
    direction: "मुख्य दिशा",
    roomAnalysis: "कमरे का विश्लेषण",
    elementBalance: "तत्व संतुलन",
    energyFlow: "ऊर्जा प्रवाह",
    remedies: "उपाय",
    showHindi: "हिंदी में दिखाएं",
    categories: "श्रेणियाँ",
    rules: "नियम",
    violations: "उल्लंघन",
    confidence: "विश्वास",
    generateReport: "रिपोर्ट बनाएं",
    applySelected: "चयनित लागू करें",
    viewDetails: "विवरण देखें",
  },
};

const categoryIcons: Record<VastuCategory, React.ReactNode> = {
  entrance: <Home className="w-5 h-5" />,
  bedroom: <Moon className="w-5 h-5" />,
  kitchen: <Flame className="w-5 h-5" />,
  bathroom: <Droplets className="w-5 h-5" />,
  puja: <Sparkles className="w-5 h-5" />,
  living: <Users className="w-5 h-5" />,
  direction: <Compass className="w-5 h-5" />,
  elements: <Sparkles className="w-5 h-5" />,
  colors: <Eye className="w-5 h-5" />,
  furniture: <Home className="w-5 h-5" />,
  lighting: <Sparkles className="w-5 h-5" />,
  plants: <Sparkles className="w-5 h-5" />,
  mirrors: <Sparkles className="w-5 h-5" />,
  water: <Droplets className="w-5 h-5" />,
  storage: <Home className="w-5 h-5" />,
  study: <Brain className="w-5 h-5" />,
};

const categoryColors: Record<VastuCategory, string> = {
  entrance: "bg-blue-500/20 text-blue-600",
  bedroom: "bg-purple-500/20 text-purple-600",
  kitchen: "bg-orange-500/20 text-orange-600",
  bathroom: "bg-cyan-500/20 text-cyan-600",
  puja: "bg-yellow-500/20 text-yellow-600",
  living: "bg-green-500/20 text-green-600",
  direction: "bg-indigo-500/20 text-indigo-600",
  elements: "bg-red-500/20 text-red-600",
  colors: "bg-pink-500/20 text-pink-600",
  furniture: "bg-emerald-500/20 text-emerald-600",
  lighting: "bg-amber-500/20 text-amber-600",
  plants: "bg-lime-500/20 text-lime-600",
  mirrors: "bg-violet-500/20 text-violet-600",
  water: "bg-sky-500/20 text-sky-600",
  storage: "bg-gray-500/20 text-gray-600",
  study: "bg-teal-500/20 text-teal-600",
};

export function VastuPanel({
  isOpen,
  onClose,
  imageUrl,
  roomType,
  projectId,
  analysis = null,
  isLoading = false,
  error,
  onApplySuggestion,
  onExport,
}: VastuPanelProps) {
  const [showHindi, setShowHindi] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDirection, setSelectedDirection] = useState<CompassDirection>("NORTH");

  const language = showHindi ? "hi" : "en";
  const t = translations[language];

  const handleApplyAutoFix = () => {
    if (analysis?.suggestions && onApplySuggestion) {
      analysis.suggestions.forEach((suggestion) => {
        if (suggestion.canAutoFix) {
          onApplySuggestion(suggestion.id);
        }
      });
    }
  };

  const handleExport = (format: "pdf" | "json" | "image") => {
    onExport?.(format);
  };

  const panelVariants = {
    hidden: {
      x: "100%",
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
    if (score >= 40) return "bg-orange-500/10 border-orange-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}
      {isOpen && (
        /* Panel */
        <motion.div
          key="panel"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed right-0 top-0 h-full w-full sm:w-[420px] lg:w-[480px]",
            "bg-background border-l border-border shadow-2xl z-50",
            "flex flex-col"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-orange-500/10 to-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{t.title}</h2>
                <p className="text-xs text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-2">
                <Label htmlFor="hindi-toggle" className="text-xs text-muted-foreground">
                  हिं
                </Label>
                <Switch
                  id="hindi-toggle"
                  checked={showHindi}
                  onCheckedChange={setShowHindi}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            {!imageUrl ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Compass className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t.noImage}</p>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">{t.analyzing}</p>
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-orange-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-500 font-medium">Analysis Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            ) : analysis ? (
              <div className="p-4 space-y-6">
                {/* Score Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-2xl border-2",
                    getScoreBg(analysis.overallScore.value)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.score}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={cn("text-4xl font-bold", getScoreColor(analysis.overallScore.value))}>
                          {analysis.overallScore.value}
                        </span>
                        <span className="text-muted-foreground">/100</span>
                      </div>
                    </div>
                    <Badge className={cn(
                      analysis.overallScore.grade === "excellent" && "bg-green-500",
                      analysis.overallScore.grade === "good" && "bg-green-400",
                      analysis.overallScore.grade === "average" && "bg-yellow-500",
                      analysis.overallScore.grade === "poor" && "bg-orange-500",
                      analysis.overallScore.grade === "critical" && "bg-red-500",
                    )}>
                      {language === "hi" ? analysis.overallScore.labelHi : analysis.overallScore.label}
                    </Badge>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center p-2 rounded-lg bg-background/50">
                      <div className="flex items-center justify-center gap-1 text-red-500">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-sm font-medium">
                          {analysis.ruleEvaluations.filter((r: { status: string }) => r.status === "failed").length}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t.violations}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background/50">
                      <div className="flex items-center justify-center gap-1 text-yellow-500">
                        <Info className="w-3 h-3" />
                        <span className="text-sm font-medium">{analysis.suggestions.length}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t.suggestions}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background/50">
                      <div className="flex items-center justify-center gap-1 text-green-500">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-sm font-medium">{analysis.positiveAspects?.length || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t.positive}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-3">
                    {language === "hi" ? analysis.overallScore.descriptionHi : analysis.overallScore.description}
                  </p>
                </motion.div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="overview" className="text-xs">
                      {t.overview}
                    </TabsTrigger>
                    <TabsTrigger value="suggestions" className="text-xs">
                      {t.suggestions}
                    </TabsTrigger>
                    <TabsTrigger value="grid" className="text-xs">
                      {t.grid}
                    </TabsTrigger>
                    <TabsTrigger value="compass" className="text-xs">
                      {t.compass}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4 space-y-4">
                    {/* Direction */}
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{t.direction}</p>
                          <p className="font-semibold capitalize mt-1">
                            {analysis.roomDirection || "Not detected"}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Compass className="w-6 h-6 text-blue-500" />
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-3">{t.categories}</p>
                      <div className="space-y-3">
                        {analysis.categories.map((category, idx) => (
                          <div key={category.category} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", categoryColors[category.category])}>
                                  {categoryIcons[category.category]}
                                </div>
                                <div>
                                  <div className="font-medium text-sm capitalize">{category.category}</div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      category.status === "compliant" && "border-green-500/50 text-green-600",
                                      category.status === "partial" && "border-yellow-500/50 text-yellow-600",
                                      category.status === "non-compliant" && "border-red-500/50 text-red-600",
                                    )}
                                  >
                                    {category.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={cn("text-xl font-bold", getScoreColor(category.percentage))}>
                                  {category.percentage}
                                </div>
                                <div className="text-xs text-muted-foreground">%</div>
                              </div>
                            </div>
                            <Progress value={category.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-muted-foreground">{t.confidence}</p>
                        <Badge variant="outline">
                          {analysis.confidence}%
                        </Badge>
                      </div>
                      <Progress value={analysis.confidence} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Analysis processed in {analysis.processingTime}s
                      </p>
                    </div>

                    {/* Detection quality notices */}
                    {analysis.detectionConfidence === 'failed' && (
                      <div className="flex items-start gap-2 p-3 rounded-xl border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-orange-600 dark:text-orange-400" />
                        <p className="text-xs text-orange-800 dark:text-orange-200">
                          {language === "hi"
                            ? "इस छवि के लिए तत्व पहचान नहीं हुई — स्कोर केवल कमरे के प्रकार पर आधारित है। दोबारा विश्लेषण करने का प्रयास करें।"
                            : "Element detection did not run for this image — score reflects room type rules only. Try analyzing again."}
                        </p>
                      </div>
                    )}
                    {analysis.detectionConfidence === 'low' && (
                      <div className="flex items-start gap-2 p-3 rounded-xl border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                          {language === "hi"
                            ? "पहचान विश्वास कम है — कुछ तत्व सटीक नहीं हो सकते। परिणाम नीचे दर्शाए गए हैं।"
                            : "Detection confidence is lower than usual — some detected items may not be accurate. Results are still shown below."}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="suggestions" className="mt-4">
                    <VastuSuggestions
                      analysis={analysis}
                      language={language}
                      onApply={onApplySuggestion}
                    />
                  </TabsContent>

                  <TabsContent value="grid" className="mt-4">
                    <VastuGrid analysis={analysis} />
                  </TabsContent>

                  <TabsContent value="compass" className="mt-4">
                    <div className="flex flex-col items-center gap-6 py-4">
                      <VastuCompass
                        direction={analysis.roomDirection ?? undefined}
                        size="lg"
                        showLabels
                      />
                      {!analysis.roomDirection && (
                        <p className="text-sm text-muted-foreground text-center">
                          No direction detected — specify a room direction for compass alignment.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Compass className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <p className="text-muted-foreground text-sm">{t.noAnalysis}</p>
              </div>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-t border-border bg-muted/30 space-y-3"
            >
              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                onClick={handleApplyAutoFix}
                disabled={!analysis.autoFixAvailable || !onApplySuggestion}
                title={!onApplySuggestion ? "AI auto-fix coming soon" : undefined}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t.autoFix}
                <Badge variant="secondary" className="ml-2">
                  {analysis.suggestions.filter(s => s.canAutoFix).length}
                </Badge>
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleExport("pdf")}
                  disabled={!onExport}
                  title={!onExport ? "Export coming soon" : undefined}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t.exportReport}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleExport("image")}
                  disabled={!onExport}
                  title={!onExport ? "Share coming soon" : undefined}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
