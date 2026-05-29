// app/(app)/layout.tsx
'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserMenu } from '@/components/layout/UserMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Icons
import {
  Home,
  FolderOpen,
  Wand2,
  CreditCard,
  Settings,
  History,
  Heart,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
  Shield,
  Search,
  HelpCircle,
  Zap,
  IndianRupee,
  Compass,
  Palette,
  Eraser,
  Paintbrush,
  Layers,
  Box,
  Sofa,
  Lightbulb,
  Users,
  Calendar,
  LayoutDashboard,
  LucideIcon,
  Store,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  role?: string;
};

type NavSection = {
  title: string;
  role?: string;
  items: NavItem[];
};

const sidebarNavigation: NavSection[] = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Projects', href: '/projects', icon: FolderOpen },
      { name: 'Browse Designers', href: '/designers', icon: Users },
      { name: 'Browse Contractors', href: '/marketplace?tab=contractors', icon: Users },
      { name: 'Browse Vendors', href: '/marketplace?tab=vendors', icon: Store },
      { name: 'AI Design Studio', href: '/ai-design', icon: Wand2 },
      { name: 'Master Design Studio', href: '/master-design', icon: Settings },
      { name: 'Professional Design Studio', href: '/professional-design', icon: Shield },
      { name: 'Editor', href: '/editor', icon: Palette },
      { name: 'Color Visualizer', href: '/color-visualizer', icon: Palette },
      { name: 'Dream Room', href: '/dream-room', icon: Sparkles },
      { name: 'Object Removal', href: '/remove-object', icon: Eraser },
      { name: 'Furniture Remover', href: '/furniture-remover', icon: Eraser },
      { name: 'Room Changer', href: '/room-changer', icon: Paintbrush },
      { name: 'Style Transfer', href: '/style-transfer', icon: Palette },
      { name: 'Ceiling Changer', href: '/ceiling-changer', icon: Layers },
      { name: 'AI Lighting Studio', href: '/lighting', icon: Lightbulb },
      { name: '3D Room View', href: '/room-3d', icon: Box },
      { name: 'Furniture Placement', href: '/furniture-placement', icon: Sofa },
    ],
  },
  {
    title: 'Library',
    items: [
      { name: 'History', href: '/history', icon: History },
      { name: 'Favorites', href: '/favorites', icon: Heart },
      { name: 'My Bookings', href: '/my-bookings', icon: Calendar },
    ],
  },
  {
    title: 'Designer Portal',
    role: 'designer',
    items: [
      { name: 'Designer Dashboard', href: '/designer/dashboard', icon: LayoutDashboard },
      { name: 'Designer Bookings', href: '/designer/bookings', icon: Calendar },
      { name: 'Designer Pricing', href: '/designer/pricing', icon: CreditCard },
    ],
  },
  {
    title: 'Contractor Portal',
    role: 'contractor',
    items: [
      { name: 'Contractor Dashboard', href: '/contractor/dashboard', icon: LayoutDashboard },
      { name: 'Contractor Bookings', href: '/contractor/bookings', icon: Calendar },
    ],
  },
  {
    title: 'Vendor Portal',
    role: 'vendor',
    items: [
      { name: 'Vendor Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Billing & Plans', href: '/billing', icon: CreditCard },
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Become a Designer', href: '/designer/register', icon: Sparkles, role: 'customer' },
      { name: 'Become a Contractor', href: '/contractor/register', icon: Sparkles, role: 'customer' },
      { name: 'Become a Vendor', href: '/vendor/register', icon: Sparkles, role: 'customer' },
    ],
  },
];

