// app/(app)/pricing/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
// TODO: Remnant Clerk imports: useUser, useAuth
import Link from 'next/link';
import Image from 'next/image';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Crown,
  Building2,
  Users,
  Star,
  ArrowRight,
  HelpCircle,
  Shield,
  CreditCard,
  Gift,
  Percent,
  Clock,
  Infinity,
  Download,
  Palette,
  Wand2,
  Compass,
  IndianRupee,
  DollarSign,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Award,
  TrendingUp,
  Lock,
  RefreshCw,
  Headphones,
  FileText,
  Video,
  Image as ImageIcon,
  Layers,
  Share2,
  Cloud,
  Cpu,
  Gauge,
  Heart,
  BadgeCheck,
  Timer,
  CalendarDays,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Types
interface PricingPlan {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
  enterprise?: boolean;
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
  credits: {
    monthly: number;
    yearly: number;
  };
  features: {
    text: string;
    included: boolean;
    tooltip?: string;
    highlight?: boolean;
  }[];
  cta: string;
  ctaVariant: 'default' | 'outline' | 'secondary';
}

interface FAQ {
  question: string;
  answer: string;
}

// Pricing data
const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out Removation.ai',
    icon: <Sparkles className="h-6 w-6" />,
    price: {
      monthly: { usd: 0, inr: 0 },
      yearly: { usd: 0, inr: 0 },
    },
    credits: {
      monthly: 5,
      yearly: 5,
    },
    features: [
      { text: '5 free renders per month', included: true },
      { text: 'Basic design styles (50+)', included: true },
      { text: 'Standard resolution (1024px)', included: true },
      { text: 'Vastu Score (basic)', included: true },
      { text: 'Cost estimate (basic)', included: true },
      { text: 'Watermark on exports', included: true },
      { text: 'Community support', included: true },
      { text: 'HD resolution (4K)', included: false },
      { text: 'Priority processing', included: false },
      { text: 'Inpainting & editing tools', included: false },
      { text: 'API access', included: false },
      { text: 'Team collaboration', included: false },
    ],
    cta: 'Get Started Free',
    ctaVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best for professionals and designers',
    icon: <Zap className="h-6 w-6" />,
    popular: true,
    price: {
      monthly: { usd: 29, inr: 2399 },
      yearly: { usd: 290, inr: 23990 },
    },
    credits: {
      monthly: 100,
      yearly: 1200,
    },
    features: [
      { text: '100 renders per month', included: true, highlight: true },
      { text: 'All 400+ design styles', included: true, highlight: true },
      { text: '4K HD resolution', included: true, highlight: true },
      { text: 'Advanced Vastu analysis', included: true, highlight: true },
      { text: 'Detailed cost breakdown', included: true, highlight: true },
      { text: 'No watermark', included: true },
      { text: 'Inpainting & object removal', included: true },
      { text: 'Fill empty room', included: true },
      { text: 'Sketch to render', included: true },
      { text: 'Priority processing (2x faster)', included: true },
      { text: 'Email support', included: true },
      { text: 'API access (1000 calls/mo)', included: false },
      { text: 'Team collaboration', included: false },
      { text: 'Custom branding', included: false },
    ],
    cta: 'Start Pro Trial',
    ctaVariant: 'default',
  },
  {
    id: 'teams',
    name: 'Teams',
    description: 'For design studios and agencies',
    icon: <Users className="h-6 w-6" />,
    price: {
      monthly: { usd: 99, inr: 8199 },
      yearly: { usd: 990, inr: 81990 },
    },
    credits: {
      monthly: 500,
      yearly: 6000,
    },
    features: [
      { text: '500 renders per user/month', included: true, highlight: true },
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited team members', included: true, highlight: true },
      { text: 'Team workspace & projects', included: true },
      { text: 'Role-based permissions', included: true },
      { text: 'Shared asset library', included: true },
      { text: 'API access (10,000 calls/mo)', included: true },
      { text: 'White-label exports', included: true },
      { text: 'Custom branding', included: true },
      { text: 'Priority support (24/7)', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'SSO & advanced security', included: true },
    ],
    cta: 'Contact Sales',
    ctaVariant: 'secondary',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    icon: <Building2 className="h-6 w-6" />,
    enterprise: true,
    price: {
      monthly: { usd: -1, inr: -1 },
      yearly: { usd: -1, inr: -1 },
    },
    credits: {
      monthly: -1,
      yearly: -1,
    },
    features: [
      { text: 'Unlimited renders', included: true, highlight: true },
      { text: 'Everything in Teams', included: true },
      { text: 'Custom AI model training', included: true, highlight: true },
      { text: 'On-premise deployment option', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'SLA guarantee (99.9% uptime)', included: true },
      { text: 'Dedicated infrastructure', included: true },
      { text: 'Advanced analytics & reporting', included: true },
      { text: 'Custom contract & billing', included: true },
      { text: 'Training & onboarding', included: true },
      { text: '24/7 phone support', included: true },
      { text: 'Security audit & compliance', included: true },
    ],
    cta: 'Talk to Sales',
    ctaVariant: 'outline',
  },
];

