"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  FolderKanban,
  ImagePlus,
  History,
  User
} from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Create",
    href: "/editor",
    icon: ImagePlus,
    primary: true,
  },
  {
    title: "History",
    href: "/history",
    icon: History,
  },
  {
    title: "Profile",
    href: "/settings",
    icon: User,
  },
]

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl md:hidden safe-area-pb", className)}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          
          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                >
                  <item.icon className="h-6 w-6" />
                </motion.div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <motion.div
                initial={false}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <item.icon className="h-5 w-5" />
              </motion.div>
              <span className="text-[10px] font-medium">{item.title}</span>
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export { MobileNav as default }