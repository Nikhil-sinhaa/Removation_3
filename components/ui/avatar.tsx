"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: "xs" | "sm" | "md" | "lg" | "xl"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-800 ring-offset-2 ring-offset-zinc-950",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-medium text-white",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Avatar Group Component for stacked avatars
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number
  children: React.ReactNode
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 4, children, ...props }, ref) => {
    const childArray = React.Children.toArray(children)
    const visibleChildren = childArray.slice(0, max)
    const remainingCount = childArray.length - max

    return (
      <div
        ref={ref}
        className={cn("flex -space-x-3", className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            className="relative ring-2 ring-zinc-950 rounded-full"
            style={{ zIndex: visibleChildren.length - index }}
          >
            {child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 ring-2 ring-zinc-950"
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    )
  }
)
AvatarGroup.displayName = "AvatarGroup"

// Online Status Indicator
interface AvatarWithStatusProps
  extends React.ComponentPropsWithoutRef<typeof Avatar> {
  status?: "online" | "offline" | "away" | "busy"
  children: React.ReactNode
}

const AvatarWithStatus = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  AvatarWithStatusProps
>(({ status, children, className, ...props }, ref) => {
  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-zinc-500",
    away: "bg-amber-500",
    busy: "bg-red-500",
  }

  return (
    <div className="relative inline-block">
      <Avatar ref={ref} className={className} {...props}>
        {children}
      </Avatar>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-zinc-950",
            statusColors[status]
          )}
        />
      )}
    </div>
  )
})
AvatarWithStatus.displayName = "AvatarWithStatus"

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarWithStatus }