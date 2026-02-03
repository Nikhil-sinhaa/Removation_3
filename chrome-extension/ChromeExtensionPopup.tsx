// components/ChromeExtensionPopup.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chrome,
  X,
  Download,
  Star,
  Users,
  Zap,
  Camera,
  Wand2,
  ExternalLink,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

interface ChromeExtensionPopupProps {
  className?: string;
  trigger?: 'auto' | 'manual';
  delay?: number;
}

const translations = {
  en: {
    title: 'Get Removation.ai Chrome Extension',
    subtitle: 'Transform any room image on the web instantly',
    description: 'Right-click on any interior image online and redesign it with AI in seconds. Works on Pinterest, Houzz, Instagram, and more!',
    features: [
      'One-click room transformation',
      'Works on any website',
      'Save designs to your account',
      'Access all 400+ styles',
      'Vastu analysis included',
    ],
    installNow: 'Install Free Extension',
    remindLater: 'Remind me later',
    neverShow: "Don't show again",
    rating: '4.9 rating',
    users: '50,000+ users',
    free: 'FREE',
    newFeature: 'NEW',
    chromeWebStore: 'Chrome Web Store',
    alsoAvailable: 'Also available for',
    firefox: 'Firefox',
    edge: 'Edge',
    safari: 'Safari (Coming Soon)',
    bonus: 'Install now and get 10 free credits!',
  },
  hi: {
    title: 'Removation.ai Chrome एक्सटेंशन प्राप्त करें',
    subtitle: 'वेब पर किसी भी कमरे की छवि को तुरंत बदलें',
    description: 'ऑनलाइन किसी भी इंटीरियर इमेज पर राइट-क्लिक करें और सेकंड में AI से रीडिज़ाइन करें। Pinterest, Houzz, Instagram और अन्य पर काम करता है!',
    features: [
      'एक-क्लिक रूम ट्रांसफॉर्मेशन',
      'किसी भी वेबसाइट पर काम करता है',
      'डिज़ाइन अपने अकाउंट में सेव करें',
      'सभी 400+ स्टाइल उपलब्ध',
      'वास्तु विश्लेषण शामिल',
    ],
    installNow: 'मुफ्त एक्सटेंशन इंस्टॉल करें',
    remindLater: 'बाद में याद दिलाएं',
    neverShow: 'फिर न दिखाएं',
    rating: '4.9 रेटिंग',
    users: '50,000+ उपयोगकर्ता',
    free: 'मुफ्त',
    newFeature: 'नया',
    chromeWebStore: 'Chrome वेब स्टोर',
    alsoAvailable: 'इसके लिए भी उपलब्ध',
    firefox: 'Firefox',
    edge: 'Edge',
    safari: 'Safari (जल्द आ रहा है)',
    bonus: 'अभी इंस्टॉल करें और 10 मुफ्त क्रेडिट पाएं!',
  },
};

export function ChromeExtensionPopup({ 
  className, 
  trigger = 'auto',
  delay = 30000 // 30 seconds
}: ChromeExtensionPopupProps) {
  const { language } = useLanguage();
  const t = translations[language];
  
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage('extension-popup-dismissed', false);
  const [remindLater, setRemindLater] = useLocalStorage('extension-popup-remind', 0);

  useEffect(() => {
    if (trigger === 'auto' && !dismissed) {
      // Check if we should remind later
      const now = Date.now();
      if (remindLater && now < remindLater) {
        return;
      }

      // Check if user is on Chrome
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      
      if (isChrome) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, delay);

        return () => clearTimeout(timer);
      }
    }
  }, [trigger, dismissed, remindLater, delay]);

  const handleInstall = () => {
    // Open Chrome Web Store
    window.open('https://chrome.google.com/webstore/detail/removation-ai', '_blank');
    setIsOpen(false);
    setDismissed(true);
  };

  const handleRemindLater = () => {
    // Remind after 24 hours
    setRemindLater(Date.now() + 24 * 60 * 60 * 1000);
    setIsOpen(false);
  };

  const handleNeverShow = () => {
    setDismissed(true);
    setIsOpen(false);
  };

  // Floating badge to manually trigger popup
  const FloatingBadge = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
      className={cn(
        'fixed bottom-24 right-6 z-40',
        className
      )}
    >
      <Button
        onClick={() => setIsOpen(true)}
        className="group relative bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25"
      >
        <Chrome className="w-5 h-5 mr-2" />
        <span className="hidden sm:inline">Get Extension</span>
        <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5">
          {t.free}
        </Badge>
        
        {/* Pulse effect */}
        <span className="absolute inset-0 rounded-md bg-white/20 animate-ping opacity-75" />
      </Button>
    </motion.div>
  );

  return (
    <>
      {!dismissed && trigger === 'auto' && <FloatingBadge />}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg overflow-hidden p-0">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500 p-6 text-white">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-20 h-20 border border-white/30 rounded-full" />
              <div className="absolute bottom-4 right-4 w-32 h-32 border border-white/30 rounded-full" />
              <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Chrome className="w-8 h-8" />
                </div>
                <div>
                  <Badge className="bg-white/20 text-white border-0 mb-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t.newFeature}
                  </Badge>
                  <DialogTitle className="text-xl text-white">{t.title}</DialogTitle>
                </div>
              </div>
              
              <DialogDescription className="text-white/90 text-base">
                {t.subtitle}
              </DialogDescription>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{t.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{t.users}</span>
              </div>
              <Badge className="bg-green-500 text-white border-0">
                {t.free}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <p className="text-muted-foreground">{t.description}</p>

            {/* Features */}
            <div className="space-y-3">
              {t.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Bonus */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
            >
              <Gift className="w-6 h-6 text-amber-500" />
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {t.bonus}
              </span>
            </motion.div>

            {/* Install button */}
            <Button
              onClick={handleInstall}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Chrome className="w-5 h-5 mr-2" />
              {t.installNow}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            {/* Secondary actions */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={handleRemindLater}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.remindLater}
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                onClick={handleNeverShow}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.neverShow}
              </button>
            </div>

            {/* Other browsers */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center mb-3">
                {t.alsoAvailable}
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  🦊 {t.firefox}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  🌐 {t.edge}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs opacity-50" disabled>
                  🧭 {t.safari}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Standalone extension install banner for pages
export function ExtensionBanner({ className }: { className?: string }) {
  const { language } = useLanguage();
  const t = translations[language];
  const [dismissed, setDismissed] = useLocalStorage('extension-banner-dismissed', false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'relative bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white px-4 py-3',
        className
      )}
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Chrome className="w-5 h-5" />
          <span className="text-sm font-medium">
            {t.subtitle} - {t.bonus}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-purple-600 hover:bg-white/90"
            onClick={() => window.open('https://chrome.google.com/webstore/detail/removation-ai', '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            {t.installNow}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ChromeExtensionPopup;