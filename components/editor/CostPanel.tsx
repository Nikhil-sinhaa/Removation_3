"use client";

import React, { useState, useEffect } from "react";
import {
    IndianRupee,
    Calculator,
    Info,
    DollarSign,
    TrendingUp,
    Package,
    Hammer,
    Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { calculateRenovationCost } from "@/lib/cost-engine";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CostPanelProps {
    roomType: string;
    className?: string;
    currency?: 'INR' | 'USD';
}

export function CostPanel({ roomType, className, currency = 'INR' }: CostPanelProps) {
    const [area, setArea] = useState(150);
    const [quality, setQuality] = useState<'basic' | 'standard' | 'premium' | 'luxury'>('standard');
    const [city, setCity] = useState("Mumbai");
    const [includeLabor, setIncludeLabor] = useState(true);
    const [includeTax, setIncludeTax] = useState(true);

    const [estimate, setEstimate] = useState<any>(null);

    useEffect(() => {
        const result = calculateRenovationCost({
            roomType,
            areaInSqft: area,
            city: city.toLowerCase(),
            renovationType: quality,
            includeLabor,
            includeTax
        });
        setEstimate(result);
    }, [roomType, area, quality, city, includeLabor, includeTax]);

    const formatCurrency = (amount: number) => {
        if (currency === 'INR') {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(amount);
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount / 83); // Simple conversion
    };

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            <div className="p-4 space-y-4 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-green-500" />
                        Cost Estimator
                    </h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                        {quality.toUpperCase()}
                    </Badge>
                </div>

                {/* Total Estimate Card */}
                <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Estimated Cost</p>
                        <h2 className="text-2xl font-bold text-green-700">
                            {estimate ? formatCurrency(estimate.totalCost) : '---'}
                        </h2>
                        <p className="text-xs text-green-600 mt-1">
                            For {area} sq.ft {roomType.replace('-', ' ')}
                        </p>
                    </div>
                </Card>

                {/* Key Controls */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-xs">Area (sq.ft)</Label>
                            <span className="text-xs text-muted-foreground">{area} sq.ft</span>
                        </div>
                        <Slider
                            value={[area]}
                            min={50}
                            max={1000}
                            step={10}
                            onValueChange={([v]) => setArea(v)}
                            className="py-2"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Quality</Label>
                            <Select value={quality} onValueChange={(v: any) => setQuality(v)}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="luxury">Luxury</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">City</Label>
                            <Select value={city} onValueChange={setCity}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                                    <SelectItem value="Delhi">Delhi</SelectItem>
                                    <SelectItem value="Bangalore">Bangalore</SelectItem>
                                    <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                                    <SelectItem value="Chennai">Chennai</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {/* Breakdown */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-muted-foreground" />
                            Cost Breakdown
                        </h4>
                        <div className="space-y-2">
                            {estimate?.breakdown.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-sm p-2 rounded bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        {item.category === 'Materials' && <Package className="w-3.5 h-3.5 text-blue-500" />}
                                        {item.category === 'Labor' && <Hammer className="w-3.5 h-3.5 text-orange-500" />}
                                        {item.category.includes('Tax') && <IndianRupee className="w-3.5 h-3.5 text-purple-500" />}
                                        <span>{item.category}</span>
                                    </div>
                                    <span className="font-medium">{formatCurrency(item.cost)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-normal cursor-pointer" htmlFor="labor">Include Labor</Label>
                            <Switch id="labor" checked={includeLabor} onCheckedChange={setIncludeLabor} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-normal cursor-pointer" htmlFor="tax">Include GST (18%)</Label>
                            <Switch id="tax" checked={includeTax} onCheckedChange={setIncludeTax} />
                        </div>
                    </div>

                    {/* Timeline Info */}
                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs flex gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>
                            Estimated renovation timeline for this scope is approximately
                            <span className="font-bold"> {estimate?.estimatedDays} days</span>.
                        </p>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
