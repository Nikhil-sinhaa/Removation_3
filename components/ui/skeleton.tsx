import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rectangular"
  animation?: "pulse" | "wave" | "none"
}

function Skeleton({
  className,
  variant = "default",
  animation = "pulse",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    default: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none",
  }

  const animationStyles = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
    none: "",
  }

  return (
    <div
      className={cn(
        "bg-muted",
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      {...props}
    />
  )
}

// Pre-built skeleton patterns
function SkeletonCard() {
  return (
    <div className="rounded-xl border p-4 space-y-4">
      <Skeleton className="h-40 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="grid bg-muted/50 p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid p-4 border-t"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonRenderGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" animation="wave" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function SkeletonEditor() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 border-r p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      {/* Main Canvas */}
      <div className="flex-1 p-4">
        <Skeleton className="h-full w-full rounded-xl" animation="wave" />
      </div>
      {/* Right Panel */}
      <div className="w-80 border-l p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonList, 
  SkeletonTable,
  SkeletonRenderGrid,
  SkeletonEditor 
}

// ── AI-specific skeleton components ─────────────────────────────────────────

export function AIResultSkeleton() {
  return (
    <div className="space-y-3 w-full">
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export function AIToolCardSkeleton() {
  return (
    <div className="space-y-3 p-4 border rounded-xl border-white/10">
      <Skeleton className="h-[160px] w-full rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  )
}