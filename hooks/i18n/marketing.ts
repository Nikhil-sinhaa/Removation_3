// hooks/i18n/marketing.ts
import type { Language } from '../useLanguage';

export const marketingTranslations: Record<string, Record<Language, string>> = {
  // ── Pricing Page ─────────────────────────────────────────────────────────────
  'pricing_title': { en: 'Simple, Transparent Pricing', hi: 'सरल, पारदर्शी मूल्य निर्धारण' },
  'pricing_subtitle': { en: 'Start free, upgrade when you need more power', hi: 'मुफ़्त शुरू करें, जरूरत पड़ने पर अपग्रेड करें' },
  'pricing_monthly': { en: 'Monthly', hi: 'मासिक' },
  'pricing_yearly': { en: 'Yearly', hi: 'वार्षिक' },
  'pricing_save': { en: 'Save 20%', hi: '20% बचाएं' },
  'pricing_free_plan': { en: 'Free', hi: 'मुफ़्त' },
  'pricing_pro_plan': { en: 'Pro', hi: 'प्रो' },
  'pricing_teams_plan': { en: 'Teams', hi: 'टीम्स' },
  'pricing_enterprise': { en: 'Enterprise', hi: 'एंटरप्राइज़' },
  'pricing_per_month': { en: '/month', hi: '/माह' },
  'pricing_per_year': { en: '/year', hi: '/वर्ष' },
  'pricing_get_started': { en: 'Get Started Free', hi: 'मुफ़्त शुरू करें' },
  'pricing_upgrade': { en: 'Upgrade to Pro', hi: 'प्रो में अपग्रेड करें' },
  'pricing_contact_sales': { en: 'Contact Sales', hi: 'सेल्स से संपर्क करें' },
  'pricing_current_plan': { en: 'Current Plan', hi: 'वर्तमान प्लान' },
  'pricing_popular': { en: 'Most Popular', hi: 'सबसे लोकप्रिय' },
  'pricing_credits_month': { en: '{{count}} credits/month', hi: '{{count}} क्रेडिट/माह' },
  'pricing_unlimited': { en: 'Unlimited', hi: 'असीमित' },
  'pricing_faq_title': { en: 'Frequently Asked Questions', hi: 'अक्सर पूछे जाने वाले प्रश्न' },
  'pricing_guarantee': { en: '30-day money-back guarantee', hi: '30 दिन की मनी-बैक गारंटी' },
  'pricing_no_cc': { en: 'No credit card required', hi: 'क्रेडिट कार्ड की जरूरत नहीं' },
  'pricing_cancel_anytime': { en: 'Cancel anytime', hi: 'कभी भी रद्द करें' },

  // ── Features Page ─────────────────────────────────────────────────────────────
  'feat_title': { en: 'Powerful AI Design Features', hi: 'शक्तिशाली AI डिज़ाइन फ़ीचर्स' },
  'feat_subtitle': { en: 'Everything you need to transform any space — from a single room to an entire home', hi: 'एक कमरे से लेकर पूरे घर तक — किसी भी जगह बदलने के लिए सब कुछ' },
  'feat_ai_design': { en: 'AI Interior Design', hi: 'AI इंटीरियर डिज़ाइन' },
  'feat_ai_design_desc': { en: 'Transform any room with our powerful SDXL model running on RTX 4060 GPU', hi: 'RTX 4060 GPU पर चलने वाले हमारे SDXL मॉडल से किसी भी कमरे को बदलें' },
  'feat_vastu': { en: 'Vastu Compliance', hi: 'वास्तु अनुपालन' },
  'feat_vastu_desc': { en: 'Get AI-powered Vastu Shastra analysis with 120+ rules and personalized fixes', hi: '120+ नियमों और व्यक्तिगत सुझावों के साथ AI-पावर्ड वास्तु शास्त्र विश्लेषण पाएं' },
  'feat_marketplace': { en: 'Designer Marketplace', hi: 'डिज़ाइनर मार्केटप्लेस' },
  'feat_marketplace_desc': { en: 'Connect with verified interior designers and contractors across India', hi: 'भारत भर में सत्यापित इंटीरियर डिज़ाइनरों और कॉन्ट्रैक्टरों से जुड़ें' },
  'feat_cost': { en: 'Cost Estimator', hi: 'लागत अनुमानक' },
  'feat_cost_desc': { en: 'Get accurate renovation cost estimates based on your city and room size', hi: 'अपने शहर और कमरे के आकार के आधार पर सटीक नवीनीकरण लागत अनुमान पाएं' },
  'feat_floor_plan': { en: '3D Floor Plans', hi: '3D फ्लोर प्लान' },
  'feat_floor_plan_desc': { en: 'Generate professional 3D floor plans from simple sketches or photos', hi: 'सरल स्केच या फ़ोटो से पेशेवर 3D फ्लोर प्लान बनाएं' },
  'feat_learn_more': { en: 'Learn more', hi: 'और जानें' },
  'feat_get_started': { en: 'Get Started Free', hi: 'मुफ़्त शुरू करें' },
  'feat_view_pricing': { en: 'View Pricing', hi: 'मूल्य देखें' },

  // ── About Page ───────────────────────────────────────────────────────────────
  'about_title': { en: 'About Removation', hi: 'Removation के बारे में' },
  'about_subtitle': { en: 'Making professional interior design accessible to every Indian home', hi: 'हर भारतीय घर के लिए पेशेवर इंटीरियर डिज़ाइन सुलभ बनाना' },
  'about_mission': { en: 'Our Mission', hi: 'हमारा मिशन' },
  'about_team': { en: 'Our Team', hi: 'हमारी टीम' },
  'about_contact': { en: 'Contact Us', hi: 'हमसे संपर्क करें' },

  // ── Home/Landing Page ─────────────────────────────────────────────────────────
  'home_hero_title': { en: 'Transform Your Home with AI', hi: 'AI से अपना घर बदलें' },
  'home_hero_subtitle': { en: 'Professional interior design powered by AI. Upload a photo and get stunning redesigns in seconds — for free.', hi: 'AI-पावर्ड पेशेवर इंटीरियर डिज़ाइन। फ़ोटो अपलोड करें और सेकंडों में शानदार रीडिज़ाइन पाएं — मुफ़्त में।' },
  'home_cta_start': { en: 'Start Designing Free', hi: 'मुफ़्त डिज़ाइन शुरू करें' },
  'home_cta_demo': { en: 'Watch Demo', hi: 'डेमो देखें' },
  'home_social_proof': { en: '{{count}}+ designs generated', hi: '{{count}}+ डिज़ाइन बनाए गए' },
  'home_trusted': { en: 'Trusted by homeowners across India', hi: 'भारत भर के घर मालिकों द्वारा भरोसा किया गया' },
};
