"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  Gift,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface CreditTransaction {
  id: string;
  type: "used" | "added" | "bonus" | "refund" | "expired";
  amount: number;
  description: string;
  descriptionHi?: string;
  timestamp: Date;
  balance: number;
}

interface CreditBalanceProps {
  currentCredits?: number;
  credits?: number; // alias for backward compatibility
  monthlyCredits?: number;
  bonusCredits?: number;
  usedThisMonth?: number;
  resetDate?: Date;
  transactions?: CreditTransaction[];
  onBuyCredits?: () => void;
  variant?: "compact" | "full" | "dashboard";
  isLoading?: boolean;
}

export function CreditBalance({
  currentCredits,
  credits, // legacy support
  monthlyCredits = 0,
  bonusCredits = 0,
  usedThisMonth = 0,
  resetDate,
  transactions = [],
  onBuyCredits,
  variant = "full",
  isLoading = false,
}: CreditBalanceProps) {
  const { language } = useLanguage();
  const isHindi = language === "hi";

  const [showHistory, setShowHistory] = useState(false);

  // SAFELY RESOLVE CREDITS (supports both currentCredits and legacy credits prop)
  const safeCurrent = Number(credits ?? currentCredits ?? 0);
  const safeBonus = Number(bonusCredits || 0);
  const safeUsed = Number(usedThisMonth || 0);
  const safeMonthly = Number(monthlyCredits || 0);

  const totalCredits = safeCurrent + safeBonus;

  const usagePercentage = safeMonthly
    ? Math.min(100, (safeUsed / safeMonthly) * 100)
    : 0;

  const isLowCredits = safeCurrent < safeMonthly * 0.2;
  const isDanger = safeCurrent < safeMonthly * 0.1;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(isHindi ? "hi-IN" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getDaysUntilReset = () => {
    if (!resetDate) return null;
    const diff = new Date(resetDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTransactionIcon = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "used":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "added":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "bonus":
        return <Gift className="w-4 h-4 text-violet-500" />;
      case "refund":
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case "expired":
        return <Clock className="w-4 h-4 text-zinc-400" />;
      default:
        return <Zap className="w-4 h-4 text-amber-500" />;
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                               COMPACT VARIANT                              */
  /* -------------------------------------------------------------------------- */
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
          isDanger
            ? "bg-red-100 dark:bg-red-900/30"
            : isLowCredits
            ? "bg-amber-100 dark:bg-amber-900/30"
            : "bg-violet-100 dark:bg-violet-900/30"
        )}
      >
        <Zap
          className={cn(
            "w-4 h-4",
            isDanger
              ? "text-red-600 dark:text-red-400"
              : isLowCredits
              ? "text-amber-600 dark:text-amber-400"
              : "text-violet-600 dark:text-violet-400"
          )}
        />

        <span className="font-semibold text-sm">
          {totalCredits.toLocaleString()}
        </span>

        {safeBonus > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5">
            +{safeBonus.toLocaleString()}
          </Badge>
        )}
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             DASHBOARD VARIANT                              */
  /* -------------------------------------------------------------------------- */
  if (variant === "dashboard") {
    return (
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>

              <div>
                <p className="text-sm text-zinc-500">
                  {isHindi ? "उपलब्ध क्रेडिट" : "Available Credits"}
                </p>

                <motion.p className="text-3xl font-bold">
                  {totalCredits.toLocaleString()}
                </motion.p>
              </div>
            </div>

            {onBuyCredits && (
              <Button onClick={onBuyCredits} variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                {isHindi ? "खरीदें" : "Buy More"}
              </Button>
            )}
          </div>

          {/* Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>
                {isHindi ? "इस महीने उपयोग किया" : "Used this month"}
              </span>
              <span>
                {safeUsed.toLocaleString()} /{" "}
                {safeMonthly.toLocaleString()}
              </span>
            </div>

            <Progress value={usagePercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                  FULL VARIANT                              */
  /* -------------------------------------------------------------------------- */
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isHindi ? "क्रेडिट बैलेंस" : "Credit Balance"}</CardTitle>
        <CardDescription>
          {isHindi
            ? "AI रेंडर के लिए आपके क्रेडिट"
            : "Your credits for AI renders"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Total Credits */}
        <div className="text-center p-6 rounded-2xl bg-violet-50 dark:bg-violet-950/20">
          <motion.div className="text-5xl font-bold text-violet-700 dark:text-violet-300">
            {totalCredits.toLocaleString()}
          </motion.div>

          <p className="text-zinc-500 mt-1">
            {isHindi ? "कुल उपलब्ध क्रेडिट" : "Total Available Credits"}
          </p>

          {safeBonus > 0 && (
            <Badge className="mt-2">
              +{safeBonus.toLocaleString()}{" "}
              {isHindi ? "बोनस" : "Bonus"}
            </Badge>
          )}
        </div>

        {/* Three stats */}
        <div className="grid grid-cols-3 text-center">
          <div>
            <p className="text-2xl font-bold">
              {safeCurrent.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500">
              {isHindi ? "मासिक" : "Monthly"}
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold text-amber-600">
              {safeBonus.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500">
              {isHindi ? "बोनस" : "Bonus"}
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold text-red-600">
              {safeUsed.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500">
              {isHindi ? "उपयोग किया" : "Used"}
            </p>
          </div>
        </div>

        {/* History */}
        {transactions.length > 0 && (
          <Collapsible open={showHistory} onOpenChange={setShowHistory}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                {isHindi ? "लेन-देन इतिहास" : "Transaction History"}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    showHistory && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {transactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
                  >
                    {getTransactionIcon(tx.type)}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isHindi && tx.descriptionHi
                          ? tx.descriptionHi
                          : tx.description}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "font-semibold text-sm",
                        tx.type === "used" || tx.type === "expired"
                          ? "text-red-600"
                          : "text-green-600"
                      )}
                    >
                      {tx.type === "used" || tx.type === "expired"
                        ? "-"
                        : "+"}
                      {Number(tx.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export default CreditBalance;