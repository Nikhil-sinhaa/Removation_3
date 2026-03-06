// app/admin/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Zap,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  ChevronDown,
  Sparkles,
  Home,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  color: string;
}

interface ChartData {
  label: string;
  value: number;
  percentage?: number;
}

interface ActivityItem {
  id: string;
  type: "render" | "signup" | "payment" | "upgrade";
  message: string;
  timestamp: string;
  user?: string;
  amount?: string;
}

interface TopStyle {
  name: string;
  renders: number;
  percentage: number;
  growth: number;
}

interface GeoData {
  country: string;
  users: number;
  renders: number;
  revenue: string;
  flag: string;
}

// Mock Data
const mockMetrics = {
  totalUsers: { value: "45,892", change: 12.5, changeLabel: "vs last month" },
  activeUsers: { value: "12,456", change: 8.3, changeLabel: "vs last week" },
  totalRenders: { value: "1,234,567", change: 23.7, changeLabel: "vs last month" },
  revenue: { value: "$847,234", change: 18.2, changeLabel: "vs last month" },
  avgSessionTime: { value: "8m 42s", change: 5.1, changeLabel: "vs last week" },
  conversionRate: { value: "4.8%", change: -0.3, changeLabel: "vs last month" },
  vastuScans: { value: "89,432", change: 45.2, changeLabel: "vs last month" },
  costCalculations: { value: "156,789", change: 32.8, changeLabel: "vs last month" },
};

const mockDailyRenders: ChartData[] = [
  { label: "Mon", value: 12500 },
  { label: "Tue", value: 14200 },
  { label: "Wed", value: 13800 },
  { label: "Thu", value: 16500 },
  { label: "Fri", value: 18200 },
  { label: "Sat", value: 21000 },
  { label: "Sun", value: 19500 },
];

const mockRevenueData: ChartData[] = [
  { label: "Week 1", value: 45000 },
  { label: "Week 2", value: 52000 },
  { label: "Week 3", value: 48000 },
  { label: "Week 4", value: 61000 },
];

const mockUserGrowth: ChartData[] = [
  { label: "Jan", value: 12000 },
  { label: "Feb", value: 15000 },
  { label: "Mar", value: 18500 },
  { label: "Apr", value: 22000 },
  { label: "May", value: 28000 },
  { label: "Jun", value: 35000 },
  { label: "Jul", value: 42000 },
  { label: "Aug", value: 45892 },
];

const mockPlanDistribution: ChartData[] = [
  { label: "Free", value: 32456, percentage: 70.7 },
  { label: "Pro", value: 10234, percentage: 22.3 },
  { label: "Teams", value: 3202, percentage: 7.0 },
];

const mockTopStyles: TopStyle[] = [
  { name: "Modern Minimalist", renders: 234567, percentage: 19, growth: 15.2 },
  { name: "Scandinavian", renders: 198432, percentage: 16.1, growth: 12.8 },
  { name: "Industrial", renders: 156789, percentage: 12.7, growth: 8.5 },
  { name: "Contemporary", renders: 143256, percentage: 11.6, growth: 22.1 },
  { name: "Traditional Indian", renders: 134567, percentage: 10.9, growth: 45.3 },
  { name: "Bohemian", renders: 112345, percentage: 9.1, growth: 18.7 },
  { name: "Japanese Zen", renders: 98765, percentage: 8.0, growth: 25.4 },
  { name: "Art Deco", renders: 78432, percentage: 6.4, growth: 5.2 },
  { name: "Rustic", renders: 67890, percentage: 5.5, growth: -2.3 },
  { name: "Coastal", renders: 9524, percentage: 0.8, growth: 31.5 },
];

const mockRoomTypes: ChartData[] = [
  { label: "Living Room", value: 345678, percentage: 28 },
  { label: "Bedroom", value: 289432, percentage: 23.5 },
  { label: "Kitchen", value: 198765, percentage: 16.1 },
  { label: "Bathroom", value: 156432, percentage: 12.7 },
  { label: "Office", value: 123456, percentage: 10 },
  { label: "Dining Room", value: 78965, percentage: 6.4 },
  { label: "Outdoor", value: 41839, percentage: 3.4 },
];

