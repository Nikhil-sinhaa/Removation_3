import React, { useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'en' | 'hi';

interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string>) => string;
  isHindi: boolean;
  isEnglish: boolean;
}

// Simple translation dictionary
const translations: Record<string, Record<Language, string>> = {
  // Common UI
  'search': {
    en: 'Search',
    hi: 'खोजें'
  },
  'filter': {
    en: 'Filter',
    hi: 'फ़िल्टर'
  },
  'clear': {
    en: 'Clear',
    hi: 'साफ़ करें'
  },
  'apply': {
    en: 'Apply',
    hi: 'लागू करें'
  },
  'cancel': {
    en: 'Cancel',
    hi: 'रद्द करें'
  },
  'save': {
    en: 'Save',
    hi: 'सेव करें'
  },
  'loading': {
    en: 'Loading...',
    hi: 'लोड हो रहा है...'
  },
  'error': {
    en: 'Error',
    hi: 'त्रुटि'
  },
  'success': {
    en: 'Success',
    hi: 'सफल'
  },

  // Style Picker
  'all_styles': {
    en: 'All Styles',
    hi: 'सभी शैलियाँ'
  },
  'popular_styles': {
    en: 'Popular',
    hi: 'लोकप्रिय'
  },
  'indian_styles': {
    en: 'Indian Styles',
    hi: 'भारतीय शैलियाँ'
  },
  'search_placeholder': {
    en: 'Search styles...',
    hi: 'शैलियाँ खोजें...'
  },
  'premium': {
    en: 'Premium',
    hi: 'प्रीमियम'
  },
  'free': {
    en: 'Free',
    hi: 'मुफ़्त'
  },
  'select_style': {
    en: 'Select Style',
    hi: 'शैली चुनें'
  },

  // Room Types
  'room': {
    en: 'room',
    hi: 'कमरा'
  },
  'rooms': {
    en: 'rooms',
    hi: 'कमरे'
  },
  'all_rooms': {
    en: 'All Rooms',
    hi: 'सभी कमरे'
  },
  'indoor_rooms': {
    en: 'Indoor',
    hi: 'अंदरूनी'
  },
  'outdoor_rooms': {
    en: 'Outdoor',
    hi: 'बाहरी'
  },
  'high_vastu': {
    en: 'High Vastu',
    hi: 'उच्च वास्तु'
  },
  'search_rooms_placeholder': {
    en: 'Search rooms...',
    hi: 'कमरे खोजें...'
  },
  'clear_filters': {
    en: 'Clear filters',
    hi: 'फ़िल्टर साफ़ करें'
  },
  'variants': {
    en: 'variants',
    hi: 'वेरिएंट'
  },
  'no_rooms_found': {
    en: 'No rooms found',
    hi: 'कोई कमरा नहीं मिला'
  },
  'try_different_search': {
    en: 'Try a different search or category',
    hi: 'अलग खोज या श्रेणी आजमाएं'
  },
  'popular_picks': {
    en: 'Popular Picks',
    hi: 'लोकप्रिय विकल्प'
  },
  'vastu_importance': {
    en: 'Vastu Importance',
    hi: 'वास्तु महत्व'
  },
  'sub_types': {
    en: 'sub-types',
    hi: 'उप-प्रकार'
  },
  'indoor': {
    en: 'Indoor',
    hi: 'अंदरूनी'
  },
  'outdoor': {
    en: 'Outdoor',
    hi: 'बाहरी'
  },

  // Project
  'project_name': {
    en: 'Project Name',
    hi: 'प्रोजेक्ट नाम'
  },
  'description': {
    en: 'Description',
    hi: 'विवरण'
  },
  'room_type': {
    en: 'Room Type',
    hi: 'कमरे का प्रकार'
  },
  'style': {
    en: 'Style',
    hi: 'शैली'
  },
  'budget': {
    en: 'Budget',
    hi: 'बजट'
  },

  // Vastu
  'vastu_score': {
    en: 'Vastu Score',
    hi: 'वास्तु स्कोर'
  },
  'cost_estimate': {
    en: 'Cost Estimate',
    hi: 'लागत अनुमान'
  },
  'view_report': {
    en: 'View Report',
    hi: 'रिपोर्ट देखें'
  },
  'fix_suggestions': {
    en: 'Fix Suggestions',
    hi: 'सुझाव सुधारें'
  },

  // Actions
  'create': {
    en: 'Create',
    hi: 'बनाएं'
  },
  'edit': {
    en: 'Edit',
    hi: 'संपादित करें'
  },
  'delete': {
    en: 'Delete',
    hi: 'हटाएं'
  },
  'duplicate': {
    en: 'Duplicate',
    hi: 'डुप्लिकेट'
  },
  'share': {
    en: 'Share',
    hi: 'साझा करें'
  },
  'download': {
    en: 'Download',
    hi: 'डाउनलोड'
  },

  // Status
  'draft': {
    en: 'Draft',
    hi: 'ड्राफ्ट'
  },
  'processing': {
    en: 'Processing',
    hi: 'प्रोसेसिंग'
  },
  'completed': {
    en: 'Completed',
    hi: 'पूरा हुआ'
  },
  'failed': {
    en: 'Failed',
    hi: 'विफल'
  },

  // Settings
  'settings': {
    en: 'Settings',
    hi: 'सेटिंग्स'
  },
  'profile': {
    en: 'Profile',
    hi: 'प्रोफ़ाइल'
  },
  'account': {
    en: 'Account',
    hi: 'खाता'
  },
  'notifications': {
    en: 'Notifications',
    hi: 'सूचनाएं'
  },

  // Months
  'january': {
    en: 'January',
    hi: 'जनवरी'
  },
  'february': {
    en: 'February',
    hi: 'फरवरी'
  },
  'march': {
    en: 'March',
    hi: 'मार्च'
  },
  'april': {
    en: 'April',
    hi: 'अप्रैल'
  },
  'may': {
    en: 'May',
    hi: 'मई'
  },
  'june': {
    en: 'June',
    hi: 'जून'
  },
  'july': {
    en: 'July',
    hi: 'जुलाई'
  },
  'august': {
    en: 'August',
    hi: 'अगस्त'
  },
  'september': {
    en: 'September',
    hi: 'सितंबर'
  },
  'october': {
    en: 'October',
    hi: 'अक्टूबर'
  },
  'november': {
    en: 'November',
    hi: 'नवंबर'
  },
  'december': {
    en: 'December',
    hi: 'दिसंबर'
  },
  // Add these after the existing translations:

  // More common translations
  'submit': {
    en: 'Submit',
    hi: 'सबमिट करें'
  },
  'reset': {
    en: 'Reset',
    hi: 'रीसेट'
  },
  'close': {
    en: 'Close',
    hi: 'बंद करें'
  },
  'open': {
    en: 'Open',
    hi: 'खोलें'
  },
  'yes': {
    en: 'Yes',
    hi: 'हाँ'
  },
  'no': {
    en: 'No',
    hi: 'नहीं'
  },
  'confirm': {
    en: 'Confirm',
    hi: 'पुष्टि करें'
  },
  'back': {
    en: 'Back',
    hi: 'वापस'
  },
  'next': {
    en: 'Next',
    hi: 'अगला'
  },
  'previous': {
    en: 'Previous',
    hi: 'पिछला'
  },
  'continue': {
    en: 'Continue',
    hi: 'जारी रखें'
  },
  'finish': {
    en: 'Finish',
    hi: 'समाप्त करें'
  },

  // Form labels
  'name': {
    en: 'Name',
    hi: 'नाम'
  },
  'email': {
    en: 'Email',
    hi: 'ईमेल'
  },
  'phone': {
    en: 'Phone',
    hi: 'फ़ोन'
  },
  'address': {
    en: 'Address',
    hi: 'पता'
  },
  'city': {
    en: 'City',
    hi: 'शहर'
  },
  'state': {
    en: 'State',
    hi: 'राज्य'
  },
  'country': {
    en: 'Country',
    hi: 'देश'
  },
  'zip_code': {
    en: 'ZIP Code',
    hi: 'ज़िप कोड'
  },

  // Project related
  'new_project': {
    en: 'New Project',
    hi: 'नया प्रोजेक्ट'
  },
  'my_projects': {
    en: 'My Projects',
    hi: 'मेरे प्रोजेक्ट'
  },
  'recent_projects': {
    en: 'Recent Projects',
    hi: 'हाल के प्रोजेक्ट'
  },
  'favorite_projects': {
    en: 'Favorite Projects',
    hi: 'पसंदीदा प्रोजेक्ट'
  },
  'archived_projects': {
    en: 'Archived Projects',
    hi: 'संग्रहित प्रोजेक्ट'
  },

  // Design related
  'design_style': {
    en: 'Design Style',
    hi: 'डिज़ाइन शैली'
  },
  'color_scheme': {
    en: 'Color Scheme',
    hi: 'रंग योजना'
  },
  'materials': {
    en: 'Materials',
    hi: 'सामग्री'
  },
  'furniture': {
    en: 'Furniture',
    hi: 'फर्नीचर'
  },
  'lighting': {
    en: 'Lighting',
    hi: 'प्रकाश व्यवस्था'
  },
  'decor': {
    en: 'Decor',
    hi: 'सजावट'
  },

  // Vastu related
  'vastu_analysis': {
    en: 'Vastu Analysis',
    hi: 'वास्तु विश्लेषण'
  },
  'vastu_report': {
    en: 'Vastu Report',
    hi: 'वास्तु रिपोर्ट'
  },
  'vastu_suggestions': {
    en: 'Vastu Suggestions',
    hi: 'वास्तु सुझाव'
  },
  'vastu_fixes': {
    en: 'Vastu Fixes',
    hi: 'वास्तु सुधार'
  },
  'auto_fix': {
    en: 'Auto Fix',
    hi: 'स्वचालित सुधार'
  },

  // Cost related
  'cost_calculator': {
    en: 'Cost Calculator',
    hi: 'लागत कैलकुलेटर'
  },
  'material_costs': {
    en: 'Material Costs',
    hi: 'सामग्री लागत'
  },
  'labor_costs': {
    en: 'Labor Costs',
    hi: 'श्रम लागत'
  },
  'total_cost': {
    en: 'Total Cost',
    hi: 'कुल लागत'
  },
  'cost_breakdown': {
    en: 'Cost Breakdown',
    hi: 'लागत विवरण'
  },
  'estimate': {
    en: 'Estimate',
    hi: 'अनुमान'
  },
  'actual': {
    en: 'Actual',
    hi: 'वास्तविक'
  },
  'budget_vs_actual': {
    en: 'Budget vs Actual',
    hi: 'बजट बनाम वास्तविक'
  },

};

