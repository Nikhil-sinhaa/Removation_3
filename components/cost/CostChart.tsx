"use client";
import type { CostMaterialEntry } from "@/types/cost";
import type { TooltipProps } from "recharts";

import React, { useMemo, useCallback } from "react";
import { motion } from "framer-motion";

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UICostChartData, CurrencyType } from "@/types/cost";


interface CostChartProps {
  costData?: UICostChartData; // Make optional
  data?: any; // Add the 'data' prop that CostPanel is passing
  currency: CurrencyType;
  showComparison?: boolean;
  averageCost?: number;
  className?: string;
  compact?: boolean; // Add compact prop
}

const COLORS = [
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#6366f1", // Indigo
];

const CostChart: React.FC<CostChartProps> = ({
  costData,
  data,
  currency,
  showComparison = false,
  averageCost,
  className = "",
  compact = false
}) => {
  const [language, setLanguage] = React.useState<"en" | "hi">("en");
  const [activeChart, setActiveChart] = React.useState("pie");

  // Handle both data props
  const chartData = useMemo(() => {
    // If we have the new format data (from CostPanel), use it
    if (data) {
      // Convert the data from CostPanel to UICostChartData format
      return {
        currency,
        materials: [],
        materialTotal: data.materials?.amount || 0,
        laborTotal: data.labor?.amount || 0,
        tax: data.tax?.amount || 0,
        grandTotal: (data.materials?.amount || 0) + (data.labor?.amount || 0) + (data.tax?.amount || 0) + (data.other?.amount || 0),
        estimatedDays: 45 // Default
      };
    }
    // Otherwise use costData
    return costData || {
      currency,
      materials: [],
      materialTotal: 0,
      laborTotal: 0,
      tax: 0,
      grandTotal: 0,
      estimatedDays: 45
    };
  }, [costData, data, currency]);

  // Detect language
  React.useEffect(() => {
    const browserLang = navigator.language;
    if (browserLang.startsWith("hi")) {
      setLanguage("hi");
    }
  }, []);

  const t = useCallback((en: string, hi: string) => language === "hi" ? hi : en, [language]);

  const formatCurrency = (value: number) => {
    if (currency === "INR") {
      if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(2)}Cr`;
      }
      if (value >= 100000) {
        return `₹${(value / 100000).toFixed(2)}L`;
      }
      if (value >= 1000) {
        return `₹${(value / 1000).toFixed(1)}K`;
      }
      return `₹${value}`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
  };

  // Prepare pie chart data
  const pieData = useMemo(() => {
    const data = [];
    
    // Add material categories
    const materialsByCategory = chartData.materials.reduce<Record<string, number>>(
      (acc, mat: CostMaterialEntry) => {
        const category = mat.category ?? "Other";
        acc[category] = (acc[category] || 0) + mat.cost;
        return acc;
      },
      {}
    );
    
    Object.entries(materialsByCategory).forEach(([name, value]) => {
      data.push({ name, value, type: "material" });
    });
    
    // Add labor
    data.push({ 
      name: t("Labor", "श्रम"), 
      value: chartData.laborTotal, 
      type: "labor" 
    });
    
    // Add tax
    data.push({ 
      name: t("Tax/GST", "कर/GST"), 
      value: chartData.tax, 
      type: "tax" 
    });
    
    // Add other if exists
    if (data.length === 0) {
      data.push(
        { name: "Materials", value: chartData.materialTotal || 0, type: "material" },
        { name: "Labor", value: chartData.laborTotal || 0, type: "labor" },
        { name: "Tax", value: chartData.tax || 0, type: "tax" },
        { name: "Other", value: chartData.grandTotal - (chartData.materialTotal + chartData.laborTotal + chartData.tax) || 0, type: "other" }
      );
    }
    
    return data.filter(item => item.value > 0);
  }, [chartData, t]);

  // Prepare bar chart data for materials
  const barData = useMemo(() => {
    if (chartData.materials && chartData.materials.length > 0) {
      return chartData.materials.slice(0, 8).map((mat: CostMaterialEntry) => ({
        name: mat.name.length > 15 ? mat.name.slice(0, 15) + "..." : mat.name,
        fullName: mat.name,
        cost: mat.cost,
        quantity: mat.quantity
      }));
    }
    // If no materials data, create dummy data from totals
    return [
      { name: "Construction", cost: chartData.materialTotal * 0.4, quantity: 1 },
      { name: "Finishing", cost: chartData.materialTotal * 0.3, quantity: 1 },
      { name: "Fixtures", cost: chartData.materialTotal * 0.2, quantity: 1 },
      { name: "Hardware", cost: chartData.materialTotal * 0.1, quantity: 1 }
    ].filter(item => item.cost > 0);
  }, [chartData.materials, chartData.materialTotal]);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    if (!showComparison || !averageCost) return null;

    return [
      {
        name: t("Your Estimate", "आपका अनुमान"),
        value: chartData.grandTotal,
        fill: "#8b5cf6"
      },
      {
        name: t("City Average", "शहर का औसत"),
        value: averageCost,
        fill: "#94a3b8"
      },
      {
        name: t("Budget Option", "बजट विकल्प"),
        value: chartData.grandTotal * 0.7,
        fill: "#10b981"
      },
      {
        name: t("Premium Option", "प्रीमियम विकल्प"),
        value: chartData.grandTotal * 1.4,
        fill: "#f59e0b"
      }
    ];
  }, [chartData.grandTotal, averageCost, showComparison, t]);

  // Cost timeline data (estimated monthly spending)
  const timelineData = useMemo(() => {
    const totalMonths = Math.max(1, Math.ceil(chartData.estimatedDays / 30));
    const monthlyBudget = chartData.grandTotal / totalMonths;
    let cumulativeSpend = 0;

    return Array.from({ length: totalMonths }, (_, i) => {
      let monthSpend = monthlyBudget;
      
      if (i === 0) monthSpend *= 1.5;
      if (i === totalMonths - 1) monthSpend *= 1.3;
      
      cumulativeSpend += monthSpend;
      
      return {
        month: `${t("Month", "महीना")} ${i + 1}`,
        spend: Math.round(monthSpend),
        cumulative: Math.round(Math.min(cumulativeSpend, chartData.grandTotal))
      };
    });
  }, [chartData, t]);

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{label || payload[0].name}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(Number(entry.value ?? 0))}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Pie chart custom label
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name
  }: any) => {
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // If compact mode, show simplified view
  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={40}
                innerRadius={20}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="stroke-background stroke-2"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
          {pieData.slice(0, 4).map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate">{item.name}</span>
              <span className="ml-auto font-medium">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {t("Cost Breakdown", "लागत विवरण")}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {t("Total", "कुल")}: {formatCurrency(chartData.grandTotal)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeChart} onValueChange={setActiveChart}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="pie" className="text-xs">
              {t("Distribution", "वितरण")}
            </TabsTrigger>
            <TabsTrigger value="bar" className="text-xs">
              {t("Materials", "सामग्री")}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">
              {t("Timeline", "समयरेखा")}
            </TabsTrigger>
            {showComparison && (
              <TabsTrigger value="compare" className="text-xs">
                {t("Compare", "तुलना")}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Pie Chart */}
          <TabsContent value="pie" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="stroke-background stroke-2"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    layout="horizontal" 
                    align="center" 
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Bar Chart - Materials */}
          <TabsContent value="bar" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => formatCurrency(value)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 11 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="cost" 
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    animationDuration={800}
                  >
                    {barData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Timeline Chart */}
          <TabsContent value="timeline" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 11 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground">
                        {value === "spend" ? t("Monthly Spend", "मासिक खर्च") : t("Cumulative", "संचयी")}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSpend)"
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCumulative)"
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Comparison Chart */}
          {showComparison && comparisonData && (
            <TabsContent value="compare" className="mt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#888', fontSize: 10 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#888', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    >
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Comparison insights */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {chartData.grandTotal < (averageCost || 0) ? (
                  <div className="col-span-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ {t(
                        `Your estimate is ${formatCurrency((averageCost || 0) - chartData.grandTotal)} below city average!`,
                        `आपका अनुमान शहर के औसत से ${formatCurrency((averageCost || 0) - chartData.grandTotal)} कम है!`
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="col-span-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      ⚠ {t(
                        `Your estimate is ${formatCurrency(chartData.grandTotal - (averageCost || 0))} above city average`,
                        `आपका अनुमान शहर के औसत से ${formatCurrency(chartData.grandTotal - (averageCost || 0))} अधिक है`
                      )}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {t("Materials", "सामग्री")}
            </p>
            <p className="text-sm font-medium text-primary">
              {(((chartData.materialTotal ?? 0) / (chartData.grandTotal || 1)) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {t("Labor", "श्रम")}
            </p>
            <p className="text-sm font-medium text-blue-500">
              {(((chartData.laborTotal ?? 0) / (chartData.grandTotal || 1)) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {t("Tax", "कर")}
            </p>
            <p className="text-sm font-medium text-amber-500">
              {(((chartData.tax ?? 0) / (chartData.grandTotal || 1)) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostChart;