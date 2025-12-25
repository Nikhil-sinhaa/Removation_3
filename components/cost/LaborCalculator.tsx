"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  IndianRupee,
  DollarSign,
  Calendar,
  Hammer,
  Paintbrush,
  Wrench,
  Zap,
  Droplet,
  Truck,
  Shield,
  Star,
  TrendingUp,
  Info,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { MaterialGrade, LaborCost, LaborType, LaborQuality } from "@/types/cost";

interface LaborCalculatorProps {
  city: string;
  roomType: string;
  area: number;
  materialGrade: MaterialGrade;
  laborQuality: LaborQuality;
  currency: "INR" | "USD";
  onLaborCostChange: (cost: LaborCost) => void;
  className?: string;
}

interface LaborCategory {
  id: LaborType;
  name: string;
  icon: React.ReactNode;
  description: string;
  ratePerSqft: Record<MaterialGrade, number>;
  daysPerSqft: number;
  isRequired: boolean;
}

const LABOR_CATEGORIES: LaborCategory[] = [
  {
    id: "carpenter",
    name: "Carpentry & Woodwork",
    icon: <Hammer className="h-4 w-4" />,
    description: "Furniture, cabinets, doors, windows",
    ratePerSqft: { budget: 150, standard: 250, premium: 400, luxury: 600 },
    daysPerSqft: 0.15,
    isRequired: true,
  },
  {
    id: "painter",
    name: "Painting & Finishing",
    icon: <Paintbrush className="h-4 w-4" />,
    description: "Walls, ceilings, woodwork",
    ratePerSqft: { budget: 25, standard: 40, premium: 75, luxury: 120 },
    daysPerSqft: 0.05,
    isRequired: true,
  },
  {
    id: "electrician",
    name: "Electrical Work",
    icon: <Zap className="h-4 w-4" />,
    description: "Wiring, switches, lighting fixtures",
    ratePerSqft: { budget: 50, standard: 85, premium: 150, luxury: 220 },
    daysPerSqft: 0.08,
    isRequired: true,
  },
  {
    id: "plumber",
    name: "Plumbing",
    icon: <Droplet className="h-4 w-4" />,
    description: "Pipes, fittings, fixtures",
    ratePerSqft: { budget: 45, standard: 75, premium: 125, luxury: 180 },
    daysPerSqft: 0.06,
    isRequired: false,
  },
  {
    id: "flooring",
    name: "Flooring Installation",
    icon: <Wrench className="h-4 w-4" />,
    description: "Tiles, marble, wood flooring",
    ratePerSqft: { budget: 35, standard: 60, premium: 100, luxury: 150 },
    daysPerSqft: 0.04,
    isRequired: true,
  },
  {
    id: "falseCeiling",
    name: "False Ceiling",
    icon: <Wrench className="h-4 w-4" />,
    description: "Gypsum, POP, wooden ceiling",
    ratePerSqft: { budget: 75, standard: 110, premium: 175, luxury: 250 },
    daysPerSqft: 0.07,
    isRequired: false,
  },
  {
    id: "civilWork",
    name: "Civil Work",
    icon: <Wrench className="h-4 w-4" />,
    description: "Masonry, demolition, construction",
    ratePerSqft: { budget: 100, standard: 150, premium: 250, luxury: 350 },
    daysPerSqft: 0.1,
    isRequired: false,
  },
  {
    id: "supervisor",
    name: "Site Supervision",
    icon: <Users className="h-4 w-4" />,
    description: "Project management, quality control",
    ratePerSqft: { budget: 20, standard: 35, premium: 60, luxury: 90 },
    daysPerSqft: 0.01,
    isRequired: true,
  },
];

