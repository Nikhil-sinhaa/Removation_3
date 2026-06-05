// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Clock,
  Eye,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  CreditCard,
  UserPlus,
  ImagePlus,
  Home,
  IndianRupee,
  Sparkles,
  Bell,
  Search,
  Filter,
  Download,
  ChevronRight,
  Calendar,
  Mail,
  MessageSquare,
  Flag,
  Ban,
  UserCheck,
  FileText,
  Layers,
  Target,
  Award,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
interface StatCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  href: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "teams";
  joinedAt: string;
  renders: number;
  status: "active" | "inactive" | "suspended";
}

interface RecentRender {
  id: string;
  user: string;
  userAvatar?: string;
  type: string;
  style: string;
  status: "completed" | "processing" | "failed";
  createdAt: string;
  thumbnail?: string;
}

interface SystemStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency?: string;
  uptime?: string;
}

interface Alert {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface PendingItem {
  id: string;
  type: "report" | "refund" | "verification" | "support";
  title: string;
  user: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

// Mock Data
const mockStats: StatCard[] = [
  {
    title: "Total Users",
    value: "45,892",
    change: 12.5,
    changeLabel: "vs last month",
    icon: <Users className="w-6 h-6" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    href: "/admin/users",
  },
  {
    title: "Total Renders",
    value: "1.23M",
    change: 23.7,
    changeLabel: "vs last month",
    icon: <ImageIcon className="w-6 h-6" />,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    href: "/admin/renders",
  },
  {
    title: "Monthly Revenue",
    value: "$127,432",
    change: 18.2,
    changeLabel: "vs last month",
    icon: <DollarSign className="w-6 h-6" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    href: "/admin/analytics",
  },
  {
    title: "Active Subscriptions",
    value: "13,436",
    change: 8.9,
    changeLabel: "vs last month",
    icon: <CreditCard className="w-6 h-6" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    href: "/admin/analytics",
  },
];

const mockQuickStats = [
  { label: "Today's Signups", value: "234", icon: <UserPlus className="w-4 h-4" />, trend: "+12%" },
  { label: "Today's Renders", value: "8,456", icon: <ImagePlus className="w-4 h-4" />, trend: "+8%" },
  { label: "Vastu Scans", value: "1,234", icon: <Home className="w-4 h-4" />, trend: "+45%" },
  { label: "Cost Calculations", value: "2,567", icon: <IndianRupee className="w-4 h-4" />, trend: "+32%" },
  { label: "Active Sessions", value: "3,421", icon: <Activity className="w-4 h-4" />, trend: "live" },
  { label: "API Calls/min", value: "12.4K", icon: <Zap className="w-4 h-4" />, trend: "stable" },
];

const mockRecentUsers: RecentUser[] = [
  {
    id: "1",
    name: "Priya Sharma",
    email: "priya@design.in",
    plan: "pro",
    joinedAt: "2 min ago",
    renders: 0,
    status: "active",
  },
  {
    id: "2",
    name: "John Smith",
    email: "john@architect.com",
    plan: "teams",
    joinedAt: "15 min ago",
    renders: 3,
    status: "active",
  },
  {
    id: "3",
    name: "Rahul Verma",
    email: "rahul@builder.in",
    plan: "free",
    joinedAt: "32 min ago",
    renders: 1,
    status: "active",
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma@interiors.uk",
    plan: "pro",
    joinedAt: "1 hour ago",
    renders: 12,
    status: "active",
  },
  {
    id: "5",
    name: "Amit Patel",
    email: "amit@realty.in",
    plan: "free",
    joinedAt: "2 hours ago",
    renders: 2,
    status: "active",
  },
];

const mockRecentRenders: RecentRender[] = [
  {
    id: "1",
    user: "Sarah Johnson",
    type: "Room Redesign",
    style: "Modern Minimalist",
    status: "completed",
    createdAt: "Just now",
  },
  {
    id: "2",
    user: "Mike Chen",
    type: "Vastu Analysis",
    style: "Traditional Indian",
    status: "completed",
    createdAt: "1 min ago",
  },
  {
    id: "3",
    user: "Lisa Park",
    type: "Fill Empty Room",
    style: "Scandinavian",
    status: "processing",
    createdAt: "2 min ago",
  },
  {
    id: "4",
    user: "Raj Malhotra",
    type: "Cost Estimate",
    style: "Contemporary",
    status: "completed",
    createdAt: "3 min ago",
  },
  {
    id: "5",
    user: "Anna Schmidt",
    type: "Outdoor Design",
    style: "Japanese Zen",
    status: "failed",
    createdAt: "5 min ago",
  },
  {
    id: "6",
    user: "David Lee",
    type: "Inpainting",
    style: "Industrial",
    status: "completed",
    createdAt: "8 min ago",
  },
];

const mockSystemStatus: SystemStatus[] = [
  { name: "API Gateway", status: "healthy", latency: "45ms", uptime: "99.99%" },
  { name: "MongoDB Atlas", status: "healthy", latency: "12ms", uptime: "99.99%" },
  { name: "Replicate AI", status: "healthy", latency: "2.3s", uptime: "99.95%" },
  { name: "Groq LLM", status: "healthy", latency: "180ms", uptime: "99.98%" },
  { name: "UploadThing CDN", status: "healthy", latency: "28ms", uptime: "99.99%" },
  { name: "Stripe Payments", status: "healthy", latency: "156ms", uptime: "100%" },
  { name: "Razorpay", status: "healthy", latency: "234ms", uptime: "99.97%" },
  { name: "Clerk Auth", status: "healthy", latency: "89ms", uptime: "99.99%" },
];

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    title: "High API Usage",
    message: "API usage is 85% of monthly limit",
    timestamp: "10 min ago",
    isRead: false,
  },
  {
    id: "2",
    type: "info",
    title: "New Feature Deployed",
    message: "Vastu Engine v2.0 is now live",
    timestamp: "1 hour ago",
    isRead: false,
  },
  {
    id: "3",
    type: "success",
    title: "Revenue Milestone",
    message: "Monthly revenue crossed $125K",
    timestamp: "2 hours ago",
    isRead: true,
  },
  {
    id: "4",
    type: "error",
    title: "Failed Renders Spike",
    message: "3 failed renders in last 10 minutes",
    timestamp: "3 hours ago",
    isRead: true,
  },
];

