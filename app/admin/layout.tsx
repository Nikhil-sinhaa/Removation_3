'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
// TODO: Remnant Clerk imports: useUser, useAuth
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  CreditCard,
  Settings,
  BarChart3,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  Menu,
  ChevronLeft,
  LogOut,
  Shield,
  Activity,
  Database,
  FileText,
  HelpCircle,
  Zap,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Palette,
  MessageSquare,
  Flag,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  Edit3,
  MoreHorizontal,
  Home,
  Sparkles,
  Compass,
  PieChart,
  LineChart,
  Layers,
  Cpu,
  HardDrive,
  ExternalLink,
  Copy,
  Calendar,
  Filter,
  SlidersHorizontal,
  UserPlus,
  UserMinus,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone,
  Gift,
  Percent,
  Tag,
  Bookmark,
  Heart,
  Star,
  Award,
  Target,
  Briefcase,
  Building2,
  MapPin,
  Phone,
  Mail,
  Send,
  Inbox,
  Archive,
  FolderOpen,
  Cloud,
  CloudOff,
  Key,
  Fingerprint,
  Scan,
  QrCode,
  Smartphone,
  Laptop,
  Tablet,
  MousePointer,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Box,
  Package,
  Truck,
  ShoppingCart,
  Receipt,
  Wallet,
  Banknote,
  PiggyBank,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';

// Types
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  avatar?: string;
  permissions: string[];
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface SystemStatus {
  api: 'operational' | 'degraded' | 'down';
  database: 'operational' | 'degraded' | 'down';
  ai: 'operational' | 'degraded' | 'down';
  storage: 'operational' | 'degraded' | 'down';
}

interface QuickStat {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

// Context
interface AdminContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminLayout');
  }
  return context;
};

// Navigation item types
interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string | null;
  badgeColor?: string;
  children?: NavItem[];
}

interface SimpleNavItem {
  title: string;
  href: string;
  icon: any;
}

// Navigation items
const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    badge: null,
    children: [
      { title: 'Overview', href: '/admin/analytics', icon: PieChart },
      { title: 'Revenue', href: '/admin/analytics/revenue', icon: DollarSign },
      { title: 'Usage', href: '/admin/analytics/usage', icon: Activity },
      { title: 'Retention', href: '/admin/analytics/retention', icon: TrendingUp },
    ],
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    badge: '2.4k',
    children: [
      { title: 'All Users', href: '/admin/users', icon: Users },
      { title: 'Active', href: '/admin/users/active', icon: UserCheck },
      { title: 'Subscribed', href: '/admin/users/subscribed', icon: CreditCard },
      { title: 'Banned', href: '/admin/users/banned', icon: Ban },
    ],
  },
  {
    title: 'Renders',
    href: '/admin/renders',
    icon: ImageIcon,
    badge: '48.2k',
    children: [
      { title: 'All Renders', href: '/admin/renders', icon: Layers },
      { title: 'Processing', href: '/admin/renders/processing', icon: Loader2 },
      { title: 'Flagged', href: '/admin/renders/flagged', icon: Flag },
      { title: 'Gallery', href: '/admin/renders/gallery', icon: Palette },
    ],
  },
  {
    title: 'Approvals',
    href: '/admin/approvals',
    icon: ShieldCheck,
    badge: null,
  },
  {
    title: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: CreditCard,
    badge: null,
    children: [
      { title: 'Overview', href: '/admin/subscriptions', icon: CreditCard },
      { title: 'Plans', href: '/admin/subscriptions/plans', icon: Package },
      { title: 'Transactions', href: '/admin/subscriptions/transactions', icon: Receipt },
      { title: 'Refunds', href: '/admin/subscriptions/refunds', icon: RotateCcw },
    ],
  },
];

const systemNavItems: (NavItem | SimpleNavItem)[] = [
  {
    title: 'Vastu Engine',
    href: '/admin/vastu',
    icon: Compass,
  },
  {
    title: 'Cost Engine',
    href: '/admin/cost',
    icon: DollarSign,
  },
  {
    title: 'AI Models',
    href: '/admin/ai',
    icon: Cpu,
    badge: 'Live',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    title: 'Storage',
    href: '/admin/storage',
    icon: HardDrive,
    badge: '72%',
    badgeColor: 'bg-yellow-100 text-yellow-700',
  },
];

