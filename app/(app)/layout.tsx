// app/(app)/layout.tsx
'use client';

import { ReactNode, useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserMenu } from '@/components/layout/UserMenu';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { CreditSuccessHandler } from '@/components/payment/CreditSuccessHandler';
import { TourProvider } from '@/components/tours/TourProvider';
import { TourHelpMenu } from '@/components/tours/TourHelpMenu';
import { SearchBar } from '@/components/search/SearchBar';
import { AnnouncementBanner } from '@/components/announcements/AnnouncementBanner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  Palette,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  role?: string;
  tourId?: string;
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
      { name: 'Browse Designers', href: '/designers', icon: Users, tourId: 'sidebar-browse-designers' },
      { name: 'Browse Contractors', href: '/marketplace?tab=contractors', icon: Users },
      { name: 'Browse Vendors', href: '/marketplace?tab=vendors', icon: Store },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { name: 'AI Design Studio', href: '/ai-design', icon: Wand2, tourId: 'sidebar-ai-studio' },
      { name: 'Room Changer', href: '/room-changer', icon: Paintbrush },
      { name: 'Ceiling Changer', href: '/ceiling-changer', icon: Layers },
      { name: 'Furniture Remover', href: '/furniture-remover', icon: Eraser },
      { name: 'Furniture Placement', href: '/furniture-placement', icon: Sofa },
      { name: 'AI Lighting Studio', href: '/lighting', icon: Lightbulb },
      { name: '3D Room View', href: '/room-3d', icon: Box },
      { name: 'Style Transfer', href: '/style-transfer', icon: Palette },
    ],
  },
  {
    title: 'Library',
    items: [
      { name: 'History', href: '/history', icon: History },
      { name: 'Favorites', href: '/favorites', icon: Heart },
      { name: 'My Bookings', href: '/my-bookings', icon: Calendar, tourId: 'sidebar-my-bookings' },
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

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: isLoaded } = useAuth();
  const plan = user?.plan || user?.subscription?.plan || 'free';
  const MAX_CREDITS = plan === 'pro' ? 500 : plan === 'team' ? 1000 : 50;
  const remainingPercent = Math.min(
    100,
    Math.max(0, Math.round(((user?.credits ?? 0) / MAX_CREDITS) * 100))
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect incomplete onboarding
  useEffect(() => {
    if (isLoaded) return;
    if (user && user.onboardingCompleted === false && !pathname.startsWith('/onboarding')) {
      router.push('/onboarding');
    }
  }, [user, isLoaded, pathname, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href.split('?')[0]);
  };

  return (
    <TourProvider>
    <div className="app-shell flex" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* ── Desktop Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 68 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="rm-sidebar fixed left-0 top-0 h-screen z-40 hidden lg:flex flex-col overflow-hidden flex-shrink-0"
        style={{ background: '#161616', borderRight: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center justify-between px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#7c3aed', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  key="logo-text"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="font-bold text-base text-white tracking-tight truncate"
                >
                  Removation
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: '#a1a1aa' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1c1c1c'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {sidebarNavigation
            .filter((section) => !section.role || section.role === user?.role)
            .map((section) => (
              <div key={section.title} className="mb-5">
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.p
                      key={`label-${section.title}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rm-section-label mb-2"
                    >
                      {section.title}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="space-y-0.5">
                  {section.items
                    .filter((item) => !item.role || item.role === user?.role)
                    .map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          {...(item.tourId ? { 'data-tour': item.tourId } : {})}
                          title={!sidebarOpen ? item.name : undefined}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: sidebarOpen ? '8px 12px' : '8px',
                            borderRadius: '8px',
                            fontSize: '13.5px',
                            fontWeight: active ? '500' : '400',
                            color: active ? '#ffffff' : '#a1a1aa',
                            background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                            borderLeft: active ? '2px solid #7c3aed' : '2px solid transparent',
                            paddingLeft: active ? '10px' : sidebarOpen ? '12px' : '8px',
                            textDecoration: 'none',
                            transition: 'all 150ms ease',
                            justifyContent: sidebarOpen ? 'flex-start' : 'center',
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = '#1c1c1c';
                              e.currentTarget.style.color = '#e8dfee';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#a1a1aa';
                            }
                          }}
                        >
                          <item.icon
                            className="flex-shrink-0"
                            style={{
                              width: '16px',
                              height: '16px',
                              color: active ? '#7c3aed' : 'inherit',
                            }}
                          />
                          <AnimatePresence>
                            {sidebarOpen && (
                              <motion.span
                                key={`nav-${item.name}`}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -6 }}
                                transition={{ duration: 0.12 }}
                                className="truncate"
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
        </nav>

        {/* Credits & Upgrade */}
        <div
          className="p-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          data-tour="dashboard-credits"
        >
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="credits-expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: '500' }}>Credits left</span>
                  <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '700' }}>
                    {user?.credits !== undefined ? user.credits : 0}
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  className="w-full h-1.5 rounded-full mb-3"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${remainingPercent}%`,
                      background: '#7c3aed',
                    }}
                  />
                </div>
                {user?.subscription?.plan !== 'pro' ? (
                  <Link
                    href="/billing"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: '100%',
                      padding: '8px 12px',
                      background: '#7c3aed',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'background 150ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#6d28d9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#7c3aed'; }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade to Pro
                  </Link>
                ) : (
                  <div style={{ fontSize: '11px', color: '#a1a1aa', textAlign: 'center' }}>
                    ✨ Pro Plan Active
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="credits-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => router.push('/billing')}
                title={`${user?.credits ?? 0} Credits`}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Zap className="w-4 h-4" style={{ color: '#7c3aed' }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* ── Mobile Menu Overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed left-0 top-0 h-screen w-72 z-50 lg:hidden flex flex-col"
            style={{ background: '#161616', borderRight: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="h-16 flex items-center justify-between px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#7c3aed' }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-base text-white">Removation</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: '#a1a1aa', background: '#1c1c1c' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2">
              {sidebarNavigation
                .filter((section) => !section.role || section.role === user?.role)
                .map((section) => (
                  <div key={section.title} className="mb-5">
                    <p className="rm-section-label mb-2">{section.title}</p>
                    <div className="space-y-0.5">
                      {section.items
                        .filter((item) => !item.role || item.role === user?.role)
                        .map((item) => {
                          const active = isActive(item.href);
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              {...(item.tourId ? { 'data-tour': item.tourId } : {})}
                              onClick={() => setMobileMenuOpen(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '13.5px',
                                fontWeight: active ? '500' : '400',
                                color: active ? '#ffffff' : '#a1a1aa',
                                background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                                borderLeft: active ? '2px solid #7c3aed' : '2px solid transparent',
                                paddingLeft: active ? '10px' : '12px',
                                textDecoration: 'none',
                              }}
                            >
                              <item.icon style={{ width: '16px', height: '16px', color: active ? '#7c3aed' : 'inherit', flexShrink: 0 }} />
                              <span>{item.name}</span>
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

      <Suspense fallback={null}>
        <CreditSuccessHandler />
      </Suspense>

      {/* ── Main Content ── */}
      <div
        className={cn('flex-1 flex flex-col min-w-0 transition-all duration-200')}
        style={{ marginLeft: sidebarOpen ? '260px' : '68px' }}
      >
        {/* ── Top Bar ── */}
        <header
          className="sticky top-0 z-30 h-14 flex items-center px-4 lg:px-6"
          style={{
            background: 'rgba(10,10,10,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center justify-between w-full">
            {/* Left: mobile menu + search */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: '#a1a1aa', background: '#1c1c1c' }}
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Search — full bar on sm+, icon link on mobile */}
              <SearchBar className="hidden sm:block w-56 lg:w-72" />
              <Link
                href="/search"
                className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: '#a1a1aa', background: '#1c1c1c' }}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </Link>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <NotificationBell />

              <TourHelpMenu />

              <div
                className="w-px h-5 mx-1 flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              />

              {/* User info + menu */}
              {!isLoaded && user && (
                <div className="flex items-center gap-2.5">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium" style={{ color: '#ffffff', fontSize: '13px' }}>
                      {user.firstName || 'User'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#a1a1aa' }}>
                      {plan === 'pro' ? 'Pro Plan' : plan === 'team' ? 'Team Plan' : 'Free Plan'}
                    </p>
                  </div>
                  <UserMenu />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Announcement Banners ── */}
        <AnnouncementBanner />

        {/* ── Page Content ── */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
    </TourProvider>
  );
}