const mockPendingItems: PendingItem[] = [
  {
    id: "1",
    type: "report",
    title: "Inappropriate content report",
    user: "user@email.com",
    priority: "high",
    createdAt: "30 min ago",
  },
  {
    id: "2",
    type: "refund",
    title: "Refund request - Pro subscription",
    user: "john@company.com",
    priority: "medium",
    createdAt: "2 hours ago",
  },
  {
    id: "3",
    type: "support",
    title: "API integration help",
    user: "dev@startup.io",
    priority: "low",
    createdAt: "4 hours ago",
  },
  {
    id: "4",
    type: "verification",
    title: "Business account verification",
    user: "hr@enterprise.com",
    priority: "medium",
    createdAt: "6 hours ago",
  },
];

const mockRevenueBreakdown = [
  { label: "Pro Subscriptions", value: 78500, percentage: 61.6, color: "bg-violet-500" },
  { label: "Teams Subscriptions", value: 38200, percentage: 30, color: "bg-blue-500" },
  { label: "One-time Credits", value: 8732, percentage: 6.9, color: "bg-amber-500" },
  { label: "Enterprise", value: 2000, percentage: 1.5, color: "bg-emerald-500" },
];

// Components
const StatCardComponent = ({ stat, index }: { stat: StatCard; index: number }) => {
  const isPositive = stat.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={stat.href}>
        <Card className="relative overflow-hidden border-neutral-800 bg-neutral-900/50 backdrop-blur-sm hover:bg-neutral-900/80 transition-all duration-300 hover:border-neutral-700 cursor-pointer group">
          <div className={`absolute top-0 left-0 w-1 h-full ${stat.color.replace('text-', 'bg-')}`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">{stat.title}</CardTitle>
            <div className={`p-2.5 rounded-xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <div className="flex items-center gap-1.5 mt-2">
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                {isPositive ? "+" : ""}{stat.change}%
              </span>
              <span className="text-sm text-neutral-500">{stat.changeLabel}</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
            {stat.icon && (
              <div className={`w-32 h-32 ${stat.color}`}>
                {stat.icon}
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

const QuickStatPill = ({ stat, index }: { stat: typeof mockQuickStats[0]; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50 hover:border-neutral-600 transition-colors"
    >
      <div className="p-2 rounded-lg bg-neutral-700/50 text-neutral-300">
        {stat.icon}
      </div>
      <div>
        <p className="text-xs text-neutral-500">{stat.label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-white">{stat.value}</p>
          <Badge
            variant="outline"
            className={`text-xs ${
              stat.trend === "live"
                ? "bg-green-500/10 text-green-400 border-green-500/30 animate-pulse"
                : stat.trend === "stable"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {stat.trend}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

const UserRow = ({ user, index }: { user: RecentUser; index: number }) => {
  const planColors = {
    free: "bg-neutral-500/10 text-neutral-400 border-neutral-500/30",
    pro: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    teams: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-800/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 border-2 border-neutral-700">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white text-sm">
            {user.name.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-neutral-500">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="outline" className={planColors[user.plan]}>
          {user.plan}
        </Badge>
        <span className="text-xs text-neutral-500 hidden sm:block">{user.joinedAt}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">
              <Ban className="w-4 h-4 mr-2" />
              Suspend User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

const RenderRow = ({ render, index }: { render: RecentRender; index: number }) => {
  const statusColors = {
    completed: "bg-green-500/10 text-green-400 border-green-500/30",
    processing: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    failed: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  const statusIcons = {
    completed: <CheckCircle2 className="w-3 h-3" />,
    processing: <RefreshCw className="w-3 h-3 animate-spin" />,
    failed: <XCircle className="w-3 h-3" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-800/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-neutral-700 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-neutral-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{render.type}</p>
          <p className="text-xs text-neutral-500">{render.user} • {render.style}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="outline" className={`flex items-center gap-1 ${statusColors[render.status]}`}>
          {statusIcons[render.status]}
          {render.status}
        </Badge>
        <span className="text-xs text-neutral-500 hidden sm:block">{render.createdAt}</span>
      </div>
    </motion.div>
  );
};

const SystemStatusRow = ({ system, index }: { system: SystemStatus; index: number }) => {
  const statusColors = {
    healthy: "text-green-500",
    degraded: "text-amber-500",
    down: "text-red-500",
  };

  const statusBg = {
    healthy: "bg-green-500",
    degraded: "bg-amber-500",
    down: "bg-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between py-2"
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusBg[system.status]} ${system.status === "healthy" ? "" : "animate-pulse"}`} />
        <span className="text-sm text-neutral-300">{system.name}</span>
      </div>
      <div className="flex items-center gap-4">
        {system.latency && (
          <span className="text-xs text-neutral-500">{system.latency}</span>
        )}
        <span className={`text-xs font-medium ${statusColors[system.status]}`}>
          {system.uptime}
        </span>
      </div>
    </motion.div>
  );
};

const AlertItem = ({ alert, index }: { alert: Alert; index: number }) => {
  const alertColors = {
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
    error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: <XCircle className="w-4 h-4 text-red-500" /> },
    info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: <Bell className="w-4 h-4 text-blue-500" /> },
    success: { bg: "bg-green-500/10", border: "border-green-500/30", icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
  };

  const colors = alertColors[alert.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 p-3 rounded-lg ${colors.bg} border ${colors.border} ${!alert.isRead ? "ring-1 ring-offset-1 ring-offset-neutral-900 ring-neutral-700" : ""}`}
    >
      {colors.icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{alert.title}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{alert.message}</p>
        <p className="text-xs text-neutral-500 mt-1">{alert.timestamp}</p>
      </div>
      {!alert.isRead && (
        <div className="w-2 h-2 rounded-full bg-violet-500" />
      )}
    </motion.div>
  );
};

const PendingItemRow = ({ item, index }: { item: PendingItem; index: number }) => {
  const priorityColors = {
    high: "bg-red-500/10 text-red-400 border-red-500/30",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  const typeIcons = {
    report: <Flag className="w-4 h-4" />,
    refund: <CreditCard className="w-4 h-4" />,
    verification: <UserCheck className="w-4 h-4" />,
    support: <MessageSquare className="w-4 h-4" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-800/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400">
          {typeIcons[item.type]}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{item.title}</p>
          <p className="text-xs text-neutral-500">{item.user}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={priorityColors[item.priority]}>
          {item.priority}
        </Badge>
        <span className="text-xs text-neutral-500 hidden sm:block">{item.createdAt}</span>
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// API response types
interface StatsResponse {
  users: {
    total: number;
    today: number;
    thisMonth: number;
    growth: number;
    active: number;
    pro: number;
    byPlan: Record<string, number>;
    byRole: Record<string, number>;
    recent: Array<{
      _id: string;
      firstName?: string;
      lastName?: string;
      email: string;
      imageUrl?: string;
      'subscription.plan'?: string;
      subscription?: { plan: string };
      role: string;
      createdAt: string;
    }>;
  };
  renders: {
    total: number;
    today: number;
    thisMonth: number;
    growth: number;
    byStatus: Record<string, number>;
    byMode: Array<{ _id: string; count: number }>;
    recent: Array<{
      _id: string;
      mode: string;
      status: string;
      createdAt: string;
      userId?: { firstName?: string; lastName?: string; email?: string; imageUrl?: string };
    }>;
  };
}

// Main Component
export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        // stats stays null — fallback to mock display
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Build real stat cards from API data
  const realStats: StatCard[] = stats ? [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      change: stats.users.growth,
      changeLabel: 'vs last month',
      icon: <Users className="w-6 h-6" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      href: '/admin/users',
    },
    {
      title: 'Total Renders',
      value: stats.renders.total.toLocaleString(),
      change: stats.renders.growth,
      changeLabel: 'vs last month',
      icon: <ImageIcon className="w-6 h-6" />,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      href: '/admin/renders',
    },
    {
      title: 'Pro / Team Users',
      value: stats.users.pro.toLocaleString(),
      change: 0,
      changeLabel: 'paying subscribers',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      href: '/admin/analytics',
    },
    {
      title: 'Active Subscriptions',
      value: stats.users.active.toLocaleString(),
      change: 0,
      changeLabel: 'currently active',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      href: '/admin/analytics',
    },
  ] : mockStats;

  const displayStats = realStats;

  // Build quick stats from real data
  const realQuickStats = stats ? [
    { label: "New Users Today", value: stats.users.today.toLocaleString(), icon: <UserPlus className="w-4 h-4" />, trend: "+" + stats.users.today },
    { label: "Renders Today", value: stats.renders.today.toLocaleString(), icon: <ImagePlus className="w-4 h-4" />, trend: "+" + stats.renders.today },
    { label: "This Month Users", value: stats.users.thisMonth.toLocaleString(), icon: <Home className="w-4 h-4" />, trend: stats.users.growth + "%" },
    { label: "Monthly Renders", value: stats.renders.thisMonth.toLocaleString(), icon: <IndianRupee className="w-4 h-4" />, trend: stats.renders.growth + "%" },
    { label: "Active Subscriptions", value: stats.users.active.toLocaleString(), icon: <Activity className="w-4 h-4" />, trend: "live" },
    { label: "Pro Users", value: stats.users.pro.toLocaleString(), icon: <Zap className="w-4 h-4" />, trend: "stable" },
  ] : mockQuickStats;

  // Map recent users from API
  const recentUsersFromApi: RecentUser[] = stats?.users.recent.map(u => ({
    id: u._id,
    name: [(u.firstName ?? ''), (u.lastName ?? '')].filter(Boolean).join(' ') || u.email,
    email: u.email,
    avatar: u.imageUrl,
    plan: ((u.subscription as any)?.plan ?? 'free') as 'free' | 'pro' | 'teams',
    joinedAt: new Date(u.createdAt).toLocaleDateString(),
    renders: 0,
    status: 'active' as const,
  })) ?? [];

  const displayUsers = recentUsersFromApi.length > 0 ? recentUsersFromApi : mockRecentUsers;

  // Map recent renders from API
  const recentRendersFromApi: RecentRender[] = stats?.renders.recent.map(r => ({
    id: r._id,
    user: r.userId ? [(r.userId.firstName ?? ''), (r.userId.lastName ?? '')].filter(Boolean).join(' ') || (r.userId.email ?? 'Unknown') : 'Unknown',
    type: r.mode.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    style: '',
    status: r.status as 'completed' | 'processing' | 'failed',
    createdAt: new Date(r.createdAt).toLocaleString(),
  })) ?? [];

  const displayRenders = recentRendersFromApi.length > 0 ? recentRendersFromApi : mockRecentRenders;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 bg-neutral-800" />
              <Skeleton className="h-4 w-96 bg-neutral-800" />
            </div>
            <Skeleton className="h-10 w-40 bg-neutral-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 bg-neutral-800 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 bg-neutral-800 rounded-xl lg:col-span-2" />
            <Skeleton className="h-96 bg-neutral-800 rounded-xl" />
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
              <Shield className="w-8 h-8 text-violet-500" />
              Admin Dashboard
            </h1>
            <p className="text-neutral-400 mt-1 flex items-center gap-2">
              Welcome back, Admin • 
              <span className="text-violet-400">
                {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
              <span className="text-neutral-500">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Search users, renders..."
                className="pl-10 w-64 bg-neutral-800 border-neutral-700"
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="relative border-neutral-700">
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                      {mockAlerts.filter((a) => !a.isRead).length}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayStats.map((stat, index) => (
            <StatCardComponent key={stat.title} stat={stat} index={index} />
          ))}
        </div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {realQuickStats.map((stat, index) => (
            <QuickStatPill key={stat.label} stat={stat} index={index} />
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Users & Renders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-500" />
                      Recent Signups
                    </CardTitle>
                    <CardDescription>New users in the last 24 hours</CardDescription>
                  </div>
                  <Link href="/admin/users">
                    <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                      View All
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-1 px-2">
                      {displayUsers.map((user, index) => (
                        <UserRow key={user.id} user={user} index={index} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Renders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-violet-500" />
                      Recent Renders
                    </CardTitle>
                    <CardDescription>Latest AI generation activity</CardDescription>
                  </div>
                  <Link href="/admin/renders">
                    <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                      View All
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[320px]">
                    <div className="space-y-1 px-2">
                      {displayRenders.map((render, index) => (
                        <RenderRow key={render.id} render={render} index={index} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Revenue Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Revenue Breakdown
                  </CardTitle>
                  <CardDescription>This month&apos;s revenue by source</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRevenueBreakdown.map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-300">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">${item.value.toLocaleString()}</span>
                            <span className="text-xs text-neutral-500">({item.percentage}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                            className={`h-full ${item.color} rounded-full`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400">Total Revenue</span>
                    <span className="text-2xl font-bold text-white">$127,432</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Server className="w-5 h-5 text-emerald-500" />
                        System Status
                      </CardTitle>
                      <CardDescription>All services operational</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {mockSystemStatus.map((system, index) => (
                      <SystemStatusRow key={system.name} system={system} index={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    Recent Alerts
                    {mockAlerts.filter((a) => !a.isRead).length > 0 && (
                      <Badge className="bg-red-500 text-white ml-2">
                        {mockAlerts.filter((a) => !a.isRead).length} new
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px] pr-2">
                    <div className="space-y-3">
                      {mockAlerts.map((alert, index) => (
                        <AlertItem key={alert.id} alert={alert} index={index} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Items */}
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
                        <Layers className="w-5 h-5 text-orange-500" />
                        Pending Actions
                      </CardTitle>
                      <CardDescription>Items requiring attention</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                      {mockPendingItems.length} items
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[240px]">
                    <div className="space-y-1 px-2">
                      {mockPendingItems.map((item, index) => (
                        <PendingItemRow key={item.id} item={item} index={index} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Add User", icon: <UserPlus className="w-4 h-4" />, href: "/admin/users/new" },
                      { label: "View Analytics", icon: <BarChart3 className="w-4 h-4" />, href: "/admin/analytics" },
                      { label: "Manage Renders", icon: <ImageIcon className="w-4 h-4" />, href: "/admin/renders" },
                      { label: "Settings", icon: <Settings className="w-4 h-4" />, href: "/admin/settings" },
                    ].map((action) => (
                      <Link key={action.label} href={action.href}>
                        <Button
                          variant="outline"
                          className="w-full justify-start border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600"
                        >
                          {action.icon}
                          <span className="ml-2 text-xs">{action.label}</span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4"
        >
          {[
            { label: "Server Load", value: "34%", icon: <Cpu className="w-4 h-4 text-cyan-500" />, status: "normal" },
            { label: "Database Size", value: "45.2 GB", icon: <Database className="w-4 h-4 text-violet-500" />, status: "normal" },
            { label: "Storage Used", value: "1.2 TB", icon: <HardDrive className="w-4 h-4 text-amber-500" />, status: "normal" },
            { label: "Bandwidth", value: "8.4 TB/mo", icon: <Globe className="w-4 h-4 text-green-500" />, status: "normal" },
          ].map((stat) => (
            <Card key={stat.label} className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-800">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">{stat.label}</p>
                    <p className="text-lg font-semibold text-white">{stat.value}</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
}