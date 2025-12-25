"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "dark" | "light" | "icon-only";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  /** DEPRECATED — Logo will no longer wrap itself in <Link> */
  href?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const sizeConfig = {
  xs: { icon: 20, text: "text-sm" },
  sm: { icon: 24, text: "text-base" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
  xl: { icon: 48, text: "text-3xl" },
};

export function Logo({
  variant = "default",
  size = "md",
  animated = true,
  // ❗ href is intentionally ignored internally to avoid nested <a>
  href,
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  const { icon: iconSize, text: textSize } = sizeConfig[size];

  const logoContent = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* ICON */}
      <motion.div
        className={cn("relative", iconClassName)}
        style={{ width: iconSize, height: iconSize }}
        whileHover={animated ? { scale: 1.05 } : undefined}
        whileTap={animated ? { scale: 0.95 } : undefined}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>

            <linearGradient id="logoGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>

          {/* Circle */}
          <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" />

          {/* House Shape */}
          <path
            d="M20 10L10 18V28H16V22H24V28H30V18L20 10Z"
            fill="white"
            fillOpacity="0.95"
          />

          {/* Window */}
          <rect
            x="17"
            y="14"
            width="6"
            height="4"
            rx="1"
            fill="url(#logoGradient)"
            fillOpacity="0.6"
          />

          {/* AI Sparkle */}
          <motion.circle
            cx="32"
            cy="8"
            r="3"
            fill="#FCD34D"
            animate={
              animated
                ? {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1],
                  }
                : undefined
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      {/* TEXT */}
      {variant !== "icon-only" && (
        <motion.div
          className={cn(
            "font-bold tracking-tight",
            textSize,
            variant === "light"
              ? "text-white"
              : variant === "dark"
              ? "text-gray-900"
              : "text-gray-900 dark:text-white",
            textClassName
          )}
          initial={animated ? { opacity: 0, x: -10 } : undefined}
          animate={animated ? { opacity: 1, x: 0 } : undefined}
        >
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Remov
          </span>
          <span
            className={cn(
              variant === "light"
                ? "text-white"
                : variant === "dark"
                ? "text-gray-900"
                : "text-gray-900 dark:text-white"
            )}
          >
            ation
          </span>
          <span className="text-primary">.ai</span>
        </motion.div>
      )}
    </div>
  );

  // ❗ We DO NOT wrap in <Link> here anymore.
  // Doing so causes nested <a> tags in Navbar and breaks hydration.
  return logoContent;
}

/* -------------------------------------------------------------------------- */
/*                               Animated Logo                                */
/* -------------------------------------------------------------------------- */

export function AnimatedLogo({ size = "lg" }: { size?: LogoProps["size"] }) {
  const { icon: iconSize } = sizeConfig[size];

  return (
    <motion.div
      className="relative"
      style={{ width: iconSize * 2, height: iconSize * 2 }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0 bg-primary/20 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#loadingGradient)"
            strokeWidth="2"
            strokeDasharray="70 200"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <div className="absolute inset-4">
        <Logo variant="icon-only" size={size} animated={false} />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Logo Mark                                 */
/* -------------------------------------------------------------------------- */

export function LogoMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="logoMarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>

      <circle cx="20" cy="20" r="18" fill="url(#logoMarkGradient)" />

      <path
        d="M20 10L10 18V28H16V22H24V28H30V18L20 10Z"
        fill="white"
        fillOpacity="0.95"
      />

      <rect x="17" y="14" width="6" height="4" rx="1" fill="white" fillOpacity="0.3" />

      <circle cx="32" cy="8" r="3" fill="#FCD34D" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Wordmark                                  */
/* -------------------------------------------------------------------------- */

export function Wordmark({
  variant = "default",
  size = "md",
  className,
}: {
  variant?: "default" | "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const textSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size];

  return (
    <div className={cn("font-bold tracking-tight", textSize, className)}>
      <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
        Remov
      </span>
      <span
        className={cn(
          variant === "light"
            ? "text-white"
            : variant === "dark"
            ? "text-gray-900"
            : "text-gray-900 dark:text-white"
        )}
      >
        ation
      </span>
      <span className="text-primary">.ai</span>
    </div>
  );
}

export default Logo;
