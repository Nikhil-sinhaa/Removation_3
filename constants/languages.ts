// constants/languages.ts

export type LanguageCode = 'en' | 'hi';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    direction: 'ltr'
  }
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// Comprehensive translations
export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.blog': 'Blog',
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Projects',
    'nav.editor': 'Editor',
    'nav.settings': 'Settings',
    'nav.history': 'History',
    'nav.favorites': 'Favorites',
    'nav.signIn': 'Sign In',
    'nav.signUp': 'Sign Up',
    'nav.signOut': 'Sign Out',

    // Hero Section
    'hero.title': 'Transform Your Space with AI',
    'hero.subtitle': 'Redesign any room in seconds using cutting-edge AI. Get instant renovation costs and Vastu-compliant designs.',
    'hero.cta.primary': 'Start Free',
    'hero.cta.secondary': 'Watch Demo',
    'hero.badge': 'Powered by Advanced AI',
    'hero.stats.renders': 'AI Renders Generated',
    'hero.stats.users': 'Happy Users',
    'hero.stats.rating': 'Average Rating',

    // Features
    'features.title': 'Everything You Need to Redesign',
    'features.subtitle': 'Powerful AI tools to transform any space instantly',
    'features.interiorDesign': 'Interior Design AI',
    'features.interiorDesign.desc': 'Transform any room with 400+ design styles',
    'features.exteriorDesign': 'Exterior Design',
    'features.exteriorDesign.desc': 'Redesign facades, gardens, and outdoor spaces',
    'features.vastuAnalysis': 'Vastu Analysis',
    'features.vastuAnalysis.desc': 'Get Vastu score and auto-fix suggestions',
    'features.costCalculator': 'Cost Calculator',
    'features.costCalculator.desc': 'Real-time renovation costs with material breakdown',
    'features.objectRemoval': 'Object Removal',
    'features.objectRemoval.desc': 'Remove unwanted items from any photo',
    'features.smartInpaint': 'Smart Inpaint',
    'features.smartInpaint.desc': 'Replace specific areas with new designs',
    'features.emptyRoom': 'Fill Empty Room',
    'features.emptyRoom.desc': 'Furnish empty spaces automatically',
    'features.sketchToRender': 'Sketch to Render',
    'features.sketchToRender.desc': 'Convert hand-drawn sketches to realistic images',

    // Editor
    'editor.title': 'Design Editor',
    'editor.upload': 'Upload Image',
    'editor.uploadHint': 'Drag and drop or click to upload',
    'editor.transform': 'Transform',
    'editor.style': 'Style',
    'editor.roomType': 'Room Type',
    'editor.generate': 'Generate Design',
    'editor.generating': 'Generating...',
    'editor.download': 'Download',
    'editor.compare': 'Compare',
    'editor.undo': 'Undo',
    'editor.redo': 'Redo',
    'editor.zoom': 'Zoom',
    'editor.export': 'Export',
    'editor.save': 'Save',
    'editor.selectArea': 'Select Area',
    'editor.brushSize': 'Brush Size',
    'editor.modes.redesign': 'Redesign',
    'editor.modes.inpaint': 'Inpaint',
    'editor.modes.remove': 'Remove Object',
    'editor.modes.fill': 'Fill Room',
    'editor.modes.enhance': 'Enhance',
    'editor.modes.sketch': 'Sketch to Render',
    'editor.quality.standard': 'Standard',
    'editor.quality.hd': 'HD',
    'editor.quality.4k': '4K',

    // Vastu
    'vastu.title': 'Vastu Analysis',
    'vastu.score': 'Vastu Score',
    'vastu.excellent': 'Excellent',
    'vastu.good': 'Good',
    'vastu.average': 'Average',
    'vastu.poor': 'Poor',
    'vastu.suggestions': 'Suggestions',
    'vastu.autoFix': 'Auto Fix',
    'vastu.analyze': 'Analyze Vastu',
    'vastu.analyzing': 'Analyzing...',
    'vastu.compass': 'Direction',
    'vastu.elements': 'Elements',
    'vastu.zones': 'Zones',
    'vastu.report': 'Download Report',
    'vastu.directions.north': 'North',
    'vastu.directions.south': 'South',
    'vastu.directions.east': 'East',
    'vastu.directions.west': 'West',
    'vastu.directions.northeast': 'Northeast',
    'vastu.directions.northwest': 'Northwest',
    'vastu.directions.southeast': 'Southeast',
    'vastu.directions.southwest': 'Southwest',
    'vastu.directions.center': 'Center',

    // Cost Calculator
    'cost.title': 'Renovation Cost Calculator',
    'cost.estimate': 'Estimated Cost',
    'cost.breakdown': 'Cost Breakdown',
    'cost.materials': 'Materials',
    'cost.labor': 'Labor',
    'cost.tax': 'GST/Tax',
    'cost.total': 'Total',
    'cost.city': 'Select City',
    'cost.area': 'Area (sq ft)',
    'cost.quality': 'Quality Level',
    'cost.quality.basic': 'Basic',
    'cost.quality.standard': 'Standard',
    'cost.quality.premium': 'Premium',
    'cost.quality.luxury': 'Luxury',
    'cost.currency': 'Currency',
    'cost.compare': 'Compare Quotes',
    'cost.export': 'Export Quote',
    'cost.material.flooring': 'Flooring',
    'cost.material.paint': 'Paint & Wall',
    'cost.material.furniture': 'Furniture',
    'cost.material.lighting': 'Lighting',
    'cost.material.fixtures': 'Fixtures',
    'cost.material.accessories': 'Accessories',

    // Pricing
    'pricing.title': 'Simple, Transparent Pricing',
    'pricing.subtitle': 'Choose the plan that fits your needs',
    'pricing.monthly': 'Monthly',
    'pricing.yearly': 'Yearly',
    'pricing.save': 'Save 20%',
    'pricing.free': 'Free',
    'pricing.pro': 'Pro',
    'pricing.teams': 'Teams',
    'pricing.enterprise': 'Enterprise',
    'pricing.perMonth': '/month',
    'pricing.perUser': '/user/month',
    'pricing.free.price': '₹0',
    'pricing.pro.price': '₹2,399',
    'pricing.teams.price': '₹8,199',
    'pricing.getStarted': 'Get Started',
    'pricing.subscribe': 'Subscribe',
    'pricing.contactSales': 'Contact Sales',
    'pricing.currentPlan': 'Current Plan',
    'pricing.features.renders': 'AI Renders',
    'pricing.features.styles': 'Design Styles',
    'pricing.features.vastu': 'Vastu Analysis',
    'pricing.features.cost': 'Cost Calculator',
    'pricing.features.export': 'HD Export',
    'pricing.features.support': 'Priority Support',
    'pricing.features.api': 'API Access',
    'pricing.features.team': 'Team Collaboration',

    // Projects
    'projects.title': 'My Projects',
    'projects.new': 'New Project',
    'projects.empty': 'No projects yet',
    'projects.emptyDesc': 'Create your first project to get started',
    'projects.createFirst': 'Create Project',
    'projects.search': 'Search projects...',
    'projects.filter': 'Filter',
    'projects.sort': 'Sort by',
    'projects.delete': 'Delete',
    'projects.duplicate': 'Duplicate',
    'projects.rename': 'Rename',
    'projects.open': 'Open',
    'projects.renders': 'Renders',
    'projects.created': 'Created',
    'projects.updated': 'Last updated',

    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.or': 'or continue with',
    'auth.google': 'Continue with Google',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.terms': 'By signing up, you agree to our Terms and Privacy Policy',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.done': 'Done',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.all': 'All',
    'common.new': 'New',
    'common.popular': 'Popular',
    'common.recent': 'Recent',
    'common.credits': 'Credits',
    'common.upgrade': 'Upgrade',
    'common.learnMore': 'Learn More',
    'common.viewAll': 'View All',

    // Room Types
    'room.livingRoom': 'Living Room',
    'room.bedroom': 'Bedroom',
    'room.kitchen': 'Kitchen',
    'room.bathroom': 'Bathroom',
    'room.diningRoom': 'Dining Room',
    'room.office': 'Home Office',
    'room.balcony': 'Balcony',
    'room.terrace': 'Terrace',
    'room.pooja': 'Pooja Room',
    'room.kids': "Kids Room",
    'room.guest': 'Guest Room',
    'room.study': 'Study Room',
    'room.entrance': 'Entrance/Foyer',
    'room.outdoor': 'Outdoor Area',

    // Styles
    'style.modern': 'Modern',
    'style.minimalist': 'Minimalist',
    'style.traditional': 'Traditional Indian',
    'style.contemporary': 'Contemporary',
    'style.scandinavian': 'Scandinavian',
    'style.industrial': 'Industrial',
    'style.bohemian': 'Bohemian',
    'style.luxury': 'Luxury',
    'style.rustic': 'Rustic',
    'style.coastal': 'Coastal',

    // Footer
    'footer.company': 'Company',
    'footer.product': 'Product',
    'footer.resources': 'Resources',
    'footer.legal': 'Legal',
    'footer.about': 'About Us',
    'footer.careers': 'Careers',
    'footer.blog': 'Blog',
    'footer.press': 'Press',
    'footer.features': 'Features',
    'footer.pricing': 'Pricing',
    'footer.integrations': 'Integrations',
    'footer.api': 'API',
    'footer.docs': 'Documentation',
    'footer.tutorials': 'Tutorials',
    'footer.community': 'Community',
    'footer.support': 'Support',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.cookies': 'Cookie Policy',
    'footer.rights': 'All rights reserved',

    // Notifications
    'notification.renderComplete': 'Your render is ready!',
    'notification.renderFailed': 'Render failed. Please try again.',
    'notification.saveSuccess': 'Project saved successfully',
    'notification.exportSuccess': 'Image exported successfully',
    'notification.uploadSuccess': 'Image uploaded successfully',
    'notification.uploadFailed': 'Upload failed. Please try again.',
    'notification.copied': 'Copied to clipboard',

    // Errors
    'error.notFound': 'Page not found',
    'error.unauthorized': 'Please sign in to continue',
    'error.forbidden': 'You do not have access to this resource',
    'error.serverError': 'Server error. Please try again later.',
    'error.networkError': 'Network error. Check your connection.',
    'error.invalidImage': 'Invalid image format',
    'error.imageTooLarge': 'Image too large. Max 10MB allowed.',
    'error.noCredits': 'No credits remaining. Please upgrade.',

    // Success messages
    'success.projectCreated': 'Project created successfully',
    'success.projectDeleted': 'Project deleted',
    'success.settingsSaved': 'Settings saved',
    'success.passwordChanged': 'Password changed successfully',
  },

  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.features': 'फीचर्स',
    'nav.pricing': 'मूल्य निर्धारण',
    'nav.about': 'हमारे बारे में',
    'nav.contact': 'संपर्क',
    'nav.blog': 'ब्लॉग',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.projects': 'प्रोजेक्ट्स',
    'nav.editor': 'एडिटर',
    'nav.settings': 'सेटिंग्स',
    'nav.history': 'इतिहास',
    'nav.favorites': 'पसंदीदा',
    'nav.signIn': 'साइन इन',
    'nav.signUp': 'साइन अप',
    'nav.signOut': 'साइन आउट',

    // Hero Section
    'hero.title': 'AI के साथ अपने स्थान को बदलें',
    'hero.subtitle': 'अत्याधुनिक AI का उपयोग करके सेकंडों में किसी भी कमरे को फिर से डिज़ाइन करें। तुरंत नवीनीकरण लागत और वास्तु-अनुरूप डिज़ाइन प्राप्त करें।',
    'hero.cta.primary': 'मुफ्त शुरू करें',
    'hero.cta.secondary': 'डेमो देखें',
    'hero.badge': 'उन्नत AI द्वारा संचालित',
    'hero.stats.renders': 'AI रेंडर्स जनरेट',
    'hero.stats.users': 'खुश उपयोगकर्ता',
    'hero.stats.rating': 'औसत रेटिंग',

    // Features
    'features.title': 'रीडिज़ाइन के लिए सब कुछ',
    'features.subtitle': 'किसी भी स्थान को तुरंत बदलने के लिए शक्तिशाली AI टूल्स',
    'features.interiorDesign': 'इंटीरियर डिज़ाइन AI',
    'features.interiorDesign.desc': '400+ डिज़ाइन स्टाइल के साथ किसी भी कमरे को बदलें',
    'features.exteriorDesign': 'एक्सटीरियर डिज़ाइन',
    'features.exteriorDesign.desc': 'फेसाड, बगीचे और बाहरी स्थानों को रीडिज़ाइन करें',
    'features.vastuAnalysis': 'वास्तु विश्लेषण',
    'features.vastuAnalysis.desc': 'वास्तु स्कोर और ऑटो-फिक्स सुझाव प्राप्त करें',
    'features.costCalculator': 'लागत कैलकुलेटर',
    'features.costCalculator.desc': 'सामग्री ब्रेकडाउन के साथ रियल-टाइम नवीनीकरण लागत',
    'features.objectRemoval': 'ऑब्जेक्ट रिमूवल',
    'features.objectRemoval.desc': 'किसी भी फोटो से अवांछित आइटम हटाएं',
    'features.smartInpaint': 'स्मार्ट इनपेंट',
    'features.smartInpaint.desc': 'विशिष्ट क्षेत्रों को नए डिज़ाइन से बदलें',
    'features.emptyRoom': 'खाली कमरा भरें',
    'features.emptyRoom.desc': 'खाली स्थानों को स्वचालित रूप से सजाएं',
    'features.sketchToRender': 'स्केच से रेंडर',
    'features.sketchToRender.desc': 'हाथ से बनाए गए स्केच को यथार्थवादी छवियों में बदलें',

    // Editor
    'editor.title': 'डिज़ाइन एडिटर',
    'editor.upload': 'इमेज अपलोड करें',
    'editor.uploadHint': 'खींचें और छोड़ें या अपलोड करने के लिए क्लिक करें',
    'editor.transform': 'ट्रांसफॉर्म',
    'editor.style': 'स्टाइल',
    'editor.roomType': 'कमरे का प्रकार',
    'editor.generate': 'डिज़ाइन जनरेट करें',
    'editor.generating': 'जनरेट हो रहा है...',
    'editor.download': 'डाउनलोड',
    'editor.compare': 'तुलना',
    'editor.undo': 'अनडू',
    'editor.redo': 'रीडू',
    'editor.zoom': 'ज़ूम',
    'editor.export': 'एक्सपोर्ट',
    'editor.save': 'सेव',
    'editor.selectArea': 'क्षेत्र चुनें',
    'editor.brushSize': 'ब्रश साइज़',
    'editor.modes.redesign': 'रीडिज़ाइन',
    'editor.modes.inpaint': 'इनपेंट',
    'editor.modes.remove': 'ऑब्जेक्ट हटाएं',
    'editor.modes.fill': 'कमरा भरें',
    'editor.modes.enhance': 'एनहांस',
    'editor.modes.sketch': 'स्केच से रेंडर',
    'editor.quality.standard': 'स्टैंडर्ड',
    'editor.quality.hd': 'HD',
    'editor.quality.4k': '4K',

    // Vastu
    'vastu.title': 'वास्तु विश्लेषण',
    'vastu.score': 'वास्तु स्कोर',
    'vastu.excellent': 'उत्कृष्ट',
    'vastu.good': 'अच्छा',
    'vastu.average': 'औसत',
    'vastu.poor': 'कमज़ोर',
    'vastu.suggestions': 'सुझाव',
    'vastu.autoFix': 'ऑटो फिक्स',
    'vastu.analyze': 'वास्तु विश्लेषण करें',
    'vastu.analyzing': 'विश्लेषण हो रहा है...',
    'vastu.compass': 'दिशा',
    'vastu.elements': 'तत्व',
    'vastu.zones': 'क्षेत्र',
    'vastu.report': 'रिपोर्ट डाउनलोड करें',
    'vastu.directions.north': 'उत्तर',
    'vastu.directions.south': 'दक्षिण',
    'vastu.directions.east': 'पूर्व',
    'vastu.directions.west': 'पश्चिम',
    'vastu.directions.northeast': 'ईशान',
    'vastu.directions.northwest': 'वायव्य',
    'vastu.directions.southeast': 'आग्नेय',
    'vastu.directions.southwest': 'नैऋत्य',
    'vastu.directions.center': 'केंद्र',

    // Cost Calculator
    'cost.title': 'नवीनीकरण लागत कैलकुलेटर',
    'cost.estimate': 'अनुमानित लागत',
    'cost.breakdown': 'लागत विवरण',
    'cost.materials': 'सामग्री',
    'cost.labor': 'मजदूरी',
    'cost.tax': 'GST/कर',
    'cost.total': 'कुल',
    'cost.city': 'शहर चुनें',
    'cost.area': 'क्षेत्रफल (वर्ग फुट)',
    'cost.quality': 'गुणवत्ता स्तर',
    'cost.quality.basic': 'बेसिक',
    'cost.quality.standard': 'स्टैंडर्ड',
    'cost.quality.premium': 'प्रीमियम',
    'cost.quality.luxury': 'लक्ज़री',
    'cost.currency': 'मुद्रा',
    'cost.compare': 'कोट्स की तुलना करें',
    'cost.export': 'कोट एक्सपोर्ट करें',
    'cost.material.flooring': 'फ्लोरिंग',
    'cost.material.paint': 'पेंट और दीवार',
    'cost.material.furniture': 'फर्नीचर',
    'cost.material.lighting': 'लाइटिंग',
    'cost.material.fixtures': 'फिक्सचर',
    'cost.material.accessories': 'एक्सेसरीज़',

    // Pricing
    'pricing.title': 'सरल, पारदर्शी मूल्य निर्धारण',
    'pricing.subtitle': 'अपनी आवश्यकताओं के अनुसार प्लान चुनें',
    'pricing.monthly': 'मासिक',
    'pricing.yearly': 'वार्षिक',
    'pricing.save': '20% बचाएं',
    'pricing.free': 'फ्री',
    'pricing.pro': 'प्रो',
    'pricing.teams': 'टीम्स',
    'pricing.enterprise': 'एंटरप्राइज़',
    'pricing.perMonth': '/महीना',
    'pricing.perUser': '/उपयोगकर्ता/महीना',
    'pricing.free.price': '₹0',
    'pricing.pro.price': '₹2,399',
    'pricing.teams.price': '₹8,199',
    'pricing.getStarted': 'शुरू करें',
    'pricing.subscribe': 'सब्सक्राइब करें',
    'pricing.contactSales': 'सेल्स से संपर्क करें',
    'pricing.currentPlan': 'वर्तमान प्लान',
    'pricing.features.renders': 'AI रेंडर्स',
    'pricing.features.styles': 'डिज़ाइन स्टाइल्स',
    'pricing.features.vastu': 'वास्तु विश्लेषण',
    'pricing.features.cost': 'लागत कैलकुलेटर',
    'pricing.features.export': 'HD एक्सपोर्ट',
    'pricing.features.support': 'प्राथमिकता सहायता',
    'pricing.features.api': 'API एक्सेस',
    'pricing.features.team': 'टीम सहयोग',

    // Projects
    'projects.title': 'मेरे प्रोजेक्ट्स',
    'projects.new': 'नया प्रोजेक्ट',
    'projects.empty': 'अभी कोई प्रोजेक्ट नहीं',
    'projects.emptyDesc': 'शुरू करने के लिए अपना पहला प्रोजेक्ट बनाएं',
    'projects.createFirst': 'प्रोजेक्ट बनाएं',
    'projects.search': 'प्रोजेक्ट खोजें...',
    'projects.filter': 'फ़िल्टर',
    'projects.sort': 'क्रमबद्ध करें',
    'projects.delete': 'हटाएं',
    'projects.duplicate': 'डुप्लिकेट',
    'projects.rename': 'नाम बदलें',
    'projects.open': 'खोलें',
    'projects.renders': 'रेंडर्स',
    'projects.created': 'बनाया गया',
    'projects.updated': 'अंतिम अपडेट',

    // Auth
    'auth.signIn': 'साइन इन',
    'auth.signUp': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    'auth.or': 'या इससे जारी रखें',
    'auth.google': 'Google से जारी रखें',
    'auth.noAccount': 'अकाउंट नहीं है?',
    'auth.haveAccount': 'पहले से अकाउंट है?',
    'auth.terms': 'साइन अप करके, आप हमारी शर्तों और गोपनीयता नीति से सहमत होते हैं',

    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'कुछ गलत हो गया',
    'common.retry': 'पुनः प्रयास करें',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.save': 'सेव करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.close': 'बंद करें',
    'common.back': 'वापस',
    'common.next': 'आगे',
    'common.done': 'हो गया',
    'common.yes': 'हाँ',
    'common.no': 'नहीं',
    'common.search': 'खोजें',
    'common.filter': 'फ़िल्टर',
    'common.sort': 'क्रमबद्ध',
    'common.all': 'सभी',
    'common.new': 'नया',
    'common.popular': 'लोकप्रिय',
    'common.recent': 'हाल का',
    'common.credits': 'क्रेडिट्स',
    'common.upgrade': 'अपग्रेड',
    'common.learnMore': 'और जानें',
    'common.viewAll': 'सभी देखें',

    // Room Types
    'room.livingRoom': 'लिविंग रूम',
    'room.bedroom': 'बेडरूम',
    'room.kitchen': 'किचन',
    'room.bathroom': 'बाथरूम',
    'room.diningRoom': 'डाइनिंग रूम',
    'room.office': 'होम ऑफिस',
    'room.balcony': 'बालकनी',
    'room.terrace': 'टेरेस',
    'room.pooja': 'पूजा कक्ष',
    'room.kids': 'बच्चों का कमरा',
    'room.guest': 'गेस्ट रूम',
    'room.study': 'स्टडी रूम',
    'room.entrance': 'प्रवेश द्वार',
    'room.outdoor': 'बाहरी क्षेत्र',

    // Styles
    'style.modern': 'मॉडर्न',
    'style.minimalist': 'मिनिमलिस्ट',
    'style.traditional': 'पारंपरिक भारतीय',
    'style.contemporary': 'कंटेम्पररी',
    'style.scandinavian': 'स्कैंडिनेवियन',
    'style.industrial': 'इंडस्ट्रियल',
    'style.bohemian': 'बोहेमियन',
    'style.luxury': 'लक्ज़री',
    'style.rustic': 'रस्टिक',
    'style.coastal': 'कोस्टल',

    // Footer
    'footer.company': 'कंपनी',
    'footer.product': 'उत्पाद',
    'footer.resources': 'संसाधन',
    'footer.legal': 'कानूनी',
    'footer.about': 'हमारे बारे में',
    'footer.careers': 'करियर',
    'footer.blog': 'ब्लॉग',
    'footer.press': 'प्रेस',
    'footer.features': 'फीचर्स',
    'footer.pricing': 'मूल्य निर्धारण',
    'footer.integrations': 'इंटीग्रेशन',
    'footer.api': 'API',
    'footer.docs': 'डॉक्यूमेंटेशन',
    'footer.tutorials': 'ट्यूटोरियल',
    'footer.community': 'समुदाय',
    'footer.support': 'सहायता',
    'footer.privacy': 'गोपनीयता नीति',
    'footer.terms': 'सेवा की शर्तें',
    'footer.cookies': 'कुकी नीति',
    'footer.rights': 'सर्वाधिकार सुरक्षित',

    // Notifications
    'notification.renderComplete': 'आपका रेंडर तैयार है!',
    'notification.renderFailed': 'रेंडर विफल। कृपया पुनः प्रयास करें।',
    'notification.saveSuccess': 'प्रोजेक्ट सफलतापूर्वक सेव हुआ',
    'notification.exportSuccess': 'इमेज सफलतापूर्वक एक्सपोर्ट हुई',
    'notification.uploadSuccess': 'इमेज सफलतापूर्वक अपलोड हुई',
    'notification.uploadFailed': 'अपलोड विफल। कृपया पुनः प्रयास करें।',
    'notification.copied': 'क्लिपबोर्ड पर कॉपी हुआ',

    // Errors
    'error.notFound': 'पेज नहीं मिला',
    'error.unauthorized': 'जारी रखने के लिए साइन इन करें',
    'error.forbidden': 'आपको इस संसाधन तक पहुंच नहीं है',
    'error.serverError': 'सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें।',
    'error.networkError': 'नेटवर्क त्रुटि। अपना कनेक्शन जांचें।',
    'error.invalidImage': 'अमान्य इमेज फॉर्मेट',
    'error.imageTooLarge': 'इमेज बहुत बड़ी है। अधिकतम 10MB अनुमत है।',
    'error.noCredits': 'कोई क्रेडिट शेष नहीं। कृपया अपग्रेड करें।',

    // Success messages
    'success.projectCreated': 'प्रोजेक्ट सफलतापूर्वक बनाया गया',
    'success.projectDeleted': 'प्रोजेक्ट हटाया गया',
    'success.settingsSaved': 'सेटिंग्स सेव हो गईं',
    'success.passwordChanged': 'पासवर्ड सफलतापूर्वक बदला गया',
  }
};