const settingsNavItems: SimpleNavItem[] = [
  {
    title: 'General',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    title: 'Security',
    href: '/admin/settings/security',
    icon: Shield,
  },
  {
    title: 'API Keys',
    href: '/admin/settings/api-keys',
    icon: Key,
  },
  {
    title: 'Webhooks',
    href: '/admin/settings/webhooks',
    icon: Zap,
  },
  {
    title: 'Audit Logs',
    href: '/admin/settings/audit-logs',
    icon: FileText,
  },
];

// Sample data
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'High API Usage',
    message: 'Replicate API usage has exceeded 80% of monthly quota.',
    time: '5 min ago',
    read: false,
    action: { label: 'View Usage', href: '/admin/analytics/usage' },
  },
  {
    id: '2',
    type: 'success',
    title: 'New Milestone',
    message: 'Congratulations! 50,000 renders completed.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'New User Signup',
    message: '156 new users signed up in the last 24 hours.',
    time: '2 hours ago',
    read: true,
  },
  {
    id: '4',
    type: 'error',
    title: 'Payment Failed',
    message: 'Subscription payment failed for 3 users.',
    time: '3 hours ago',
    read: false,
    action: { label: 'Review', href: '/admin/subscriptions/transactions' },
  },
];

const quickStats: QuickStat[] = [
  { label: 'Active Users', value: '2,847', change: 12.5, trend: 'up' },
  { label: "Today's Revenue", value: '₹1.2L', change: 8.3, trend: 'up' },
  { label: 'Renders Today', value: '4,521', change: -2.1, trend: 'down' },
  { label: 'API Latency', value: '142ms', change: 0, trend: 'neutral' },
];

// Components
function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/admin/dashboard" className="flex items-center gap-3 px-2">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <Shield className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col"
          >
            <span className="font-bold text-gray-900 text-lg leading-tight">
              Removation
            </span>
            <span className="text-xs text-orange-600 font-semibold">
              Admin Panel
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}

