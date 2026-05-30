// app/(app)/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
// TODO: Remnant Clerk imports: useUser
import {
  Plus,
  Upload,
  Wand2,
  ArrowRight,
  Clock,
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  Compass,
  IndianRupee,
  ChevronRight,
  Play,
  Star,
  Zap,
  Home,
  Sofa,
  ChefHat,
  Bed,
  Bath,
  TreePine,
  Building2,
  Palette,
  MoreHorizontal,
  Heart,
  Share2,
  Download,
  Eye,
  Calendar,
  Target,
  Award,
  Gift,
  Bell,
  ArrowUpRight,
  Flame,
  Crown,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Video,
  MousePointer,
  Command,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
};

// Types
interface Project {
  id: string;
  name: string;
  nameKey?: string;
  thumbnail: string;
  style: string;
  styleKey?: string;
  roomType: string;
  roomTypeKey?: string;
  updatedAt: string;
  updatedAtKey?: string;
  renders: number;
  vastuScore?: number;
  isFavorite: boolean;
}

interface UserStats {
  projectsCreated: number;
  aiRenders: number;
  creditsLeft: number;
  totalCredits: number;
  streak: number;
  savedDesigns: number;
}

interface Activity {
  id: string;
  type: 'render' | 'project' | 'achievement' | 'vastu';
  message: string;
  messageKey?: string;
  timeKey?: string;
  params?: Record<string, string>;
  time: string;
  icon: typeof Wand2;
  color: string;
}

// Sample data
const sampleProjects: Project[] = [
  {
    id: '1',
    name: 'Living Room Makeover',
    nameKey: 'db_project_living_room_makeover',
    thumbnail: '/images/samples/living-room.jpg',
    style: 'Modern Minimalist',
    styleKey: 'style_modern_minimalist',
    roomType: 'Living Room',
    roomTypeKey: 'room_living_room',
    updatedAt: '2 hours ago',
    updatedAtKey: 'db_time_2_hours_ago',
    renders: 5,
    vastuScore: 85,
    isFavorite: true,
  },
  {
    id: '2',
    name: 'Bedroom Redesign',
    nameKey: 'db_project_bedroom_redesign',
    thumbnail: '/images/samples/bedroom.jpg',
    style: 'Scandinavian',
    styleKey: 'style_scandinavian',
    roomType: 'Bedroom',
    roomTypeKey: 'room_bedroom',
    updatedAt: '1 day ago',
    updatedAtKey: 'db_time_1_day_ago',
    renders: 3,
    vastuScore: 72,
    isFavorite: false,
  },
  {
    id: '3',
    name: 'Kitchen Renovation',
    nameKey: 'db_project_kitchen_renovation',
    thumbnail: '/images/samples/kitchen.jpg',
    style: 'Contemporary',
    styleKey: 'style_contemporary',
    roomType: 'Kitchen',
    roomTypeKey: 'room_kitchen',
    updatedAt: '3 days ago',
    updatedAtKey: 'db_time_3_days_ago',
    renders: 8,
    vastuScore: 91,
    isFavorite: true,
  },
  {
    id: '4',
    name: 'Home Office Setup',
    nameKey: 'db_project_home_office_setup',
    thumbnail: '/images/samples/office.jpg',
    style: 'Industrial',
    styleKey: 'style_industrial',
    roomType: 'Office',
    roomTypeKey: 'room_home_office',
    updatedAt: '5 days ago',
    updatedAtKey: 'db_time_5_days_ago',
    renders: 4,
    vastuScore: 68,
    isFavorite: false,
  },
];

