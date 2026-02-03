"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  MapPin,
  Palette,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2,
  BarChart3
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { CurrencyType } from "@/types/cost";
import { RENOVATION_COST_PER_SQFT, CITY_LABOR_MULTIPLIERS } from "@/constants/pricing-2025-india";

/* ----------------------------------------
   CITY DATA
----------------------------------------- */
const CITY_LIST = [
  // Metro Cities
  { id: 'mumbai', name: 'Mumbai', nameHi: 'मुंबई', tier: 'metro' as const },
  { id: 'delhi', name: 'Delhi', nameHi: 'दिल्ली', tier: 'metro' as const },
  { id: 'bangalore', name: 'Bangalore', nameHi: 'बैंगलोर', tier: 'metro' as const },
  { id: 'hyderabad', name: 'Hyderabad', nameHi: 'हैदराबाद', tier: 'metro' as const },
  { id: 'chennai', name: 'Chennai', nameHi: 'चेन्नई', tier: 'metro' as const },
  { id: 'kolkata', name: 'Kolkata', nameHi: 'कोलकाता', tier: 'metro' as const },
  { id: 'pune', name: 'Pune', nameHi: 'पुणे', tier: 'metro' as const },
  { id: 'ahmedabad', name: 'Ahmedabad', nameHi: 'अहमदाबाद', tier: 'metro' as const },

  // Tier 1 Cities
  { id: 'jaipur', name: 'Jaipur', nameHi: 'जयपुर', tier: 'tier1' as const },
  { id: 'lucknow', name: 'Lucknow', nameHi: 'लखनऊ', tier: 'tier1' as const },
  { id: 'chandigarh', name: 'Chandigarh', nameHi: 'चंडीगढ़', tier: 'tier1' as const },
  { id: 'indore', name: 'Indore', nameHi: 'इंदौर', tier: 'tier1' as const },
  { id: 'bhopal', name: 'Bhopal', nameHi: 'भोपाल', tier: 'tier1' as const },
  { id: 'coimbatore', name: 'Coimbatore', nameHi: 'कोयंबटूर', tier: 'tier1' as const },
  { id: 'kochi', name: 'Kochi', nameHi: 'कोच्चि', tier: 'tier1' as const },
  { id: 'vadodara', name: 'Vadodara', nameHi: 'वडोदरा', tier: 'tier1' as const },

  // Tier 2 Cities
  { id: 'nagpur', name: 'Nagpur', nameHi: 'नागपुर', tier: 'tier2' as const },
  { id: 'visakhapatnam', name: 'Visakhapatnam', nameHi: 'विशाखापट्टनम', tier: 'tier2' as const },
  { id: 'patna', name: 'Patna', nameHi: 'पटना', tier: 'tier2' as const },
  { id: 'ludhiana', name: 'Ludhiana', nameHi: 'लुधियाना', tier: 'tier2' as const },
  { id: 'agra', name: 'Agra', nameHi: 'आगरा', tier: 'tier2' as const },
  { id: 'nashik', name: 'Nashik', nameHi: 'नासिक', tier: 'tier2' as const },
  { id: 'vijayawada', name: 'Vijayawada', nameHi: 'विजयवाड़ा', tier: 'tier2' as const },
  { id: 'raipur', name: 'Raipur', nameHi: 'रायपुर', tier: 'tier2' as const },

  // Tier 3 Cities
  { id: 'dehradun', name: 'Dehradun', nameHi: 'देहरादून', tier: 'tier3' as const },
  { id: 'mysore', name: 'Mysore', nameHi: 'मैसूर', tier: 'tier3' as const },
  { id: 'amritsar', name: 'Amritsar', nameHi: 'अमृतसर', tier: 'tier3' as const },
  { id: 'jodhpur', name: 'Jodhpur', nameHi: 'जोधपुर', tier: 'tier3' as const },
  { id: 'udaipur', name: 'Udaipur', nameHi: 'उदयपुर', tier: 'tier3' as const },
  { id: 'shimla', name: 'Shimla', nameHi: 'शिमला', tier: 'tier3' as const },
  { id: 'guwahati', name: 'Guwahati', nameHi: 'गुवाहाटी', tier: 'tier3' as const },
  { id: 'itanagar', name: 'Itanagar', nameHi: 'ईटानगर', tier: 'tier3' as const }
];

