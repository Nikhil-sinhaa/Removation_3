"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LoadingShimmerProps {
  className?: string;
  variant?: "default" | "card" | "text" | "avatar" | "image" | "editor";
  count?: number;
  animate?: boolean;
}

export function LoadingShimmer({
  className,
  variant = "default",
  count = 1,
  animate = true,
}: LoadingShimmerProps) {
  const shimmerAnimation = {
    backgroundPosition: animate
      ? ["200% 0", "-200% 0"]
      : undefined,
  };

  const baseClasses = cn(
    "relative overflow-hidden bg-zinc-200 dark:bg-zinc-800",
    animate && "animate-shimmer bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:400%_100%]"
  );

  const renderShimmer = (index: number) => {
    switch (variant) {
      case "card":
        return (
          <div key={index} className={cn("space-y-4", className)}>
            <div className={cn(baseClasses, "aspect-[4/3] rounded-xl")} />
            <div className="space-y-2">
              <div className={cn(baseClasses, "h-4 w-3/4 rounded")} />
              <div className={cn(baseClasses, "h-3 w-1/2 rounded")} />
            </div>
            <div className="flex gap-2">
              <div className={cn(baseClasses, "h-6 w-16 rounded-full")} />
              <div className={cn(baseClasses, "h-6 w-20 rounded-full")} />
            </div>
          </div>
        );

      case "text":
        return (
          <div key={index} className={cn("space-y-2", className)}>
            <div className={cn(baseClasses, "h-4 w-full rounded")} />
            <div className={cn(baseClasses, "h-4 w-5/6 rounded")} />
            <div className={cn(baseClasses, "h-4 w-4/6 rounded")} />
          </div>
        );

      case "avatar":
        return (
          <div key={index} className={cn("flex items-center gap-3", className)}>
            <div className={cn(baseClasses, "w-10 h-10 rounded-full")} />
            <div className="space-y-2">
              <div className={cn(baseClasses, "h-4 w-24 rounded")} />
              <div className={cn(baseClasses, "h-3 w-16 rounded")} />
            </div>
          </div>
        );

      case "image":
        return (
          <div
            key={index}
            className={cn(baseClasses, "aspect-[4/3] rounded-xl", className)}
          />
        );

      case "editor":
        return (
          <div key={index} className={cn("flex gap-4 h-[600px]", className)}>
            {/* Left Sidebar */}
            <div className="w-72 space-y-4 p-4">
              <div className={cn(baseClasses, "h-10 rounded-lg")} />
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(baseClasses, "h-12 rounded-lg")}
                  />
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-4">
              {/* Toolbar */}
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(baseClasses, "w-10 h-10 rounded-lg")}
                  />
                ))}
              </div>

              {/* Canvas */}
              <div
                className={cn(baseClasses, "aspect-video rounded-xl")}
              />
            </div>

            {/* Right Sidebar */}
            <div className="w-80 space-y-4 p-4">
              <div className={cn(baseClasses, "h-10 rounded-lg")} />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(baseClasses, "aspect-square rounded-lg")}
                  />
                ))}
              </div>
              <div className={cn(baseClasses, "h-24 rounded-lg")} />
            </div>
          </div>
        );

      default:
        return (
          <div
            key={index}
            className={cn(baseClasses, "h-4 w-full rounded", className)}
          />
        );
    }
  };

  if (count === 1) {
    return renderShimmer(0);
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => renderShimmer(index))}
    </div>
  );
}

// Specialized Loading Components
export function RenderGridShimmer({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingShimmer key={i} variant="card" />
      ))}
    </div>
  );
}

export function StylePickerShimmer() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-shimmer bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:400%_100%]"
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-shimmer bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:400%_100%]"
          />
        ))}
      </div>
    </div>
  );
}

export function SidebarShimmer() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-shimmer" />
        <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-shimmer" />
      </div>
      
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2"
          >
            <div className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-800 animate-shimmer" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GenerationShimmer() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-24 h-24 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 mb-6"
      />
      <div className="space-y-2 text-center">
        <div className="h-5 w-40 mx-auto rounded bg-zinc-200 dark:bg-zinc-800 animate-shimmer bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:400%_100%]" />
        <div className="h-4 w-32 mx-auto rounded bg-zinc-200 dark:bg-zinc-800 animate-shimmer bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:400%_100%]" />
      </div>
    </div>
  );
}

export default LoadingShimmer;