"use client";
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  DollarSign,
  Calculator,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Building2,
  Palette,
  Ruler,
  MapPin,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CostBreakdown } from "./CostBreakdown";
import { MaterialSelector } from "./MaterialSelector";
import { LaborCalculator } from "./LaborCalculator";
import { CitySelector } from "./CitySelector";
import { CurrencyToggle } from "./CurrencyToggle";
import CostChart from "./CostChart";
import CostComparison from "./CostComparison";
import CostExport from "./CostExport";

import {
  UIEstimateDisplay,
  UICostEstimate,
  CurrencyType,
  MaterialGrade,
  LaborQuality,
  CostLocation,
  LaborCost
} from "@/types/cost";

interface CostPanelProps {
  projectId?: string;
  roomType: string;
  styleType: string;
  imageUrl?: string;
  onCostCalculated?: (estimate: UIEstimateDisplay) => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  unit: "feet" | "meters";
  area: number;
}

interface UICostSettingsExtended {
  currency: CurrencyType;
  city: string;
  materialGrade: MaterialGrade;
  laborQuality: LaborQuality;
  urgency: 'low' | 'medium' | 'high';
  taxIncluded: boolean;
  includeLabor: boolean;
  includeFurniture: boolean;
  includeAppliances: boolean;
  includeFinishing: boolean;
  includeWasteRemoval: boolean;
  qualityTier: MaterialGrade;
  location: CostLocation;
}

const DEFAULT_SETTINGS: UICostSettingsExtended = {
  currency: "INR",
  city: "mumbai",
  materialGrade: "standard",
  laborQuality: "standard",
  urgency: "medium",
  taxIncluded: true,
  includeLabor: true,
  includeFurniture: true,
  includeAppliances: false,
  includeFinishing: true,
  includeWasteRemoval: true,
  qualityTier: "standard",
  location: {
    city: "mumbai",
    state: "MH",
    country: "India",
    tier: "tier1",
    laborMultiplier: 1.4,
    materialMultiplier: 1.3
  }
};

// Helper function to convert UIEstimateDisplay to UICostEstimate
const convertToUICostEstimate = (estimate: UIEstimateDisplay): UICostEstimate => {
  const subtotal = estimate.breakdown.materials.amount + estimate.breakdown.labor.amount + estimate.breakdown.other.amount;

  return {
    subtotal,
    discount: 0,
    tax: estimate.breakdown.tax.amount,
    total: estimate.totalCost,
    pricePerSqFt: Math.round(estimate.totalCost / (estimate.totalCost > 0 ? 1 : 1)),
    categories: [
      {
        id: 'materials',
        name: 'Materials',
        amount: estimate.breakdown.materials.amount,
        itemCount: 0,
        items: []
      },
      {
        id: 'labor',
        name: 'Labor',
        amount: estimate.breakdown.labor.amount,
        itemCount: 0,
        items: []
      },
      {
        id: 'other',
        name: 'Other',
        amount: estimate.breakdown.other.amount,
        itemCount: 0,
        items: []
      },
      {
        id: 'tax',
        name: 'Tax',
        amount: estimate.breakdown.tax.amount,
        itemCount: 0,
        items: []
      }
    ]
  };
};