const FEATURE_COMPARISON = [
  {
    category: 'Renders & Generation',
    features: [
      { name: 'Monthly renders', free: '5', pro: '100', teams: '500/user', enterprise: 'Unlimited' },
      { name: 'Design styles', free: '50+', pro: '400+', teams: '400+', enterprise: 'Custom' },
      { name: 'Max resolution', free: '1024px', pro: '4K', teams: '4K', enterprise: '8K' },
      { name: 'Render speed', free: 'Standard', pro: '2x faster', teams: '3x faster', enterprise: 'Dedicated' },
      { name: 'Concurrent renders', free: '1', pro: '3', teams: '10', enterprise: 'Unlimited' },
    ],
  },
  {
    category: 'AI Features',
    features: [
      { name: 'Room redesign', free: true, pro: true, teams: true, enterprise: true },
      { name: 'Fill empty room', free: false, pro: true, teams: true, enterprise: true },
      { name: 'Inpainting', free: false, pro: true, teams: true, enterprise: true },
      { name: 'Object removal', free: false, pro: true, teams: true, enterprise: true },
      { name: 'Sketch to render', free: false, pro: true, teams: true, enterprise: true },
      { name: 'Outdoor/landscape', free: false, pro: true, teams: true, enterprise: true },
      { name: 'Custom style training', free: false, pro: false, teams: false, enterprise: true },
    ],
  },
  {
    category: 'India-Specific Features',
    features: [
      { name: 'Vastu analysis', free: 'Basic', pro: 'Advanced', teams: 'Advanced', enterprise: 'Custom' },
      { name: 'Cost estimation', free: 'Basic', pro: 'Detailed', teams: 'Detailed', enterprise: 'Custom' },
      { name: 'Indian cities pricing', free: '5 cities', pro: '50+ cities', teams: '50+ cities', enterprise: 'All' },
      { name: 'Material database', free: 'Limited', pro: 'Full', teams: 'Full', enterprise: 'Custom' },
      { name: 'Contractor connect', free: false, pro: false, teams: true, enterprise: true },
    ],
  },
  {
    category: 'Export & Integration',
    features: [
      { name: 'Watermark-free exports', free: false, pro: true, teams: true, enterprise: true },
      { name: 'PDF reports', free: false, pro: true, teams: true, enterprise: true },
      { name: 'API access', free: false, pro: '1K/mo', teams: '10K/mo', enterprise: 'Unlimited' },
      { name: 'Webhooks', free: false, pro: false, teams: true, enterprise: true },
      { name: 'White-label', free: false, pro: false, teams: true, enterprise: true },
    ],
  },
  {
    category: 'Collaboration',
    features: [
      { name: 'Projects', free: '3', pro: 'Unlimited', teams: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Team members', free: '1', pro: '1', teams: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Shared workspace', free: false, pro: false, teams: true, enterprise: true },
      { name: 'Comments & feedback', free: false, pro: false, teams: true, enterprise: true },
      { name: 'Version history', free: '7 days', pro: '30 days', teams: '1 year', enterprise: 'Unlimited' },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Community support', free: true, pro: true, teams: true, enterprise: true },
      { name: 'Email support', free: false, pro: true, teams: true, enterprise: true },
      { name: 'Priority support', free: false, pro: false, teams: true, enterprise: true },
      { name: 'Phone support', free: false, pro: false, teams: false, enterprise: true },
      { name: 'Dedicated manager', free: false, pro: false, teams: false, enterprise: true },
    ],
  },
];

