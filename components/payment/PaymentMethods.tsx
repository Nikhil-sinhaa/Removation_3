// components/payment/PaymentMethods.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Building,
  Smartphone,
  Globe,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'bank' | 'wallet';
  name: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  upiId?: string;
  bankName?: string;
  walletName?: string;
  isDefault: boolean;
  createdAt: Date;
}

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  selectedMethodId?: string;
  onSelect?: (methodId: string) => void;
  onSetDefault?: (methodId: string) => void;
  onRemove?: (methodId: string) => void;
  onAddNew?: () => void;
  mode?: 'select' | 'manage';
  isLoading?: boolean;
}

const cardBrandIcons: Record<string, string> = {
  visa: '/images/cards/visa.svg',
  mastercard: '/images/cards/mastercard.svg',
  amex: '/images/cards/amex.svg',
  rupay: '/images/cards/rupay.svg',
  discover: '/images/cards/discover.svg',
};

export function PaymentMethods({
  methods,
  selectedMethodId,
  onSelect,
  onSetDefault,
  onRemove,
  onAddNew,
  mode = 'manage',
  isLoading = false,
}: PaymentMethodsProps) {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'upi':
        return <Smartphone className="w-5 h-5" />;
      case 'bank':
        return <Building className="w-5 h-5" />;
      case 'wallet':
        return <Globe className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getMethodTitle = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `${method.brand?.charAt(0).toUpperCase()}${method.brand?.slice(1) || 'Card'} •••• ${method.last4}`;
      case 'upi':
        return method.upiId || 'UPI';
      case 'bank':
        return method.bankName || 'Bank Account';
      case 'wallet':
        return method.walletName || 'Wallet';
      default:
        return method.name;
    }
  };

  const getMethodSubtitle = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `${isHindi ? 'समाप्ति' : 'Expires'} ${method.expiryMonth}/${method.expiryYear}`;
      case 'upi':
        return isHindi ? 'UPI पेमेंट' : 'UPI Payment';
      case 'bank':
        return isHindi ? 'बैंक ट्रांसफर' : 'Bank Transfer';
      case 'wallet':
        return isHindi ? 'डिजिटल वॉलेट' : 'Digital Wallet';
      default:
        return '';
    }
  };

  const handleRemove = (methodId: string) => {
    setMethodToDelete(methodId);
  };

  const confirmRemove = () => {
    if (methodToDelete && onRemove) {
      onRemove(methodToDelete);
    }
    setMethodToDelete(null);
  };

  if (methods.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {isHindi ? 'कोई भुगतान विधि नहीं' : 'No Payment Methods'}
          </h3>
          <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
            {isHindi
              ? 'तेज़ चेकआउट के लिए एक भुगतान विधि जोड़ें'
              : 'Add a payment method for faster checkout'}
          </p>
          {onAddNew && (
            <Button onClick={onAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              {isHindi ? 'भुगतान विधि जोड़ें' : 'Add Payment Method'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (mode === 'select') {
    return (
      <RadioGroup
        value={selectedMethodId}
        onValueChange={onSelect}
        className="space-y-3"
      >
        {methods.map((method) => (
          <Label
            key={method.id}
            htmlFor={method.id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
              selectedMethodId === method.id
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            )}
          >
            <RadioGroupItem value={method.id} id={method.id} />
            
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              {method.type === 'card' && method.brand && cardBrandIcons[method.brand] ? (
                <img
                  src={cardBrandIcons[method.brand]}
                  alt={method.brand}
                  className="w-6 h-6"
                />
              ) : (
                getMethodIcon(method)
              )}
            </div>

            <div className="flex-1">
              <p className="font-medium">{getMethodTitle(method)}</p>
              <p className="text-sm text-zinc-500">{getMethodSubtitle(method)}</p>
            </div>

            {method.isDefault && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Star className="w-3 h-3 mr-1" />
                {isHindi ? 'डिफ़ॉल्ट' : 'Default'}
              </Badge>
            )}
          </Label>
        ))}

        {onAddNew && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onAddNew}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isHindi ? 'नई भुगतान विधि जोड़ें' : 'Add New Payment Method'}
          </Button>
        )}
      </RadioGroup>
    );
  }

  // Management mode
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {isHindi ? 'भुगतान विधियाँ' : 'Payment Methods'}
            </CardTitle>
            <CardDescription>
              {isHindi
                ? 'अपनी सहेजी गई भुगतान विधियाँ प्रबंधित करें'
                : 'Manage your saved payment methods'}
            </CardDescription>
          </div>
          {onAddNew && (
            <Button variant="outline" onClick={onAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              {isHindi ? 'नई जोड़ें' : 'Add New'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {methods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border transition-all',
                method.isDefault
                  ? 'border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20'
                  : 'border-zinc-200 dark:border-zinc-800'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                {method.type === 'card' && method.brand && cardBrandIcons[method.brand] ? (
                  <img
                    src={cardBrandIcons[method.brand]}
                    alt={method.brand}
                    className="w-8 h-8"
                  />
                ) : (
                  getMethodIcon(method)
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{getMethodTitle(method)}</p>
                  {method.isDefault && (
                    <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                      <Check className="w-3 h-3 mr-1" />
                      {isHindi ? 'डिफ़ॉल्ट' : 'Default'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-500">{getMethodSubtitle(method)}</p>
              </div>

              <div className="flex items-center gap-2">
                {!method.isDefault && onSetDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetDefault(method.id)}
                    disabled={isLoading}
                  >
                    {isHindi ? 'डिफ़ॉल्ट बनाएं' : 'Set Default'}
                  </Button>
                )}
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(method.id)}
                    disabled={isLoading || method.isDefault}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!methodToDelete} onOpenChange={() => setMethodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isHindi ? 'भुगतान विधि हटाएं?' : 'Remove Payment Method?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isHindi
                ? 'यह क्रिया पूर्ववत नहीं की जा सकती। क्या आप वाकई इस भुगतान विधि को हटाना चाहते हैं?'
                : 'This action cannot be undone. Are you sure you want to remove this payment method?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isHindi ? 'हटाएं' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default PaymentMethods;