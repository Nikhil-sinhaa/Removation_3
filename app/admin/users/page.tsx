// app/admin/users/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Trash2,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Crown,
  Zap,
  CreditCard,
  Image as ImageIcon,
  Activity,
  TrendingUp,
  Globe,
  Smartphone,
  MapPin,
  ExternalLink,
  Copy,
  X,
  Grid3X3,
  List,
  BarChart3,
  DollarSign,
  IndianRupee,
  Sparkles,
  Home,
  Settings,
  Key,
  Lock,
  Unlock,
  Send,
  MessageSquare,
  Bell,
  Star,
  Gift,
  Award,
  Flame,
  Target,
  FileText,
  MoreVertical,
  Edit,
  History,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

// Types
interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatar?: string;
  plan: "free" | "pro" | "teams" | "enterprise";
  status: "active" | "inactive" | "suspended" | "banned";
  role: "user" | "admin" | "super_admin";
  credits: number;
  totalRenders: number;
  vastuScans: number;
  costCalculations: number;
  favoriteStyles: string[];
  country: string;
  city: string;
  language: string;
  device: string;
  lastActive: string;
  createdAt: string;
  subscription?: {
    status: "active" | "cancelled" | "expired" | "trial";
    startDate: string;
    endDate: string;
    amount: number;
    currency: string;
    provider: "stripe" | "razorpay";
  };
  activity: {
    loginCount: number;
    lastLogin: string;
    projectsCreated: number;
    imagesUploaded: number;
  };
  flags: {
    isVerified: boolean;
    isEmailVerified: boolean;
    isTwoFactorEnabled: boolean;
    hasCompletedOnboarding: boolean;
    acceptedTerms: boolean;
  };
  metadata: {
    referralSource?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  banned: number;
  free: number;
  pro: number;
  teams: number;
  enterprise: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
}

// Mock stats fallback (used until API responds)
const defaultStats: UserStats = {
  total: 0,
  active: 0,
  inactive: 0,
  suspended: 0,
  banned: 0,
  free: 0,
  pro: 0,
  teams: 0,
  enterprise: 0,
  newToday: 0,
  newThisWeek: 0,
  newThisMonth: 0,
};

// We keep generateMockUsers only as a fallback if API is unavailable
const generateMockUsers = (count: number): User[] => [];
const mockUsers: User[] = [];

const countries = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
];

const favoriteStyles = [
  "Modern Minimalist",
  "Scandinavian",
  "Industrial",
  "Contemporary",
  "Traditional Indian",
  "Bohemian",
  "Japanese Zen",
  "Art Deco",
];

const devices = ["Desktop", "Mobile", "Tablet"];


