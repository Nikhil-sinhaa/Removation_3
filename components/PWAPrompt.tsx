'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  X,
  Download,
  Smartphone,
  Share,
  Plus,
  CheckCircle,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage('pwa-prompt-dismissed', false);
  const [installCount, setInstallCount] = useLocalStorage('pwa-prompt-count', 0);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    // Check for iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
    };

    checkStandalone();
    checkIOS();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after delay if not dismissed recently
      if (!dismissed && installCount < 3) {
        setTimeout(() => {
          setShowPrompt(true);
          setInstallCount(prev => prev + 1);
        }, 30000); // Show after 30 seconds
      }
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismissed, installCount, setInstallCount]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        // Track installation
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('pwa_installed');
        }
      }
    } catch (error) {
      console.error('PWA install error:', error);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Reset dismissed state after 7 days
    setTimeout(() => setDismissed(false), 7 * 24 * 60 * 60 * 1000);
  };

  const handleIOSInstall = () => {
    setShowIOSInstructions(true);
  };

  // Don't show if already installed or dismissed
  if (isStandalone || (!showPrompt && !showIOSInstructions)) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* Main Install Prompt */}
      {showPrompt && !isIOS && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[380px] z-50"
        >
          <Card className="p-4 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-lg">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                <Download className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">Install Removation.ai</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get the full app experience with offline access and faster performance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Faster loading</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Maybe later
              </Button>
              <Button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-primary to-purple-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* iOS Install Prompt */}
      {showPrompt && isIOS && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <Card className="p-4 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-lg">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">Add to Home Screen</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Install Removation.ai for the best experience
                </p>
              </div>
            </div>

            <Button
              onClick={handleIOSInstall}
              className="w-full mt-4 bg-gradient-to-r from-primary to-purple-600"
            >
              Show me how
            </Button>
          </Card>
        </motion.div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowIOSInstructions(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="p-6 shadow-2xl">
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6 text-center">
                Install on iPhone/iPad
              </h2>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Find it at the bottom of Safari
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-center">
                      <Share className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      It's in the actions list
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-lg flex items-center gap-3">
                      <Plus className="w-5 h-5 text-primary" />
                      <span className="text-sm">Add to Home Screen</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap "Add" to confirm</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The app will appear on your home screen
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ArrowDown className="w-4 h-4 animate-bounce" />
                <span>Scroll down in Safari to see the share button</span>
              </div>

              <Button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full mt-6"
              >
                Got it!
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PWAPrompt;