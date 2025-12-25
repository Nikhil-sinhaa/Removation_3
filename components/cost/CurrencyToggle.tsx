// components/cost/CurrencyToggle.tsx
"use client";

import React from "react";
import { IndianRupee, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CurrencyToggleProps {
  value: "INR" | "USD";
  onChange: (currency: "INR" | "USD") => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "minimal";
  showLabels?: boolean;
  className?: string;
}

const EXCHANGE_RATE = 83.12; // USD to INR

export function CurrencyToggle({
  value,
  onChange,
  size = "md",
  variant = "default",
  showLabels = false,
  className,
}: CurrencyToggleProps) {
  const sizeClasses = {
    sm: "h-7 text-xs",
    md: "h-9 text-sm",
    lg: "h-11 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={value === "INR" ? "default" : "ghost"}
              size="icon"
              className={cn("rounded-full", sizeClasses[size])}
              onClick={() => onChange("INR")}
            >
              <IndianRupee className={iconSizes[size]} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Indian Rupee (₹)</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={value === "USD" ? "default" : "ghost"}
              size="icon"
              className={cn("rounded-full", sizeClasses[size])}
              onClick={() => onChange("USD")}
            >
              <DollarSign className={iconSizes[size]} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>US Dollar ($)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center rounded-lg border bg-muted/50 p-0.5",
          variant === "outline" && "bg-transparent"
        )}
      >
        <button
          onClick={() => onChange("INR")}
          className={cn(
            "flex items-center gap-1.5 px-3 rounded-md transition-all",
            sizeClasses[size],
            value === "INR"
              ? "bg-background shadow-sm text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <IndianRupee className={iconSizes[size]} />
          {showLabels && <span>INR</span>}
        </button>
        <button
          onClick={() => onChange("USD")}
          className={cn(
            "flex items-center gap-1.5 px-3 rounded-md transition-all",
            sizeClasses[size],
            value === "USD"
              ? "bg-background shadow-sm text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <DollarSign className={iconSizes[size]} />
          {showLabels && <span>USD</span>}
        </button>
      </div>
      
      {/* Exchange Rate Indicator */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground cursor-help">
            1 USD = ₹{EXCHANGE_RATE.toFixed(2)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Live exchange rate (updated daily)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// Hook for currency conversion
export function useCurrencyConverter(currency: "INR" | "USD") {
  const convert = React.useCallback(
    (amount: number, fromCurrency: "INR" | "USD") => {
      if (fromCurrency === currency) return amount;
      if (fromCurrency === "INR" && currency === "USD") {
        return amount / EXCHANGE_RATE;
      }
      return amount * EXCHANGE_RATE;
    },
    [currency]
  );

  const format = React.useCallback(
    (amount: number, options?: { compact?: boolean; decimals?: number }) => {
      const { compact = false, decimals = 0 } = options || {};

      if (currency === "INR") {
        if (compact && amount >= 10000000) {
          return `₹${(amount / 10000000).toFixed(2)} Cr`;
        }
        if (compact && amount >= 100000) {
          return `₹${(amount / 100000).toFixed(2)} L`;
        }
        return `₹${amount.toLocaleString("en-IN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}`;
      }

      if (compact && amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(2)}M`;
      }
      if (compact && amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;
      }
      return `$${amount.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    },
    [currency]
  );

  return { convert, format, exchangeRate: EXCHANGE_RATE };
}

export default CurrencyToggle;