"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    RotateCw,
    Sparkles,
    ImageIcon,
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
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface VastuPanelProps {
    roomType: string;
    imageUrl?: string;
    className?: string;
}

export function VastuPanel({ roomType, imageUrl, className }: VastuPanelProps) {
    const [direction, setDirection] = useState("North");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Use a ref so runAnalysis always reads the latest direction without
    // the useEffect re-firing on every direction change (credits are finite).
    const directionRef = useRef(direction);
    directionRef.current = direction;

    const runAnalysis = async () => {
        if (!imageUrl) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const res = await fetch('/api/vastu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl,
                    roomType: roomType.replace(/-/g, '_'),
                    direction: directionRef.current,
                    language: 'en',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Analysis failed');
                return;
            }
            setAnalysis(data.analysis);
        } catch (e: any) {
            setError(e.message || 'Network error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Re-run automatically when the image or room type changes.
    // Direction changes require an explicit "Re-analyze" click to avoid
    // spending a credit on every dropdown interaction.
    useEffect(() => {
        if (imageUrl) runAnalysis();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageUrl, roomType]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-orange-500";
        return "text-red-500";
    };

    if (!imageUrl) {
        return (
            <div className={cn("flex flex-col items-center justify-center gap-3 p-6 text-center h-full bg-background", className)}>
                <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                    Upload or select an image to run Vastu analysis.
                </p>
            </div>
        );
    }

    if (!analysis && !isAnalyzing && !error) return null;

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            <div className="p-4 space-y-4 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        Vastu Analysis
                    </h3>
                    <Badge variant={analysis?.overallScore?.grade === 'excellent' ? 'default' : 'outline'}>
                        {isAnalyzing ? 'ANALYZING' : (analysis?.overallScore?.grade?.toUpperCase() || 'ERROR')}
                    </Badge>
                </div>

                {/* Direction Selector */}
                <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium uppercase">
                        Room Direction
                    </label>
                    <div className="flex gap-2">
                        <Select value={direction} onValueChange={setDirection}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                            <SelectContent>
                                {['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'].map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                            title="Re-analyze with selected direction"
                        >
                            <RotateCw className={cn("w-4 h-4", isAnalyzing && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* Overall Score */}
                {analysis && (
                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                            <span>Compatibility Score</span>
                            <span className={cn("font-bold", getScoreColor(analysis?.overallScore?.value || 0))}>
                                {analysis?.overallScore?.value || 0}/100
                            </span>
                        </div>
                        <Progress value={analysis?.overallScore?.value || 0} className="h-2" />
                    </div>
                )}

                {error && (
                    <p className="text-xs text-destructive">{error}</p>
                )}
            </div>

            {isAnalyzing && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <RotateCw className="w-6 h-6 animate-spin" />
                        <p className="text-sm">Analyzing room elements…</p>
                    </div>
                </div>
            )}

            {analysis && !isAnalyzing && (
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6">
                        {/* Compliances */}
                        {analysis?.compliances?.length > 0 && (
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
                        {analysis?.violations?.length > 0 && (
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
                        {analysis?.recommendations?.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium flex items-center gap-2 text-blue-600">
                                    <Info className="w-4 h-4" />
                                    Recommendations
                                </h4>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec: any, i: number) => (
                                        <li key={`rec-${i}`} className="text-xs text-muted-foreground flex gap-2 items-start">
                                            <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            {rec.recommendation}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