/* ----------------------------------------
   TYPES
----------------------------------------- */
interface CostComparisonProps {
  costData: { grandTotal: number;[key: string]: any };
  currentCity: string;
  roomType: string;
  style: string;
  areaInSqFt: number;
  currency: CurrencyType;
  onCityChange?: (city: string) => void;
  className?: string;
}

interface ComparisonCity {
  id: string;
  name: string;
  nameHi: string;
  estimatedCost: number;
  pricePerSqFt: number;
  difference: number;
  differencePercent: number;
  tier: "metro" | "tier1" | "tier2" | "tier3";
}

/* ----------------------------------------
   HELPER FUNCTIONS
----------------------------------------- */
const getCityMultiplier = (cityId: string): number => {
  return CITY_LABOR_MULTIPLIERS[cityId as keyof typeof CITY_LABOR_MULTIPLIERS] ||
    CITY_LABOR_MULTIPLIERS.default || 1.0;
};

const getRoomTypeKey = (roomType: string): keyof typeof RENOVATION_COST_PER_SQFT => {
  const normalized = roomType.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
  const validKeys = Object.keys(RENOVATION_COST_PER_SQFT) as Array<keyof typeof RENOVATION_COST_PER_SQFT>;

  // Try to find exact match
  if (validKeys.includes(normalized as any)) {
    return normalized as keyof typeof RENOVATION_COST_PER_SQFT;
  }

  // Try to find partial match
  for (const key of validKeys) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return key;
    }
  }

  // Default to living room
  return 'living_room';
};