const mockGeoData: GeoData[] = [
  { country: "India", users: 18456, renders: 456789, revenue: "₹2,34,56,789", flag: "🇮🇳" },
  { country: "United States", users: 12345, renders: 345678, revenue: "$345,678", flag: "🇺🇸" },
  { country: "United Kingdom", users: 4567, renders: 123456, revenue: "£89,432", flag: "🇬🇧" },
  { country: "Canada", users: 3456, renders: 89432, revenue: "$67,234", flag: "🇨🇦" },
  { country: "Australia", users: 2345, renders: 67890, revenue: "$45,678", flag: "🇦🇺" },
  { country: "Germany", users: 1987, renders: 45678, revenue: "€34,567", flag: "🇩🇪" },
  { country: "UAE", users: 1654, renders: 34567, revenue: "$28,456", flag: "🇦🇪" },
  { country: "Singapore", users: 1234, renders: 28765, revenue: "$23,456", flag: "🇸🇬" },
];

const mockRecentActivity: ActivityItem[] = [
  { id: "1", type: "payment", message: "Pro subscription purchased", timestamp: "2 min ago", user: "john@email.com", amount: "$29" },
  { id: "2", type: "render", message: "Batch render completed (25 images)", timestamp: "5 min ago", user: "sarah@design.com" },
  { id: "3", type: "signup", message: "New user registered", timestamp: "8 min ago", user: "mike@startup.io" },
  { id: "4", type: "upgrade", message: "Upgraded to Teams plan", timestamp: "12 min ago", user: "studio@interiors.com", amount: "$99" },
  { id: "5", type: "render", message: "Vastu analysis completed", timestamp: "15 min ago", user: "priya@home.in" },
  { id: "6", type: "payment", message: "Pro subscription renewed", timestamp: "18 min ago", user: "alex@arch.com", amount: "$29" },
  { id: "7", type: "render", message: "Cost estimate generated", timestamp: "22 min ago", user: "rahul@builder.in" },
  { id: "8", type: "signup", message: "New user registered via Chrome Extension", timestamp: "25 min ago", user: "emma@design.uk" },
];

const mockFeatureUsage: ChartData[] = [
  { label: "Room Redesign", value: 456789, percentage: 37 },
  { label: "Vastu Analysis", value: 234567, percentage: 19 },
  { label: "Cost Calculator", value: 198765, percentage: 16.1 },
  { label: "Fill Empty Room", value: 156432, percentage: 12.7 },
  { label: "Inpainting", value: 98765, percentage: 8 },
  { label: "Outdoor Design", value: 56789, percentage: 4.6 },
  { label: "Sketch to Render", value: 32145, percentage: 2.6 },
];

// Components
const MetricCard = ({ title, value, change, changeLabel, icon, trend, color }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
        <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-neutral-400">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${color.replace('bg-', 'bg-opacity-20 bg-')}`}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="flex items-center gap-1 mt-1">
            {trend === "up" ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : trend === "down" ? (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            ) : null}
            <span className={`text-xs ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-neutral-500"}`}>
              {change > 0 ? "+" : ""}{change}%
            </span>
            <span className="text-xs text-neutral-500">{changeLabel}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const BarChartSimple = ({ data, maxValue, color = "bg-violet-500" }: { data: ChartData[]; maxValue: number; color?: string }) => {
  return (
    <div className="flex items-end justify-between gap-2 h-48">
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ height: 0 }}
          animate={{ height: `${(item.value / maxValue) * 100}%` }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className="flex flex-col items-center gap-2 flex-1"
        >
          <div className="text-xs text-neutral-400">{(item.value / 1000).toFixed(1)}k</div>
          <div
            className={`w-full rounded-t-lg ${color} hover:opacity-80 transition-opacity cursor-pointer`}
            style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: "20px" }}
          />
          <div className="text-xs text-neutral-500">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

