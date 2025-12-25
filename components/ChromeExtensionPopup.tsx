'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Chrome,
  Sparkles,
  Zap,
  ArrowRight,
  Star,
  ExternalLink,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import Link from 'next/link';

interface ChromeExtensionPopupProps {
  variant?: 'banner' | 'modal' | 'inline';
  onInstall?: () => void;
  onDismiss?: () => void;
  showAfterMs?: number;
}

const EXTENSION_URL = 'https://chrome.google.com/webstore/detail/removation-ai/EXTENSION_ID';

const extensionFeatures = [
  { icon: Zap, text: 'Transform images from any website' },
  { icon: Sparkles, text: 'One-click room redesign' },
  { icon: Star, text: 'Save designs to your account' },
];

export function ChromeExtensionPopup({
  variant = 'banner',
  onInstall,
  onDismiss,
  showAfterMs = 60000, // Show after 1 minute
}: ChromeExtensionPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage('extension-popup-dismissed', false);
  const [hasExtension, setHasExtension] = useState(false);
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    // Check if Chrome browser
    const checkChrome = () => {
      const isChromeBrowser = /Chrome/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent);
      setIsChrome(isChromeBrowser);
    };

    // Check if extension is already installed
    const checkExtension = () => {
      // The extension would set this when installed
      if (typeof window !== 'undefined' && (window as any).__REMOVATION_EXTENSION__) {
        setHasExtension(true);
        return true;
      }
      return false;
    };

    checkChrome();
    const installed = checkExtension();

    // Show popup after delay if not dismissed and on Chrome
    if (!dismissed && !installed && isChrome) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, showAfterMs);

      return () => clearTimeout(timer);
    }
  }, [dismissed, showAfterMs, isChrome]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    onDismiss?.();
    
    // Reset after 7 days
    setTimeout(() => {
      setDismissed(false);
    }, 7 * 24 * 60 * 60 * 1000);
  };

  const handleInstall = () => {
    window.open(EXTENSION_URL, '_blank');
    onInstall?.();
    handleDismiss();
  };

  // Don't render if not Chrome, has extension, or dismissed
  if (!isChrome || hasExtension || (!isVisible && variant !== 'inline')) {
    return null;
  }

  // Inline variant - always visible when rendered
  if (variant === 'inline') {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
            <Chrome className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">Chrome Extension</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Gift className="w-3 h-3 mr-1" />
                Free
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Transform any room image on the web with just one click
            </p>
            
            <div className="flex flex-wrap gap-4 mt-3">
              {extensionFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <Button
            onClick={handleInstall}
            className="bg-gradient-to-r from-primary to-purple-600 whitespace-nowrap"
          >
            <Chrome className="w-4 h-4 mr-2" />
            Add to Chrome
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white overflow-hidden"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
                    <Chrome className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      <span className="hidden sm:inline">✨ </span>
                      Get our Chrome Extension for one-click transformations!
                    </p>
                    <p className="text-sm text-white/80 hidden sm:block">
                      Transform any room image on the web instantly
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleInstall}
                    className="bg-white text-primary hover:bg-white/90 whitespace-nowrap"
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Install Free
                  </Button>
                  <button
                    onClick={handleDismiss}
                    className="text-white/80 hover:text-white transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Modal variant
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg"
          >
            <Card className="relative overflow-hidden">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" />
              
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                      <Chrome className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-4 border-background">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                  <Badge className="mb-3 bg-gradient-to-r from-green-500 to-emerald-500">
                    <Gift className="w-3 h-3 mr-1" />
                    Free Forever
                  </Badge>
                  <h2 className="text-2xl font-bold mb-2">
                    Get the Chrome Extension
                  </h2>
                  <p className="text-muted-foreground">
                    Transform any room image on the web with just one click.
                    No need to upload - just right-click and transform!
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {extensionFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{feature.text}</span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    4.9 • 10,000+ users
                  </span>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
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
                    <Chrome className="w-4 h-4 mr-2" />
                    Add to Chrome
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Footer */}
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Works with Chrome, Brave, Edge, and other Chromium browsers
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Utility component for promoting extension in different places
export function ExtensionPromoCard({ className }: { className?: string }) {
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    const checkChrome = /Chrome/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent);
    setIsChrome(checkChrome);
  }, []);

  if (!isChrome) return null;

  return (
    <Card className={cn('p-4 bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20', className)}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
          <Chrome className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold">Chrome Extension</h4>
          <p className="text-sm text-muted-foreground truncate">
            Right-click any image to transform
          </p>
        </div>
        <Link href={EXTENSION_URL} target="_blank">
          <Button size="sm" variant="secondary">
            Get it
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default ChromeExtensionPopup;