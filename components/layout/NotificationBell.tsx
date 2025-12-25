"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Check,
  Trash2,
  Image,
  CreditCard,
  Sparkles,
  AlertCircle,
  X
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Notification {
  id: string
  type: "render" | "credit" | "system" | "promo"
  title: string
  message: string
  read: boolean
  createdAt: Date
  actionUrl?: string
  imageUrl?: string
}

// Mock notifications - in real app, fetch from API
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "render",
    title: "Render Complete",
    message: "Your Modern Living Room design is ready to view",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    actionUrl: "/projects/123",
    imageUrl: "/images/sample-render.jpg",
  },
  {
    id: "2",
    type: "credit",
    title: "Credits Low",
    message: "You have 5 credits remaining. Upgrade for more!",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    actionUrl: "/pricing",
  },
  {
    id: "3",
    type: "promo",
    title: "New Feature: Vastu Analysis",
    message: "Try our new Vastu Shastra AI engine for free!",
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actionUrl: "/editor?mode=vastu",
  },
  {
    id: "4",
    type: "render",
    title: "Render Complete",
    message: "Your Scandinavian Bedroom design is ready",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    actionUrl: "/projects/124",
  },
]

const notificationIcons = {
  render: Image,
  credit: CreditCard,
  system: AlertCircle,
  promo: Sparkles,
}

const notificationColors = {
  render: "text-green-500 bg-green-500/10",
  credit: "text-amber-500 bg-amber-500/10",
  system: "text-blue-500 bg-blue-500/10",
  promo: "text-violet-500 bg-violet-500/10",
}

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = React.useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type]
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={cn(
                      "relative flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl
                        setIsOpen(false)
                      }
                    }}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        notificationColors[notification.type]
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm",
                          !notification.read && "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        <button
                          className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={clearAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { NotificationBell as default }