const DonutChart = ({ data }: { data: ChartData[] }) => {
  const colors = ["bg-violet-500", "bg-blue-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-pink-500"];
  const total = data.reduce((acc, item) => acc + item.value, 0);

  let cumulativePercentage = 0;

  return (
    <div className="flex items-center gap-8">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -cumulativePercentage;
            cumulativePercentage += percentage;

            return (
              <motion.circle
                key={item.label}
                initial={{ strokeDasharray: "0 100" }}
                animate={{ strokeDasharray }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={`hsl(${260 - index * 30}, 70%, 50%)`}
                strokeWidth="12"
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{(total / 1000).toFixed(0)}k</span>
          <span className="text-xs text-neutral-400">Total</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
            <span className="text-sm text-neutral-300">{item.label}</span>
            <span className="text-sm text-neutral-500">({item.percentage?.toFixed(1) || ((item.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityFeed = ({ activities }: { activities: ActivityItem[] }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "render": return <ImageIcon className="w-4 h-4 text-violet-500" />;
      case "signup": return <Users className="w-4 h-4 text-blue-500" />;
      case "payment": return <DollarSign className="w-4 h-4 text-green-500" />;
      case "upgrade": return <Zap className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case "render": return "bg-violet-500/10";
      case "signup": return "bg-blue-500/10";
      case "payment": return "bg-green-500/10";
      case "upgrade": return "bg-amber-500/10";
      default: return "bg-neutral-500/10";
    }
  };

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
          >
            <div className={`p-2 rounded-full ${getActivityBg(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-200">{activity.message}</p>
              <p className="text-xs text-neutral-500 truncate">{activity.user}</p>
            </div>
            <div className="text-right">
              {activity.amount && (
                <p className="text-sm font-medium text-green-500">{activity.amount}</p>
              )}
              <p className="text-xs text-neutral-500">{activity.timestamp}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
};

const TopStylesTable = ({ styles }: { styles: TopStyle[] }) => {
  return (
    <div className="space-y-3">
      {styles.slice(0, 8).map((style, index) => (
        <motion.div
          key={style.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-4"
        >
          <span className="text-sm font-medium text-neutral-500 w-6">#{index + 1}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-neutral-200">{style.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">{(style.renders / 1000).toFixed(0)}k renders</span>
                <span className={`text-xs flex items-center gap-0.5 ${style.growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {style.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {style.growth}%
                </span>
              </div>
            </div>
            <Progress value={style.percentage} className="h-1.5" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const GeoTable = ({ data }: { data: GeoData[] }) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-4 text-xs text-neutral-500 pb-2 border-b border-neutral-800">
        <span>Country</span>
        <span className="text-right">Users</span>
        <span className="text-right">Renders</span>
        <span className="text-right">Revenue</span>
        <span className="text-right">Share</span>
      </div>
      {data.map((item, index) => {
        const totalUsers = data.reduce((acc, d) => acc + d.users, 0);
        const share = ((item.users / totalUsers) * 100).toFixed(1);

        return (
          <motion.div
            key={item.country}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="grid grid-cols-5 gap-4 items-center py-2 hover:bg-neutral-800/50 rounded-lg px-2 -mx-2 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm text-neutral-200">
              <span className="text-lg">{item.flag}</span>
              {item.country}
            </span>
            <span className="text-right text-sm text-neutral-400">{item.users.toLocaleString()}</span>
            <span className="text-right text-sm text-neutral-400">{item.renders.toLocaleString()}</span>
            <span className="text-right text-sm text-green-500">{item.revenue}</span>
            <span className="text-right text-sm text-neutral-500">{share}%</span>
          </motion.div>
        );
      })}
    </div>
  );
};

// Main Component
export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Re-fetch analytics data when real API is available
    // For now, briefly show spinner to acknowledge user action
    await new Promise((r) => setTimeout(r, 300));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 bg-neutral-800" />
              <Skeleton className="h-4 w-72 bg-neutral-800" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 bg-neutral-800" />
              <Skeleton className="h-10 w-32 bg-neutral-800" />
            </div>
          </div>

          {/* Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-neutral-800 rounded-lg" />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 bg-neutral-800 rounded-lg" />
            <Skeleton className="h-96 bg-neutral-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-violet-500" />
              Analytics Dashboard
            </h1>
            <p className="text-neutral-400 mt-1">
              Real-time insights for Removation.ai performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-neutral-800 border-neutral-700">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-neutral-700"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-neutral-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem>Export as Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={mockMetrics.totalUsers.value}
            change={mockMetrics.totalUsers.change}
            changeLabel={mockMetrics.totalUsers.changeLabel}
            icon={<Users className="w-5 h-5 text-blue-500" />}
            trend="up"
            color="bg-blue-500"
          />
          <MetricCard
            title="Total Renders"
            value={mockMetrics.totalRenders.value}
            change={mockMetrics.totalRenders.change}
            changeLabel={mockMetrics.totalRenders.changeLabel}
            icon={<ImageIcon className="w-5 h-5 text-violet-500" />}
            trend="up"
            color="bg-violet-500"
          />
          <MetricCard
            title="Revenue"
            value={mockMetrics.revenue.value}
            change={mockMetrics.revenue.change}
            changeLabel={mockMetrics.revenue.changeLabel}
            icon={<DollarSign className="w-5 h-5 text-green-500" />}
            trend="up"
            color="bg-green-500"
          />
          <MetricCard
            title="Conversion Rate"
            value={mockMetrics.conversionRate.value}
            change={mockMetrics.conversionRate.change}
            changeLabel={mockMetrics.conversionRate.changeLabel}
            icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
            trend="down"
            color="bg-amber-500"
          />
          <MetricCard
            title="Active Users"
            value={mockMetrics.activeUsers.value}
            change={mockMetrics.activeUsers.change}
            changeLabel={mockMetrics.activeUsers.changeLabel}
            icon={<Activity className="w-5 h-5 text-cyan-500" />}
            trend="up"
            color="bg-cyan-500"
          />
          <MetricCard
            title="Avg. Session Time"
            value={mockMetrics.avgSessionTime.value}
            change={mockMetrics.avgSessionTime.change}
            changeLabel={mockMetrics.avgSessionTime.changeLabel}
            icon={<Clock className="w-5 h-5 text-rose-500" />}
            trend="up"
            color="bg-rose-500"
          />
          <MetricCard
            title="Vastu Scans"
            value={mockMetrics.vastuScans.value}
            change={mockMetrics.vastuScans.change}
            changeLabel={mockMetrics.vastuScans.changeLabel}
            icon={<Home className="w-5 h-5 text-orange-500" />}
            trend="up"
            color="bg-orange-500"
          />
          <MetricCard
            title="Cost Calculations"
            value={mockMetrics.costCalculations.value}
            change={mockMetrics.costCalculations.change}
            changeLabel={mockMetrics.costCalculations.changeLabel}
            icon={<IndianRupee className="w-5 h-5 text-emerald-500" />}
            trend="up"
            color="bg-emerald-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Renders Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Daily Renders</CardTitle>
                    <CardDescription>Render volume over the past week</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +23.7%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <BarChartSimple data={mockDailyRenders} maxValue={25000} />
              </CardContent>
            </Card>
          </motion.div>

          {/* User Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Plan Distribution</CardTitle>
                <CardDescription>User subscription breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart data={mockPlanDistribution} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Feature Usage & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Feature Usage</CardTitle>
                    <CardDescription>Most popular features by usage</CardDescription>
                  </div>
                  <Tabs defaultValue="features" className="w-auto">
                    <TabsList className="bg-neutral-800">
                      <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
                      <TabsTrigger value="rooms" className="text-xs">Room Types</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFeatureUsage.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-200 flex items-center gap-2">
                          {feature.label === "Vastu Analysis" && <Sparkles className="w-4 h-4 text-orange-500" />}
                          {feature.label === "Cost Calculator" && <IndianRupee className="w-4 h-4 text-green-500" />}
                          {feature.label}
                        </span>
                        <span className="text-neutral-400">
                          {(feature.value / 1000).toFixed(0)}k ({feature.percentage}%)
                        </span>
                      </div>
                      <Progress value={feature.percentage} className="h-2" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Real-time Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Live Activity
                    </CardTitle>
                    <CardDescription>Real-time platform activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ActivityFeed activities={mockRecentActivity} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Styles & Geography */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Styles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Top Design Styles</CardTitle>
                    <CardDescription>Most rendered design styles</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TopStylesTable styles={mockTopStyles} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Geographic Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      Geographic Distribution
                    </CardTitle>
                    <CardDescription>Users by country</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <GeoTable data={mockGeoData} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Room Types & Revenue Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Room Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Room Type Distribution</CardTitle>
                <CardDescription>Renders by room type</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart data={mockRoomTypes} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Weekly Revenue</CardTitle>
                    <CardDescription>Revenue trend this month</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                    <DollarSign className="w-3 h-3 mr-1" />
                    $206,000 total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <BarChartSimple data={mockRevenueData} maxValue={70000} color="bg-green-500" />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* User Growth Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-violet-500" />
                    User Growth
                  </CardTitle>
                  <CardDescription>Monthly user acquisition trend</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span className="text-neutral-400">Total Users</span>
                  </div>
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                    282% YoY Growth
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BarChartSimple data={mockUserGrowth} maxValue={50000} color="bg-gradient-to-t from-violet-600 to-violet-400" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "API Calls Today", value: "2.4M", icon: <Zap className="w-4 h-4" /> },
            { label: "Avg Response Time", value: "234ms", icon: <Clock className="w-4 h-4" /> },
            { label: "Error Rate", value: "0.02%", icon: <Activity className="w-4 h-4" /> },
            { label: "Uptime", value: "99.99%", icon: <TrendingUp className="w-4 h-4" /> },
          ].map((stat, index) => (
            <Card key={stat.label} className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
                <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400">
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
}