export function CostPanel({
  projectId,
  roomType,
  styleType,
  imageUrl,
  onCostCalculated,
  className,
  isOpen = true,
  onClose,
}: CostPanelProps) {
  const [settings, setSettings] = useState<UICostSettingsExtended>(DEFAULT_SETTINGS);
  const [dimensions, setDimensions] = useState<RoomDimensions>({
    length: 10,
    width: 12,
    height: 10,
    unit: "feet",
    area: 120
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [estimate, setEstimate] = useState<UIEstimateDisplay | null>(null);
  const [laborCost, setLaborCost] = useState<LaborCost | null>(null);

  // Mock calculateCost function
  const calculateCost = useCallback(async () => {
    setIsCalculating(true);
    try {
      const area = dimensions.area;

      // Material multipliers based on grade
      const materialMultiplier = {
        budget: 0.7,
        standard: 1.0,
        premium: 1.5,
        luxury: 2.0
      }[settings.materialGrade];

      // Labor multipliers based on quality
      const laborMultiplier = {
        standard: 1.0,
        premium: 1.3,
        luxury: 1.6
      }[settings.laborQuality];

      // Urgency multipliers
      const urgencyMultiplier = {
        low: 1.0,
        medium: 1.3,
        high: 1.6
      }[settings.urgency];

      // Base cost per sq ft (INR)
      const baseCostPerSqFt: Record<MaterialGrade, number> = {
        budget: 800,
        standard: 1200,
        premium: 2000,
        luxury: 4000
      };

      const selectedTier = settings.qualityTier;
      const baseCost = baseCostPerSqFt[selectedTier] * area;

      // Apply multipliers
      const materialCost = baseCost * materialMultiplier;
      const laborCost = baseCost * 0.4 * laborMultiplier * urgencyMultiplier;
      const otherCost = baseCost * 0.2;

      // Location adjustment
      const cityMultiplier = settings.location?.laborMultiplier || 1.0;
      const adjustedLaborCost = laborCost * cityMultiplier;

      // Calculate totals
      const subtotal = materialCost + adjustedLaborCost + otherCost;
      const tax = settings.taxIncluded ? subtotal * 0.18 : 0;
      const totalCost = subtotal + tax;

      const mockEstimate: UIEstimateDisplay = {
        totalCost: Math.round(totalCost),
        breakdown: {
          materials: { amount: Math.round(materialCost) },
          labor: { amount: Math.round(adjustedLaborCost) },
          tax: { amount: Math.round(tax) },
          other: { amount: Math.round(otherCost) }
        },
        estimatedDuration: { totalDays: Math.ceil(area / 50) },
        trend: Math.random() > 0.5 ? 'up' : 'down',
        trendPercentage: Math.floor(Math.random() * 20) + 1
      };

      setEstimate(mockEstimate);
      if (onCostCalculated) {
        onCostCalculated(mockEstimate);
      }
      setLastUpdated(new Date());
      return mockEstimate;
    } catch (err) {
      console.error("Cost calculation error:", err);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [dimensions, settings, onCostCalculated]);

  // Calculate cost whenever inputs change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      calculateCost();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [dimensions, settings, roomType, styleType, calculateCost]);

  const handleDimensionChange = (key: keyof RoomDimensions, value: number | string) => {
    if (key === "unit") {
      setDimensions(prev => {
        const newUnit = value as "feet" | "meters";
        const conversionFactor = prev.unit === "feet" && newUnit === "meters" ? 0.3048 :
          prev.unit === "meters" && newUnit === "feet" ? 3.28084 : 1;

        return {
          ...prev,
          unit: newUnit,
          length: prev.length * conversionFactor,
          width: prev.width * conversionFactor,
          height: prev.height * conversionFactor,
          area: prev.area * (conversionFactor ** 2)
        };
      });
    } else {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      setDimensions(prev => {
        const newDimensions = { ...prev, [key]: numValue };
        if (key === "length" || key === "width") {
          newDimensions.area = newDimensions.length * newDimensions.width;
        }
        return newDimensions;
      });
    }
  };

  const handleSettingChange = (key: keyof UICostSettingsExtended, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const calculateArea = () => {
    const { length, width, unit } = dimensions;
    const area = length * width;
    if (unit === "meters") {
      return { sqft: area * 10.764, sqm: area };
    }
    return { sqft: area, sqm: area / 10.764 };
  };

  const area = calculateArea();

  const formatCurrency = (amount: number) => {
    if (settings.currency === "INR") {
      return `₹${Math.round(amount).toLocaleString("en-IN")}`;
    }
    return `$${Math.round(amount).toLocaleString("en-US")}`;
  };

  const panelContent = (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Renovation Cost</h2>
            <p className="text-xs text-muted-foreground">
              Real-time estimate • {roomType} • {styleType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CurrencyToggle
            value={settings.currency}
            onChange={(currency) => handleSettingChange("currency", currency)}
          />
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30">
        <div className="p-3 rounded-lg bg-background border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Estimated Cost</span>
            {isCalculating && (
              <RefreshCw className="h-3 w-3 animate-spin text-primary" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            {settings.currency === "INR" ? (
              <IndianRupee className="h-4 w-4 text-green-600" />
            ) : (
              <DollarSign className="h-4 w-4 text-green-600" />
            )}
            <span className="text-2xl font-bold text-green-600">
              {estimate ? formatCurrency(estimate.totalCost).replace(/[₹$]/g, "") : "---"}
            </span>
          </div>
          {estimate && (
            <div className="flex items-center gap-1 mt-1">
              {estimate.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              <span className={cn(
                "text-xs",
                estimate.trend === "up" ? "text-red-500" : "text-green-500"
              )}>
                {estimate.trendPercentage}% vs market avg
              </span>
            </div>
          )}
        </div>

        <div className="p-3 rounded-lg bg-background border">
          <span className="text-xs text-muted-foreground">Area</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">
              {area.sqft.toFixed(0)}
            </span>
            <span className="text-xs text-muted-foreground">sq.ft</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {area.sqm.toFixed(1)} sq.m
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4 mx-4 mt-2">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="materials" className="text-xs">Materials</TabsTrigger>
            <TabsTrigger value="labor" className="text-xs">Labor</TabsTrigger>
            <TabsTrigger value="compare" className="text-xs">Compare</TabsTrigger>
          </TabsList>

          <div className="px-4 py-3">
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Dimensions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Room Dimensions
                  </Label>
                  <select
                    value={dimensions.unit}
                    onChange={(e) => handleDimensionChange("unit", e.target.value)}
                    className="text-xs px-2 py-1 rounded border bg-background"
                  >
                    <option value="feet">Feet</option>
                    <option value="meters">Meters</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Length</Label>
                    <Input
                      type="number"
                      value={dimensions.length}
                      onChange={(e) => handleDimensionChange("length", parseFloat(e.target.value))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Width</Label>
                    <Input
                      type="number"
                      value={dimensions.width}
                      onChange={(e) => handleDimensionChange("width", parseFloat(e.target.value))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Height</Label>
                    <Input
                      type="number"
                      value={dimensions.height}
                      onChange={(e) => handleDimensionChange("height", parseFloat(e.target.value))}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* City Selection */}
              <CitySelector
                value={settings.location.city}
                onChange={(city) => handleSettingChange("city", city)}
                currency={settings.currency}
              />

              <Separator />

              {/* Material Grade */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Material Grade
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["budget", "standard", "premium"] as MaterialGrade[]).map((grade) => (
                    <button
                      key={grade}
                      onClick={() => handleSettingChange("materialGrade", grade)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        settings.materialGrade === grade
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                    >
                      <div className="text-sm font-medium capitalize">{grade}</div>
                      <div className="text-xs text-muted-foreground">
                        {grade === "budget" && "₹800-1,200/sqft"}
                        {grade === "standard" && "₹1,200-2,000/sqft"}
                        {grade === "premium" && "₹2,000-4,000/sqft"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Inclusions */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Include in Estimate
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "includeFurniture", label: "Furniture" },
                    { key: "includeLabor", label: "Labor" },
                    { key: "includeAppliances", label: "Appliances" },
                    { key: "includeFinishing", label: "Finishing" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <span className="text-sm">{label}</span>
                      <Switch
                        checked={settings[key as keyof UICostSettingsExtended] as boolean}
                        onCheckedChange={(checked) => handleSettingChange(key as keyof UICostSettingsExtended, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">Advanced Settings</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Labor Quality */}
                    <div className="space-y-2">
                      <Label className="text-sm">Labor Quality</Label>
                      <select
                        value={settings.laborQuality}
                        onChange={(e) => handleSettingChange("laborQuality", e.target.value as LaborQuality)}
                        className="w-full p-2 rounded-lg border bg-background"
                      >
                        <option value="standard">Standard (Verified professionals)</option>
                        <option value="premium">Premium (Experienced contractors)</option>
                        <option value="luxury">Luxury (Top-rated experts)</option>
                      </select>
                    </div>

                    {/* Urgency */}
                    <div className="space-y-2">
                      <Label className="text-sm">Timeline</Label>
                      <select
                        value={settings.urgency}
                        onChange={(e) => handleSettingChange("urgency", e.target.value as 'low' | 'medium' | 'high')}
                        className="w-full p-2 rounded-lg border bg-background"
                      >
                        <option value="low">Flexible (Best price)</option>
                        <option value="medium">Normal (4-8 weeks)</option>
                        <option value="high">Urgent (+20% premium)</option>
                      </select>
                    </div>

                    {/* GST */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="text-sm font-medium">Include GST</span>
                        <p className="text-xs text-muted-foreground">
                          18% Goods & Services Tax
                        </p>
                      </div>
                      <Switch
                        checked={settings.taxIncluded}
                        onCheckedChange={(checked) => handleSettingChange("taxIncluded", checked)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Separator />

              {/* Cost Breakdown - Provide all required props */}
              {estimate && (
                <CostBreakdown
                  estimate={convertToUICostEstimate(estimate)}
                  currency={settings.currency}
                  isLoading={isCalculating}
                  formatCurrency={formatCurrency}
                  includeGST={settings.taxIncluded}
                  onToggleGST={(include) => handleSettingChange("taxIncluded", include)}
                />
              )}
            </TabsContent>

            <TabsContent value="materials" className="mt-0">
              <MaterialSelector
                roomType={roomType}
                styleType={styleType}
                grade={settings.materialGrade}
                currency={settings.currency}
                onMaterialsChange={(materials: any[]) => {
                  console.log('Selected materials:', materials);
                  // Handle material selection
                }}
              />
            </TabsContent>

            <TabsContent value="labor" className="mt-0">
              <LaborCalculator
                city={settings.location.city}
                roomType={roomType}
                area={area.sqft}
                materialGrade={settings.materialGrade}
                laborQuality={settings.laborQuality}
                currency={settings.currency}
                onLaborCostChange={(cost: LaborCost) => {
                  console.log('Labor cost:', cost);
                  setLaborCost(cost);
                }}
              />
            </TabsContent>

            <TabsContent value="compare" className="mt-0">
              {estimate && (
                <CostComparison
                  costData={{
                    currency: settings.currency,
                    materials: [],
                    materialTotal: estimate.breakdown.materials.amount,
                    laborTotal: estimate.breakdown.labor.amount,
                    tax: estimate.breakdown.tax.amount,
                    grandTotal: estimate.totalCost,
                    estimatedDays: estimate.estimatedDuration.totalDays,
                  }}
                  currentCity={settings.city}
                  roomType={roomType}
                  areaInSqFt={area.sqft}
                  currency={settings.currency}
                  style={styleType}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-background space-y-3">
        {/* Chart Preview */}
        {estimate && (
          <CostChart
            data={estimate.breakdown}
            currency={settings.currency}
            compact={true}
          />
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => calculateCost()}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            Recalculate
          </Button>
          {estimate && (
            <CostExport
              costData={{
                currency: settings.currency,
                materials: [],
                materialTotal: estimate.breakdown.materials.amount,
                laborTotal: estimate.breakdown.labor.amount,
                tax: estimate.breakdown.tax.amount,
                grandTotal: estimate.totalCost,
                estimatedDays: estimate.estimatedDuration.totalDays,
              }}
              projectName={projectId ? `Project ${projectId}` : "Renovation Project"}
              roomType={roomType}
              style={styleType}
              currency={settings.currency}
            />
          )}
        </div>

        {lastUpdated && (
          <p className="text-xs text-center text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden">
        {panelContent}
      </SheetContent>
    </Sheet>
  );
}

export default CostPanel;