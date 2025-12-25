// components/payment/PricingCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Building2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

export interface PricingFeature {
  text: string;
  textHi?: string;
  included: boolean;
  highlight?: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  nameHi?: string;
  description: string;
  descriptionHi?: string;
  priceMonthly: number;
  priceMonthlyINR: number;
  priceYearly: number;
  priceYearlyINR: number;
  credits: number;
  creditsLabel: string;
  features: PricingFeature[];
  popular?: boolean;
  enterprise?: boolean;
  icon: React.ReactNode;
  gradient: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
  buttonText: string;
  buttonTextHi?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  isYearly: boolean;
  currency: 'USD' | 'INR';
  onSelect: (planId: string) => void;
  isLoading?: boolean;
  currentPlan?: string;
}

export function PricingCard({
  plan,
  isYearly,
  currency,
  onSelect,
  isLoading = false,
  currentPlan,
}: PricingCardProps) {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  const price = currency === 'INR'
    ? (isYearly ? plan.priceYearlyINR : plan.priceMonthlyINR)
    : (isYearly ? plan.priceYearly : plan.priceMonthly);

  const monthlyEquivalent = isYearly ? Math.round(price / 12) : price;
  const yearlyDiscount = isYearly ? Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100) : 0;

  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.priceMonthly === 0;

  const formatPrice = (amount: number) => {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN').format(amount);
    }
    return new Intl.NumberFormat('en-US').format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative"
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge 
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-1 
                       text-sm font-medium shadow-lg shadow-violet-500/25"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {isHindi ? 'सबसे लोकप्रिय' : 'Most Popular'}
          </Badge>
        </div>
      )}

      {plan.enterprise && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge 
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 
                       text-sm font-medium shadow-lg shadow-orange-500/25"
          >
            <Crown className="w-3 h-3 mr-1" />
            {isHindi ? 'एंटरप्राइज' : 'Enterprise'}
          </Badge>
        </div>
      )}

      <Card
        className={cn(
          'relative overflow-hidden border-2 transition-all duration-300 h-full',
          plan.popular 
            ? 'border-violet-500/50 shadow-xl shadow-violet-500/10 bg-gradient-to-b from-violet-50/50 to-white dark:from-violet-950/20 dark:to-zinc-900'
            : plan.enterprise
              ? 'border-amber-500/50 shadow-xl shadow-amber-500/10 bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-zinc-900'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
          isCurrentPlan && 'ring-2 ring-green-500 ring-offset-2'
        )}
      >
        {/* Gradient overlay */}
        <div
          className={cn(
            'absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl',
            plan.gradient
          )}
        />

        <CardHeader className="text-center pb-2">
          <div className={cn(
            'w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center',
            'bg-gradient-to-br shadow-lg',
            plan.popular 
              ? 'from-violet-500 to-purple-600 shadow-violet-500/25' 
              : plan.enterprise
                ? 'from-amber-500 to-orange-600 shadow-amber-500/25'
                : 'from-zinc-600 to-zinc-800 shadow-zinc-500/25'
          )}>
            <span className="text-white">{plan.icon}</span>
          </div>

          <CardTitle className="text-2xl font-bold">
            {isHindi && plan.nameHi ? plan.nameHi : plan.name}
          </CardTitle>

          <CardDescription className="text-sm mt-1">
            {isHindi && plan.descriptionHi ? plan.descriptionHi : plan.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center pb-6">
          {/* Price display */}
          <div className="mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-semibold text-zinc-500">{currencySymbol}</span>
              <span className="text-5xl font-bold tracking-tight">
                {isFree ? '0' : formatPrice(monthlyEquivalent)}
              </span>
              <span className="text-zinc-500 text-lg">/mo</span>
            </div>

            {isYearly && !isFree && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-zinc-500">
                  {currencySymbol}{formatPrice(price)}{' '}
                  {isHindi ? 'सालाना बिल' : 'billed yearly'}
                </p>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {isHindi ? `${yearlyDiscount}% बचाएं` : `Save ${yearlyDiscount}%`}
                </Badge>
              </div>
            )}

            {!isYearly && !isFree && (
              <p className="text-sm text-zinc-500 mt-2">
                {isHindi ? 'मासिक बिल' : 'Billed monthly'}
              </p>
            )}
          </div>

          {/* Credits */}
          <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-xl font-bold">{plan.credits.toLocaleString()}</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {isHindi ? 'क्रेडिट/माह' : plan.creditsLabel}
              </span>
            </div>
          </div>

          {/* Features list */}
          <ul className="space-y-3 text-left">
            {plan.features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-start gap-3',
                  !feature.included && 'opacity-50'
                )}
              >
                {feature.included ? (
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    feature.highlight 
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' 
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  )}>
                    <Check className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-zinc-100 dark:bg-zinc-800">
                    <X className="w-3 h-3 text-zinc-400" />
                  </div>
                )}
                <span className={cn(
                  'text-sm',
                  feature.highlight && 'font-medium text-violet-700 dark:text-violet-300'
                )}>
                  {isHindi && feature.textHi ? feature.textHi : feature.text}
                </span>
              </motion.li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            className={cn(
              'w-full py-6 text-base font-semibold transition-all duration-300',
              plan.popular && !isCurrentPlan && 
                'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25',
              plan.enterprise && !isCurrentPlan &&
                'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25'
            )}
            variant={isCurrentPlan ? 'secondary' : plan.buttonVariant}
            onClick={() => onSelect(plan.id)}
            disabled={isLoading || isCurrentPlan}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {isHindi ? 'प्रोसेसिंग...' : 'Processing...'}
              </div>
            ) : isCurrentPlan ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {isHindi ? 'वर्तमान प्लान' : 'Current Plan'}
              </>
            ) : (
              isHindi && plan.buttonTextHi ? plan.buttonTextHi : plan.buttonText
            )}
          </Button>
        </CardFooter>

        {/* Current plan indicator */}
        {isCurrentPlan && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-500 text-white">
              <Check className="w-3 h-3 mr-1" />
              {isHindi ? 'सक्रिय' : 'Active'}
            </Badge>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// Default pricing plans data
export const defaultPricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    nameHi: 'मुफ़्त',
    description: 'Perfect for trying out Removation.ai',
    descriptionHi: 'Removation.ai आज़माने के लिए',
    priceMonthly: 0,
    priceMonthlyINR: 0,
    priceYearly: 0,
    priceYearlyINR: 0,
    credits: 5,
    creditsLabel: 'credits/month',
    icon: <Zap className="w-6 h-6" />,
    gradient: 'bg-zinc-500',
    buttonVariant: 'outline',
    buttonText: 'Get Started',
    buttonTextHi: 'शुरू करें',
    features: [
      { text: '5 AI renders per month', textHi: '5 AI रेंडर प्रति माह', included: true },
      { text: 'Basic design styles', textHi: 'बेसिक डिज़ाइन स्टाइल', included: true },
      { text: 'Standard resolution (720p)', textHi: 'स्टैंडर्ड रेज़ोलूशन (720p)', included: true },
      { text: 'Vastu Score (basic)', textHi: 'वास्तु स्कोर (बेसिक)', included: true },
      { text: 'Cost estimation (basic)', textHi: 'लागत अनुमान (बेसिक)', included: true },
      { text: 'HD renders', textHi: 'HD रेंडर', included: false },
      { text: 'Priority support', textHi: 'प्राथमिकता सहायता', included: false },
      { text: 'API access', textHi: 'API एक्सेस', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    nameHi: 'प्रो',
    description: 'For professionals and serious renovators',
    descriptionHi: 'प्रोफेशनल और गंभीर रेनोवेटर्स के लिए',
    priceMonthly: 29,
    priceMonthlyINR: 2399,
    priceYearly: 290,
    priceYearlyINR: 23990,
    credits: 500,
    creditsLabel: 'credits/month',
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'bg-violet-500',
    buttonVariant: 'default',
    buttonText: 'Upgrade to Pro',
    buttonTextHi: 'प्रो में अपग्रेड करें',
    popular: true,
    features: [
      { text: '500 AI renders per month', textHi: '500 AI रेंडर प्रति माह', included: true, highlight: true },
      { text: 'All 400+ design styles', textHi: 'सभी 400+ डिज़ाइन स्टाइल', included: true, highlight: true },
      { text: '4K HD resolution', textHi: '4K HD रेज़ोलूशन', included: true },
      { text: 'Advanced Vastu analysis', textHi: 'एडवांस्ड वास्तु विश्लेषण', included: true, highlight: true },
      { text: 'Detailed cost breakdown', textHi: 'विस्तृत लागत विवरण', included: true, highlight: true },
      { text: 'Inpainting & object removal', textHi: 'इनपेंटिंग और ऑब्जेक्ट रिमूवल', included: true },
      { text: 'Priority support', textHi: 'प्राथमिकता सहायता', included: true },
      { text: 'Commercial license', textHi: 'कमर्शियल लाइसेंस', included: true },
    ],
  },
  {
    id: 'teams',
    name: 'Teams',
    nameHi: 'टीम्स',
    description: 'For design studios and agencies',
    descriptionHi: 'डिज़ाइन स्टूडियो और एजेंसियों के लिए',
    priceMonthly: 99,
    priceMonthlyINR: 8199,
    priceYearly: 990,
    priceYearlyINR: 81990,
    credits: 2000,
    creditsLabel: 'credits/user/month',
    icon: <Building2 className="w-6 h-6" />,
    gradient: 'bg-amber-500',
    buttonVariant: 'default',
    buttonText: 'Contact Sales',
    buttonTextHi: 'सेल्स से संपर्क करें',
    enterprise: true,
    features: [
      { text: '2000 AI renders per user/month', textHi: '2000 AI रेंडर प्रति यूज़र/माह', included: true, highlight: true },
      { text: 'All Pro features included', textHi: 'सभी प्रो फीचर्स शामिल', included: true },
      { text: 'Team collaboration tools', textHi: 'टीम सहयोग टूल्स', included: true, highlight: true },
      { text: 'White-label exports', textHi: 'व्हाइट-लेबल एक्सपोर्ट', included: true },
      { text: 'API access', textHi: 'API एक्सेस', included: true, highlight: true },
      { text: 'Custom integrations', textHi: 'कस्टम इंटीग्रेशन', included: true },
      { text: 'Dedicated account manager', textHi: 'डेडिकेटेड अकाउंट मैनेजर', included: true },
      { text: 'SLA guarantee', textHi: 'SLA गारंटी', included: true },
    ],
  },
];

export default PricingCard;