export function useLanguage(): UseLanguageReturn {
  const [language, setLanguageState] = useState<Language>('en');

  // Initialize from localStorage or browser language
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      setLanguageState(savedLang);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'hi') {
        setLanguageState('hi');
      }
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

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let translation = translations[key]?.[language] || key;

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, value);
      });
    }

    return translation;
  }, [language]);

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isHindi: language === 'hi',
    isEnglish: language === 'en',
  };
}

// Helper function to format numbers in Indian/English
export const formatNumber = (num: number, language: Language): string => {
  if (language === 'hi') {
    // Indian numbering system (lakhs, crores)
    if (num >= 10000000) {
      return `${(num / 10000000).toFixed(1)} करोड़`;
    } else if (num >= 100000) {
      return `${(num / 100000).toFixed(1)} लाख`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} हज़ार`;
    }
    return num.toString();
  }

  // English/international numbering
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Helper function to format currency
export const formatCurrency = (
  amount: number,
  language: Language,
  currency: 'INR' | 'USD' = 'INR'
): string => {
  const formatter = new Intl.NumberFormat(
    language === 'hi' ? 'en-IN' : 'en-US',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  );

  return formatter.format(amount);
};

// Helper function to format date
export const formatDate = (date: Date, language: Language): string => {
  const formatter = new Intl.DateTimeFormat(
    language === 'hi' ? 'hi-IN' : 'en-IN',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return formatter.format(date);
};

