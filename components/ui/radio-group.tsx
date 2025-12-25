"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-primary/80",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2 w-2 fill-primary-foreground text-primary-foreground" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Card-style Radio Group Item
interface RadioGroupCardProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  title: string
  description?: string
  icon?: React.ReactNode
}

const RadioGroupCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupCardProps
>(({ className, title, description, icon, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-pointer items-start gap-4 rounded-xl border-2 border-muted bg-popover p-4 transition-all duration-200",
        "hover:border-primary/50 hover:bg-accent/50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary/5",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        {description && (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      <div className="absolute right-4 top-4">
        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted data-[state=checked]:border-primary data-[state=checked]:bg-primary">
          <RadioGroupPrimitive.Indicator>
            <Circle className="h-2 w-2 fill-primary-foreground text-primary-foreground" />
          </RadioGroupPrimitive.Indicator>
        </div>
      </div>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupCard.displayName = "RadioGroupCard"

export { RadioGroup, RadioGroupItem, RadioGroupCard }