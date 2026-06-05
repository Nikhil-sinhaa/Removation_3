"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  FolderKanban,
  ImagePlus,
  History,
  Heart,
  Settings,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  Calculator,
  Compass,
  LogOut,
  Crown,
  FileBox,
  Cpu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/Logo"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CreditBalance } from "@/components/payment/CreditBalance"
import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
  className?: string
}

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "New Design",
    href: "/editor",
    icon: ImagePlus,
    highlight: true,
  },
]

const toolsNavItems = [
  {
    title: "AI Redesign",
    href: "/editor?mode=redesign",
    icon: Sparkles,
  },
  {
    title: "Vastu Analysis",
    href: "/editor?mode=vastu",
    icon: Compass,
    badge: "New",
  },
  {
    title: "Cost Calculator",
    href: "/editor?mode=cost",
    icon: Calculator,
    badge: "₹/$",
  },
  {
    title: "Fill Empty Room",
    href: "/editor?mode=fill",
    icon: Home,
  },
  {
    title: "Floor Plan",
    href: "/floor-plan",
    icon: FileBox,
    badge: "3D",
  },
]

const libraryNavItems = [
  {
    title: "History",
    href: "/history",
    icon: History,
  },
  {
    title: "Favorites",
    href: "/favorites",
    icon: Heart,
  },
]

const bottomNavItems = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "GPU Settings",
    href: "/settings/gpu",
    icon: Cpu,
    badge: "GPU",
  },
  {
    title: "Billing",
    href: "/pricing",
    icon: CreditCard,
  },
  {
    title: "Help",
    href: "/help",
    icon: HelpCircle,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const NavItem = ({
    item,
    isCollapsed
  }: {
    item: typeof mainNavItems[0] & { badge?: string; highlight?: boolean }
    isCollapsed: boolean
  }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-primary/10 text-primary",
          item.highlight && !isActive && "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-primary",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    )

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.title}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[280px]",
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex h-16 items-center border-b px-4",
        isCollapsed && "justify-center px-2"
      )}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo variant={isCollapsed ? "icon-only" : "default"} className="h-8 w-auto" />
        </Link>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {/* Main Nav */}
          <div className="space-y-1">
            {!isCollapsed && (
              <h4 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Main
              </h4>
            )}
            {mainNavItems.map((item) => (
              <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}
          </div>

          {/* Tools Nav */}
          <div className="space-y-1">
            {!isCollapsed && (
              <h4 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                AI Tools
              </h4>
            )}
            {toolsNavItems.map((item) => (
              <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}
          </div>

          {/* Library Nav */}
          <div className="space-y-1">
            {!isCollapsed && (
              <h4 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Library
              </h4>
            )}
            {libraryNavItems.map((item) => (
              <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Credits Card */}
      {!isCollapsed && (
        <div className="mx-3 mb-3">
          <CreditBalance variant="compact" />
        </div>
      )}

      {/* Bottom Nav */}
      <div className="border-t p-3 space-y-1">
        {bottomNavItems.map((item) => (
          <NavItem key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}

        {/* Sign Out */}
        <button
          onClick={() => logout()}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* User Profile */}
      {user && !isCollapsed && (
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <img
              src={user.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=test"}
              alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "User"}
              className="h-10 w-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Crown className="h-3 w-3 text-amber-500" />
                Pro Member
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export { Sidebar as default }