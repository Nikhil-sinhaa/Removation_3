"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string
  showValue?: boolean
  variant?: "default" | "success" | "warning" | "danger" | "gradient"
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, showValue, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    gradient: "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500",
  }

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out",
            variantStyles[variant],
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground ml-2">
          {value}%
        </span>
      )}
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Circular Progress Component
interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  variant?: "default" | "success" | "warning" | "danger" | "vastu"
}

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  ({ value, size = 120, strokeWidth = 8, className, showValue = true, variant = "default" }, ref) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    const variantColors = {
      default: "stroke-primary",
      success: "stroke-green-500",
      warning: "stroke-yellow-500",
      danger: "stroke-red-500",
      vastu: "stroke-orange-500",
    }

    const getVastuColor = (score: number) => {
      if (score >= 80) return "stroke-green-500"
      if (score >= 60) return "stroke-yellow-500"
      if (score >= 40) return "stroke-orange-500"
      return "stroke-red-500"
    }

    const strokeColor = variant === "vastu" ? getVastuColor(value) : variantColors[variant]

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          ref={ref}
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={cn("transition-all duration-500 ease-out", strokeColor)}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(value)}</span>
            {variant === "vastu" && (
              <span className="text-xs text-muted-foreground">Vastu Score</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
CircularProgress.displayName = "CircularProgress"

export { Progress, CircularProgress }