const quickActions = [
  { name: 'Dream Room', icon: Sparkles, color: 'violet', href: '/dream-room' },
  { name: 'Visualize Color', icon: Palette, color: 'green', href: '/color-visualizer' },
  { name: 'Object Removal', icon: Eraser, color: 'orange', href: '/remove-object' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: isLoaded } = useAuth();
  const plan = user?.plan || user?.subscription?.plan || 'free';
  const MAX_CREDITS = plan === 'pro' ? 500 : plan === 'team' ? 1000 : 50;
  const usedPercent = Math.min(
    100,
    Math.round(((MAX_CREDITS - (user?.credits ?? 0)) / MAX_CREDITS) * 100)
  );
  const remainingPercent = Math.min(
    100,
    Math.max(0, Math.round(((user?.credits ?? 0) / MAX_CREDITS) * 100))
  );

  const isSignedIn = !!user;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'b') {
          e.preventDefault();
          setSidebarOpen((prev) => !prev);
        }
        if (e.key === 'k') {
          e.preventDefault();
          // Open command palette
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 hidden lg:flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  key="sidebar-logo-text"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"
                >
                  Removation
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="sidebar-quick-actions"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 border-b border-gray-100"
            >
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={() => router.push(action.href)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200',
                      action.color === 'violet' && 'bg-violet-50 hover:bg-violet-100 text-violet-600',
                      action.color === 'orange' && 'bg-orange-50 hover:bg-orange-100 text-orange-600',
                      action.color === 'green' && 'bg-green-50 hover:bg-green-100 text-green-600'
                    )}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-xs font-medium truncate w-full text-center">
                      {action.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sidebarNavigation
            .filter((section) => !section.role || section.role === user?.role)
            .map((section) => (
              <div key={section.title} className="mb-6">
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.h3
                    key={`section-title-${section.title}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {section.title}
                  </motion.h3>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {section.items
                  .filter((item) => !item.role || item.role === user?.role)
                  .map((item) => {
                    const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                        active
                          ? 'bg-violet-50 text-violet-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-5 h-5 flex-shrink-0 transition-colors',
                          active ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'
                        )}
                      />
                      <AnimatePresence>
                        {sidebarOpen && (
                          <motion.span
                            key={`nav-item-${item.name}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="font-medium"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1 h-6 bg-violet-600 rounded-r-full"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Credits & Upgrade */}
        <div className="p-4 border-t border-gray-100">
          <AnimatePresence>
            {sidebarOpen ? (
              <motion.div
                key="sidebar-upgrade-expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white/80">Credits Left</span>
                  <span className="text-lg font-bold">{user?.credits !== undefined ? user.credits : 0} credits left</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500" 
                    style={{ width: `${remainingPercent}%` }} 
                  />
                </div>
                {user?.subscription?.plan !== 'pro' ? (
                  <Link
                    href="/billing"
                    className="block w-full py-2 px-4 bg-white text-violet-600 rounded-lg font-semibold text-sm text-center hover:bg-white/90 transition-colors"
                  >
                    <Zap className="w-4 h-4 inline mr-2 animate-pulse" />
                    Upgrade to Pro
                  </Link>
                ) : (
                  <div className="text-xs text-center text-white/80 font-medium py-1">
                    ✨ Active Pro Subscription
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="sidebar-upgrade-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => router.push('/billing')}
                className="w-full p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center hover:shadow-md transition-shadow"
                title={`${user?.credits !== undefined ? user.credits : 0} Credits Left`}
              >
                <Zap className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed left-0 top-0 h-screen w-80 bg-white z-50 lg:hidden flex flex-col"
          >
            {/* Mobile Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Removation
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              {sidebarNavigation
                .filter((section) => !section.role || section.role === user?.role)
                .map((section) => (
                  <div key={section.title} className="mb-6">
                  <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items
                      .filter((item) => !item.role || item.role === user?.role)
                      .map((item) => {
                        const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                            active
                              ? 'bg-violet-50 text-violet-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'w-5 h-5 flex-shrink-0',
                              active ? 'text-violet-600' : 'text-gray-400'
                            )}
                          />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-200',
          sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-20'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              {/* Search */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl w-64 lg:w-80">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
                <kbd className="hidden lg:block px-2 py-0.5 text-xs text-gray-400 bg-white rounded border border-gray-200">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Help */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5 text-gray-500" />
              </button>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 mx-2" />

              {/* User Menu */}
              <div className="flex items-center gap-3">
                {isLoaded && user && (
                  <>
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span>
                          {plan === 'pro' ? 'Pro Plan' :
                           plan === 'team' ? 'Team Plan' :
                           'Free Plan'}
                        </span>
                      </p>
                    </div>
                    <UserMenu />
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}