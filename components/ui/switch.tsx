"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: "default" | "sm" | "lg"
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = "default", ...props }, ref) => {
  const sizeStyles = {
    sm: "h-4 w-8",
    default: "h-6 w-11",
    lg: "h-7 w-14",
  }

  const thumbSizeStyles = {
    sm: "h-3 w-3 data-[state=checked]:translate-x-4",
    default: "h-5 w-5 data-[state=checked]:translate-x-5",
    lg: "h-6 w-6 data-[state=checked]:translate-x-7",
  }

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        sizeStyles[size],
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200",
          "data-[state=checked]:translate-x-0",
          thumbSizeStyles[size]
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

// Switch with label
interface LabeledSwitchProps extends SwitchProps {
  label: string
  description?: string
}

const LabeledSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  LabeledSwitchProps
>(({ label, description, className, ...props }, ref) => {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="space-y-0.5">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch ref={ref} {...props} />
    </div>
  )
})
LabeledSwitch.displayName = "LabeledSwitch"

export { Switch, LabeledSwitch }