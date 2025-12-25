import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, XCircle, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 border-zinc-800 text-zinc-100",
        destructive:
          "border-red-500/50 bg-red-950/50 text-red-400 [&>svg]:text-red-400",
        success:
          "border-emerald-500/50 bg-emerald-950/50 text-emerald-400 [&>svg]:text-emerald-400",
        warning:
          "border-amber-500/50 bg-amber-950/50 text-amber-400 [&>svg]:text-amber-400",
        info:
          "border-blue-500/50 bg-blue-950/50 text-blue-400 [&>svg]:text-blue-400",
        vastu:
          "border-violet-500/50 bg-violet-950/50 text-violet-300 [&>svg]:text-violet-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const alertIcons = {
  default: AlertCircle,
  destructive: XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  vastu: AlertCircle,
}

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", showIcon = true, children, ...props }, ref) => {
    const Icon = alertIcons[variant || "default"]
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && <Icon className="h-4 w-4" />}
        {children}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, alertVariants }