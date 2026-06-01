// components/payment/CheckoutModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Lock,
  Check,
  X,
  Loader2,
  Shield,
  Zap,
  ChevronRight,
  Building2,
  User,
  Globe,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { PricingPlan } from './PricingCard';

type PaymentMethod = 'stripe' | 'razorpay';
type CheckoutStep = 'plan' | 'details' | 'payment' | 'processing' | 'success' | 'error';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
  isYearly: boolean;
  currency: 'USD' | 'INR';
  onSuccess?: (subscriptionId: string) => void;
}

interface BillingDetails {
  name: string;
  email: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstNumber?: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  plan,
  isYearly,
  currency,
  onSuccess,
}: CheckoutModalProps) {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  const [step, setStep] = useState<CheckoutStep>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    currency === 'INR' ? 'razorpay' : 'stripe'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    name: '',
    email: '',
    company: '',
    address: '',
    city: '',
    state: '',
    country: currency === 'INR' ? 'India' : 'United States',
    postalCode: '',
    gstNumber: '',
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setError(null);
      setPaymentMethod(currency === 'INR' ? 'razorpay' : 'stripe');
    }
  }, [isOpen, currency]);

  if (!plan) return null;

  const price = currency === 'INR'
    ? (isYearly ? plan.priceYearlyINR : plan.priceMonthlyINR)
    : (isYearly ? plan.priceYearly : plan.priceMonthly);

  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const tax = currency === 'INR' ? Math.round(price * 0.18) : 0; // 18% GST for India
  const total = price + tax;

  const formatPrice = (amount: number) => {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN').format(amount);
    }
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const handleInputChange = (field: keyof BillingDetails, value: string) => {
    setBillingDetails(prev => ({ ...prev, [field]: value }));
  };

  const validateDetails = () => {
    if (!billingDetails.name.trim()) return 'Name is required';
    if (!billingDetails.email.trim() || !billingDetails.email.includes('@')) return 'Valid email is required';
    if (!billingDetails.address.trim()) return 'Address is required';
    if (!billingDetails.city.trim()) return 'City is required';
    if (!billingDetails.postalCode.trim()) return 'Postal code is required';
    return null;
  };

  const handleContinueToPayment = () => {
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep('payment');
  };

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          isYearly,
          currency,
          paymentMethod,
          billingDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      if (paymentMethod === 'stripe' && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (paymentMethod === 'razorpay' && (data.orderId || data.subscriptionId)) {
        // Initialize Razorpay
        const options: any = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || data.keyId,
          amount: data.amount,
          currency: 'INR',
          name: 'Removation.ai',
          description: `${plan.name} - ${isYearly ? 'Yearly' : 'Monthly'} Plan`,
          handler: async function (response: any) {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentMethod: 'razorpay',
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id || data.orderId,
                  razorpay_subscription_id: response.razorpay_subscription_id || data.subscriptionId,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (verifyResponse.ok) {
                setStep('success');
                onSuccess?.(response.razorpay_payment_id || data.subscriptionId || data.orderId);
              } else {
                const verifyData = await verifyResponse.json();
                setError(verifyData.error || 'Payment verification failed');
                setStep('error');
              }
            } catch (err: any) {
              setError(err.message || 'Payment verification failed');
              setStep('error');
            }
          },
          prefill: {
            name: billingDetails.name,
            email: billingDetails.email,
          },
          theme: {
            color: '#7c3aed',
          },
        };

        if (data.subscriptionId) {
          options.subscription_id = data.subscriptionId;
        } else if (data.orderId) {
          options.order_id = data.orderId;
        }

        if (typeof window === 'undefined' || typeof (window as any).Razorpay === 'undefined') {
          setError('Razorpay payment SDK failed to load. Please refresh the page and try again.');
          setStep('error');
          return;
        }
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
      case 'details':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  {isHindi ? 'पूरा नाम' : 'Full Name'} *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    id="name"
                    placeholder={isHindi ? 'आपका नाम' : 'Your full name'}
                    value={billingDetails.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="w-full"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">
                  {isHindi ? 'ईमेल' : 'Email'} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={billingDetails.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="w-full"
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company">
                  {isHindi ? 'कंपनी (वैकल्पिक)' : 'Company (Optional)'}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    id="company"
                    placeholder={isHindi ? 'कंपनी का नाम' : 'Company name'}
                    value={billingDetails.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">
                  {isHindi ? 'पता' : 'Address'} *
                </Label>
                <Input
                  id="address"
                  placeholder={isHindi ? 'सड़क का पता' : 'Street address'}
                  value={billingDetails.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">
                    {isHindi ? 'शहर' : 'City'} *
                  </Label>
                  <Input
                    id="city"
                    placeholder={isHindi ? 'शहर' : 'City'}
                    value={billingDetails.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postalCode">
                    {isHindi ? 'पिनकोड' : 'Postal Code'} *
                  </Label>
                  <Input
                    id="postalCode"
                    placeholder={isHindi ? 'पिनकोड' : 'Postal code'}
                    value={billingDetails.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  />
                </div>
              </div>

              {currency === 'INR' && (
                <div className="grid gap-2">
                  <Label htmlFor="gstNumber">
                    {isHindi ? 'GST नंबर (वैकल्पिक)' : 'GST Number (Optional)'}
                  </Label>
                  <Input
                    id="gstNumber"
                    placeholder="22XXXXX0000X1Z5"
                    value={billingDetails.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                  />
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={handleContinueToPayment}
            >
              {isHindi ? 'भुगतान जारी रखें' : 'Continue to Payment'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'payment':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-semibold mb-4">
                {isHindi ? 'भुगतान विधि चुनें' : 'Select Payment Method'}
              </h3>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="space-y-3"
              >
                <Label
                  htmlFor="stripe"
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    paymentMethod === 'stripe'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  )}
                >
                  <RadioGroupItem value="stripe" id="stripe" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-[#635bff] flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Stripe</p>
                      <p className="text-sm text-zinc-500">
                        {isHindi ? 'क्रेडिट/डेबिट कार्ड, Apple Pay, Google Pay' : 'Credit/Debit Cards, Apple Pay, Google Pay'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <img src="/images/cards/visa.svg" alt="Visa" className="h-6" />
                    <img src="/images/cards/mastercard.svg" alt="Mastercard" className="h-6" />
                  </div>
                </Label>

                <Label
                  htmlFor="razorpay"
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    paymentMethod === 'razorpay'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  )}
                >
                  <RadioGroupItem value="razorpay" id="razorpay" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-[#072654] flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Razorpay</p>
                      <p className="text-sm text-zinc-500">
                        {isHindi ? 'UPI, नेट बैंकिंग, वॉलेट' : 'UPI, Net Banking, Wallets'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {isHindi ? 'भारत के लिए' : 'For India'}
                  </Badge>
                </Label>
              </RadioGroup>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
              <h4 className="font-semibold">
                {isHindi ? 'ऑर्डर सारांश' : 'Order Summary'}
              </h4>
              
              <div className="flex justify-between text-sm">
                <span>{isHindi && plan.nameHi ? plan.nameHi : plan.name} {isYearly ? (isHindi ? '(वार्षिक)' : '(Yearly)') : (isHindi ? '(मासिक)' : '(Monthly)')}</span>
                <span>{currencySymbol}{formatPrice(price)}</span>
              </div>
              
              {tax > 0 && (
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>{isHindi ? 'GST (18%)' : 'GST (18%)'}</span>
                  <span>{currencySymbol}{formatPrice(tax)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-semibold">
                <span>{isHindi ? 'कुल' : 'Total'}</span>
                <span className="text-lg">{currencySymbol}{formatPrice(total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Lock className="w-4 h-4" />
              <span>
                {isHindi 
                  ? 'आपका भुगतान 256-bit SSL एन्क्रिप्शन से सुरक्षित है'
                  : 'Your payment is secured with 256-bit SSL encryption'
                }
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('details')}
              >
                {isHindi ? 'पीछे' : 'Back'}
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
                onClick={handlePayment}
                disabled={isLoading}
              >
                <Lock className="w-4 h-4 mr-2" />
                {isHindi ? 'भुगतान करें' : 'Pay'} {currencySymbol}{formatPrice(total)}
              </Button>
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
                ? `आप अब ${plan?.name} प्लान पर हैं`
                : `You're now on the ${plan?.name} plan`
              }
            </p>
            <Button onClick={onClose}>
              {isHindi ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}
            </Button>
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
            <Button onClick={() => setStep('payment')}>
              {isHindi ? 'पुनः प्रयास करें' : 'Try Again'}
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span>{isHindi ? 'अपग्रेड करें' : 'Upgrade to'} {plan?.name}</span>
              <p className="text-sm font-normal text-zinc-500">
                {isYearly ? (isHindi ? 'वार्षिक' : 'Yearly') : (isHindi ? 'मासिक' : 'Monthly')} {isHindi ? 'सब्सक्रिप्शन' : 'subscription'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="sync">
          {renderStepContent()}
        </AnimatePresence>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Shield className="w-3 h-3" />
            <span>{isHindi ? 'सुरक्षित भुगतान' : 'Secure Payment'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Zap className="w-3 h-3" />
            <span>{isHindi ? 'तुरंत सक्रियण' : 'Instant Activation'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Check className="w-3 h-3" />
            <span>{isHindi ? 'कभी भी रद्द करें' : 'Cancel Anytime'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CheckoutModal;