export function LaborCalculator({
  city,
  roomType,
  area,
  materialGrade,
  laborQuality,
  currency,
  onLaborCostChange,
  className,
}: LaborCalculatorProps) {
  const [selectedLabor, setSelectedLabor] = useState<LaborType[]>(
    LABOR_CATEGORIES.filter((l) => l.isRequired).map((l) => l.id)
  );
  const [customMultipliers, setCustomMultipliers] = useState<Record<LaborType, number>>({} as any);
  const [includeContingency, setIncludeContingency] = useState(true);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [workersCount, setWorkersCount] = useState(4);
  const [workHoursPerDay, setWorkHoursPerDay] = useState(8);

  // City-based rate multiplier
  const cityMultiplier = useMemo(() => {
    const multipliers: Record<string, number> = {
      mumbai: 1.4,
      delhi: 1.3,
      bangalore: 1.35,
      hyderabad: 1.2,
      chennai: 1.15,
      kolkata: 1.1,
      pune: 1.25,
      ahmedabad: 1.1,
      jaipur: 1.0,
      lucknow: 0.95,
      other: 1.0,
    };
    return multipliers[city] || 1.0;
  }, [city]);

  // Quality multiplier
  const qualityMultiplier = useMemo(() => {
    const multipliers: Record<LaborQuality, number> = {
      standard: 1.0,
      premium: 1.3,
      luxury: 1.6,
    };
    return multipliers[laborQuality];
  }, [laborQuality]);

  // USD conversion rate
  const usdRate = 83;

  // Calculate labor costs
  const laborCosts = useMemo(() => {
    return selectedLabor.map((laborId) => {
      const category = LABOR_CATEGORIES.find((l) => l.id === laborId)!;
      const baseRate = category.ratePerSqft[materialGrade] || category.ratePerSqft.standard;
      const customMultiplier = customMultipliers[laborId] || 1;
      
      const ratePerSqft = baseRate * cityMultiplier * qualityMultiplier * customMultiplier;
      const totalCost = ratePerSqft * area;
      const days = Math.ceil(category.daysPerSqft * area);
      const workers = Math.ceil(days / 10); // Rough estimate

      return {
        id: laborId,
        name: category.name,
        description: category.description,
        ratePerSqft: currency === "INR" ? ratePerSqft : ratePerSqft / usdRate,
        totalCost: currency === "INR" ? totalCost : totalCost / usdRate,
        estimatedDays: days,
        estimatedWorkers: workers,
        isRequired: category.isRequired,
      };
    });
  }, [selectedLabor, materialGrade, cityMultiplier, qualityMultiplier, customMultipliers, area, currency]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = laborCosts.reduce((sum, l) => sum + l.totalCost, 0);
    const contingency = includeContingency ? subtotal * (contingencyPercent / 100) : 0;
    const total = subtotal + contingency;
    const totalDays = Math.max(...laborCosts.map((l) => l.estimatedDays), 1);
    const avgRate = subtotal / area;

    return {
      subtotal,
      contingency,
      total,
      totalDays,
      avgRate,
    };
  }, [laborCosts, includeContingency, contingencyPercent, area]);

  // Notify parent of changes
  useEffect(() => {
    onLaborCostChange({
      breakdown: laborCosts,
      subtotal: totals.subtotal,
      contingency: totals.contingency,
      total: totals.total,
      estimatedDays: totals.totalDays,
      currency,
    });
  }, [laborCosts, totals, currency, onLaborCostChange]);

  const formatCurrency = (amount: number) => {
    if (currency === "INR") {
      return `₹${Math.round(amount).toLocaleString("en-IN")}`;
    }
    return `$${Math.round(amount).toLocaleString("en-US")}`;
  };

  const toggleLabor = (laborId: LaborType) => {
    const category = LABOR_CATEGORIES.find((l) => l.id === laborId);
    if (category?.isRequired) return; // Can't toggle required

    setSelectedLabor((prev) =>
      prev.includes(laborId)
        ? prev.filter((id) => id !== laborId)
        : [...prev, laborId]
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-orange-600" />
            <span className="text-xs text-muted-foreground">Total Labor Cost</span>
          </div>
          <div className="text-xl font-bold text-orange-600">
            {formatCurrency(totals.total)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatCurrency(totals.avgRate)}/sq.ft
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-muted-foreground">Est. Duration</span>
          </div>
          <div className="text-xl font-bold text-blue-600">
            {totals.totalDays} days
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            ~{Math.ceil(totals.totalDays / 7)} weeks
          </div>
        </div>
      </div>

      {/* Quality Selection */}
      <div className="p-3 rounded-lg border bg-muted/30">
        <Label className="text-sm font-medium mb-2 block">Labor Quality</Label>
        <RadioGroup
          value={laborQuality}
          className="grid grid-cols-3 gap-2"
        >
          {(["standard", "premium", "luxury"] as LaborQuality[]).map((quality) => (
            <div
              key={quality}
              className={cn(
                "flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all",
                laborQuality === quality
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              )}
            >
              <RadioGroupItem value={quality} id={quality} />
              <Label htmlFor={quality} className="cursor-pointer capitalize text-sm">
                {quality}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <p className="text-xs text-muted-foreground mt-2">
          {laborQuality === "standard" && "Verified professionals, good finish quality"}
          {laborQuality === "premium" && "Experienced contractors, high-quality finish"}
          {laborQuality === "luxury" && "Top-rated experts, luxury finish quality"}
        </p>
      </div>

      <Separator />

      {/* Labor Categories */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Labor Categories</Label>
        <Accordion type="multiple" className="space-y-2">
          {LABOR_CATEGORIES.map((category) => {
            const isSelected = selectedLabor.includes(category.id);
            const costData = laborCosts.find((l) => l.id === category.id);

            return (
              <AccordionItem
                key={category.id}
                value={category.id}
                className={cn(
                  "rounded-lg border overflow-hidden",
                  isSelected && "border-primary/50"
                )}
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{category.name}</span>
                        {category.isRequired && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isSelected && costData && (
                      <div className="text-right">
                        <div className="font-semibold text-sm">
                          {formatCurrency(costData.totalCost)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {costData.estimatedDays} days
                        </div>
                      </div>
                    )}
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => toggleLabor(category.id)}
                      disabled={category.isRequired}
                    />
                  </div>
                </div>

                {isSelected && (
                  <AccordionContent className="p-3 pt-0">
                    <AccordionTrigger className="py-0 hover:no-underline">
                      <span className="text-xs text-primary">Adjust rate</span>
                    </AccordionTrigger>
                    <div className="pt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Rate per sq.ft
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(costData?.ratePerSqft || 0)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Rate Multiplier</span>
                          <span>{(customMultipliers[category.id] || 1).toFixed(1)}x</span>
                        </div>
                        <Slider
                          value={[customMultipliers[category.id] || 1]}
                          min={0.5}
                          max={2}
                          step={0.1}
                          onValueChange={([value]) =>
                            setCustomMultipliers((prev) => ({
                              ...prev,
                              [category.id]: value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted">
                          <span className="text-muted-foreground">Workers:</span>{" "}
                          <span className="font-medium">{costData?.estimatedWorkers}</span>
                        </div>
                        <div className="p-2 rounded bg-muted">
                          <span className="text-muted-foreground">Days:</span>{" "}
                          <span className="font-medium">{costData?.estimatedDays}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <Separator />

      {/* Contingency */}
      <div className="p-3 rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Contingency Buffer</span>
              <p className="text-xs text-muted-foreground">
                For unexpected costs
              </p>
            </div>
          </div>
          <Switch
            checked={includeContingency}
            onCheckedChange={setIncludeContingency}
          />
        </div>
        {includeContingency && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Contingency: {contingencyPercent}%</span>
              <span className="font-medium">{formatCurrency(totals.contingency)}</span>
            </div>
            <Slider
              value={[contingencyPercent]}
              min={5}
              max={25}
              step={1}
              onValueChange={([value]) => setContingencyPercent(value)}
            />
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {includeContingency && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Contingency ({contingencyPercent}%)</span>
              <span>{formatCurrency(totals.contingency)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total Labor Cost</span>
            <span className="text-primary">{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <p>💡 Labor rates vary by city. {city.charAt(0).toUpperCase() + city.slice(1)} has a {((cityMultiplier - 1) * 100).toFixed(0)}% {cityMultiplier > 1 ? 'premium' : 'discount'} compared to average rates.</p>
            <p>⏱️ Hiring more workers can speed up work but may increase coordination costs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LaborCalculator;