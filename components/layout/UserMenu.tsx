"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from '@/hooks/useAuth';
import {
  User as UserIcon,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  Crown,
  Sparkles,
  Moon,
  Sun,
  Monitor
} from "lucide-react"
import { useTheme } from "next-themes"
import { useUserStore } from "@/stores/user-store"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface UserMenuProps {
  className?: string
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, isLoading, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    const store = useUserStore.getState();
    store.setTheme(newTheme as any);
    try {
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (err) {
      console.error("Failed to save theme preference:", err);
    }
  };

  if (isLoading || !user) {
    return (
      <div className={cn("h-9 w-9 rounded-full bg-muted animate-pulse", className)} />
    )
  }

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U"

  const fullName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("relative h-9 w-9 rounded-full", className)}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.imageUrl} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {user.subscription?.plan !== 'free' && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
              <Crown className="h-2 w-2 text-white" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.imageUrl} alt={fullName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {fullName}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate w-[160px]">
                {user.email}
              </p>
              {user.subscription?.plan !== 'free' && (
                <Badge variant="premium" className="w-fit mt-1 text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro Plan
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* Credits Display */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">Credits</span>
            </div>
            <span className="text-sm font-bold">{user.credits || 0}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Theme Switcher */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleThemeChange("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
              {theme === "light" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
              {theme === "dark" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleThemeChange("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
              {theme === "system" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem asChild>
          <Link href="/help">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu as default }