const FAQS: FAQ[] = [
  {
    question: 'What is a render credit?',
    answer: 'A render credit is used each time you generate a new design variation. One credit = one AI-generated image. If you generate 4 variations at once, it uses 4 credits.',
  },
  {
    question: 'Can I switch between plans?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, the new rate applies from your next billing cycle.',
  },
  {
    question: 'Do unused credits roll over?',
    answer: 'Monthly credits reset at the start of each billing cycle and do not roll over. However, yearly plan credits are available for the entire year, giving you more flexibility.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit/debit cards (Visa, Mastercard, American Express), UPI, net banking, and popular wallets. For Indian customers, we also support Razorpay for seamless payments in INR.',
  },
  {
    question: 'Is there a free trial for Pro plans?',
    answer: 'Yes! Pro and Teams plans come with a 7-day free trial. You can cancel anytime during the trial without being charged.',
  },
  {
    question: 'How accurate is the Vastu analysis?',
    answer: 'Our Vastu AI engine is trained on 120+ traditional Vastu Shastra principles and has been validated by certified Vastu consultants. It provides directional analysis, element placement suggestions, and a comprehensive score.',
  },
  {
    question: 'How is the renovation cost calculated?',
    answer: 'Our cost engine uses real-time pricing data from 50+ Indian cities, including material costs, labor rates, and local taxes. Estimates are updated monthly and include detailed breakdowns by category.',
  },
  {
    question: 'Can I use Removation.ai for commercial projects?',
    answer: 'Absolutely! Pro and Teams plans include commercial usage rights. You can use generated designs for client presentations, marketing materials, and professional projects.',
  },
  {
    question: 'What if I need more credits?',
    answer: 'You can purchase additional credit packs anytime. Bonus credits are available at discounted rates and never expire. Contact sales for volume discounts.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact support for a full refund, no questions asked.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Interior Designer',
    company: 'Design Studio Mumbai',
    avatar: '/images/testimonials/priya.jpg',
    content: 'Removation.ai has transformed my workflow. The Vastu analysis feature is a game-changer for my Indian clients. I\'ve doubled my project output!',
    rating: 5,
  },
  {
    name: 'Rajesh Kumar',
    role: 'Architect',
    company: 'RK Associates',
    avatar: '/images/testimonials/rajesh.jpg',
    content: 'The cost estimation in INR is incredibly accurate. My clients love seeing detailed breakdowns before we even start the project.',
    rating: 5,
  },
  {
    name: 'Sarah Chen',
    role: 'Real Estate Agent',
    company: 'Premium Properties',
    avatar: '/images/testimonials/sarah.jpg',
    content: 'I use Removation.ai to stage empty properties virtually. The before/after comparisons help my listings sell 40% faster!',
    rating: 5,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoading: isLoaded } = useAuth();
  const isSignedIn = !!user;
  const { toast } = useToast();

  // State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'USD' | 'INR'>('INR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Detect user's location for currency
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code === 'IN') {
          setCurrency('INR');
        } else {
          setCurrency('USD');
        }
      } catch (error) {
        // Default to INR for Indian users
        setCurrency('INR');
      }
    };
    detectLocation();
  }, []);

  // Calculate savings for yearly
  const yearlySavings = (plan: PricingPlan) => {
    if (plan.price.monthly.usd === 0 || plan.price.monthly.usd === -1) return 0;
    const monthlyTotal = plan.price.monthly[currency.toLowerCase() as 'usd' | 'inr'] * 12;
    const yearlyTotal = plan.price.yearly[currency.toLowerCase() as 'usd' | 'inr'];
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
  };

  // Format price
  const formatPrice = (amount: number) => {
    if (amount === -1) return 'Custom';
    if (amount === 0) return 'Free';
    
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle plan selection
  const handleSelectPlan = async (planId: string) => {
    if (!isSignedIn) {
      router.push('/sign-up?redirect=/billing');
      return;
    }

    if (planId === 'free') {
      router.push('/dashboard');
      return;
    }

    if (planId === 'enterprise') {
      window.location.href = 'mailto:enterprise@removation.ai?subject=Enterprise Plan Inquiry';
      return;
    }

    setSelectedPlan(planId);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle,
          currency,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.razorpayOrderId) {
        // Handle Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: 'INR',
          name: 'Removation.ai',
          description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan - ${billingCycle}`,
          order_id: data.razorpayOrderId,
          handler: async (response: any) => {
            await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            router.push('/dashboard?upgrade=success');
          },
          prefill: {
            email: user?.emailAddresses[0]?.emailAddress,
            name: user?.fullName,
          },
          theme: {
            color: '#7C3AED',
          },
        };
        // @ts-ignore
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-30" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4 gap-2">
                <Gift className="h-4 w-4" />
                Save up to 17% with yearly billing
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Simple, transparent{' '}
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  pricing
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8">
                Start free and scale as you grow. No hidden fees, no surprises.
                <br />
                Cancel anytime.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-3 bg-muted p-1 rounded-full">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-all',
                      billingCycle === 'monthly'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                      billingCycle === 'yearly'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Yearly
                    <Badge variant="default" className="bg-green-500 text-xs">
                      Save 17%
                    </Badge>
                  </button>
                </div>

                <Separator orientation="vertical" className="h-8" />

                {/* Currency Toggle */}
                <div className="flex items-center gap-2 bg-muted p-1 rounded-full">
                  <button
                    onClick={() => setCurrency('INR')}
                    className={cn(
                      'px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1',
                      currency === 'INR'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <IndianRupee className="h-4 w-4" />
                    INR
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={cn(
                      'px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1',
                      currency === 'USD'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <DollarSign className="h-4 w-4" />
                    USD
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mt-12">
              {PRICING_PLANS.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className={cn(
                      'relative h-full flex flex-col transition-all duration-300 hover:shadow-xl',
                      plan.popular && 'border-primary shadow-lg scale-[1.02] lg:scale-105',
                      plan.enterprise && 'border-dashed'
                    )}
                  >
                    {/* Popular Badge */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground gap-1 px-3 py-1">
                          <Star className="h-3 w-3 fill-current" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <div
                        className={cn(
                          'mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-4',
                          plan.popular
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {plan.icon}
                      </div>

                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 pb-4">
                      {/* Price */}
                      <div className="text-center mb-6">
                        {plan.enterprise ? (
                          <div className="text-3xl font-bold">Custom</div>
                        ) : (
                          <>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-4xl font-bold">
                                {formatPrice(
                                  plan.price[billingCycle][currency.toLowerCase() as 'usd' | 'inr']
                                )}
                              </span>
                              {plan.price.monthly.usd > 0 && (
                                <span className="text-muted-foreground">
                                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                                </span>
                              )}
                            </div>
                            {billingCycle === 'yearly' && yearlySavings(plan) > 0 && (
                              <Badge variant="secondary" className="mt-2 gap-1">
                                <Percent className="h-3 w-3" />
                                Save {yearlySavings(plan)}%
                              </Badge>
                            )}
                          </>
                        )}
                      </div>

                      {/* Credits */}
                      {!plan.enterprise && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            {plan.credits[billingCycle] === -1 ? (
                              <span className="flex items-center justify-center gap-1">
                                <Infinity className="h-4 w-4" />
                                Unlimited renders
                              </span>
                            ) : (
                              <>
                                <span className="text-2xl font-bold text-foreground">
                                  {plan.credits[billingCycle]}
                                </span>{' '}
                                renders/{billingCycle === 'yearly' ? 'year' : 'month'}
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Features */}
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className={cn(
                              'flex items-start gap-2 text-sm',
                              !feature.included && 'text-muted-foreground'
                            )}
                          >
                            {feature.included ? (
                              <Check
                                className={cn(
                                  'h-4 w-4 mt-0.5 flex-shrink-0',
                                  feature.highlight ? 'text-primary' : 'text-green-500'
                                )}
                              />
                            ) : (
                              <X className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                            )}
                            <span className={cn(feature.highlight && 'font-medium')}>
                              {feature.text}
                            </span>
                            {feature.tooltip && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{feature.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="pt-4">
                      <Button
                        className="w-full"
                        size="lg"
                        variant={plan.ctaVariant}
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isProcessing && selectedPlan === plan.id}
                      >
                        {isProcessing && selectedPlan === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {plan.cta}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-8 mt-16"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-green-500" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-5 w-5 text-green-500" />
                <span>Secure payment with SSL</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-5 w-5 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Headphones className="h-5 w-5 text-green-500" />
                <span>24/7 support</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Compare all features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See exactly what you get with each plan
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowComparisonTable(!showComparisonTable)}
              >
                {showComparisonTable ? 'Hide' : 'Show'} comparison table
                <ChevronDown
                  className={cn(
                    'h-4 w-4 ml-2 transition-transform',
                    showComparisonTable && 'rotate-180'
                  )}
                />
              </Button>
            </motion.div>

            <AnimatePresence>
              {showComparisonTable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b">
                          <th className="py-4 px-4 text-left font-semibold">Feature</th>
                          <th className="py-4 px-4 text-center font-semibold">Free</th>
                          <th className="py-4 px-4 text-center font-semibold">
                            <div className="flex items-center justify-center gap-2">
                              Pro
                              <Badge variant="default" className="text-xs">Popular</Badge>
                            </div>
                          </th>
                          <th className="py-4 px-4 text-center font-semibold">Teams</th>
                          <th className="py-4 px-4 text-center font-semibold">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FEATURE_COMPARISON.map((category, categoryIndex) => (
                          <>
                            <tr key={category.category} className="bg-muted/50">
                              <td
                                colSpan={5}
                                className="py-3 px-4 font-semibold text-sm"
                              >
                                {category.category}
                              </td>
                            </tr>
                            {category.features.map((feature, featureIndex) => (
                              <tr
                                key={`${categoryIndex}-${featureIndex}`}
                                className="border-b hover:bg-muted/20 transition-colors"
                              >
                                <td className="py-3 px-4 text-sm">{feature.name}</td>
                                {['free', 'pro', 'teams', 'enterprise'].map((plan) => (
                                  <td
                                    key={plan}
                                    className="py-3 px-4 text-center text-sm"
                                  >
                                    {typeof feature[plan as keyof typeof feature] === 'boolean' ? (
                                      feature[plan as keyof typeof feature] ? (
                                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                                      ) : (
                                        <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                                      )
                                    ) : (
                                      <span
                                        className={cn(
                                          plan === 'pro' && 'font-medium text-primary'
                                        )}
                                      >
                                        {feature[plan as keyof typeof feature] as string}
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge variant="secondary" className="mb-4">
                <Heart className="h-4 w-4 mr-2" />
                Loved by 50,000+ designers
              </Badge>
              <h2 className="text-3xl font-bold mb-4">What our customers say</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {TESTIMONIALS.map((testimonial, index) => (
                <motion.div
                  key={`testimonial-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {testimonial.name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Frequently asked questions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about our pricing
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((faq, index) => (
                  <motion.div
                    key={`faq-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AccordionItem value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </div>

            {/* Contact CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <p className="text-muted-foreground mb-4">
                Still have questions?
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" asChild>
                  <a href="mailto:support@removation.ai">
                    <Mail className="h-4 w-4 mr-2" />
                    Email us
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#" onClick={() => {/* Open Crisp chat */}}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Live chat
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-purple-600 p-12 text-center text-white"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to transform your designs?
                </h2>
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                  Join 50,000+ designers and architects who use Removation.ai
                  to create stunning interior designs in seconds.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-primary font-semibold"
                    onClick={() => handleSelectPlan('pro')}
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-white border-white/30 hover:bg-white/10"
                    asChild
                  >
                    <Link href="/contact">
                      Contact Sales
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-white/60 mt-6">
                  No credit card required • 7-day free trial • Cancel anytime
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Credit Packs Section */}
        <section className="py-16 border-t">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <Badge variant="outline" className="mb-4">
                  <Zap className="h-4 w-4 mr-2" />
                  Need more credits?
                </Badge>
                <h3 className="text-2xl font-bold mb-2">Buy additional credit packs</h3>
                <p className="text-muted-foreground">
                  Purchase extra credits anytime. They never expire!
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { credits: 50, price: { usd: 10, inr: 799 }, bonus: 0 },
                  { credits: 100, price: { usd: 18, inr: 1499 }, bonus: 5, popular: true },
                  { credits: 250, price: { usd: 40, inr: 3299 }, bonus: 15 },
                  { credits: 500, price: { usd: 70, inr: 5799 }, bonus: 50 },
                ].map((pack, index) => (
                  <Card
                    key={`pack-${index}`}
                    className={cn(
                      'relative cursor-pointer transition-all hover:shadow-lg',
                      pack.popular && 'border-primary'
                    )}
                  >
                    {pack.popular && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                        Best Value
                      </Badge>
                    )}
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold mb-1">{pack.credits}</p>
                      <p className="text-sm text-muted-foreground mb-3">credits</p>
                      {pack.bonus > 0 && (
                        <Badge variant="secondary" className="mb-3 gap-1">
                          <Gift className="h-3 w-3" />
                          +{pack.bonus} bonus
                        </Badge>
                      )}
                      <p className="text-lg font-semibold">
                        {formatPrice(pack.price[currency.toLowerCase() as 'usd' | 'inr'])}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPrice(
                          Math.round(
                            pack.price[currency.toLowerCase() as 'usd' | 'inr'] / pack.credits * 100
                          ) / 100
                        )}{' '}
                        per credit
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="outline" size="sm" className="w-full">
                        Buy Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}