function NavItem({
  item,
  collapsed,
  isActive,
  isOpen,
  onToggle,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group',
        isActive
          ? 'bg-violet-100 text-violet-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
      onClick={hasChildren ? onToggle : undefined}
    >
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
          isActive ? 'bg-violet-200' : 'bg-transparent group-hover:bg-gray-200'
        )}
      >
        <Icon className={cn('w-5 h-5', isActive && 'text-violet-700')} />
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex-1 flex items-center justify-between overflow-hidden"
          >
            <span className="font-medium whitespace-nowrap">{item.title}</span>
            <div className="flex items-center gap-2">
              {item.badge && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs px-1.5 py-0',
                    item.badgeColor || 'bg-gray-100 text-gray-600'
                  )}
                >
                  {item.badge}
                </Badge>
              )}
              {hasChildren && (
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {hasChildren ? (
            <div>{content}</div>
          ) : (
            <Link href={item.href}>{content}</Link>
          )}
        </TooltipTrigger>
        <TooltipContent side="right" className="flex flex-col gap-1">
          <span className="font-medium">{item.title}</span>
          {hasChildren && (
            <span className="text-xs text-gray-400">Click to expand</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return hasChildren ? (
    <div>
      {content}
      <AnimatePresence>
        {isOpen && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-6 mt-1 space-y-1"
          >
            {item.children?.map((child) => {
              const ChildIcon = child.icon;
              const isChildActive = pathname === child.href;

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isChildActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  )}
                >
                  <ChildIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{child.title}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ) : (
    <Link href={item.href}>{content}</Link>
  );
}

function SimpleNavItem({
  item,
  collapsed,
  isActive,
}: {
  item: SimpleNavItem;
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
        isActive
          ? 'bg-violet-100 text-violet-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
          isActive ? 'bg-violet-200' : 'bg-transparent group-hover:bg-gray-200'
        )}
      >
        <Icon className={cn('w-5 h-5', isActive && 'text-violet-700')} />
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex-1"
          >
            <span className="font-medium whitespace-nowrap">{item.title}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={item.href}>{content}</Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return <Link href={item.href}>{content}</Link>;
}

function SystemStatus({ status }: { status: SystemStatus }) {
  const getStatusColor = (s: 'operational' | 'degraded' | 'down') => {
    switch (s) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
    }
  };

  const allOperational = Object.values(status).every((s) => s === 'operational');

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          System Status
        </span>
        {allOperational ? (
          <Badge className="bg-green-100 text-green-700 text-xs">
            All Systems Go
          </Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-700 text-xs">
            Issues Detected
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(status).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center gap-2 text-xs text-gray-600"
          >
            <div className={cn('w-2 h-2 rounded-full', getStatusColor(value))} />
            <span className="capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickStatsBar({ stats }: { stats: QuickStat[] }) {
  return (
    <div className="hidden xl:flex items-center gap-6 px-4 py-2 bg-gray-50 border-b border-gray-100">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3">
          <div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
          </div>
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              stat.trend === 'up' && 'text-green-600',
              stat.trend === 'down' && 'text-red-600',
              stat.trend === 'neutral' && 'text-gray-500'
            )}
          >
            {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {stat.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {stat.change !== 0 && (
              <span>{stat.change > 0 ? '+' : ''}{stat.change}%</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer',
        !notification.read && 'bg-violet-50/50'
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-gray-400">{notification.time}</span>
          {notification.action && (
            <Link
              href={notification.action.href}
              className="text-xs text-violet-600 font-medium hover:text-violet-700"
            >
              {notification.action.label}
            </Link>
          )}
        </div>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0" />
      )}
    </div>
  );
}

function Sidebar({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse: () => void;
}) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (href: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const systemStatus: SystemStatus = {
    api: 'operational',
    database: 'operational',
    ai: 'operational',
    storage: 'degraded',
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-gray-200',
        'hidden lg:flex'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <Logo collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className="w-8 h-8 rounded-lg"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main
            </p>
          )}
          {mainNavItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={pathname.startsWith(item.href)}
              isOpen={openItems.has(item.href)}
              onToggle={() => toggleItem(item.href)}
            />
          ))}
        </div>

        <Separator className="my-4" />

        {/* System Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              System
            </p>
          )}
          {systemNavItems.map((item) => {
            if ('children' in item || 'badge' in item) {
              // This is a NavItem
              const navItem = item as NavItem;
              return (
                <NavItem
                  key={navItem.href}
                  item={navItem}
                  collapsed={collapsed}
                  isActive={pathname === navItem.href}
                  isOpen={false}
                  onToggle={() => {}}
                />
              );
            } else {
              // This is a SimpleNavItem
              const simpleItem = item as SimpleNavItem;
              return (
                <SimpleNavItem
                  key={simpleItem.href}
                  item={simpleItem}
                  collapsed={collapsed}
                  isActive={pathname === simpleItem.href}
                />
              );
            }
          })}
        </div>

        <Separator className="my-4" />

        {/* Settings Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Settings
            </p>
          )}
          {settingsNavItems.map((item) => (
            <SimpleNavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </ScrollArea>

      {/* System Status */}
      {!collapsed && (
        <div className="border-t border-gray-100">
          <SystemStatus status={systemStatus} />
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors',
                collapsed && 'justify-center'
              )}
            >
              <ExternalLink className="w-5 h-5" />
              {!collapsed && <span className="font-medium">View Website</span>}
            </Link>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">View Website</TooltipContent>}
        </Tooltip>
      </div>
    </motion.aside>
  );
}

function Header({
  sidebarCollapsed,
  onMenuClick,
}: {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}) {
  const { user, isLoading: isLoaded, logout } = useAuth();
  const isSignedIn = !!user;
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [commandOpen, setCommandOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get breadcrumbs
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
      href: '/' + paths.slice(0, index + 1).join('/'),
      isLast: index === paths.length - 1,
    }));
  };

  const breadcrumbs = getBreadcrumbs();

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({
      title: 'Notifications cleared',
      description: 'All notifications marked as read',
    });
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100',
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:left-20' : 'lg:left-[280px]',
          'left-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 lg:px-6 gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden w-10 h-10"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link
                href="/admin/dashboard"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Home className="w-4 h-4" />
              </Link>
              {breadcrumbs.map((crumb) => (
                <div key={crumb.href} className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  {crumb.isLast ? (
                    <span className="font-medium text-gray-900">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search / Command Palette Trigger */}
            <Button
              variant="outline"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 w-64 justify-start text-gray-400 font-normal"
            >
              <Search className="w-4 h-4" />
              <span>Search...</span>
              <div className="ml-auto flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">K</kbd>
              </div>
            </Button>

            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCommandOpen(true)}
              className="sm:hidden w-10 h-10"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Refresh Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10">
                  <RefreshCw className="w-5 h-5 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh Data</TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative w-10 h-10">
                  <Bell className="w-5 h-5 text-gray-500" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="text-xs text-violet-600 hover:text-violet-700"
                  >
                    Mark all read
                  </Button>
                </div>
                <ScrollArea className="h-96">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  )}
                </ScrollArea>
                <div className="p-3 border-t border-gray-100">
                  <Link
                    href="/admin/notifications"
                    className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                  >
                    View all notifications
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-8 mx-2" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 px-2 py-1.5 h-auto"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold">
                      {user?.firstName?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.fullName || 'Admin User'}
                    </span>
                    <span className="text-xs text-gray-500">Super Admin</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold">
                        {user?.firstName?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user?.fullName || 'Admin User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Activity className="w-4 h-4 mr-2" />
                    Activity Log
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Documentation
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <QuickStatsBar stats={quickStats} />
      </header>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search users, renders, analytics..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => router.push('/admin/users')}>
              <Users className="w-4 h-4 mr-2" />
              View All Users
              <CommandShortcut>⌘U</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => router.push('/admin/renders')}>
              <ImageIcon className="w-4 h-4 mr-2" />
              View All Renders
              <CommandShortcut>⌘R</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => router.push('/admin/analytics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics Dashboard
              <CommandShortcut>⌘A</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => {
                    router.push(item.href);
                    setCommandOpen(false);
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.title}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="System">
            {systemNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => {
                    router.push(item.href);
                    setCommandOpen(false);
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.title}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (href: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="h-16 flex items-center px-6 border-b border-gray-100">
          <Logo collapsed={false} />
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main
              </p>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                const isOpen = openItems.has(item.href);
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <div key={item.href}>
                    <div
                      onClick={() => {
                        if (hasChildren) {
                          toggleItem(item.href);
                        } else {
                          onClose();
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors',
                        isActive
                          ? 'bg-violet-100 text-violet-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 font-medium">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {hasChildren && (
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 transition-transform',
                            isOpen && 'rotate-90'
                          )}
                        />
                      )}
                    </div>
                    <AnimatePresence>
                      {isOpen && hasChildren && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-6 mt-1 space-y-1"
                        >
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onClose}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                                  pathname === child.href
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'text-gray-500 hover:bg-gray-50'
                                )}
                              >
                                <ChildIcon className="w-4 h-4" />
                                <span className="text-sm">{child.title}</span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* System Navigation */}
            <div className="space-y-1">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                System
              </p>
              {systemNavItems.map((item) => {
                const Icon = item.icon;
                const isNavItem = 'badge' in item;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                      pathname === item.href
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 font-medium">{item.title}</span>
                    {isNavItem && (item as NavItem).badge && (
                      <Badge
                        className={cn(
                          'text-xs',
                          (item as NavItem).badgeColor || 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {(item as NavItem).badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>

            <Separator />

            {/* Settings Navigation */}
            <div className="space-y-1">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Settings
              </p>
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                      pathname === item.href
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-violet-600/25">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 border-4 border-violet-200 border-t-violet-600 rounded-full"
          />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Admin Panel</h2>
        <p className="text-gray-500">Please wait...</p>
      </motion.div>
    </div>
  );
}

function AccessDenied() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          You don't have permission to access the admin panel. Please contact your
          administrator if you believe this is an error.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => router.push('/')}>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Main Layout Component
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const isLoaded = !isLoading;
  const isSignedIn = !!user;
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Check authorization
  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/sign-in?redirect_url=/admin/dashboard');
      return;
    }

    const hasAdminAccess = user.role === 'admin';
    setIsAuthorized(hasAdminAccess);
  }, [isLoaded, user, router]);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Loading state
  if (!isLoaded || isAuthorized === null) {
    return <LoadingScreen />;
  }

  // Access denied
  if (!isAuthorized) {
    return <AccessDenied />;
  }

  const contextValue: AdminContextType = {
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    setTheme,
    notifications,
    markAsRead,
    clearAllNotifications,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Mobile Sidebar */}
          <MobileSidebar
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />

          {/* Header */}
          <Header
            sidebarCollapsed={sidebarCollapsed}
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          {/* Main Content */}
          <main
            className={cn(
              'min-h-screen pt-16 xl:pt-[104px] transition-all duration-300',
              sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-[280px]'
            )}
          >
            <div className="p-4 lg:p-6 xl:p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </div>
          </main>

          {/* Floating Action Button (Mobile) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full shadow-lg shadow-violet-600/25 flex items-center justify-center z-40"
            onClick={() => router.push('/admin/users')}
          >
            <UserPlus className="w-6 h-6" />
          </motion.button>
        </div>
      </TooltipProvider>
    </AdminContext.Provider>
  );
}