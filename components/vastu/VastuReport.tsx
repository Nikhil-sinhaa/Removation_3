"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileDown,
  Share2,
  Printer,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Home,
  Compass,
  Sun,
  Moon,
  Wind,
  Droplets,
  Flame,
  Mountain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
  MapPin,
  Building,
  Layers,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Download,
  ExternalLink,
  Zap,
  Shield,
  Heart,
  Wallet,
  Users,
  Brain,
  Clock,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { VastuAnalysis, VastuRuleEvaluation, VastuSuggestion, VastuCategory, VastuGrade, VastuElementType, CompassDirection } from "@/types/vastu";
import { useLanguage } from "@/hooks/useLanguage";

interface VastuReportProps {
  analysis: VastuAnalysis;
  roomType: string;
  projectName?: string;
  address?: string;
  onApplySuggestion?: (suggestionId: string) => void;
  onExport?: (format: "pdf" | "json" | "image") => void;
  className?: string;
}

interface CategoryScore {
  category: VastuCategory;
  score: number;
  percentage: number;
  status: string;
  findings: string[];
  icon: React.ReactNode;
  description: string;
  impact: "health" | "wealth" | "harmony" | "career" | "relationships";
}

interface LifeAspect {
  id: string;
  name: string;
  nameHindi: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const directionData: Record<CompassDirection, { 
  name: string; 
  nameHindi: string; 
  element: string; 
  deity: string;
  color: string;
}> = {
  NORTH: { name: "North", nameHindi: "उत्तर", element: "Water", deity: "Kubera", color: "#3B82F6" },
  NORTHEAST: { name: "Northeast", nameHindi: "ईशान", element: "Water", deity: "Ishana", color: "#06B6D4" },
  EAST: { name: "East", nameHindi: "पूर्व", element: "Air", deity: "Indra", color: "#F59E0B" },
  SOUTHEAST: { name: "Southeast", nameHindi: "आग्नेय", element: "Fire", deity: "Agni", color: "#EF4444" },
  SOUTH: { name: "South", nameHindi: "दक्षिण", element: "Fire", deity: "Yama", color: "#DC2626" },
  SOUTHWEST: { name: "Southwest", nameHindi: "नैऋत्य", element: "Earth", deity: "Nairuti", color: "#92400E" },
  WEST: { name: "West", nameHindi: "पश्चिम", element: "Air", deity: "Varuna", color: "#6366F1" },
  NORTHWEST: { name: "Northwest", nameHindi: "वायव्य", element: "Air", deity: "Vayu", color: "#8B5CF6" },
};

const categoryIcons: Record<VastuCategory, React.ReactNode> = {
  entrance: <Home className="w-5 h-5" />,
  bedroom: <Moon className="w-5 h-5" />,
  kitchen: <Flame className="w-5 h-5" />,
  bathroom: <Droplets className="w-5 h-5" />,
  puja: <Sparkles className="w-5 h-5" />,
  living: <Users className="w-5 h-5" />,
  direction: <Compass className="w-5 h-5" />,
  elements: <Wind className="w-5 h-5" />,
  colors: <Sun className="w-5 h-5" />,
  furniture: <Mountain className="w-5 h-5" />,
  lighting: <Sun className="w-5 h-5" />,
  plants: <Sparkles className="w-5 h-5" />,
  mirrors: <Sparkles className="w-5 h-5" />,
  water: <Droplets className="w-5 h-5" />,
  storage: <Mountain className="w-5 h-5" />,
  study: <Brain className="w-5 h-5" />, // Added missing category
};

const categoryDescriptions: Record<VastuCategory, string> = {
  entrance: "Main entrance and door placement",
  bedroom: "Sleeping area and bed direction",
  kitchen: "Kitchen location and stove placement",
  bathroom: "Bathroom and toilet location",
  puja: "Prayer area and sacred space",
  living: "Living room arrangement and seating",
  direction: "Overall directional compliance",
  elements: "Five elements balance",
  colors: "Color scheme compliance",
  furniture: "Furniture placement and arrangement",
  lighting: "Natural and artificial lighting",
  plants: "Indoor plants placement",
  mirrors: "Mirror placement and direction",
  water: "Water elements and features",
  storage: "Storage and clutter management",
  study: "Study room and workspace arrangement", // Added missing category
};

export function VastuReport({
  analysis,
  roomType,
  projectName = "Untitled Project",
  address,
  onApplySuggestion,
  onExport,
  className,
}: VastuReportProps) {
  const { t, language } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<string[]>(["summary"]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const reportRef = useRef<HTMLDivElement>(null);

  // Calculate category scores from analysis
  const categoryScores: CategoryScore[] = analysis.categories.map(cat => ({
    category: cat.category,
    score: cat.score,
    percentage: cat.percentage,
    status: cat.status,
    findings: cat.findings,
    icon: categoryIcons[cat.category] || <Info className="w-5 h-5" />,
    description: categoryDescriptions[cat.category] || "Vastu compliance category",
    impact: getCategoryImpact(cat.category),
  }));

  // Life aspects impacted (simplified mapping from categories)
  const lifeAspects: LifeAspect[] = [
    {
      id: "health",
      name: "Health & Wellness",
      nameHindi: "स्वास्थ्य",
      score: calculateAspectScore(['bedroom', 'bathroom', 'kitchen']),
      icon: <Heart className="w-5 h-5" />,
      color: "#10B981",
      description: "Physical and mental well-being",
    },
    {
      id: "wealth",
      name: "Wealth & Prosperity",
      nameHindi: "धन समृद्धि",
      score: calculateAspectScore(['entrance', 'direction', 'puja']),
      icon: <Wallet className="w-5 h-5" />,
      color: "#F59E0B",
      description: "Financial growth and stability",
    },
    {
      id: "harmony",
      name: "Family Harmony",
      nameHindi: "पारिवारिक सौहार्द",
      score: calculateAspectScore(['living', 'bedroom', 'kitchen']),
      icon: <Users className="w-5 h-5" />,
      color: "#8B5CF6",
      description: "Peace and unity in family",
    },
    {
      id: "career",
      name: "Career & Success",
      nameHindi: "करियर सफलता",
      score: calculateAspectScore(['direction', 'study', 'entrance']),
      icon: <TrendingUp className="w-5 h-5" />,
      color: "#3B82F6",
      description: "Professional growth and opportunities",
    },
    {
      id: "relationships",
      name: "Relationships",
      nameHindi: "रिश्ते",
      score: calculateAspectScore(['bedroom', 'living', 'colors']),
      icon: <Heart className="w-5 h-5" />,
      color: "#EC4899",
      description: "Personal and social connections",
    },
  ];

  function getCategoryImpact(category: VastuCategory): "health" | "wealth" | "harmony" | "career" | "relationships" {
    switch (category) {
      case 'bedroom':
      case 'bathroom':
      case 'kitchen':
        return "health";
      case 'entrance':
      case 'puja':
      case 'water':
        return "wealth";
      case 'living':
      case 'kitchen':
      case 'colors':
        return "harmony";
      case 'direction':
      case 'study':
        return "career";
      case 'bedroom':
      case 'living':
      case 'mirrors':
        return "relationships";
      default:
        return "harmony";
    }
  }

  function calculateAspectScore(categories: VastuCategory[]): number {
    const relevantCategories = categoryScores.filter(cat => categories.includes(cat.category));
    if (relevantCategories.length === 0) return 75;
    return Math.round(relevantCategories.reduce((sum, cat) => sum + cat.score, 0) / relevantCategories.length);
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
    if (score >= 40) return "bg-orange-500/10 border-orange-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getGradeColor = (grade: VastuGrade) => {
    switch (grade) {
      case 'excellent': return "text-green-500 bg-green-500/10 border-green-500/20";
      case 'good': return "text-green-400 bg-green-400/10 border-green-400/20";
      case 'average': return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case 'poor': return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case 'critical': return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  const getGradeIcon = (grade: VastuGrade) => {
    switch (grade) {
      case 'excellent': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'good': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'average': return <Info className="w-5 h-5 text-yellow-500" />;
      case 'poor': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'non-compliant':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getSuggestionDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'moderate': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'difficult': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-zinc-500" />;
    }
  };

  const handleCopyReport = async () => {
    const reportText = generateReportText();
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateReportText = () => {
    return `
VASTU SHASTRA REPORT
====================
Project: ${projectName}
${address ? `Address: ${address}` : ""}
Room Type: ${roomType}
Generated: ${new Date().toLocaleDateString()}

OVERALL SCORE: ${analysis.overallScore.value}/100 (${analysis.overallScore.grade.toUpperCase()})

SUMMARY:
${language === 'hi' ? analysis.overallScore.descriptionHi : analysis.overallScore.description}

CATEGORY SCORES:
${analysis.categories.map(cat => `- ${cat.category}: ${cat.score}/${cat.maxScore} (${cat.status})`).join("\n")}

SUGGESTIONS:
${analysis.suggestions.map((s, i) => `${i + 1}. ${language === 'hi' ? s.titleHi : s.title}: ${language === 'hi' ? s.descriptionHi : s.description}`).join("\n")}

Generated by Removation.ai - Vastu Shastra AI Engine
    `.trim();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReport = () => {
    const subject = encodeURIComponent(`Vastu Report - ${projectName}`);
    const body = encodeURIComponent(generateReportText());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Count failed rules by severity
  const failedRules = analysis.ruleEvaluations.filter((rule: VastuRuleEvaluation) => rule.status === 'failed');
  const warningRules = analysis.ruleEvaluations.filter((rule: VastuRuleEvaluation) => rule.status === 'warning');

  return (
    <div
      ref={reportRef}
      className={cn(
        "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      {/* Report Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {language === "hi" ? "वास्तु शास्त्र रिपोर्ट" : "Vastu Shastra Report"}
                </h2>
                <p className="text-sm text-zinc-500">
                  {language === "hi" ? "विस्तृत विश्लेषण और सुझाव" : "Detailed Analysis & Recommendations"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyReport}
                  className="h-9 w-9"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Report</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrint}
                  className="h-9 w-9"
                >
                  <Printer className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print Report</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Share2 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEmailReport}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.("pdf")}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.("json")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onExport?.("image")}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Share Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Project Info */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4" />
            <span>{projectName}</span>
          </div>
          {address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{address}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span className="capitalize">{roomType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-zinc-200 dark:text-zinc-700"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#scoreGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={440}
                initial={{ strokeDashoffset: 440 }}
                animate={{ strokeDashoffset: 440 - (440 * analysis.overallScore.value) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={analysis.overallScore.value >= 60 ? "#10B981" : "#EF4444"}
                  />
                  <stop
                    offset="100%"
                    stopColor={analysis.overallScore.value >= 60 ? "#34D399" : "#F87171"}
                  />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className={cn("text-4xl font-bold", getScoreColor(analysis.overallScore.value))}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                {analysis.overallScore.value}
              </motion.span>
              <span className="text-sm text-zinc-500">/ 100</span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {language === "hi" ? "समग्र वास्तु स्कोर" : "Overall Vastu Score"}
              </h3>
              <Badge className={getGradeColor(analysis.overallScore.grade)}>
                {analysis.overallScore.grade.toUpperCase()}
              </Badge>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {language === 'hi' ? analysis.overallScore.descriptionHi : analysis.overallScore.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={cn("p-3 rounded-lg border", getScoreBgColor(analysis.overallScore.value))}>
                <div className="flex items-center gap-2">
                  {getGradeIcon(analysis.overallScore.grade)}
                  <span className="font-medium text-zinc-900 dark:text-white capitalize">
                    {analysis.overallScore.grade}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {failedRules.length}
                </div>
                <div className="text-xs text-zinc-500">
                  {language === "hi" ? "उल्लंघन" : "Violations"}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {analysis.suggestions.length}
                </div>
                <div className="text-xs text-zinc-500">
                  {language === "hi" ? "सुझाव" : "Suggestions"}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <div className="text-2xl font-bold text-green-500">
                  {analysis.confidence}%
                </div>
                <div className="text-xs text-zinc-500">
                  {language === "hi" ? "आत्मविश्वास" : "Confidence"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-4 border-b border-zinc-200 dark:border-zinc-800">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <Eye className="w-4 h-4 mr-1.5 hidden sm:block" />
              {language === "hi" ? "अवलोकन" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="violations" className="text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 mr-1.5 hidden sm:block" />
              {language === "hi" ? "उल्लंघन" : "Violations"}
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm">
              <Layers className="w-4 h-4 mr-1.5 hidden sm:block" />
              {language === "hi" ? "श्रेणियाँ" : "Categories"}
            </TabsTrigger>
            <TabsTrigger value="impacts" className="text-xs sm:text-sm">
              <Zap className="w-4 h-4 mr-1.5 hidden sm:block" />
              {language === "hi" ? "प्रभाव" : "Impacts"}
            </TabsTrigger>
            <TabsTrigger value="remedies" className="text-xs sm:text-sm">
              <Shield className="w-4 h-4 mr-1.5 hidden sm:block" />
              {language === "hi" ? "उपाय" : "Remedies"}
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="h-[500px]">
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6">
            {/* Category Scores */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                {language === "hi" ? "श्रेणी के अनुसार स्कोर" : "Scores by Category"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryScores.map((cat, idx) => (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      getScoreBgColor(cat.score)
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg", getScoreBgColor(cat.score))}>
                          {cat.icon}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-white capitalize">
                            {cat.category}
                          </div>
                          <div className="text-xs text-zinc-500">{cat.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("text-2xl font-bold", getScoreColor(cat.score))}>
                          {cat.score}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {cat.status}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">
                        {cat.findings.length} {language === "hi" ? "निष्कर्ष" : "findings"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {language === "hi" ? "प्रभाव:" : "Impact:"} {cat.impact}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Life Aspects */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                {language === "hi" ? "जीवन के पहलुओं पर प्रभाव" : "Impact on Life Aspects"}
              </h3>
              <div className="space-y-3">
                {lifeAspects.map((aspect, idx) => (
                  <motion.div
                    key={aspect.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800"
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${aspect.color}20` }}
                    >
                      <div style={{ color: aspect.color }}>{aspect.icon}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {language === "hi" ? aspect.nameHindi : aspect.name}
                        </span>
                        <span
                          className="font-bold"
                          style={{ color: aspect.color }}
                        >
                          {aspect.score}%
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: aspect.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${aspect.score}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{aspect.description}</p>
                    </div>
                    <div>
                      {aspect.score >= 70 ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : aspect.score >= 50 ? (
                        <Minus className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Detection-failure notice — shown even when 0 elements detected */}
            {analysis.detectionConfidence === 'failed' && (
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-sm text-orange-800 dark:text-orange-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-orange-600 dark:text-orange-400" />
                <span>
                  {language === "hi"
                    ? "इस छवि के लिए तत्व पहचान नहीं हुई — स्कोर केवल कमरे के प्रकार पर आधारित है। दोबारा विश्लेषण करने का प्रयास करें।"
                    : "Element detection did not run for this image — score reflects room type rules only. Try analyzing again."}
                </span>
              </div>
            )}

            {/* Detected Elements */}
            {analysis.detectedElements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                  {language === "hi" ? "पहचाने गए तत्व" : "Detected Elements"}
                </h3>

                {analysis.detectionConfidence === 'low' && (
                  <div className="flex items-start gap-2 mb-3 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                    <span>
                      {language === "hi"
                        ? "इस छवि के लिए पहचान विश्वास कम है — कुछ पहचाने गए तत्व सटीक नहीं हो सकते। परिणाम नीचे दिए गए हैं।"
                        : "Detection confidence is lower than usual for this image — some detected items may not be accurate. Results are still shown below."}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {analysis.detectedElements.slice(0, 6).map((element, idx) => (
                    <div
                      key={element.id}
                      className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(element.vastuCompliance)}
                        <span className="font-medium text-sm text-zinc-900 dark:text-white">
                          {language === 'hi' ? element.nameHi : element.name}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {element.position} • {element.confidence}% confidence
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Violations Tab */}
          <TabsContent value="violations" className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {language === "hi" ? "वास्तु उल्लंघन" : "Vastu Violations"}
              </h3>
              <div className="flex gap-2">
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" />
                  {failedRules.length} Failed
                </Badge>
                <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-500">
                  <AlertTriangle className="w-3 h-3" />
                  {warningRules.length} Warnings
                </Badge>
              </div>
            </div>

            <Accordion type="multiple" className="space-y-3">
              {failedRules.map((rule: VastuRuleEvaluation, idx: number) => (
                <AccordionItem
                  key={rule.ruleId}
                  value={rule.ruleId}
                  className="border rounded-lg overflow-hidden border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-medium text-zinc-900 dark:text-white">
                            {language === 'hi' ? rule.ruleTitleHi : rule.ruleTitle}
                          </div>
                          {rule.source === 'detection' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="text-xs border-blue-400 text-blue-500 gap-1 px-1.5 py-0"
                                >
                                  <Eye className="w-3 h-3" />
                                  {language === "hi" ? "AI पहचान" : "AI Detection"}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {language === "hi"
                                  ? "AI छवि विश्लेषण पर आधारित"
                                  : "Based on AI image analysis"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="text-sm text-zinc-500">
                          Code: {rule.ruleCode} • Score: {rule.score}/{rule.maxScore}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {language === 'hi' ? rule.detailsHi : rule.details}
                      </p>
                      
                      {rule.affectedElements.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            Affected Elements:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rule.affectedElements.map((el, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {el}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.autoFixAvailable && rule.suggestedRemedyIds.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            // Apply the first suggested remedy
                            const remedyId = rule.suggestedRemedyIds[0];
                            // Find suggestion with this remedy
                            const suggestion = analysis.suggestions.find(s => 
                              s.relatedRuleIds?.includes(rule.ruleId)
                            );
                            if (suggestion) {
                              onApplySuggestion?.(suggestion.id);
                            }
                          }}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {language === "hi" ? "AI से ठीक करें" : "Apply AI Fix"}
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {failedRules.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                  {language === "hi" ? "कोई उल्लंघन नहीं!" : "No Violations Found!"}
                </h3>
                <p className="text-zinc-500">
                  {language === "hi"
                    ? "आपका स्थान वास्तु के अनुसार पूर्ण है"
                    : "Your space is perfectly aligned with Vastu principles"}
                </p>
              </div>
            )}

            {/* Warnings Section */}
            {warningRules.length > 0 && (
              <div className="mt-8">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white mb-3">
                  {language === "hi" ? "चेतावनियाँ" : "Warnings"}
                </h4>
                <div className="space-y-2">
                  {warningRules.map((rule: VastuRuleEvaluation) => (
                    <div
                      key={rule.ruleId}
                      className="p-3 rounded-lg border border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-zinc-900 dark:text-white">
                            {language === 'hi' ? rule.ruleTitleHi : rule.ruleTitle}
                          </div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            {language === 'hi' ? rule.detailsHi : rule.details}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              {language === "hi" ? "विस्तृत श्रेणी विश्लेषण" : "Detailed Category Analysis"}
            </h3>

            <div className="space-y-4">
              {categoryScores.map((cat) => (
                <Card key={cat.category}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          {cat.icon}
                        </div>
                        <div>
                          <div className="capitalize">{cat.category}</div>
                          <div className="text-xs text-zinc-500">{cat.description}</div>
                        </div>
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn(
                          cat.status === 'compliant' && "border-green-500 text-green-500",
                          cat.status === 'partial' && "border-yellow-500 text-yellow-500",
                          cat.status === 'non-compliant' && "border-red-500 text-red-500",
                        )}>
                          {cat.status}
                        </Badge>
                        <div className={cn("text-2xl font-bold", getScoreColor(cat.score))}>
                          {cat.score}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={cat.percentage} className="h-2" />
                    
                    {cat.findings.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          {language === "hi" ? "निष्कर्ष" : "Findings"}:
                        </div>
                        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {cat.findings.slice(0, 3).map((finding, idx) => (
                            <li key={`finding-${idx}`} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 opacity-60" />
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Impacts Tab */}
          <TabsContent value="impacts" className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              {language === "hi" ? "जीवन पर प्रभाव विश्लेषण" : "Life Impact Analysis"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {language === "hi" ? "स्कोर वितरण" : "Score Distribution"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lifeAspects.map((aspect) => (
                      <div key={aspect.id} className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${aspect.color}20` }}
                        >
                          <div style={{ color: aspect.color }}>{aspect.icon}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {language === "hi" ? aspect.nameHindi : aspect.name}
                            </span>
                            <span style={{ color: aspect.color }}>{aspect.score}%</span>
                          </div>
                          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: aspect.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${aspect.score}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    {language === "hi" ? "समस्या वितरण" : "Issue Distribution"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {categoryScores.map((cat, idx) => {
                          const totalFailed = categoryScores.reduce((a, c) => a + (c.status === 'non-compliant' ? 1 : 0), 0);
                          const percentage = totalFailed > 0 ? 100 / totalFailed : 0;
                          const offset = categoryScores
                            .slice(0, idx)
                            .reduce((a, c) => a + (c.status === 'non-compliant' ? percentage : 0), 0);
                          
                          if (cat.status !== 'non-compliant') return null;
                          
                          return (
                            <circle
                              key={cat.category}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={
                                idx === 0 ? "#EF4444" :
                                idx === 1 ? "#F59E0B" :
                                idx === 2 ? "#10B981" :
                                idx === 3 ? "#3B82F6" :
                                idx === 4 ? "#8B5CF6" : "#EC4899"
                              }
                              strokeWidth="20"
                              strokeDasharray={`${percentage * 2.51} ${251 - percentage * 2.51}`}
                              strokeDashoffset={-offset * 2.51}
                              transform="rotate(-90 50 50)"
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                          {categoryScores.filter(c => c.status === 'non-compliant').length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {categoryScores
                      .filter(c => c.status === 'non-compliant')
                      .map((cat, idx) => (
                        <div key={cat.category} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                idx === 0 ? "#EF4444" :
                                idx === 1 ? "#F59E0B" :
                                idx === 2 ? "#10B981" :
                                idx === 3 ? "#3B82F6" :
                                idx === 4 ? "#8B5CF6" : "#EC4899"
                            }}
                          />
                          <span className="text-zinc-600 dark:text-zinc-400 capitalize">
                            {cat.category}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Remedies Tab */}
          <TabsContent value="remedies" className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {language === "hi" ? "वास्तु उपाय और सुझाव" : "Vastu Remedies & Suggestions"}
              </h3>
              <Button
                onClick={() => {
                  analysis.suggestions.forEach((s: VastuSuggestion) => onApplySuggestion?.(s.id));
                }}
                disabled={!analysis.autoFixAvailable}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {language === "hi" ? "सभी लागू करें" : "Apply All"}
              </Button>
            </div>

            <div className="space-y-4">
              {analysis.suggestions.map((suggestion: VastuSuggestion, idx: number) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          suggestion.priority === 'critical' ? "bg-gradient-to-br from-red-500 to-rose-500" :
                          suggestion.priority === 'high' ? "bg-gradient-to-br from-orange-500 to-amber-500" :
                          suggestion.priority === 'medium' ? "bg-gradient-to-br from-yellow-500 to-amber-500" :
                          "bg-gradient-to-br from-green-500 to-emerald-500"
                        )}>
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-zinc-900 dark:text-white">
                                {language === 'hi' ? suggestion.titleHi : suggestion.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.type.replace('-', ' ')}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    suggestion.difficulty === 'easy'
                                      ? "bg-green-100 text-green-700"
                                      : suggestion.difficulty === 'moderate'
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  )}
                                >
                                  {getSuggestionDifficultyIcon(suggestion.difficulty)}
                                  <span className="ml-1">
                                    {suggestion.difficulty === 'easy'
                                      ? language === "hi" ? "आसान" : "Easy"
                                      : suggestion.difficulty === 'moderate'
                                      ? language === "hi" ? "मध्यम" : "Medium"
                                      : language === "hi" ? "कठिन" : "Hard"}
                                  </span>
                                </Badge>
                                {suggestion.estimatedCost && (
                                  <Badge variant="outline" className="text-xs">
                                    ₹{suggestion.estimatedCost.INR.min.toLocaleString()} - ₹{suggestion.estimatedCost.INR.max.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-600">
                                +{suggestion.scoreImpact} {language === "hi" ? "अंक" : "points"}
                              </div>
                              {suggestion.canAutoFix && (
                                <Badge className="mt-1 bg-green-500 text-white text-xs">
                                  {language === "hi" ? "ऑटो फिक्स उपलब्ध" : "Auto Fix Available"}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            {language === 'hi' ? suggestion.descriptionHi : suggestion.description}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            {suggestion.canAutoFix && (
                              <Button
                                size="sm"
                                onClick={() => onApplySuggestion?.(suggestion.id)}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                {language === "hi" ? "AI से लागू करें" : "Apply with AI"}
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              {language === "hi" ? "पूर्वावलोकन" : "Preview"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Remedies */}
            {analysis.detectedElements.length > 0 && (
              <div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-white mb-3">
                  {language === "hi" ? "त्वरित उपाय" : "Quick Remedies"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      icon: <Sun className="w-5 h-5" />,
                      title: language === "hi" ? "पूर्व में दर्पण" : "Mirror in East",
                      desc: language === "hi" ? "ऊर्जा प्रवाह बढ़ाएं" : "Enhance energy flow",
                    },
                    {
                      icon: <Droplets className="w-5 h-5" />,
                      title: language === "hi" ? "उत्तर में जल तत्व" : "Water Element in North",
                      desc: language === "hi" ? "धन आकर्षित करें" : "Attract wealth",
                    },
                    {
                      icon: <Wind className="w-5 h-5" />,
                      title: language === "hi" ? "वायु शोधक पौधे" : "Air Purifying Plants",
                      desc: language === "hi" ? "सकारात्मक ऊर्जा" : "Positive energy",
                    },
                    {
                      icon: <Flame className="w-5 h-5" />,
                      title: language === "hi" ? "दक्षिण-पूर्व में लाल" : "Red in Southeast",
                      desc: language === "hi" ? "अग्नि तत्व संतुलन" : "Balance fire element",
                    },
                    {
                      icon: <Mountain className="w-5 h-5" />,
                      title: language === "hi" ? "दक्षिण-पश्चिम में भारी वस्तु" : "Heavy Items in Southwest",
                      desc: language === "hi" ? "स्थिरता लाएं" : "Bring stability",
                    },
                    {
                      icon: <Sparkles className="w-5 h-5" />,
                      title: language === "hi" ? "केंद्र खाली रखें" : "Keep Center Clear",
                      desc: language === "hi" ? "ब्रह्मस्थान शुद्ध" : "Pure Brahmasthan",
                    },
                  ].map((remedy, idx) => (
                    <motion.div
                      key={`remedy-${idx}`}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600">
                          {remedy.icon}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-white text-sm">
                            {remedy.title}
                          </div>
                          <div className="text-xs text-zinc-500">{remedy.desc}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Report Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-b-xl">
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-orange-500" />
            <span>
              {language === "hi"
                ? "Removation.ai वास्तु शास्त्र AI इंजन द्वारा निर्मित"
                : "Generated by Removation.ai Vastu Shastra AI Engine"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              {language === "hi" ? "रिपोर्ट आईडी:" : "Report ID:"}{" "}
              {analysis.id.slice(0, 8) || "VASTU-2025"}
            </span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VastuReport;