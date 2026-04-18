// components/PWAPrompt.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Download,
  X,
  Share,
  Plus,
  CheckCircle,
  Wifi,
  WifiOff,
  Bell,
  Zap,
  Camera
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
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAPromptProps {
  className?: string;
  delay?: number;
}

const translations = {
  en: {
    title: 'Install Removation.ai',
    subtitle: 'Get the full app experience',
    description: 'Install our app for a faster, offline-capable experience with push notifications.',
    features: [
      'Works offline',
      'Faster performance',
      'Push notifications',
      'Home screen access',
      'Full-screen mode',
    ],
    install: 'Install App',
    notNow: 'Not Now',
    neverShow: "Don't ask again",
    iosInstructions: 'To install, tap',
    iosThen: 'then "Add to Home Screen"',
    shareIcon: 'Share',
    installed: 'App Installed!',
    installedDesc: 'You can now access Removation.ai from your home screen',
    offline: 'You are offline',
    offlineDesc: 'Some features may be limited',
    online: 'Back online',
    onlineDesc: 'All features are available',
  },
  hi: {
    title: 'Removation.ai इंस्टॉल करें',
    subtitle: 'पूर्ण ऐप अनुभव प्राप्त करें',
    description: 'तेज़, ऑफ़लाइन-सक्षम अनुभव और पुश नोटिफिकेशन के लिए हमारा ऐप इंस्टॉल करें।',
    features: [
      'ऑफ़लाइन काम करता है',
      'तेज़ प्रदर्शन',
      'पुश नोटिफिकेशन',
      'होम स्क्रीन एक्सेस',
      'फ़ुल-स्क्रीन मोड',
    ],
    install: 'ऐप इंस्टॉल करें',
    notNow: 'अभी नहीं',
    neverShow: 'फिर न पूछें',
    iosInstructions: 'इंस्टॉल करने के लिए, टैप करें',
    iosThen: 'फिर "होम स्क्रीन में जोड़ें"',
    shareIcon: 'शेयर',
    installed: 'ऐप इंस्टॉल हो गया!',
    installedDesc: 'अब आप होम स्क्रीन से Removation.ai एक्सेस कर सकते हैं',
    offline: 'आप ऑफ़लाइन हैं',
    offlineDesc: 'कुछ फीचर सीमित हो सकते हैं',
    online: 'वापस ऑनलाइन',
    onlineDesc: 'सभी फीचर उपलब्ध हैं',
  },
};

export function PWAPrompt({ className, delay = 10000 }: PWAPromptProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const { isMobile, isIOS, isAndroid } = useMobile();
  
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage('pwa-prompt-dismissed', false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  // Check if already installed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    }
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after delay if not dismissed
      if (!dismissed && !isInstalled) {
        setTimeout(() => {
          setIsOpen(true);
        }, delay);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [dismissed, isInstalled, delay]);

  // Listen for app installed event
  useEffect(() => {
    const handler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsOpen(false);
    };

    window.addEventListener('appinstalled', handler);

    return () => {
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  const handleNeverShow = () => {
    setDismissed(true);
    setIsOpen(false);
  };

  // iOS-specific install instructions
  const IOSInstructions = () => (
    <div className="space-y-4">
      <p className="text-muted-foreground">{t.description}</p>
      
      <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-muted/30">
        <span>{t.iosInstructions}</span>
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20">
          <Share className="w-5 h-5 text-blue-500" />
        </div>
        <span>{t.iosThen}</span>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Plus className="w-4 h-4" />
        <span>Add to Home Screen</span>
      </div>
    </div>
  );

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Offline/Online Toast */}
      <AnimatePresence>
        {showOfflineToast && (
          <motion.div
            key="offline-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/90 text-yellow-900 backdrop-blur-sm shadow-lg">
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-medium">{t.offline}</p>
                <p className="text-sm opacity-80">{t.offlineDesc}</p>
              </div>
              <button
                onClick={() => setShowOfflineToast(false)}
                className="p-1 hover:bg-yellow-600/30 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {showOnlineToast && (
          <motion.div
            key="online-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/90 text-white backdrop-blur-sm shadow-lg">
              <Wifi className="w-5 h-5" />
              <div>
                <p className="font-medium">{t.online}</p>
                <p className="text-sm opacity-80">{t.onlineDesc}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Prompt Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/25">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{t.title}</DialogTitle>
                <DialogDescription>{t.subtitle}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isIOS ? (
            <IOSInstructions />
          ) : (
            <div className="space-y-6">
              <p className="text-muted-foreground">{t.description}</p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: WifiOff, label: t.features[0], color: 'text-blue-500' },
                  { icon: Zap, label: t.features[1], color: 'text-yellow-500' },
                  { icon: Bell, label: t.features[2], color: 'text-red-500' },
                  { icon: Smartphone, label: t.features[3], color: 'text-green-500' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-muted/30"
                  >
                    <feature.icon className={cn('w-5 h-5', feature.color)} />
                    <span className="text-sm">{feature.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Install Button */}
              <Button
                onClick={handleInstall}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Download className="w-5 h-5 mr-2" />
                {t.install}
              </Button>

              {/* Secondary actions */}
              <div className="flex items-center justify-center gap-4 text-sm">
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.notNow}
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  onClick={handleNeverShow}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.neverShow}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mini Install Button (shows on mobile when prompt is available) */}
      {isMobile && deferredPrompt && !dismissed && !isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className={cn(
            'fixed bottom-20 left-4 right-4 z-40',
            className
          )}
        >
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl text-white shadow-lg shadow-purple-500/25">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{t.title}</p>
                <p className="text-xs text-white/70">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-white/90"
                onClick={handleInstall}
              >
                {t.install}
              </Button>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

// Hook for PWA functionality
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if installed
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    }

    // Online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Install prompt
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    // App installed
    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      return outcome === 'accepted';
    }
    return false;
  };

  return {
    isInstalled,
    isOnline,
    canInstall,
    install,
  };
}

export default PWAPrompt;