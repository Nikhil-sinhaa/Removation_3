"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Camera,
  Compass,
  Loader2,
  AlertCircle,
  ArrowRight,
  Home,
  Flame,
  Moon,
  Droplets,
  Users,
  Plus,
  Minus,
  RefreshCw,
  Palette,
  Layers,
  Shield,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { VastuPanel } from "./VastuPanel";
import { useVastu } from "@/hooks/useVastu";
import { cn } from "@/lib/utils";
import type { VastuAnalysis, CompassDirection, VastuSuggestion } from "@/types/vastu";

interface VastuAnalyzerProps {
  onAnalysisComplete?: (analysis: VastuAnalysis) => void;
  className?: string;
}

const roomTypes: { value: string; label: string; labelHi: string; icon: React.ReactNode }[] = [
  { value: "bedroom", label: "Bedroom", labelHi: "शयनकक्ष", icon: <Moon className="w-4 h-4" /> },
  { value: "living", label: "Living Room", labelHi: "बैठक", icon: <Users className="w-4 h-4" /> },
  { value: "kitchen", label: "Kitchen", labelHi: "रसोई", icon: <Flame className="w-4 h-4" /> },
  { value: "bathroom", label: "Bathroom", labelHi: "स्नानघर", icon: <Droplets className="w-4 h-4" /> },
  { value: "dining", label: "Dining Room", labelHi: "भोजन कक्ष", icon: <Home className="w-4 h-4" /> },
  { value: "office", label: "Office", labelHi: "कार्यालय", icon: <Home className="w-4 h-4" /> },
  { value: "puja", label: "Puja Room", labelHi: "पूजा कक्ष", icon: <Compass className="w-4 h-4" /> },
  { value: "entrance", label: "Entrance", labelHi: "प्रवेश द्वार", icon: <Home className="w-4 h-4" /> },
];

const directions: { value: CompassDirection; label: string; labelHi: string }[] = [
  { value: "NORTH", label: "North", labelHi: "उत्तर" },
  { value: "NORTHEAST", label: "Northeast", labelHi: "ईशान" },
  { value: "EAST", label: "East", labelHi: "पूर्व" },
  { value: "SOUTHEAST", label: "Southeast", labelHi: "आग्नेय" },
  { value: "SOUTH", label: "South", labelHi: "दक्षिण" },
  { value: "SOUTHWEST", label: "Southwest", labelHi: "नैऋत्य" },
  { value: "WEST", label: "West", labelHi: "पश्चिम" },
  { value: "NORTHWEST", label: "Northwest", labelHi: "वायव्य" },
];

const suggestionIcons: Record<string, React.ReactNode> = {
  'relocate': <ArrowRight className="w-4 h-4" />,
  'reorient': <Compass className="w-4 h-4" />,
  'add': <Plus className="w-4 h-4" />,
  'remove': <Minus className="w-4 h-4" />,
  'replace': <RefreshCw className="w-4 h-4" />,
  'color-change': <Palette className="w-4 h-4" />,
  'material-change': <Layers className="w-4 h-4" />,
  'remedy': <Shield className="w-4 h-4" />,
};

export function VastuAnalyzer({ onAnalysisComplete, className }: VastuAnalyzerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<string>("bedroom");
  const [facingDirection, setFacingDirection] = useState<CompassDirection>("NORTH");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const {
    analysis,
    isAnalyzing,
    error,
    analyze,
  } = useVastu({
    imageUrl,
    roomType,
    projectId: "standalone-analyzer",
    direction: facingDirection,
    language: 'en',
  });

  useEffect(() => {
    if (analysis) onAnalysisComplete?.(analysis);
  }, [analysis, onAnalysisComplete]);

  const handleImageUpload = useCallback((url: string) => {
    setImageUrl(url);
  }, []);

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    await analyze();
    setIsPanelOpen(true);
  };

  const handleViewDetails = () => {
    setIsPanelOpen(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Vastu Analyzer</CardTitle>
              <CardDescription>
                Upload your room photo for instant Vastu analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Room Photo</Label>
            <ImageUploader
              onUpload={handleImageUpload}
              currentImage={imageUrl}
              className="h-48"
            />
          </div>

          {/* Room Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={roomType} onValueChange={(v) => setRoomType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((room) => (
                    <SelectItem key={room.value} value={room.value}>
                      <div className="flex items-center gap-2">
                        {room.icon}
                        <span>{room.label}</span>
                        <span className="ml-2 text-muted-foreground text-xs">
                          ({room.labelHi})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Facing Direction</Label>
              <Select value={facingDirection} onValueChange={(v) => setFacingDirection(v as CompassDirection)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  {directions.map((dir) => (
                    <SelectItem key={dir.value} value={dir.value}>
                      <span>{dir.label}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        ({dir.labelHi})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </motion.div>
          )}

          {/* Analysis Result Preview */}
          {analysis && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-muted/50 border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vastu Score</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-3xl font-bold",
                      getScoreColor(analysis.overallScore.value)
                    )}>
                      {analysis.overallScore.value}
                    </span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  analysis.overallScore.grade === "excellent" && "bg-green-500/20 text-green-600",
                  analysis.overallScore.grade === "good" && "bg-green-400/20 text-green-500",
                  analysis.overallScore.grade === "average" && "bg-yellow-500/20 text-yellow-600",
                  analysis.overallScore.grade === "poor" && "bg-orange-500/20 text-orange-600",
                  analysis.overallScore.grade === "critical" && "bg-red-500/20 text-red-600",
                )}>
                  {analysis.overallScore.grade.toUpperCase()}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 rounded-lg bg-red-500/10">
                  <span className="text-lg font-medium text-red-500">
                    {analysis.ruleEvaluations.filter((r: { status: string }) => r.status === "failed").length}
                  </span>
                  <p className="text-xs text-muted-foreground">Violations</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                  <span className="text-lg font-medium text-yellow-500">
                    {analysis.suggestions.length}
                  </span>
                  <p className="text-xs text-muted-foreground">Suggestions</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-500/10">
                  <span className="text-lg font-medium text-green-500">
                    {analysis.detectedElements.filter((e: { vastuCompliance: string }) => e.vastuCompliance === "compliant").length}
                  </span>
                  <p className="text-xs text-muted-foreground">Compliant</p>
                </div>
              </div>

              <Button
                onClick={handleViewDetails}
                variant="outline"
                className="w-full mt-4"
              >
                View Full Analysis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!imageUrl || isAnalyzing}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Vastu...
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 mr-2" />
                Analyze Vastu
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Full Analysis Panel */}
      <VastuPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        imageUrl={imageUrl}
        roomType={roomType}
        projectId="standalone-analyzer"
        analysis={analysis}
        isLoading={isAnalyzing}
        error={error}
      />
    </>
  );
}