// Components
const StatCard = ({ 
  title, 
  value, 
  icon, 
  color,
  trend,
  subValue,
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  trend?: string;
  subValue?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className="relative"
  >
    <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-white">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              {trend && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                  {trend}
                </Badge>
              )}
            </div>
            {subValue && (
              <p className="text-xs text-neutral-400 mt-1">{subValue}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color.replace('bg-', 'bg-opacity-20 bg-')}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const StatusBadge = ({ status }: { status: User["status"] }) => {
  const config = {
    active: { 
      bg: "bg-green-500/10", 
      text: "text-green-400", 
      border: "border-green-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    inactive: { 
      bg: "bg-neutral-500/10", 
      text: "text-neutral-400", 
      border: "border-neutral-500/30",
      icon: <Clock className="w-3 h-3" />
    },
    suspended: { 
      bg: "bg-amber-500/10", 
      text: "text-amber-400", 
      border: "border-amber-500/30",
      icon: <AlertTriangle className="w-3 h-3" />
    },
    banned: { 
      bg: "bg-red-500/10", 
      text: "text-red-400", 
      border: "border-red-500/30",
      icon: <Ban className="w-3 h-3" />
    },
  };

  const { bg, text, border, icon } = config[status];

  return (
    <Badge variant="outline" className={`${bg} ${text} ${border} flex items-center gap-1`}>
      {icon}
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

const PlanBadge = ({ plan }: { plan: User["plan"] }) => {
  const config = {
    free: { bg: "bg-neutral-500/10", text: "text-neutral-400", border: "border-neutral-500/30", icon: null },
    pro: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30", icon: <Zap className="w-3 h-3" /> },
    teams: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", icon: <Users className="w-3 h-3" /> },
    enterprise: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", icon: <Crown className="w-3 h-3" /> },
  };

  const { bg, text, border, icon } = config[plan];

  return (
    <Badge variant="outline" className={`${bg} ${text} ${border} flex items-center gap-1`}>
      {icon}
      <span className="capitalize">{plan}</span>
    </Badge>
  );
};

const RoleBadge = ({ role }: { role: User["role"] }) => {
  const config = {
    user: { bg: "bg-neutral-500/10", text: "text-neutral-400", border: "border-neutral-500/30" },
    admin: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
    super_admin: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  };

  const { bg, text, border } = config[role];

  return (
    <Badge variant="outline" className={`${bg} ${text} ${border}`}>
      {role === "super_admin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
};

const UserCard = ({ 
  user, 
  isSelected, 
  onSelect, 
  onView,
  onAction,
}: { 
  user: User; 
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (user: User) => void;
  onAction: (action: string, userId: string) => void;
}) => {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const getCountryFlag = (country: string) => {
    const c = countries.find(c => c.name === country);
    return c ? c.flag : "🌍";
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`relative group rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected 
          ? "border-violet-500 bg-violet-500/5" 
          : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
      }`}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(user.id)}
          className="bg-neutral-900/80 border-neutral-600"
        />
      </div>

      {/* Role Badge */}
      {user.role !== "user" && (
        <div className="absolute top-3 right-3 z-10">
          <RoleBadge role={user.role} />
        </div>
      )}

      {/* User Header */}
      <div className="p-5 pb-4 text-center border-b border-neutral-800">
        <Avatar className="w-20 h-20 mx-auto ring-4 ring-neutral-800 group-hover:ring-violet-500/30 transition-all">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white">
            {user.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold text-white mt-3">{user.name}</h3>
        <p className="text-sm text-neutral-400">{user.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <StatusBadge status={user.status} />
          <PlanBadge plan={user.plan} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-neutral-800 border-b border-neutral-800">
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-white">{user.totalRenders}</p>
          <p className="text-xs text-neutral-500">Renders</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-white">{user.credits}</p>
          <p className="text-xs text-neutral-500">Credits</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-white">{user.activity.projectsCreated}</p>
          <p className="text-xs text-neutral-500">Projects</p>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Location
          </span>
          <span className="text-neutral-300">
            {getCountryFlag(user.country)} {user.city}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            Device
          </span>
          <span className="text-neutral-300">{user.device}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Last Active
          </span>
          <span className="text-neutral-300">{timeAgo(user.lastActive)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Joined
          </span>
          <span className="text-neutral-300">{formatDate(user.createdAt)}</span>
        </div>
      </div>

      {/* Verification Badges */}
      <div className="px-4 pb-4 flex items-center gap-2">
        {user.flags.isVerified && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 p-1">
                  <ShieldCheck className="w-3 h-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Verified User</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {user.flags.isEmailVerified && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 p-1">
                  <Mail className="w-3 h-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Email Verified</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {user.flags.isTwoFactorEnabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 p-1">
                  <Lock className="w-3 h-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>2FA Enabled</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 border-neutral-700"
          onClick={() => onView(user)}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="border-neutral-700">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction("email", user.id)}>
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("credits", user.id)}>
              <Gift className="w-4 h-4 mr-2" />
              Add Credits
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Crown className="w-4 h-4 mr-2" />
                Change Plan
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onAction("plan-free", user.id)}>Free</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("plan-pro", user.id)}>Pro</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("plan-teams", user.id)}>Teams</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("plan-enterprise", user.id)}>Enterprise</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            {user.status === "suspended" ? (
              <DropdownMenuItem onClick={() => onAction("unsuspend", user.id)}>
                <Unlock className="w-4 h-4 mr-2" />
                Unsuspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onAction("suspend", user.id)}>
                <Lock className="w-4 h-4 mr-2" />
                Suspend
              </DropdownMenuItem>
            )}
            {user.status === "banned" ? (
              <DropdownMenuItem onClick={() => onAction("unban", user.id)}>
                <UserCheck className="w-4 h-4 mr-2" />
                Unban
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onAction("ban", user.id)} className="text-red-500">
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction("delete", user.id)} className="text-red-500">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

const UserTableRow = ({ 
  user, 
  isSelected, 
  onSelect, 
  onView,
  onAction,
}: { 
  user: User; 
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (user: User) => void;
  onAction: (action: string, userId: string) => void;
}) => {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const getCountryFlag = (country: string) => {
    const c = countries.find(c => c.name === country);
    return c ? c.flag : "🌍";
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors ${
        isSelected ? "bg-violet-500/5" : ""
      }`}
    >
      <td className="p-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(user.id)}
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white text-sm">
              {user.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">{user.name}</p>
              {user.role !== "user" && <RoleBadge role={user.role} />}
            </div>
            <p className="text-xs text-neutral-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="p-4">
        <PlanBadge plan={user.plan} />
      </td>
      <td className="p-4">
        <span className="text-sm text-neutral-300">{user.credits}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-neutral-300">{user.totalRenders}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-neutral-300">
          {getCountryFlag(user.country)} {user.country}
        </span>
      </td>
      <td className="p-4">
        <span className="text-sm text-neutral-400">{timeAgo(user.lastActive)}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-neutral-400">{formatDate(user.createdAt)}</span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          {user.flags.isVerified && (
            <ShieldCheck className="w-4 h-4 text-green-500" />
          )}
          {user.flags.isTwoFactorEnabled && (
            <Lock className="w-4 h-4 text-violet-500" />
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => onView(user)}>
            <Eye className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction("email", user.id)}>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("credits", user.id)}>
                <Gift className="w-4 h-4 mr-2" />
                Add Credits
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status !== "banned" && (
                <DropdownMenuItem onClick={() => onAction("ban", user.id)} className="text-red-500">
                  <Ban className="w-4 h-4 mr-2" />
                  Ban User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onAction("delete", user.id)} className="text-red-500">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </motion.tr>
  );
};

const UserDetailsSheet = ({ 
  user, 
  isOpen, 
  onClose,
  onAction,
}: { 
  user: User | null; 
  isOpen: boolean; 
  onClose: () => void;
  onAction: (action: string, userId: string) => void;
}) => {
  if (!user) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCountryFlag = (country: string) => {
    const c = countries.find(c => c.name === country);
    return c ? c.flag : "🌍";
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl bg-neutral-900 border-neutral-800 overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 ring-4 ring-neutral-800">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white">
                {user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-white flex items-center gap-2">
                {user.name}
                {user.role !== "user" && <RoleBadge role={user.role} />}
              </SheetTitle>
              <SheetDescription className="mt-1">{user.email}</SheetDescription>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={user.status} />
                <PlanBadge plan={user.plan} />
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid grid-cols-4 bg-neutral-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="subscription">Billing</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-neutral-800 bg-neutral-800/50">
                <CardContent className="p-4 text-center">
                  <ImageIcon className="w-6 h-6 text-violet-500 mx-auto" />
                  <p className="text-2xl font-bold text-white mt-2">{user.totalRenders}</p>
                  <p className="text-xs text-neutral-500">Total Renders</p>
                </CardContent>
              </Card>
              <Card className="border-neutral-800 bg-neutral-800/50">
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 text-amber-500 mx-auto" />
                  <p className="text-2xl font-bold text-white mt-2">{user.credits}</p>
                  <p className="text-xs text-neutral-500">Credits Left</p>
                </CardContent>
              </Card>
              <Card className="border-neutral-800 bg-neutral-800/50">
                <CardContent className="p-4 text-center">
                  <Sparkles className="w-6 h-6 text-orange-500 mx-auto" />
                  <p className="text-2xl font-bold text-white mt-2">{user.vastuScans}</p>
                  <p className="text-xs text-neutral-500">Vastu Scans</p>
                </CardContent>
              </Card>
              <Card className="border-neutral-800 bg-neutral-800/50">
                <CardContent className="p-4 text-center">
                  <IndianRupee className="w-6 h-6 text-green-500 mx-auto" />
                  <p className="text-2xl font-bold text-white mt-2">{user.costCalculations}</p>
                  <p className="text-xs text-neutral-500">Cost Estimates</p>
                </CardContent>
              </Card>
            </div>

            {/* Details */}
            <Card className="border-neutral-800 bg-neutral-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">User Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">User ID</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-neutral-300 bg-neutral-800 px-2 py-1 rounded">
                      {user.id.slice(0, 20)}...
                    </code>
                    <Button variant="ghost" size="icon" className="w-6 h-6">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Location</span>
                  <span className="text-sm text-white">
                    {getCountryFlag(user.country)} {user.city}, {user.country}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Language</span>
                  <span className="text-sm text-white">{user.language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Device</span>
                  <span className="text-sm text-white">{user.device}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Joined</span>
                  <span className="text-sm text-white">{formatDate(user.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Favorite Styles */}
            <Card className="border-neutral-800 bg-neutral-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">Favorite Styles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.favoriteStyles.map((style) => (
                    <Badge key={style} variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                      {style}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            {user.metadata.referralSource && (
              <Card className="border-neutral-800 bg-neutral-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Acquisition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Referral Source</span>
                    <span className="text-sm text-white capitalize">{user.metadata.referralSource}</span>
                  </div>
                  {user.metadata.utmCampaign && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Campaign</span>
                      <span className="text-sm text-white">{user.metadata.utmCampaign}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4 space-y-6">
            <Card className="border-neutral-800 bg-neutral-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">Activity Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Total Logins</span>
                  <span className="text-sm text-white">{user.activity.loginCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Last Login</span>
                  <span className="text-sm text-white">{formatDate(user.activity.lastLogin)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Last Active</span>
                  <span className="text-sm text-white">{formatDate(user.lastActive)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Projects Created</span>
                  <span className="text-sm text-white">{user.activity.projectsCreated}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Images Uploaded</span>
                  <span className="text-sm text-white">{user.activity.imagesUploaded}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-neutral-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "Generated render", time: "2 hours ago", icon: <ImageIcon className="w-4 h-4 text-violet-500" /> },
                    { action: "Ran Vastu analysis", time: "5 hours ago", icon: <Sparkles className="w-4 h-4 text-orange-500" /> },
                    { action: "Created project", time: "1 day ago", icon: <Home className="w-4 h-4 text-blue-500" /> },
                    { action: "Updated settings", time: "2 days ago", icon: <Settings className="w-4 h-4 text-neutral-500" /> },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-neutral-700/50">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{item.action}</p>
                        <p className="text-xs text-neutral-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="mt-4 space-y-6">
            {user.subscription ? (
              <>
                <Card className="border-neutral-800 bg-neutral-800/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">Subscription Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Status</span>
                      <Badge variant="outline" className={`${
                        user.subscription.status === "active" 
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}>
                        {user.subscription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Plan</span>
                      <PlanBadge plan={user.plan} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Amount</span>
                      <span className="text-sm text-white">
                        {user.subscription.currency === "INR" ? "₹" : "$"}
                        {user.subscription.amount}/{user.plan === "teams" ? "user/" : ""}mo
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Provider</span>
                      <span className="text-sm text-white capitalize">{user.subscription.provider}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Start Date</span>
                      <span className="text-sm text-white">{formatDate(user.subscription.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Next Billing</span>
                      <span className="text-sm text-white">{formatDate(user.subscription.endDate)}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-neutral-700">
                    <CreditCard className="w-4 h-4 mr-2" />
                    View Invoices
                  </Button>
                  <Button variant="outline" className="flex-1 border-neutral-700 text-red-400 hover:text-red-300">
                    Cancel Subscription
                  </Button>
                </div>
              </>
            ) : (
              <Card className="border-neutral-800 bg-neutral-800/50">
                <CardContent className="p-8 text-center">
                  <CreditCard className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-white font-medium">No Active Subscription</p>
                  <p className="text-sm text-neutral-400 mt-1">This user is on the free plan</p>
                  <Button className="mt-4 bg-gradient-to-r from-violet-600 to-blue-600">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade User
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-6">
            <Card className="border-neutral-800 bg-neutral-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">Security Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-300">Email Verified</span>
                  </div>
                  <Badge variant="outline" className={`${
                    user.flags.isEmailVerified
                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  }`}>
                    {user.flags.isEmailVerified ? "Verified" : "Not Verified"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-300">Account Verified</span>
                  </div>
                  <Badge variant="outline" className={`${
                    user.flags.isVerified
                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                      : "bg-neutral-500/10 text-neutral-400 border-neutral-500/30"
                  }`}>
                    {user.flags.isVerified ? "Verified" : "Not Verified"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-300">Two-Factor Auth</span>
                  </div>
                  <Badge variant="outline" className={`${
                    user.flags.isTwoFactorEnabled
                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                      : "bg-neutral-500/10 text-neutral-400 border-neutral-500/30"
                  }`}>
                    {user.flags.isTwoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-300">Terms Accepted</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                    Accepted
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button variant="outline" className="w-full border-neutral-700 justify-start">
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
              <Button variant="outline" className="w-full border-neutral-700 justify-start">
                <Send className="w-4 h-4 mr-2" />
                Send Verification Email
              </Button>
              <Button variant="outline" className="w-full border-neutral-700 justify-start text-amber-400 hover:text-amber-300">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Force Logout All Sessions
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6 pt-6 border-t border-neutral-800">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1 border-neutral-700">
              Close
            </Button>
            {user.status === "banned" ? (
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onAction("unban", user.id)}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Unban User
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => onAction("ban", user.id)}
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// Main Component
export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    tabParam === 'active' || tabParam === 'banned' || tabParam === 'suspended' ? tabParam : 'all'
  );
  const [planFilter, setPlanFilter] = useState<string>(
    tabParam === 'subscribed' ? 'pro' : 'all'
  );
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [actionUserId, setActionUserId] = useState<string>("");
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();
  const itemsPerPage = viewMode === "grid" ? 12 : 15;

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/admin/users?limit=100');
        if (res.ok) {
          const data = await res.json();
          // Map API users to the local User type
          const mapped: User[] = (data.users ?? []).map((u: any) => ({
            id: u._id,
            clerkId: u.clerkId ?? u._id,
            email: u.email,
            name: [(u.firstName ?? ''), (u.lastName ?? '')].filter(Boolean).join(' ') || u.email,
            avatar: u.imageUrl,
            plan: (u.subscription?.plan ?? 'free') as User['plan'],
            status: 'active' as User['status'],
            role: (u.role === 'admin' ? 'admin' : 'user') as User['role'],
            credits: u.credits ?? u.subscription?.credits ?? 0,
            totalRenders: 0,
            vastuScans: 0,
            costCalculations: 0,
            favoriteStyles: [],
            country: '',
            city: '',
            language: 'en',
            device: 'Desktop',
            lastActive: u.updatedAt ?? u.createdAt,
            createdAt: u.createdAt,
            activity: { loginCount: 0, lastLogin: u.updatedAt ?? u.createdAt, projectsCreated: 0, imagesUploaded: 0 },
            flags: { isVerified: u.isVerified ?? false, isEmailVerified: u.isVerified ?? false, isTwoFactorEnabled: false, hasCompletedOnboarding: false, acceptedTerms: true },
            metadata: {},
          }));
          setUsers(mapped);
          // Derive stats from the full set
          setStats(prev => ({
            ...prev,
            total: data.total ?? mapped.length,
            free: mapped.filter(u => u.plan === 'free').length,
            pro: mapped.filter(u => u.plan === 'pro').length,
            teams: mapped.filter(u => u.plan === 'teams').length,
            enterprise: mapped.filter(u => u.plan === 'enterprise').length,
          }));
        }
      } catch (e) {
        // silently fall back to empty list
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter(u => u.plan === planFilter);
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Country filter
    if (countryFilter !== "all") {
      filtered = filtered.filter(u => u.country === countryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "renders":
          comparison = a.totalRenders - b.totalRenders;
          break;
        case "credits":
          comparison = a.credits - b.credits;
          break;
        case "lastActive":
          comparison = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [users, searchQuery, statusFilter, planFilter, roleFilter, countryFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleAction = (action: string, userId: string) => {
    setActionType(action);
    setActionUserId(userId);
    
    if (action === "ban" || action === "delete" || action === "suspend") {
      setIsActionDialogOpen(true);
    } else {
      // Handle other actions directly
      executeAction(action, userId);
    }
  };

  const executeAction = async (action: string, userId: string) => {
    setIsActionLoading(true);
    try {
      let res: Response | null = null;

      if (action === "ban" || action === "unban" || action === "suspend" || action === "unsuspend") {
        const newStatus = (action === "ban") ? "banned"
          : (action === "suspend") ? "suspended"
          : "active";
        res = await fetch(`/api/admin/users/${userId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, status: newStatus as User["status"] } : u
          ));
          toast({ title: "Done", description: `User ${action}ned successfully.` });
        }
      } else if (action === "delete") {
        res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        if (res.ok) {
          setUsers(prev => prev.filter(u => u.id !== userId));
          setSelectedUsers(prev => prev.filter(id => id !== userId));
          toast({ title: "Deleted", description: "User permanently deleted." });
        }
      } else if (action.startsWith("plan-")) {
        const plan = action.replace("plan-", "") as User["plan"];
        res = await fetch(`/api/admin/users/${userId}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        if (res.ok) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u));
          toast({ title: "Plan updated", description: `Plan changed to ${plan}.` });
        }
      } else if (action === "makeAdmin" || action === "removeAdmin") {
        const role = action === "makeAdmin" ? "admin" : "customer";
        res = await fetch(`/api/admin/users/${userId}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        if (res.ok) {
          setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, role: (role === "admin" ? "admin" : "user") as User["role"] } : u
          ));
          toast({ title: "Role updated", description: `Role changed to ${role}.` });
        }
      } else {
        console.log(`Unhandled action: ${action} for user: ${userId}`);
      }

      if (res && !res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "Error",
          description: (err as { message?: string }).message ?? "Action failed",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Network error",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setIsActionDialogOpen(false);
      setIsDetailsOpen(false);
    }
  };

  const handleBulkAction = (action: string) => {
    selectedUsers.forEach(userId => executeAction(action, userId));
    setSelectedUsers([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64 bg-neutral-800" />
            <Skeleton className="h-10 w-32 bg-neutral-800" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-neutral-800 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 bg-neutral-800 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 bg-neutral-800 rounded-xl" />
            ))}
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
              <Users className="w-8 h-8 text-violet-500" />
              User Management
            </h1>
            <p className="text-neutral-400 mt-1">
              Manage and monitor all platform users
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-neutral-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Link href="/admin/users/new">
              <Button className="bg-gradient-to-r from-violet-600 to-blue-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Users"
            value={stats.total}
            icon={<Users className="w-5 h-5 text-violet-500" />}
            color="bg-violet-500"
            trend="+12%"
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
            color="bg-green-500"
          />
          <StatCard
            title="Pro Users"
            value={stats.pro}
            icon={<Zap className="w-5 h-5 text-amber-500" />}
            color="bg-amber-500"
          />
          <StatCard
            title="Teams"
            value={stats.teams}
            icon={<Users className="w-5 h-5 text-blue-500" />}
            color="bg-blue-500"
          />
          <StatCard
            title="New Today"
            value={stats.newToday}
            icon={<UserPlus className="w-5 h-5 text-cyan-500" />}
            color="bg-cyan-500"
            trend="+8%"
          />
          <StatCard
            title="Suspended"
            value={stats.suspended + stats.banned}
            icon={<Ban className="w-5 h-5 text-red-500" />}
            color="bg-red-500"
          />
        </div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-neutral-800 border-neutral-700"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-32 bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="teams">Teams</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32 bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36 bg-neutral-800 border-neutral-700">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Join Date</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="renders">Renders</SelectItem>
                      <SelectItem value="credits">Credits</SelectItem>
                      <SelectItem value="lastActive">Last Active</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                    className="border-neutral-700"
                  >
                    {sortOrder === "asc" ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                  </Button>

                  <div className="flex items-center border border-neutral-700 rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="rounded-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className="rounded-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              <AnimatePresence>
                {selectedUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-800"
                  >
                    <span className="text-sm text-neutral-400">
                      {selectedUsers.length} selected
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction("email")}>
                      <Mail className="w-4 h-4 mr-1" />
                      Email All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction("suspend")}>
                      <Lock className="w-4 h-4 mr-1" />
                      Suspend All
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete All
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </span>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-neutral-400">Select all on page</span>
          </div>
        </div>

        {/* Users Grid/Table */}
        {viewMode === "grid" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {paginatedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isSelected={selectedUsers.includes(user.id)}
                onSelect={handleSelectUser}
                onView={handleViewUser}
                onAction={handleAction}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
              <ScrollArea className="w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-800/50">
                      <th className="p-4 text-left">
                        <Checkbox
                          checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">User</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Status</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Plan</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Credits</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Renders</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Country</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Last Active</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Joined</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Verified</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        isSelected={selectedUsers.includes(user.id)}
                        onSelect={handleSelectUser}
                        onView={handleViewUser}
                        onAction={handleAction}
                      />
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Users className="w-16 h-16 text-neutral-700 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
            <p className="text-neutral-400">Try adjusting your filters or search query</p>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-neutral-400">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="border-neutral-700"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-neutral-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "bg-violet-600" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-neutral-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="border-neutral-700"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* User Details Sheet */}
      <UserDetailsSheet
        user={selectedUser}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedUser(null);
        }}
        onAction={handleAction}
      />

      {/* Action Confirmation Dialog */}
      <AlertDialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {actionType === "ban" && "Ban User"}
              {actionType === "delete" && "Delete User"}
              {actionType === "suspend" && "Suspend User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "ban" && "Are you sure you want to ban this user? They will lose access to all platform features."}
              {actionType === "delete" && "Are you sure you want to delete this user? This action cannot be undone."}
              {actionType === "suspend" && "Are you sure you want to suspend this user? They will be temporarily locked out."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeAction(actionType, actionUserId)}
              className={actionType === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}
            >
              {actionType === "ban" && "Ban User"}
              {actionType === "delete" && "Delete User"}
              {actionType === "suspend" && "Suspend User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}