// Helper function to get translation
export function t(key: string, lang: LanguageCode = DEFAULT_LANGUAGE): string {
  return TRANSLATIONS[lang][key] || TRANSLATIONS[DEFAULT_LANGUAGE][key] || key;
}

// Helper function to detect browser language
export function detectLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language.split('-')[0];
  const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);
  
  return supportedCodes.includes(browserLang as LanguageCode) 
    ? browserLang as LanguageCode 
    : DEFAULT_LANGUAGE;
}

// Get language by code
export function getLanguageByCode(code: LanguageCode): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

// Interpolate variables in translation strings
export function tWithParams(
  key: string, 
  params: Record<string, string | number>, 
  lang: LanguageCode = DEFAULT_LANGUAGE
): string {
  let translation = t(key, lang);
  
  Object.entries(params).forEach(([paramKey, value]) => {
    translation = translation.replace(`{${paramKey}}`, String(value));
  });
  
  return translation;
}

// Number formatting based on language
export function formatNumber(num: number, lang: LanguageCode = DEFAULT_LANGUAGE): string {
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.NumberFormat(locale).format(num);
}

// Date formatting based on language
export function formatDate(
  date: Date, 
  lang: LanguageCode = DEFAULT_LANGUAGE,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

// Relative time formatting
export function formatRelativeTime(
  date: Date, 
  lang: LanguageCode = DEFAULT_LANGUAGE
): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ];
  
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  for (const { unit, seconds } of units) {
    if (Math.abs(diffInSeconds) >= seconds) {
      const value = -Math.floor(diffInSeconds / seconds);
      return rtf.format(value, unit);
    }
  }
  
  return rtf.format(0, 'second');
}

// Plural handling
export function plural(
  count: number,
  singular: string,
  pluralForm: string,
  lang: LanguageCode = DEFAULT_LANGUAGE
): string {
  // Hindi doesn't have complex pluralization
  if (lang === 'hi') {
    return count === 1 ? singular : pluralForm;
  }
  return count === 1 ? singular : pluralForm;
}

// Currency formatting with language
export function formatCurrencyLocalized(
  amount: number,
  currency: string = 'INR',
  lang: LanguageCode = DEFAULT_LANGUAGE
): string {
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}