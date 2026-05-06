"use client";

import React, { useState, useEffect } from "react";
import {
    Compass,
    AlertTriangle,
    CheckCircle2,
    Info,
    ChevronRight,
    ChevronDown,
    RotateCw,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { analyzeVastu } from "@/lib/vastu-engine";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VastuPanelProps {
    roomType: string;
    className?: string;
}

export function VastuPanel({ roomType, className }: VastuPanelProps) {
    const [direction, setDirection] = useState("North");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    // Run analysis when direction or room type changes
    useEffect(() => {
        runAnalysis();
    }, [direction, roomType]);

    const runAnalysis = () => {
        setIsAnalyzing(true);

        // Simulate processing time for better UX
        setTimeout(() => {
            const result = analyzeVastu({
                roomType: roomType.replace("-", "_"), // Convert 'living-room' to 'living_room'
                direction: direction,
                language: "en"
            });
            setAnalysis(result);
            setIsAnalyzing(false);
        }, 600);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-orange-500";
        return "text-red-500";
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return "bg-green-500";
        if (score >= 60) return "bg-orange-500";
        return "bg-red-500";
    };

    if (!analysis && !isAnalyzing) return null;

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            <div className="p-4 space-y-4 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        Vastu Analysis
                    </h3>
                    <Badge variant={analysis?.overallScore?.grade === 'excellent' ? 'default' : 'outline'}>
                        {analysis?.overallScore?.grade?.toUpperCase() || 'ANALYZING'}
                    </Badge>
                </div>

                {/* Direction Selector */}
                <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium uppercase">
                        Room Direction
                    </label>
                    <Select value={direction} onValueChange={setDirection}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                        <SelectContent>
                            {['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'].map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Overall Score */}
                <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                        <span>Compatibility Score</span>
                        <span className={cn("font-bold", getScoreColor(analysis?.overallScore?.value || 0))}>
                            {analysis?.overallScore?.value || 0}/100
                        </span>
                    </div>
                    <Progress
                        value={analysis?.overallScore?.value || 0}
                        className="h-2"
                    // We'll need to customize Progress component or use inline style for color
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {/* Compliances */}
                    {analysis?.compliances.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                Positive Aspects
                            </h4>
                            <div className="space-y-2">
                                {analysis.compliances.map((item: any, i: number) => (
                                    <motion.div
                                        key={`comp-${i}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="text-sm bg-green-500/10 border border-green-500/20 p-2 rounded-md"
                                    >
                                        <p className="font-medium text-xs text-green-700 dark:text-green-300">
                                            {item.aspect}
                                        </p>
                                        <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">
                                            {item.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Violations */}
                    {analysis?.violations.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-4 h-4" />
                                Issues Detected
                            </h4>
                            <div className="space-y-2">
                                {analysis.violations.map((item: any, i: number) => (
                                    <motion.div
                                        key={`viol-${i}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="text-sm bg-red-500/10 border border-red-500/20 p-2 rounded-md"
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-xs text-red-700 dark:text-red-300">
                                                {item.type}
                                            </p>
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 border-red-200 text-red-700">
                                                {item.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5 mb-2">
                                            {item.description}
                                        </p>
                                        <div className="bg-background/50 p-1.5 rounded text-xs border border-red-100 dark:border-red-900/30">
                                            <span className="font-semibold text-red-700 dark:text-red-300">Remedy: </span>
                                            <span className="text-muted-foreground">{item.remedy}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2 text-blue-600">
                            <Info className="w-4 h-4" />
                            Recommendations
                        </h4>
                        <ul className="space-y-2">
                            {analysis?.recommendations.map((rec: any, i: number) => (
                                <li key={`rec-${i}`} className="text-xs text-muted-foreground flex gap-2 items-start">
                                    <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                    {rec.recommendation}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
