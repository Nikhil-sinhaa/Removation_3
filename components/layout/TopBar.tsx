"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Search, 
  Bell, 
  Menu,
  Command,
  Plus
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { NotificationBell } from "@/components/layout/NotificationBell"
import { CreditBalance } from "@/components/payment/CreditBalance"

interface TopBarProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function TopBar({ onMenuClick, showMenuButton = false }: TopBarProps) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  // Get page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return "Dashboard"
    const lastSegment = segments[segments.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, " ")
  }

  // Keyboard shortcut for search
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {showMenuButton && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onMenuClick}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <div>
              <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Search projects, styles...</span>
              <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* New Design Button */}
            <Link href="/editor" className="hidden sm:block">
              <Button variant="gradient" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Design
              </Button>
            </Link>

            {/* Credits */}
            <div className="hidden lg:block">
              <CreditBalance minimal />
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Command Dialog (Search) */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search projects, styles, features..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { setOpen(false); window.location.href = "/editor" }}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New Design</span>
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); window.location.href = "/editor?mode=vastu" }}>
              <Command className="mr-2 h-4 w-4" />
              <span>Vastu Analysis</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => { setOpen(false); window.location.href = "/dashboard" }}>
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); window.location.href = "/projects" }}>
              Projects
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); window.location.href = "/history" }}>
              History
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); window.location.href = "/settings" }}>
              Settings
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Styles">
            <CommandItem>Modern Minimalist</CommandItem>
            <CommandItem>Scandinavian</CommandItem>
            <CommandItem>Industrial</CommandItem>
            <CommandItem>Traditional Indian</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

export { TopBar as default }