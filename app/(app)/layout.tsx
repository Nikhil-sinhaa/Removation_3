// app/(app)/layout.tsx
'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
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
  Search,
  HelpCircle,
  Zap,
  IndianRupee,
  Compass,
  Palette,
  Eraser,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const sidebarNavigation = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Projects', href: '/projects', icon: FolderOpen },
      { name: 'Editor', href: '/editor', icon: Wand2 },
      { name: 'Color Visualizer', href: '/color-visualizer', icon: Palette },
      { name: 'Dream Room', href: '/dream-room', icon: Sparkles },
      { name: 'Object Removal', href: '/remove-object', icon: Eraser },
    ],
  },
  {
    title: 'Library',
    items: [
      { name: 'History', href: '/history', icon: History },
      { name: 'Favorites', href: '/favorites', icon: Heart },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Pricing', href: '/pricing', icon: CreditCard },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

const quickActions = [
  { name: 'Dream Room', icon: Sparkles, color: 'violet' },
  { name: 'Visualize Color', icon: Palette, color: 'green' },
  { name: 'Object Removal', icon: Eraser, color: 'orange' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
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
          {sidebarNavigation.map((section) => (
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
                {section.items.map((item) => {
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
                  <span className="text-lg font-bold">5</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                  <div className="bg-white rounded-full h-2" style={{ width: '50%' }} />
                </div>
                <Link
                  href="/pricing"
                  className="block w-full py-2 px-4 bg-white text-violet-600 rounded-lg font-semibold text-sm text-center hover:bg-white/90 transition-colors"
                >
                  <Zap className="w-4 h-4 inline mr-2" />
                  Upgrade to Pro
                </Link>
              </motion.div>
            ) : (
              <motion.button
                key="sidebar-upgrade-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center"
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
              {sidebarNavigation.map((section) => (
                <div key={section.title} className="mb-6">
                  <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
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
                      <p className="text-xs text-gray-500">Free Plan</p>
                    </div>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'w-9 h-9',
                        },
                      }}
                      afterSignOutUrl="/"
                    />
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