const quickActions = [
  {
    title: 'AI Design Studio',
    titleKey: 'db_quick_action_ai_design',
    description: 'Transform rooms with RTX 4060',
    descKey: 'db_quick_action_ai_design_desc',
    icon: Zap,
    gradient: 'from-blue-500 to-purple-600',
    bgGradient: 'from-blue-500/10 to-purple-600/10',
    href: '/ai-design',
    badge: 'Zero Cost',
    badgeKey: 'db_badge_zero_cost',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'Redesign Room',
    titleKey: 'db_quick_action_redesign',
    description: 'Transform any room with AI',
    descKey: 'db_quick_action_redesign_desc',
    icon: Wand2,
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-500/10 to-purple-600/10',
    href: '/editor',
    badge: 'Popular',
    badgeKey: 'db_badge_popular',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  {
    title: 'Vastu Analysis',
    titleKey: 'db_quick_action_vastu',
    description: 'Check Vastu compliance',
    descKey: 'db_quick_action_vastu_desc',
    icon: Compass,
    gradient: 'from-orange-500 to-amber-600',
    bgGradient: 'from-orange-500/10 to-amber-600/10',
    href: '/editor?mode=vastu',
    badge: 'India First',
    badgeKey: 'db_badge_india_first',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    title: 'Cost Estimate',
    titleKey: 'db_quick_action_cost',
    description: 'Get renovation costs',
    descKey: 'db_quick_action_cost_desc',
    icon: IndianRupee,
    gradient: 'from-emerald-500 to-green-600',
    bgGradient: 'from-emerald-500/10 to-green-600/10',
    href: '/editor?mode=cost',
    badge: 'New',
    badgeKey: 'db_badge_new',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    title: 'Fill Empty Room',
    titleKey: 'db_quick_action_fill',
    description: 'Furnish vacant spaces',
    descKey: 'db_quick_action_fill_desc',
    icon: Sofa,
    gradient: 'from-blue-500 to-cyan-600',
    bgGradient: 'from-blue-500/10 to-cyan-600/10',
    href: '/editor?mode=fill',
    badge: null,
    badgeKey: null,
    badgeColor: '',
  },
  {
    title: 'AI Lighting Studio',
    titleKey: 'db_quick_action_lighting',
    description: 'Cast professional shadows and lights',
    descKey: 'db_quick_action_lighting_desc',
    icon: Lightbulb,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-500/10 to-orange-600/10',
    href: '/lighting',
    badge: 'Beta',
    badgeKey: 'db_badge_beta',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
];

const roomTypes = [
  { name: 'Living Room', key: 'room_living_room', icon: Sofa, count: 45 },
  { name: 'Bedroom', key: 'room_bedroom', icon: Bed, count: 32 },
  { name: 'Kitchen', key: 'room_kitchen', icon: ChefHat, count: 28 },
  { name: 'Bathroom', key: 'room_bathroom', icon: Bath, count: 15 },
  { name: 'Outdoor', key: 'room_outdoor', icon: TreePine, count: 22 },
  { name: 'Office', key: 'room_home_office', icon: Building2, count: 18 },
];

const popularStyles = [
  {
    name: 'Modern Minimalist',
    key: 'style_modern_minimalist',
    image: '/images/styles/modern.jpg',
    count: '12.5k',
    gradient: 'from-slate-800 to-zinc-900',
  },
  {
    name: 'Scandinavian',
    key: 'style_scandinavian',
    image: '/images/styles/scandinavian.jpg',
    count: '9.8k',
    gradient: 'from-stone-700 to-stone-800',
  },
  {
    name: 'Industrial',
    key: 'style_industrial',
    image: '/images/styles/industrial.jpg',
    count: '7.2k',
    gradient: 'from-amber-800 to-orange-900',
  },
  {
    name: 'Bohemian',
    key: 'style_bohemian',
    image: '/images/styles/bohemian.jpg',
    count: '6.5k',
    gradient: 'from-rose-700 to-pink-800',
  },
  {
    name: 'Traditional Indian',
    key: 'style_traditional_indian',
    image: '/images/styles/indian.jpg',
    count: '8.1k',
    gradient: 'from-orange-700 to-red-800',
  },
  {
    name: 'Contemporary',
    key: 'style_contemporary',
    image: '/images/styles/contemporary.jpg',
    count: '5.9k',
    gradient: 'from-violet-700 to-purple-800',
  },
];

const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'render',
    message: 'AI generated "Modern Living Room" design',
    messageKey: 'db_recent_activity_render',
    timeKey: 'db_time_5_min_ago',
    params: { style: 'style_modern', room: 'room_living_room' },
    time: '5 min ago',
    icon: Sparkles,
    color: 'text-violet-500 bg-violet-100',
  },
  {
    id: '2',
    type: 'vastu',
    message: 'Vastu score improved to 85 for Bedroom',
    messageKey: 'db_recent_activity_vastu',
    timeKey: 'db_time_1_hour_ago',
    params: { score: '85', room: 'room_bedroom' },
    time: '1 hour ago',
    icon: Compass,
    color: 'text-orange-500 bg-orange-100',
  },
  {
    id: '3',
    type: 'achievement',
    message: 'Unlocked "Design Pro" achievement',
    messageKey: 'db_recent_activity_achievement',
    timeKey: 'db_time_2_hours_ago',
    params: { achievement: 'Design Pro' },
    time: '2 hours ago',
    icon: Award,
    color: 'text-yellow-500 bg-yellow-100',
  },
  {
    id: '4',
    type: 'project',
    message: 'Created new project "Kitchen Renovation"',
    messageKey: 'db_recent_activity_project',
    timeKey: 'db_time_3_hours_ago',
    params: { project: 'Kitchen Renovation' }, // we can use the English name since it is a user-created project name
    time: '3 hours ago',
    icon: Plus,
    color: 'text-green-500 bg-green-100',
  },
];

