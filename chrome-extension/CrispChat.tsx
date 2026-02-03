// components/CrispChat.tsx
"use client";

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useLanguage } from '@/hooks/useLanguage';



interface CrispChatProps {
  websiteId?: string;
}

export function CrispChat({ websiteId }: CrispChatProps) {
  const { user, isLoaded } = useUser();
  const { language } = useLanguage();

  useEffect(() => {
    // Initialize Crisp
    const crispWebsiteId = websiteId || process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

    if (!crispWebsiteId) {
      console.warn('Crisp website ID not provided');
      return;
    }

    // Set up Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = crispWebsiteId;

    // Load Crisp script
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      // Configure Crisp
      configureCrisp();
    };

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [websiteId]);

  useEffect(() => {
    if (isLoaded && user && window.$crisp) {
      // Set user data when authenticated
      try {
        window.$crisp.push(['set', 'user:email', [user.emailAddresses[0]?.emailAddress]]);
        window.$crisp.push(['set', 'user:nickname', [user.fullName || user.firstName || 'User']]);

        if (user.imageUrl) {
          window.$crisp.push(['set', 'user:avatar', [user.imageUrl]]);
        }

        // Set user segments/data
        window.$crisp.push(['set', 'session:data', [
          ['user_id', user.id],
          ['plan', 'free'], // TODO: Get from subscription
          ['language', language],
          ['signed_up', user.createdAt?.toISOString()],
        ]]);
      } catch (error) {
        console.error('Error setting Crisp user data:', error);
      }
    }
  }, [isLoaded, user, language]);

  const configureCrisp = () => {
    if (!window.$crisp) return;

    try {
      // Set language
      window.$crisp.push(['set', 'session:data', [['language', language]]]);

      // Set position (bottom-right, matching Spacely)
      window.$crisp.push(['config', 'position:reverse', [false]]);

      // Set color scheme
      window.$crisp.push(['config', 'color:theme', ['purple']]);

      // Hide by default on mobile (optional)
      // window.$crisp.push(['config', 'hide:on:mobile', [true]]);

      // Set availability message
      window.$crisp.push(['set', 'message:text', [
        language === 'hi'
          ? 'नमस्ते! 👋 हम आपकी कैसे मदद कर सकते हैं?'
          : 'Hello! 👋 How can we help you today?'
      ]]);

      // Safe mode (hide on specific pages if needed)
      const hideOnPages = ['/editor', '/admin'];
      const currentPath = window.location.pathname;

      if (hideOnPages.some(page => currentPath.startsWith(page))) {
        window.$crisp.push(['do', 'chat:hide']);
      } else {
        window.$crisp.push(['do', 'chat:show']);
      }
    } catch (error) {
      console.error('Error configuring Crisp:', error);
    }
  };

  // Utility functions to control Crisp
  const openChat = () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:open']);
    }
  };

  const closeChat = () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:close']);
    }
  };

  const hideChat = () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:hide']);
    }
  };

  const showChat = () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:show']);
    }
  };

  const sendMessage = (message: string) => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'message:send', ['text', message]]);
    }
  };

  const setUserData = (data: Record<string, any>) => {
    if (window.$crisp) {
      const sessionData = Object.entries(data).map(([key, value]) => [key, value]);
      window.$crisp.push(['set', 'session:data', sessionData]);
    }
  };

  // This component doesn't render anything visible
  // Crisp handles its own UI
  return null;
}

// Hook to programmatically control Crisp
export function useCrisp() {
  const openChat = () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:open']);
    }
  };

  const closeChat = () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:close']);
    }
  };

  const hideChat = () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:hide']);
    }
  };

  const showChat = () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:show']);
    }
  };

  const sendMessage = (message: string) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'message:send', ['text', message]]);
    }
  };

  const setUserData = (data: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      const sessionData = Object.entries(data).map(([key, value]) => [key, value]);
      window.$crisp.push(['set', 'session:data', sessionData]);
    }
  };

  const setUserEmail = (email: string) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'user:email', [email]]);
    }
  };

  const setUserName = (name: string) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'user:nickname', [name]]);
    }
  };

  const triggerEvent = (eventName: string, data?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'session:event', [[eventName, data]]]);
    }
  };

  return {
    openChat,
    closeChat,
    hideChat,
    showChat,
    sendMessage,
    setUserData,
    setUserEmail,
    setUserName,
    triggerEvent,
  };
}

export default CrispChat;