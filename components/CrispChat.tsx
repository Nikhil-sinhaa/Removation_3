"use client";

import React, { useEffect } from "react";
import Script from "next/script";
import { useAuth } from '@/hooks/useAuth';
// TODO: Remnant Clerk imports: useUser
import { usePathname } from "next/navigation";

interface CrispChatProps {
  crispWebsiteId?: string;
}

export function CrispChat({ crispWebsiteId }: CrispChatProps) {
  const { user, isLoading: isLoaded } = useAuth();
  const isSignedIn = !!user;
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && window.$crisp && user && isLoaded) {
      // Set user data in Crisp
      window.$crisp.push(["set", "user:email", user.emailAddresses?.[0]?.emailAddress || ""]);
      window.$crisp.push(["set", "user:nickname", user.fullName || user.username || ""]);
      window.$crisp.push(["set", "user:avatar", user.imageUrl || ""]);
      window.$crisp.push(["set", "session:data", [
        ["user_id", user.id],
        ["plan", user.publicMetadata?.plan || "free"],
        ["credits", user.publicMetadata?.credits || 0],
      ]]);
    }
  }, [user, isLoaded]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.$crisp) {
      // Reset on route change
      window.$crisp.push(["do", "session:reset"]);
    }
  }, [pathname]);

  if (!crispWebsiteId) {
    crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  }

  // Guard against placeholder Crisp IDs
  const isPlaceholder = !crispWebsiteId || crispWebsiteId.includes('your_') || crispWebsiteId === 'xxxxx';
  if (isPlaceholder) return null;

  return (
    <Script
      id="crisp-chat"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.$crisp = [];
          window.CRISP_WEBSITE_ID = "${crispWebsiteId}";
          
          // Configure Crisp
          window.$crisp.push(["safe", true]);
          window.$crisp.push(["config", "color:theme", "orange"]);
          window.$crisp.push(["config", "locale", "en"]);
          window.$crisp.push(["config", "position", "right"]);
          window.$crisp.push(["config", "hideOnMobile", false]);
          window.$crisp.push(["config", "text:title", "Removation.ai Support"]);
          window.$crisp.push(["config", "text:message", "How can we help you today?"]);
          
          // Custom data
          window.$crisp.push(["set", "session:data", [
            ["website", "removation.ai"],
            ["version", "1.0.0"]
          ]]);
          
          (function() {
            var d = document;
            var s = d.createElement("script");
            s.src = "https://client.crisp.chat/l.js";
            s.async = 1;
            d.getElementsByTagName("head")[0].appendChild(s);
            
            // Handle page visibility changes
            document.addEventListener("visibilitychange", function() {
              if (document.visibilityState === 'visible') {
                window.$crisp && window.$crisp.push(["session:reload"]);
              }
            });
          })();
        `,
      }}
    />
  );
}

