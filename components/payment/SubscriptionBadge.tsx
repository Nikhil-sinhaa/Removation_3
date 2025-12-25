// components/payment/SubscriptionBadge.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Zap,
  Sparkles,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

export type SubscriptionPlan = 'free' | 'pro' | 'teams' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'expired';

interface SubscriptionBadgeProps {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt?: Date | null;
  trialEndsAt?: Date | null;
  variant?: 'default' | 'compact' | 'detailed';
  showTooltip?: boolean;
  className?: string;
}

const planConfig: Record<SubscriptionPlan, {
  name: string;
  nameHi: string;
  icon: React.ReactNode;
  gradient: string;
  bgColor: string;
  textColor: string;
}> = {
  free: {
    name: 'Free',
    nameHi: 'मुफ़्त',
    icon: <Zap className="w-3 h-3" />,
    gradient: 'from-zinc-500 to-zinc-600',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
    textColor: 'text-zinc-700 dark:text-zinc-300',
  },
  pro: {
    name: 'Pro',
    nameHi: 'प्रो',
    icon: <Sparkles className="w-3 h-3" />,
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    textColor: 'text-violet-700 dark:text-violet-300',
  },
  teams: {
    name: 'Teams',
    nameHi: 'टीम्स',
    icon: <Building2 className="w-3 h-3" />,
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  enterprise: {
    name: 'Enterprise',
    nameHi: 'एंटरप्राइज',
    icon: <Crown className="w-3 h-3" />,
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
  },
};

const statusConfig: Record<SubscriptionStatus, {
  label: string;
  labelHi: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  active: {
    label: 'Active',
    labelHi: 'सक्रिय',
    icon: <CheckCircle2 className="w-3 h-3" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  trialing: {
    label: 'Trial',
    labelHi: 'ट्रायल',
    icon: <Clock className="w-3 h-3" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  past_due: {
    label: 'Past Due',
    labelHi: 'देय बकाया',
    icon: <AlertTriangle className="w-3 h-3" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  canceled: {
    label: 'Canceled',
    labelHi: 'रद्द',
    icon: <XCircle className="w-3 h-3" />,
    color: 'text-zinc-500 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
  },
  unpaid: {
    label: 'Unpaid',
    labelHi: 'अवैतनिक',
    icon: <AlertTriangle className="w-3 h-3" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  expired: {
    label: 'Expired',
    labelHi: 'समाप्त',
    icon: <XCircle className="w-3 h-3" />,
    color: 'text-zinc-500 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
  },
};

export function SubscriptionBadge({
  plan,
  status,
  expiresAt,
  trialEndsAt,
  variant = 'default',
  showTooltip = true,
  className,
}: SubscriptionBadgeProps) {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  const planInfo = planConfig[plan];
  const statusInfo = statusConfig[status];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(isHindi ? 'hi-IN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getDaysRemaining = (date: Date) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTooltipContent = () => {
    let content = `${isHindi ? planInfo.nameHi : planInfo.name} - ${isHindi ? statusInfo.labelHi : statusInfo.label}`;

    if (status === 'trialing' && trialEndsAt) {
      const days = getDaysRemaining(trialEndsAt);
      content += `\n${isHindi ? `ट्रायल ${days} दिन में समाप्त` : `Trial ends in ${days} days`}`;
    }

    if (expiresAt && status !== 'canceled' && status !== 'expired') {
      content += `\n${isHindi ? 'नवीनीकरण:' : 'Renews:'} ${formatDate(expiresAt)}`;
    }

    return content;
  };

  const renderBadge = () => {
    switch (variant) {
      case 'compact':
        return (
          <Badge
            className={cn(
              'px-2 py-0.5 font-medium border-0',
              `bg-gradient-to-r ${planInfo.gradient} text-white`,
              className
            )}
          >
            {planInfo.icon}
            <span className="ml-1">{isHindi ? planInfo.nameHi : planInfo.name}</span>
          </Badge>
        );

      case 'detailed':
        return (
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-xl',
              planInfo.bgColor,
              className
            )}
          >
            <motion.div
              animate={{ rotate: plan !== 'free' ? [0, 10, -10, 0] : 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                `bg-gradient-to-br ${planInfo.gradient} text-white shadow-sm`
              )}
            >
              {planInfo.icon}
            </motion.div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className={cn('font-semibold', planInfo.textColor)}>
                  {isHindi ? planInfo.nameHi : planInfo.name}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'px-1.5 py-0 text-[10px] font-medium',
                    statusInfo.bgColor,
                    statusInfo.color
                  )}
                >
                  {statusInfo.icon}
                  <span className="ml-0.5">
                    {isHindi ? statusInfo.labelHi : statusInfo.label}
                  </span>
                </Badge>
              </div>
              
              {status === 'trialing' && trialEndsAt && (
                <span className="text-xs text-zinc-500">
                  {isHindi 
                    ? `${getDaysRemaining(trialEndsAt)} दिन शेष`
                    : `${getDaysRemaining(trialEndsAt)} days left`
                  }
                </span>
              )}

              {expiresAt && status === 'active' && (
                <span className="text-xs text-zinc-500">
                  {isHindi ? 'नवीनीकरण:' : 'Renews:'} {formatDate(expiresAt)}
                </span>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className={cn('inline-flex items-center gap-1.5', className)}>
            <Badge
              className={cn(
                'px-2.5 py-1 font-medium border-0 gap-1',
                `bg-gradient-to-r ${planInfo.gradient} text-white`
              )}
            >
              {planInfo.icon}
              <span>{isHindi ? planInfo.nameHi : planInfo.name}</span>
            </Badge>
            
            {status !== 'active' && (
              <Badge
                variant="secondary"
                className={cn(
                  'px-2 py-1 font-medium gap-1',
                  statusInfo.bgColor,
                  statusInfo.color
                )}
              >
                {statusInfo.icon}
                <span>{isHindi ? statusInfo.labelHi : statusInfo.label}</span>
              </Badge>
            )}
          </div>
        );
    }
  };

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {renderBadge()}
          </TooltipTrigger>
          <TooltipContent>
            <p className="whitespace-pre-line text-sm">{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return renderBadge();
}

export default SubscriptionBadge;