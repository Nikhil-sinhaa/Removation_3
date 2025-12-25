// hooks/useMobile.ts
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isPWA: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

export function useMobile(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isPWA: false,
    screenWidth: 1920,
    screenHeight: 1080,
    orientation: 'landscape',
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent.toLowerCase();

      // Device type detection
      const isMobile = width < MOBILE_BREAKPOINT;
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
      const isDesktop = width >= TABLET_BREAKPOINT;

      // Touch detection
      const isTouchDevice = 
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0;

      // OS detection
      const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /android/.test(userAgent);

      // Browser detection
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);
      const isFirefox = /firefox/.test(userAgent);

      // PWA detection
      const isPWA = 
        window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-ignore
        window.navigator.standalone === true;

      // Orientation
      const orientation: 'portrait' | 'landscape' = 
        height > width ? 'portrait' : 'landscape';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        isFirefox,
        isPWA,
        screenWidth: width,
        screenHeight: height,
        orientation,
      });
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return deviceInfo;
}

// Simple hook for just mobile check
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Hook for detecting touch devices
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

// Hook for orientation
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

// Hook for viewport dimensions
export function useViewport(): { width: number; height: number } {
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return viewport;
}

// Hook for safe area insets (for notched phones)
export function useSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const computeInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('--sat') || '0', 10),
        right: parseInt(style.getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
        left: parseInt(style.getPropertyValue('--sal') || '0', 10),
      });
    };

    // Set CSS variables for safe area
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --sat: env(safe-area-inset-top, 0px);
        --sar: env(safe-area-inset-right, 0px);
        --sab: env(safe-area-inset-bottom, 0px);
        --sal: env(safe-area-inset-left, 0px);
      }
    `;
    document.head.appendChild(style);

    computeInsets();

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return insets;
}

// Hook for keyboard visibility (mobile)
export function useKeyboardVisible(): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // On mobile, viewport height decreases when keyboard opens
      if (typeof window !== 'undefined' && window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setIsVisible(heightDiff > 150); // Keyboard typically takes 150px+
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return isVisible;
}

export default useMobile;