const tips = [
  {
    title: 'Try Virtual Staging',
    titleKey: 'db_tip_staging_title',
    description: 'Add furniture to empty rooms for better visualization',
    descKey: 'db_tip_staging_desc',
    icon: Sofa,
    action: 'Try now',
    actionKey: 'db_try_now',
    href: '/editor?mode=fill',
  },
  {
    title: 'Improve Vastu Score',
    titleKey: 'db_tip_vastu_title',
    description: 'Rearrange elements based on AI suggestions',
    descKey: 'db_tip_vastu_desc',
    icon: Compass,
    action: 'Learn more',
    actionKey: 'db_learn_more',
    href: '/learn/vastu',
  },
  {
    title: 'Export in 4K',
    titleKey: 'db_tip_export_title',
    description: 'Upgrade to Pro for high-resolution exports',
    descKey: 'db_tip_export_desc',
    icon: Download,
    action: 'Upgrade',
    actionKey: 'db_upgrade',
    href: '/billing',
  },
];

// Skeleton Components
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function DashboardPage() {
  const { user, isLoading: isLoaded } = useAuth();
  const isSignedIn = !!user;
  const { t } = useLanguage();
  const [greetingKey, setGreetingKey] = useState('db_greeting_morning');
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreetingKey('db_greeting_morning');
    else if (hour >= 12 && hour < 17) setGreetingKey('db_greeting_afternoon');
    else if (hour >= 17 && hour < 21) setGreetingKey('db_greeting_evening');
    else setGreetingKey('db_greeting_night');
  }, []);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setProjects(sampleProjects);
      setStats({
        projectsCreated: 12,
        aiRenders: 48,
        creditsLeft: 15,
        totalCredits: 50,
        streak: 7,
        savedDesigns: 24,
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Check if first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('dashboard_visited');
    if (!hasVisited && isLoaded && user) {
      setShowWelcome(true);
      localStorage.setItem('dashboard_visited', 'true');
    }
  }, [isLoaded, user]);

  // Toggle favorite
  const toggleFavorite = useCallback((projectId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  }, []);

  // Get Vastu color based on score
  const getVastuColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8 pb-8"
      >
        {/* Welcome Banner (First Visit) */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6"
            >
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {t('db_welcome_title')}
                  </h2>
                  <p className="text-white/80 mt-1">
                    {t('db_welcome_desc')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                {t(greetingKey)},{' '}
                {isLoaded && user
                  ? user.firstName || t('db_designer')
                  : t('db_designer')}{' '}
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block origin-[70%_70%]"
                >
                  👋
                </motion.span>
              </h1>
              {stats && stats.streak > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-orange-700">
                        {t('db_day_streak', { count: String(stats.streak) })}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('db_streak_tooltip', { count: String(stats.streak) })}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-gray-500 text-lg">
              {t('db_ready_desc')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-600">
                  <Command className="w-4 h-4" />
                  <span>{t('db_search_hint')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('db_search_tooltip')}</p>
              </TooltipContent>
            </Tooltip>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>{t('db_new_design')}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Projects Card */}
              <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {t('db_total_projects')}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats?.projectsCreated || 0}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>{t('db_stats_week_projects')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
              </motion.div>

              {/* Renders Card */}
              <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {t('db_ai_renders')}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats?.aiRenders || 0}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
                      <Sparkles className="w-4 h-4" />
                      <span>{t('db_stats_week_renders')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
              </motion.div>

              {/* Credits Card */}
              <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">
                      {t('db_credits_left')}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats?.creditsLeft || 0}
                    </p>
                    <div className="mt-3">
                      <Progress
                        value={
                          ((stats?.creditsLeft || 0) /
                            (stats?.totalCredits || 1)) *
                          100
                        }
                        className="h-2"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {t('db_credits_of_total', { total: String(stats?.totalCredits || 0) })}
                      </p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </motion.div>

              {/* Saved Designs Card */}
              <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {t('db_saved_designs')}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats?.savedDesigns || 0}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                      <Heart className="w-4 h-4" />
                      <span>{t('db_in_favorites')}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('db_quick_actions')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={action.href}
                  className={cn(
                    'relative group block p-6 rounded-2xl border-2 border-transparent bg-gradient-to-br transition-all duration-300',
                    action.bgGradient,
                    'hover:border-gray-200 hover:shadow-lg'
                  )}
                >
                  {action.badgeKey && (
                    <span
                      className={cn(
                        'absolute top-4 right-4 px-2 py-0.5 text-xs font-semibold rounded-full',
                        action.badgeColor
                      )}
                    >
                      {t(action.badgeKey)}
                    </span>
                  )}
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br',
                      action.gradient
                    )}
                  >
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {t(action.titleKey)}
                  </h3>
                  <p className="text-sm text-gray-500">{t(action.descKey)}</p>
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Design Studio - Featured Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-8 border border-blue-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🎨 {t('db_studio_title')}</h2>
                <p className="text-gray-600">{t('db_studio_subtitle')}</p>
              </div>
              <Link
                href="/ai-design"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {t('db_studio_launch')}
              </Link>
            </div>

            {/* AI Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-white/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('db_zero_cost')}</h3>
                    <p className="text-sm text-gray-600">{t('db_qa_studio_desc')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-white/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('db_studio_time')}</h3>
                    <p className="text-sm text-gray-600">{t('db_studio_time_desc')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-white/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('db_studio_prof')}</h3>
                    <p className="text-sm text-gray-600">{t('db_studio_prof_desc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/ai-design">
                <Button variant="outline" className="w-full justify-start bg-white/80 hover:bg-white border-white/50">
                  <Home className="w-4 h-4 mr-2" />
                  {t('room_living_room')}
                </Button>
              </Link>
              <Link href="/ai-design">
                <Button variant="outline" className="w-full justify-start bg-white/80 hover:bg-white border-white/50">
                  <Bed className="w-4 h-4 mr-2" />
                  {t('room_bedroom')}
                </Button>
              </Link>
              <Link href="/ai-design">
                <Button variant="outline" className="w-full justify-start bg-white/80 hover:bg-white border-white/50">
                  <ChefHat className="w-4 h-4 mr-2" />
                  {t('room_kitchen')}
                </Button>
              </Link>
              <Link href="/ai-design">
                <Button variant="outline" className="w-full justify-start bg-white/80 hover:bg-white border-white/50">
                  <Bath className="w-4 h-4 mr-2" />
                  {t('room_bathroom')}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects - Takes 2 columns */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('db_recent_projects')}</h2>
              <Link
                href="/projects"
                className="text-sm text-violet-600 font-medium hover:text-violet-700 flex items-center gap-1 group"
              >
                {t('db_view_all')}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    variants={cardHoverVariants}
                    initial="rest"
                    whileHover="hover"
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {/* Placeholder gradient */}
                      <div
                        className={cn(
                          'absolute inset-0 bg-gradient-to-br',
                          index % 4 === 0 && 'from-violet-300 to-purple-400',
                          index % 4 === 1 && 'from-blue-300 to-cyan-400',
                          index % 4 === 2 && 'from-emerald-300 to-green-400',
                          index % 4 === 3 && 'from-orange-300 to-amber-400'
                        )}
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                      {/* Play button */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.1 }}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-violet-600 ml-1" />
                        </div>
                      </motion.div>

                      {/* Top badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        {project.vastuScore && (
                          <div
                            className={cn(
                              'px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1',
                              getVastuColor(project.vastuScore)
                            )}
                          >
                            <Compass className="w-3 h-3" />
                            {project.vastuScore}
                          </div>
                        )}
                        <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700">
                          {t('db_project_renders_count', { count: project.renders })}
                        </div>
                      </div>

                      {/* Favorite button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(project.id);
                        }}
                        className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                      >
                        <Heart
                          className={cn(
                            'w-4 h-4 transition-colors',
                            project.isFavorite
                              ? 'text-red-500 fill-red-500'
                              : 'text-gray-600'
                          )}
                        />
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                            {project.nameKey ? t(project.nameKey) : project.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {project.styleKey ? t(project.styleKey) : project.style}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              {t('db_project_view')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="w-4 h-4 mr-2" />
                              {t('db_project_share')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              {t('db_project_download')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {project.updatedAtKey ? t(project.updatedAtKey) : project.updatedAt}
                        </span>
                        <div className="flex items-center gap-1">
                          {roomTypes.find((r) => r.name === project.roomType || (project.roomTypeKey && r.key === project.roomTypeKey))
                            ?.icon && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              {(() => {
                                const Icon = roomTypes.find(
                                  (r) => r.name === project.roomType || (project.roomTypeKey && r.key === project.roomTypeKey)
                                )?.icon;
                                return Icon ? (
                                  <Icon className="w-3 h-3" />
                                ) : null;
                              })()}
                              {project.roomTypeKey ? t(project.roomTypeKey) : project.roomType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('db_no_projects')}
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  {t('db_no_projects_desc')}
                </p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/editor"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    {t('db_create_first_proj')}
                  </Link>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Right Sidebar */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* AI Design Studio Widget */}
            <Card className="border-gradient-to-r from-blue-100 to-purple-100 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">{t('db_studio_title')}</CardTitle>
                  </div>
                  <Link href="/ai-design">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
                      {t('db_launch')}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-3 flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">{t('db_rtx_ready')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <div className="font-bold text-blue-600">$0</div>
                      <div className="text-gray-500">{t('db_per_design')}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <div className="font-bold text-purple-600">25s</div>
                      <div className="text-gray-500">{t('db_generation')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link href="/ai-design">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-white/80 hover:bg-white border-white/50">
                      <Wand2 className="w-4 h-4 mr-2" />
                      {t('db_quick_design')}
                    </Button>
                  </Link>
                  <Link href="/ai-design">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-white/80 hover:bg-white border-white/50">
                      <Palette className="w-4 h-4 mr-2" />
                      {t('db_browse_styles')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* AI Generated Designs Showcase */}
            <Card className="border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    {t('db_ai_designs')}
                  </CardTitle>
                  <Link href="/ai-design" className="text-sm text-purple-600 hover:text-purple-700">
                    {t('db_view_all')}
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Sample AI generated designs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative group cursor-pointer">
                    <div className="aspect-square bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg overflow-hidden">
                      <img src="/images/hero-after.jpg" alt="Modern Living Room" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-1">
                      <p className="text-xs font-medium text-gray-700">{t('style_modern')}</p>
                      <p className="text-xs text-gray-500">{t('room_living_room')}</p>
                    </div>
                  </div>
                  
                  <div className="relative group cursor-pointer">
                    <div className="aspect-square bg-gradient-to-br from-green-200 to-emerald-200 rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-green-300 to-emerald-300 rounded-lg flex items-center justify-center">
                        <Bed className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-1">
                      <p className="text-xs font-medium text-gray-700">{t('style_scandinavian')}</p>
                      <p className="text-xs text-gray-500">{t('room_bedroom')}</p>
                    </div>
                  </div>
                  
                  <div className="relative group cursor-pointer">
                    <div className="aspect-square bg-gradient-to-br from-orange-200 to-amber-200 rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-orange-300 to-amber-300 rounded-lg flex items-center justify-center">
                        <ChefHat className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-1">
                      <p className="text-xs font-medium text-gray-700">{t('style_industrial')}</p>
                      <p className="text-xs text-gray-500">{t('room_kitchen')}</p>
                    </div>
                  </div>
                  
                  <div className="relative group cursor-pointer">
                    <div className="aspect-square bg-gradient-to-br from-pink-200 to-rose-200 rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-pink-300 to-rose-300 rounded-lg flex items-center justify-center">
                        <Bath className="w-8 h-8 text-pink-600" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-1">
                      <p className="text-xs font-medium text-gray-700">{t('style_bohemian')}</p>
                      <p className="text-xs text-gray-500">{t('room_bathroom')}</p>
                    </div>
                  </div>
                </div>
                
                <Link href="/ai-design">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
                    <Zap className="w-4 h-4 mr-2" />
                    {t('db_create_design')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t('db_recent_activity')}</CardTitle>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        activity.color
                      )}
                    >
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {activity.messageKey ? (
                          activity.type === 'render' && activity.params?.style && activity.params?.room ? (
                            t(activity.messageKey, {
                              message: `${t(activity.params.style)} ${t(activity.params.room)}`
                            })
                          ) : activity.type === 'vastu' && activity.params?.room ? (
                            t(activity.messageKey, {
                              score: activity.params.score,
                              room: t(activity.params.room)
                            })
                          ) : (
                            t(activity.messageKey, activity.params)
                          )
                        ) : (
                          activity.message
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {activity.timeKey ? t(activity.timeKey) : activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card className="border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-lg">{t('db_pro_tips')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {tips.map((tip, index) => (
                  <Link
                    key={`tip-${index}`}
                    href={tip.href}
                    className="block p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <tip.icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                          {tip.titleKey ? t(tip.titleKey) : tip.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {tip.descKey ? t(tip.descKey) : tip.description}
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Room Types Quick Access */}
            <Card className="border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('db_design_by_room')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {roomTypes.map((room) => (
                    <Link
                      key={room.name}
                      href={`/editor?room=${encodeURIComponent(room.name)}`}
                      className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <room.icon className="w-5 h-5 text-violet-600" />
                      </div>
                      <span className="text-xs text-gray-600 text-center">
                        {room.key ? t(room.key) : room.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Popular Styles */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('db_popular_styles')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('db_popular_styles_desc')}
              </p>
            </div>
            <Link
              href="/editor"
              className="text-sm text-violet-600 font-medium hover:text-violet-700 flex items-center gap-1 group"
            >
              {t('db_explore_styles')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularStyles.map((style, index) => (
              <motion.div
                key={style.name}
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href={`/editor?style=${encodeURIComponent(style.name)}`}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden block"
                >
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br',
                      style.gradient
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                  {/* Style info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-sm font-semibold text-white leading-tight">
                      {style.key ? t(style.key) : style.name}
                    </h3>
                    <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                      <Palette className="w-3 h-3" />
                      {t('db_style_designs_count', { count: style.count })}
                    </p>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-gray-900" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Upgrade Banner */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-8 lg:p-12">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  x: [0, -100, 0],
                  y: [0, 50, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"
              />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="flex-1 max-w-2xl">
                <motion.div
                  animate={pulseAnimation}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white mb-4"
                >
                  <Crown className="w-4 h-4 text-yellow-300" />
                  <span>{t('db_upgrade_limited')}</span>
                </motion.div>

                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                  {t('db_upgrade_title')}
                </h3>
                <p className="text-white/80 text-lg mb-6">
                  {t('db_upgrade_desc')}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {[
                    { text: 'Unlimited renders', key: 'db_up_unlimited' },
                    { text: '4K quality', key: 'db_up_quality' },
                    { text: 'Priority support', key: 'db_up_support' },
                    { text: 'Advanced Vastu', key: 'db_up_vastu' },
                    { text: 'Cost estimates', key: 'db_up_estimates' },
                  ].map((feature, idx) => (
                    <div
                      key={`${feature.text}-${idx}`}
                      className="flex items-center gap-2 text-white/90 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-300" />
                      {t(feature.key)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/billing"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-violet-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all group"
                  >
                    <Zap className="w-5 h-5" />
                    <span>{t('db_upgrade_now')}</span>
                    <span className="text-sm font-normal text-gray-500">
                      — $14.50/mo
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>

                <Link
                  href="/billing"
                  className="text-center text-white/70 text-sm hover:text-white transition-colors"
                >
                  {t('db_view_plans')}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Keyboard Shortcuts Hint */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-6 text-sm text-gray-400 pt-4"
        >
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
              ⌘ K
            </kbd>
            <span>{t('db_shortcut_search')}</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
              N
            </kbd>
            <span>{t('db_shortcut_new')}</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
              ?
            </kbd>
            <span>{t('db_shortcut_all')}</span>
          </div>
        </motion.div>
      </motion.div>

        {/* Floating AI Design Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: "spring", stiffness: 300, damping: 20 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Link href="/ai-design">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              <div className="relative flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{t('db_ai_design_btn')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
          </Link>
        </motion.div>
      </TooltipProvider>
  );
}