/* ----------------------------------------
   COMPONENT
----------------------------------------- */
const CostComparison: React.FC<CostComparisonProps> = ({
  costData,
  currentCity,
  roomType,
  style,
  areaInSqFt,
  currency,
  onCityChange,
  className = ""
}) => {
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [selectedCompareCity, setSelectedCompareCity] = useState<string>("");
  const [showAllCities, setShowAllCities] = useState(false);

  useEffect(() => {
    if (navigator.language.startsWith("hi")) {
      setLanguage("hi");
    }
  }, []);

  const t = (en: string, hi: string) => (language === "hi" ? hi : en);

  const formatCurrency = (amount: number) => {
    if (currency === "INR") {
      if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
      }
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`;
      }
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get base cost for current city and room type
  const getBaseCostForCity = (cityId: string, quality: 'standard' = 'standard') => {
    const roomKey = getRoomTypeKey(roomType);
    const cityMultiplier = getCityMultiplier(cityId);

    // Get base cost from RENOVATION_COST_PER_SQFT
    const roomCosts = RENOVATION_COST_PER_SQFT[roomKey];
    if (!roomCosts) {
      // Default cost if room type not found
      return 1500 * areaInSqFt * cityMultiplier;
    }

    const costRange = roomCosts[quality];
    const avgCost = (costRange.min + costRange.max) / 2;
    return avgCost * areaInSqFt * cityMultiplier;
  };

  // Calculate comparison data for all cities
  const comparisonData = useMemo<ComparisonCity[]>(() => {
    const currentCityCost = costData.grandTotal;

    return CITY_LIST
      .filter(city => city.id !== currentCity)
      .map(city => {
        const estimatedCost = getBaseCostForCity(city.id, 'standard');
        const pricePerSqFt = estimatedCost / areaInSqFt;
        const difference = estimatedCost - currentCityCost;
        const differencePercent = (difference / currentCityCost) * 100;

        return {
          id: city.id,
          name: city.name,
          nameHi: city.nameHi,
          estimatedCost,
          pricePerSqFt,
          difference,
          differencePercent,
          tier: city.tier
        };
      })
      .sort((a, b) => a.estimatedCost - b.estimatedCost);
  }, [costData.grandTotal, currentCity, areaInSqFt, roomType]);

  // Get cheapest and most expensive
  const cheapestCity = comparisonData[0];
  const expensiveCity = comparisonData[comparisonData.length - 1];
  const currentCityData = CITY_LIST.find(c => c.id === currentCity);

  // Get national average
  const nationalAverage = useMemo(() => {
    const allCityCosts = CITY_LIST.map(city => getBaseCostForCity(city.id, 'standard'));
    const total = allCityCosts.reduce((sum, cost) => sum + cost, 0);
    return total / allCityCosts.length;
  }, [areaInSqFt, roomType]);

  // Calculate percentile rank
  const percentileRank = useMemo(() => {
    const allCosts = comparisonData.map(c => c.estimatedCost);
    allCosts.push(costData.grandTotal);
    allCosts.sort((a, b) => a - b);
    const rank = allCosts.indexOf(costData.grandTotal);
    return Math.round((rank / allCosts.length) * 100);
  }, [comparisonData, costData.grandTotal]);

  // Style comparison
  const styleComparison = useMemo(() => {
    const styleMultipliers: Record<string, number> = {
      "minimalist": 0.85,
      "scandinavian": 0.90,
      "modern": 1.00,
      "contemporary": 1.05,
      "traditional": 1.10,
      "luxury": 1.35,
      "industrial": 0.95,
      "bohemian": 0.88,
      "coastal": 0.92,
      "farmhouse": 0.95
    };

    const currentStyleMultiplier = styleMultipliers[style.toLowerCase()] || 1;

    return Object.entries(styleMultipliers)
      .filter(([s]) => s.toLowerCase() !== style.toLowerCase())
      .map(([styleName, multiplier]) => ({
        name: styleName.charAt(0).toUpperCase() + styleName.slice(1),
        cost: costData.grandTotal * (multiplier / currentStyleMultiplier),
        difference: costData.grandTotal * (multiplier / currentStyleMultiplier) - costData.grandTotal,
        differencePercent: ((multiplier / currentStyleMultiplier) - 1) * 100
      }))
      .sort((a, b) => a.cost - b.cost);
  }, [costData.grandTotal, style]);

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "metro": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "tier1": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "tier2": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "tier3": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const displayedCities = showAllCities ? comparisonData : comparisonData.slice(0, 5);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t("Cost Comparison", "लागत तुलना")}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  {t(
                    "Compare renovation costs across different cities and styles to find the best value for your budget.",
                    "अपने बजट के लिए सर्वोत्तम मूल्य खोजने के लिए विभिन्न शहरों और शैलियों में नवीनीकरण लागतों की तुलना करें।"
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Estimate Summary */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {currentCityData ? (language === "hi" ? currentCityData.nameHi : currentCityData.name) : currentCity}
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatCurrency(costData.grandTotal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(costData.grandTotal / areaInSqFt)}/{t("sq.ft", "वर्ग फुट")}
              </p>
            </div>
            <div className="text-right">
              {currentCityData && (
                <Badge className={getTierBadgeColor(currentCityData.tier)}>
                  {currentCityData.tier === "metro"
                    ? "Metro"
                    : currentCityData.tier.charAt(0).toUpperCase() + currentCityData.tier.slice(1)}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {t("Top", "शीर्ष")} {percentileRank}% {t("costliest", "महंगा")}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {/* Cheapest City */}
          {cheapestCity && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-green-500/5 rounded-lg border border-green-500/20"
            >
              <p className="text-xs text-muted-foreground mb-1">
                {t("Cheapest", "सबसे सस्ता")}
              </p>
              <p className="text-sm font-medium text-green-600">
                {language === "hi" ? cheapestCity.nameHi : cheapestCity.name}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">
                  {Math.abs(cheapestCity.differencePercent).toFixed(0)}% {t("less", "कम")}
                </span>
              </div>
            </motion.div>
          )}

          {/* National Average */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20"
          >
            <p className="text-xs text-muted-foreground mb-1">
              {t("National Avg", "राष्ट्रीय औसत")}
            </p>
            <p className="text-sm font-medium">
              {formatCurrency(nationalAverage)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {costData.grandTotal > nationalAverage ? (
                <>
                  <TrendingUp className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-600">
                    {(((costData.grandTotal - nationalAverage) / nationalAverage) * 100).toFixed(0)}% {t("above", "ऊपर")}
                  </span>
                </>
              ) : costData.grandTotal < nationalAverage ? (
                <>
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    {(((nationalAverage - costData.grandTotal) / nationalAverage) * 100).toFixed(0)}% {t("below", "नीचे")}
                  </span>
                </>
              ) : (
                <>
                  <Minus className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">
                    {t("Same", "समान")}
                  </span>
                </>
              )}
            </div>
          </motion.div>

          {/* Most Expensive City */}
          {expensiveCity && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20"
            >
              <p className="text-xs text-muted-foreground mb-1">
                {t("Costliest", "सबसे महंगा")}
              </p>
              <p className="text-sm font-medium text-amber-600">
                {language === "hi" ? expensiveCity.nameHi : expensiveCity.name}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-amber-500" />
                <span className="text-xs text-amber-600">
                  {expensiveCity.differencePercent.toFixed(0)}% {t("more", "अधिक")}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* City-wise Comparison */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {t("City Comparison", "शहर तुलना")}
            </p>
            <Select value={selectedCompareCity} onValueChange={setSelectedCompareCity}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder={t("Compare with...", "तुलना करें...")} />
              </SelectTrigger>
              <SelectContent>
                {CITY_LIST
                  .filter(c => c.id !== currentCity)
                  .map((city) => (
                    <SelectItem key={city.id} value={city.id} className="text-xs">
                      {language === "hi" ? city.nameHi : city.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected City Comparison Detail */}
          <AnimatePresence mode="wait">
            {selectedCompareCity && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {(() => {
                  const compareCity = comparisonData.find(
                    (c: ComparisonCity) => c.id === selectedCompareCity
                  );

                  if (!compareCity) return null;

                  return (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {language === "hi" ? compareCity.nameHi : compareCity.name}
                          </span>
                          <Badge className={getTierBadgeColor(compareCity.tier)} variant="outline">
                            {compareCity.tier === "metro" ? "Metro" : compareCity.tier.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold">
                          {formatCurrency(compareCity.estimatedCost)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("Price per sq.ft", "प्रति वर्ग फुट कीमत")}
                          </p>
                          <p className="text-sm font-medium">
                            {formatCurrency(compareCity.pricePerSqFt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("Difference", "अंतर")}
                          </p>
                          <p className={`text-sm font-medium ${compareCity.difference > 0 ? "text-red-500" : "text-green-500"
                            }`}>
                            {compareCity.difference > 0 ? "+" : ""}
                            {formatCurrency(compareCity.difference)}
                            <span className="text-xs ml-1">
                              ({compareCity.differencePercent > 0 ? "+" : ""}
                              {compareCity.differencePercent.toFixed(1)}%)
                            </span>
                          </p>
                        </div>
                      </div>

                      {onCityChange && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2 gap-2"
                          onClick={() => onCityChange(compareCity.id)}
                        >
                          <MapPin className="h-3 w-3" />
                          {t("Switch to", "बदलें")} {language === "hi" ? compareCity.nameHi : compareCity.name}
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* City List */}
          <div className="space-y-2">
            {displayedCities.map((city, index) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {language === "hi" ? city.nameHi : city.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${getTierBadgeColor(city.tier)}`}
                    >
                      {city.tier === "metro" ? "M" : city.tier.replace("tier", "T")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={Math.min((city.estimatedCost / (expensiveCity?.estimatedCost || 1)) * 100, 100)}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {formatCurrency(city.estimatedCost)}
                    </span>
                  </div>
                </div>
                <div className={`text-xs font-medium ${city.difference < 0 ? "text-green-500" : "text-red-500"
                  }`}>
                  {city.difference < 0 ? (
                    <TrendingDown className="h-3 w-3 inline mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                  )}
                  {Math.abs(city.differencePercent).toFixed(0)}%
                </div>
              </motion.div>
            ))}
          </div>

          {comparisonData.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowAllCities(!showAllCities)}
            >
              {showAllCities ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  {t("Show Less", "कम दिखाएं")}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  {t(`Show ${comparisonData.length - 5} More Cities`, `${comparisonData.length - 5} और शहर दिखाएं`)}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Style Comparison */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              {t("Style Comparison", "शैली तुलना")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {styleComparison.slice(0, 4).map((styleItem, index) => (
              <motion.div
                key={styleItem.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 bg-muted/30 rounded-lg"
              >
                <p className="text-xs text-muted-foreground">{styleItem.name}</p>
                <p className="text-sm font-medium">{formatCurrency(styleItem.cost)}</p>
                <p className={`text-xs ${styleItem.difference < 0 ? "text-green-500" : "text-red-500"
                  }`}>
                  {styleItem.difference > 0 ? "+" : ""}
                  {styleItem.differencePercent.toFixed(0)}%
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Savings Tip */}
        {cheapestCity && cheapestCity.difference < -50000 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <Sparkles className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {t("Savings Opportunity!", "बचत का अवसर!")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    `You could save up to ${formatCurrency(Math.abs(cheapestCity.difference))} by renovating in ${language === "hi" ? cheapestCity.nameHi : cheapestCity.name}.`,
                    `${language === "hi" ? cheapestCity.nameHi : cheapestCity.name} में नवीनीकरण करके आप ${formatCurrency(Math.abs(cheapestCity.difference))} तक बचा सकते हैं।`
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default CostComparison;