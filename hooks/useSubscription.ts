// hooks/useSubscription.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

export type PlanType = "free" | "pro" | "teams";
export type BillingCycle = "monthly" | "yearly";

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: PlanType;
  price: {
    monthly: {
      usd: number;
      inr: number;
    };
    yearly: {
      usd: number;
      inr: number;
    };
  };
  credits: number;
  features: string[];
  popular?: boolean;
}

export interface Subscription {
  id: string;
  planType: PlanType;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  billingCycle: BillingCycle;
  provider: "stripe" | "razorpay";
  customerId: string;
  subscriptionId: string;
}

export interface UserCredits {
  total: number;
  used: number;
  remaining: number;
  resetsAt: Date;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  date: Date;
  downloadUrl?: string;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    type: "free",
    price: {
      monthly: { usd: 0, inr: 0 },
      yearly: { usd: 0, inr: 0 },
    },
    credits: 5,
    features: [
      "5 renders per month",
      "Basic room styles",
      "Standard quality",
      "Community support",
      "Watermarked exports",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    type: "pro",
    price: {
      monthly: { usd: 29, inr: 2399 },
      yearly: { usd: 290, inr: 23990 },
    },
    credits: 100,
    features: [
      "100 renders per month",
      "400+ design styles",
      "HD quality exports",
      "Vastu analysis",
      "Cost calculator",
      "Priority support",
      "No watermarks",
      "Commercial license",
    ],
    popular: true,
  },
  {
    id: "teams",
    name: "Teams",
    type: "teams",
    price: {
      monthly: { usd: 99, inr: 8199 },
      yearly: { usd: 990, inr: 81990 },
    },
    credits: 500,
    features: [
      "500 renders per user/month",
      "Everything in Pro",
      "Team collaboration",
      "Shared projects",
      "Admin dashboard",
      "API access",
      "Custom branding",
      "Dedicated support",
      "SSO integration",
    ],
  },
];

export function useSubscription() {
  const { user, isLoading: isLoaded } = useAuth();
  const { toast } = useToast();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch subscription details
  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/user/subscription");
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setCredits(data.credits);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/user/invoices");
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  }, [user]);

  // Create checkout session
  const createCheckout = useCallback(
    async (
      planType: PlanType,
      billingCycle: BillingCycle,
      provider: "stripe" | "razorpay" = "stripe"
    ) => {
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to sign in to upgrade your plan",
          variant: "destructive",
        });
        return null;
      }

      try {
        setIsProcessing(true);

        const response = await fetch("/api/payment/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType,
            billingCycle,
            provider,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create checkout session");
        }

        const data = await response.json();
        
        if (provider === "stripe" && data.url) {
          window.location.href = data.url;
        } else if (provider === "razorpay" && data.orderId) {
          return data;
        }

        return data;
      } catch (error) {
        console.error("Checkout error:", error);
        toast({
          title: "Error",
          description: "Failed to initiate checkout. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [user, toast]
  );

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!subscription) return false;

    try {
      setIsProcessing(true);

      const response = await fetch("/api/user/subscription/cancel", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      toast({
        title: "Subscription canceled",
        description: "Your subscription will remain active until the end of the billing period",
      });

      await fetchSubscription();
      return true;
    } catch (error) {
      console.error("Cancel error:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [subscription, toast, fetchSubscription]);

  // Resume subscription
  const resumeSubscription = useCallback(async () => {
    if (!subscription?.cancelAtPeriodEnd) return false;

    try {
      setIsProcessing(true);

      const response = await fetch("/api/user/subscription/resume", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to resume subscription");
      }

      toast({
        title: "Subscription resumed",
        description: "Your subscription will continue at the end of the billing period",
      });

      await fetchSubscription();
      return true;
    } catch (error) {
      console.error("Resume error:", error);
      toast({
        title: "Error",
        description: "Failed to resume subscription. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [subscription, toast, fetchSubscription]);

  // Change plan
  const changePlan = useCallback(
    async (newPlanType: PlanType, billingCycle: BillingCycle) => {
      if (!subscription) {
        return createCheckout(newPlanType, billingCycle);
      }

      try {
        setIsProcessing(true);

        const response = await fetch("/api/user/subscription/change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType: newPlanType,
            billingCycle,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to change plan");
        }

        toast({
          title: "Plan updated",
          description: "Your plan has been successfully changed",
        });

        await fetchSubscription();
        return true;
      } catch (error) {
        console.error("Change plan error:", error);
        toast({
          title: "Error",
          description: "Failed to change plan. Please try again.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [subscription, createCheckout, toast, fetchSubscription]
  );

  // Use credits
  const useCredits = useCallback(
    async (amount: number = 1): Promise<boolean> => {
      if (!credits || credits.remaining < amount) {
        toast({
          title: "Insufficient credits",
          description: "Please upgrade your plan for more renders",
          variant: "destructive",
        });
        return false;
      }

      try {
        const response = await fetch("/api/user/credits/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
          throw new Error("Failed to use credits");
        }

        const data = await response.json();
        setCredits(data.credits);
        return true;
      } catch (error) {
        console.error("Use credits error:", error);
        toast({
          title: "Error",
          description: "Failed to process credits. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    },
    [credits, toast]
  );

  // Check feature access
  const hasFeature = useCallback(
    (feature: string): boolean => {
      const currentPlan = PLANS.find(
        (p) => p.type === (subscription?.planType || "free")
      );
      return currentPlan?.features.includes(feature) || false;
    },
    [subscription]
  );

  // Get current plan
  const getCurrentPlan = useCallback((): SubscriptionPlan => {
    return (
      PLANS.find((p) => p.type === (subscription?.planType || "free")) ||
      PLANS[0]
    );
  }, [subscription]);

  // Check if user can perform action
  const canPerformAction = useCallback(
    (requiredPlan: PlanType = "free"): boolean => {
      const planOrder: PlanType[] = ["free", "pro", "teams"];
      const currentIndex = planOrder.indexOf(subscription?.planType || "free");
      const requiredIndex = planOrder.indexOf(requiredPlan);
      return currentIndex >= requiredIndex;
    },
    [subscription]
  );

  // Days remaining in billing period
  const daysRemaining = useCallback((): number => {
    if (!subscription?.currentPeriodEnd) return 0;
    const now = new Date();
    const end = new Date(subscription.currentPeriodEnd);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription]);

  // Initialize
  useEffect(() => {
    if (isLoaded && user) {
      fetchSubscription();
      fetchInvoices();
    } else if (isLoaded && !user) {
      setIsLoading(false);
    }
  }, [isLoaded, user, fetchSubscription, fetchInvoices]);

  return {
    // State
    subscription,
    credits,
    invoices,
    isLoading,
    isProcessing,
    plans: PLANS,
    
    // Actions
    createCheckout,
    cancelSubscription,
    resumeSubscription,
    changePlan,
    useCredits,
    refreshSubscription: fetchSubscription,
    refreshInvoices: fetchInvoices,
    
    // Helpers
    hasFeature,
    getCurrentPlan,
    canPerformAction,
    daysRemaining,
    
    // Computed
    isPro: subscription?.planType === "pro" || subscription?.planType === "teams",
    isTeams: subscription?.planType === "teams",
    isFree: !subscription || subscription.planType === "free",
    isActive: subscription?.status === "active" || subscription?.status === "trialing",
    isCanceled: subscription?.cancelAtPeriodEnd || subscription?.status === "canceled",
  };
}

export default useSubscription;