'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2, Shield, Zap, Check, CreditCard, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useUserStore } from '@/stores/user-store';
import { useAuth } from '@/components/auth/AuthProvider';

interface CreditPackage {
  id: string;
  credits: number;
  usd: number;
  inr: number;
  popular?: boolean;
}

const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  small: { id: 'small', credits: 25, usd: 9.99, inr: 799 },
  medium: { id: 'medium', credits: 50, usd: 17.99, inr: 1499 },
  large: { id: 'large', credits: 100, usd: 29.99, inr: 2499, popular: true },
  xlarge: { id: 'xlarge', credits: 250, usd: 59.99, inr: 4999 },
  enterprise: { id: 'enterprise', credits: 500, usd: 99.99, inr: 8499 },
};

type PackageType = keyof typeof CREDIT_PACKAGES;
type PaymentMethod = 'stripe' | 'razorpay';
type CheckoutStep = 'plan' | 'processing' | 'success' | 'error';

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
}

export function InsufficientCreditsModal() {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const { user, refreshUser } = useAuth();
  
  const isOpen = useUserStore(s => s.insufficientCreditsModalOpen);
  const setOpen = useUserStore(s => s.setInsufficientCreditsModalOpen);
  const currency = useUserStore(s => s.preferences.currency);
  
  const [step, setStep] = useState<CheckoutStep>('plan');
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('large');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(currency === 'INR' ? 'razorpay' : 'stripe');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('plan');
      setError(null);
      setPaymentMethod(currency === 'INR' ? 'razorpay' : 'stripe');
      loadRazorpayScript().catch(console.error);
    }
  }, [isOpen, currency]);

  const handleClose = () => {
    if (isLoading) return;
    setOpen(false);
  };

  const formatPrice = (amount: number) => {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      const response = await fetch('/api/payment/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: selectedPackage,
          paymentMethod,
          successUrl: window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'credits=success',
          cancelUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      if (paymentMethod === 'stripe' && data.url) {
        window.location.href = data.url;
      } else if (paymentMethod === 'razorpay' && data.orderId) {
        const options = {
          key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: data.name || 'Removation.ai',
          description: data.description,
          order_id: data.orderId,
          handler: async function (response: any) {
            try {
              const verifyResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  type: 'credits'
                }),
              });

              if (verifyResponse.ok) {
                setStep('success');
                await refreshUser();
                setTimeout(() => {
                  setOpen(false);
                }, 2000);
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (err: any) {
              setError(err.message);
              setStep('error');
            }
          },
          prefill: data.prefill,
          notes: data.notes,
          theme: {
            color: '#7c3aed',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setError(response.error.description);
          setStep('error');
        });
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'plan':
        const pkg = CREDIT_PACKAGES[selectedPackage];
        const price = currency === 'INR' ? pkg.inr : pkg.usd;
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(CREDIT_PACKAGES).map((p) => {
                const isSelected = selectedPackage === p.id;
                const pPrice = currency === 'INR' ? p.inr : p.usd;
                const perCredit = pPrice / p.credits;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPackage(p.id as PackageType)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-violet-200 dark:hover:border-violet-800",
                      p.popular && "md:col-span-2"
                    )}
                  >
                    {p.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-violet-500 hover:bg-violet-600 text-white border-none px-2 py-0.5">
                          {isHindi ? 'सबसे लोकप्रिय' : 'Most Popular'}
                        </Badge>
                      </div>
                    )}
                    <div className="font-bold text-xl mb-1">{p.credits} <span className="text-sm font-normal text-zinc-500">cr</span></div>
                    <div className="font-semibold text-lg">{formatPrice(pPrice)}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {formatPrice(perCredit)} / {isHindi ? 'क्रेडिट' : 'cr'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-sm text-zinc-500">
                {isHindi ? 'भुगतान विधि चुनें' : 'Payment Method'}
              </Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="stripe"
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all',
                    paymentMethod === 'stripe'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  )}
                >
                  <RadioGroupItem value="stripe" id="stripe" />
                  <CreditCard className="w-4 h-4 text-violet-500" />
                  <span className="font-medium text-sm">Stripe</span>
                </Label>

                <Label
                  htmlFor="razorpay"
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all',
                    paymentMethod === 'razorpay'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  )}
                >
                  <RadioGroupItem value="razorpay" id="razorpay" />
                  <Globe className="w-4 h-4 text-violet-500" />
                  <span className="font-medium text-sm">Razorpay</span>
                </Label>
              </RadioGroup>
            </div>

            <Button
              className="w-full h-12 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 transition-all"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isHindi ? `${pkg.credits} क्रेडिट ${formatPrice(price)} में खरीदें` : `Buy ${pkg.credits} Credits for ${formatPrice(price)}`}
            </Button>
            
            <div className="text-center">
              <a href="/billing" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline underline-offset-4">
                {isHindi ? 'बिलिंग पेज पर जाएं' : 'Go to billing page'}
              </a>
            </div>
          </motion.div>
        );

      case 'processing':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isHindi ? 'भुगतान प्रोसेस हो रहा है...' : 'Processing Payment...'}
            </h3>
            <p className="text-zinc-500">
              {isHindi ? 'कृपया प्रतीक्षा करें' : 'Please wait'}
            </p>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isHindi ? 'भुगतान सफल!' : 'Payment Successful!'}
            </h3>
            <p className="text-zinc-500 mb-6">
              {isHindi 
                ? 'आपके क्रेडिट खाते में जोड़ दिए गए हैं'
                : 'Your credits have been added to your account'
              }
            </p>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isHindi ? 'भुगतान विफल' : 'Payment Failed'}
            </h3>
            <p className="text-zinc-500 mb-6">
              {error || (isHindi ? 'कुछ गलत हो गया' : 'Something went wrong')}
            </p>
            <Button onClick={() => setStep('plan')}>
              {isHindi ? 'पुनः प्रयास करें' : 'Try Again'}
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-[550px] overflow-hidden p-0 border-zinc-200/50 dark:border-zinc-800/50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
        <div className="p-6 pb-2">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {isHindi ? 'क्रेडिट समाप्त हो गए' : "You've run out of credits"}
                  </DialogTitle>
                  <p className="text-sm text-zinc-500 mt-1">
                    {isHindi ? 'AI डिज़ाइन जारी रखने के लिए क्रेडिट खरीदें' : 'Purchase credits to continue generating AI designs'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  {user?.credits ?? 0} {isHindi ? 'क्रेडिट शेष' : 'Credits Left'}
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {/* Trust badges */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-center gap-6">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>{isHindi ? 'सुरक्षित भुगतान' : 'Secure Payment'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Zap className="w-3.5 h-3.5" />
            <span>{isHindi ? 'तुरंत क्रेडिट' : 'Instant Credits'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>{isHindi ? 'कोई सब्सक्रिप्शन नहीं' : 'No Subscription'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
