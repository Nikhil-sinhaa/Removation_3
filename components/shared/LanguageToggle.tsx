"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language } from "@/hooks/useLanguage";
import { Globe, Check, ChevronDown } from "lucide-react";

interface LanguageToggleProps {
  variant?: "toggle" | "dropdown" | "minimal" | "full";
  className?: string;
  showLabel?: boolean;
  showFlag?: boolean;
}

const languages: {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
];

export function LanguageToggle({
  variant = "toggle",
  className,
  showLabel = true,
  showFlag = true,
}: LanguageToggleProps) {
  const { language, setLanguage, t } = useLanguage();

  const currentLanguage = languages.find((l) => l.code === language);

  if (variant === "minimal") {
    return (
      <button
        onClick={() => setLanguage(language === "en" ? "hi" : "en")}
        className={cn(
          "text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors",
          className
        )}
      >
        {language === "en" ? "हिंदी" : "EN"}
      </button>
    );
  }

  if (variant === "toggle") {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 p-1",
          className
        )}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "relative px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
              language === lang.code
                ? "text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            {language === lang.code && (
              <motion.div
                className="absolute inset-0 bg-primary rounded-full"
                layoutId="language-toggle-active"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {showFlag && <span>{lang.flag}</span>}
              <span>{lang.code.toUpperCase()}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {language === "hi" ? "भाषा" : "Language"}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => (
            <motion.button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                language === lang.code
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="text-left">
                <p className="text-sm font-medium">{lang.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang.nativeName}
                </p>
              </div>
              {language === lang.code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto"
                >
                  <Check className="w-5 h-5 text-primary" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", className)}
        >
          <Globe className="w-4 h-4" />
          {showFlag && currentLanguage && (
            <span>{currentLanguage.flag}</span>
          )}
          {showLabel && currentLanguage && (
            <span className="hidden sm:inline">{currentLanguage.name}</span>
          )}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </div>
            {language === lang.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { LanguageProvider } from "@/hooks/useLanguage";
export type { LanguageProviderProps } from "@/hooks/useLanguage";

// Auto-detect language banner
interface LanguageDetectionBannerProps {
  onAccept: (language: Language) => void;
  onDismiss: () => void;
  detectedLanguage: Language;
  className?: string;
}

export function LanguageDetectionBanner({
  onAccept,
  onDismiss,
  detectedLanguage,
  className,
}: LanguageDetectionBannerProps) {
  const detectedLang = languages.find((l) => l.code === detectedLanguage);

  if (!detectedLang) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4",
          className
        )}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Switch to {detectedLang.nativeName}?
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              We detected your browser is set to {detectedLang.name}. Would you like to use this language?
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => onAccept(detectedLanguage)}
                className="gap-1"
              >
                <span>{detectedLang.flag}</span>
                Switch to {detectedLang.nativeName}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                Keep English
              </Button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Translate component for inline translations
interface TranslateProps {
  en: string;
  hi: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function Translate({
  en,
  hi,
  className,
  as: Component = "span",
}: TranslateProps) {
  const { language } = useLanguage();

  return (
    <Component className={className}>
      {language === "hi" ? hi : en}
    </Component>
  );
}

export default LanguageToggle;