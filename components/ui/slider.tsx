"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showValue?: boolean
  formatValue?: (value: number) => string
  variant?: "default" | "gradient"
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showValue, formatValue, variant = "default", ...props }, ref) => {
  const value = props.value || props.defaultValue || [0]
  
  const trackStyles = {
    default: "bg-primary",
    gradient: "bg-gradient-to-r from-violet-500 to-indigo-500",
  }

  return (
    <div className="relative">
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className={cn("absolute h-full", trackStyles[variant])} />
        </SliderPrimitive.Track>
        {value.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(
              "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              "hover:scale-110 active:scale-95",
              "shadow-md"
            )}
          />
        ))}
      </SliderPrimitive.Root>
      {showValue && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {formatValue ? formatValue(props.min || 0) : props.min || 0}
          </span>
          <span className="text-sm font-medium">
            {formatValue ? formatValue(value[0]) : value[0]}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatValue ? formatValue(props.max || 100) : props.max || 100}
          </span>
        </div>
      )}
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

// Range Slider with two thumbs
interface RangeSliderProps extends SliderProps {
  onRangeChange?: (range: [number, number]) => void
}

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(({ className, onRangeChange, ...props }, ref) => {
  const handleValueChange = (value: number[]) => {
    if (onRangeChange && value.length === 2) {
      onRangeChange([value[0], value[1]])
    }
    props.onValueChange?.(value)
  }

  return (
    <Slider
      ref={ref}
      className={className}
      {...props}
      onValueChange={handleValueChange}
    />
  )
})
RangeSlider.displayName = "RangeSlider"

export { Slider, RangeSlider }