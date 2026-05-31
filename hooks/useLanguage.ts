import React, { useState, useEffect, useCallback } from 'react';
import { allTranslations } from './i18n/index';

export type Language = 'en' | 'hi';

export interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isHindi: boolean;
  isEnglish: boolean;
}

const LanguageContext = React.createContext<UseLanguageReturn | undefined>(undefined);

export interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({
  children,
  defaultLanguage = 'en',
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      setLanguageState(savedLang);
      document.documentElement.lang = savedLang;
    } else {
      const browserLang = navigator.language.split('-')[0];
      const initialLang = browserLang === 'hi' ? 'hi' : 'en';
      setLanguageState(initialLang);
      document.documentElement.lang = initialLang;
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
  }, [language, setLanguage]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = allTranslations[key]?.[language] || key;

    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, String(value));
      });
    }

    return translation;
  }, [language]);

  const value = React.useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage,
    t,
    isHindi: language === 'hi',
    isEnglish: language === 'en',
  }), [language, setLanguage, toggleLanguage, t]);

  return React.createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage(): UseLanguageReturn {
  const context = React.useContext(LanguageContext);
  if (!context) {
    // Safe fallback if used outside of a LanguageProvider
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string) => allTranslations[key]?.['en'] || key,
      isHindi: false,
      isEnglish: true,
    };
  }
  return context;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export const formatNumber = (num: number, language: Language): string => {
  if (language === 'hi') {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)} करोड़`;
    if (num >= 100000)   return `${(num / 100000).toFixed(1)} लाख`;
    if (num >= 1000)     return `${(num / 1000).toFixed(1)} हज़ार`;
    return num.toString();
  }
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000)    return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const formatCurrency = (
  amount: number,
  language: Language,
  currency: 'INR' | 'USD' = 'INR'
): string => {
  const formatter = new Intl.NumberFormat(
    language === 'hi' ? 'en-IN' : 'en-US',
    { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }
  );
  return formatter.format(amount);
};

export const formatDate = (date: Date, language: Language): string => {
  const formatter = new Intl.DateTimeFormat(
    language === 'hi' ? 'hi-IN' : 'en-IN',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  return formatter.format(date);
};
