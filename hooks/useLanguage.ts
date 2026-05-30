import React, { useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'en' | 'hi';

interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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

  // 1. Navigation & App Shell
  'nav_dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav_room_changer': { en: 'AI Room Changer', hi: 'AI रूम चेंजर' },
  'nav_ceiling_changer': { en: 'AI Ceiling Changer', hi: 'AI सीलिंग चेंजर' },
  'nav_color_visualizer': { en: 'AI Color Visualizer', hi: 'AI कलर विज़ुअलाइज़र' },
  'nav_furniture_placement': { en: 'AI Furniture Placement', hi: 'AI फर्नीचर प्लेसमेंट' },
  'nav_furniture_remover': { en: 'AI Furniture Remover', hi: 'AI फर्नीचर रिमूवर' },
  'nav_remove_object': { en: 'AI Remove Object', hi: 'AI ऑब्जेक्ट रिमूवर' },
  'nav_style_transfer': { en: 'AI Style Transfer', hi: 'AI स्टाइल ट्रांसफर' },
  'nav_lighting': { en: 'AI Lighting', hi: 'AI लाइटिंग' },
  'nav_staging': { en: 'Virtual Staging', hi: 'वर्चुअल स्टेजिंग' },
  'nav_floor_plan': { en: 'Vastu Floor Plan Scan', hi: 'वास्तु फ्लोर प्लान स्कैन' },
  'nav_dream_room': { en: 'Dream Room Planner', hi: 'ड्रीम रूम प्लानर' },
  'nav_favorites': { en: 'Favorites', hi: 'पसंदीदा' },
  'nav_history': { en: 'AI History', hi: 'AI हिस्ट्री' },
  'nav_marketplace': { en: 'Marketplace', hi: 'मार्केटप्लेस' },
  'nav_my_bookings': { en: 'My Bookings', hi: 'मेरी बुकिंग्स' },
  'nav_booking_requests': { en: 'Booking Requests', hi: 'बुकिंग अनुरोध' },
  'nav_find_designers': { en: 'Find Designers', hi: 'डिज़ाइनर खोजें' },
  'nav_settings': { en: 'Settings', hi: 'सेटिंग्स' },
  'nav_logout': { en: 'Logout', hi: 'लॉगआउट' },
  'nav_menu': { en: 'Menu', hi: 'मेनू' },
  'nav_switch_language': { en: 'Switch Language', hi: 'भाषा बदलें' },
  'nav_projects': { en: 'My Projects', hi: 'मेरे प्रोजेक्ट्स' },
  'nav_help_support': { en: 'Help & Support', hi: 'सपोर्ट और मदद' },

  // 2. Auth & Onboarding
  'auth_login': { en: 'Login', hi: 'लॉगिन करें' },
  'auth_signup': { en: 'Sign Up', hi: 'साइन अप करें' },
  'auth_email': { en: 'Email Address', hi: 'ईमेल एड्रेस' },
  'auth_password': { en: 'Password', hi: 'पासवर्ड' },
  'auth_forgot_password': { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?' },
  'auth_dont_have_account': { en: "Don't have an account?", hi: 'क्या आपका खाता नहीं है?' },
  'auth_already_have_account': { en: 'Already have an account?', hi: 'पहले से खाता है?' },
  'auth_create_account': { en: 'Create Account', hi: 'खाता बनाएं' },
  'auth_welcome_back': { en: 'Welcome Back', hi: 'आपका स्वागत है' },
  'auth_join_remo': { en: 'Join Remo today', hi: 'आज ही Remo से जुड़ें' },
  'auth_logout_confirm': { en: 'Are you sure you want to logout?', hi: 'क्या आप लॉगआउट करना चाहते हैं?' },
  'auth_first_name': { en: 'First Name', hi: 'पहला नाम' },
  'auth_last_name': { en: 'Last Name', hi: 'आखरी नाम' },
  'auth_phone_number': { en: 'Phone Number', hi: 'फ़ोन नंबर' },
  'auth_role_selection': { en: 'Select your role', hi: 'अपना रोल चुनें' },
  'auth_role_customer': { en: 'Homeowner / Customer', hi: 'मकान मालिक / कस्टमर' },
  'auth_role_designer': { en: 'Interior Designer', hi: 'इंटीरियर डिज़ाइनर' },
  'auth_role_contractor': { en: 'Renovation Contractor', hi: 'रेनोवेशन कॉन्ट्रैक्टर' },
  'auth_verifying': { en: 'Verifying...', hi: 'सत्यापित किया जा रहा है...' },
  'auth_invalid_credentials': { en: 'Invalid email or password', hi: 'गलत ईमेल या पासवर्ड' },

  // 3. User Dashboard
  'dash_welcome': { en: 'Welcome back, {{name}}!', hi: 'स्वागत है, {{name}}!' },
  'dash_subtitle': { en: 'Transform your home with AI and verified professional designers.', hi: 'AI और वेरिफाइड डिज़ाइनर की मदद से अपने घर को नया लुक दें।' },
  'dash_stat_renders': { en: 'AI Designs', hi: 'AI डिज़ाइन' },
  'dash_stat_bookings': { en: 'Bookings', hi: 'बुकिंग्स' },
  'dash_stat_vastu': { en: 'Vastu Scans', hi: 'वास्तु स्कैन' },
  'dash_active_projects': { en: 'Active Projects', hi: 'चालू प्रोजेक्ट्स' },
  'dash_view_all': { en: 'View All', hi: 'सभी देखें' },
  'dash_recent_renders': { en: 'Recent AI Renders', hi: 'हाल ही के AI डिज़ाइन' },
  'dash_no_renders': { en: 'No renders yet.', hi: 'अभी कोई डिज़ाइन नहीं है।' },
  'dash_start_generating': { en: 'Start generating with AI', hi: 'AI से डिज़ाइन बनाना शुरू करें' },
  'dash_quick_actions': { en: 'Quick Actions', hi: 'त्वरित कार्रवाई' },
  'dash_active_bookings': { en: 'Active Bookings', hi: 'एक्टिव बुकिंग्स' },
  'dash_completed_bookings': { en: 'Completed Bookings', hi: 'पूरी हुई बुकिंग्स' },
  'dash_upcoming_consultations': { en: 'Upcoming Consultations', hi: 'आने वाली कंसल्टेशन' },
  'dash_no_upcoming': { en: 'No upcoming consultations', hi: 'कोई आने वाली कंसल्टेशन नहीं है' },
  'dash_explore_ai_tools': { en: 'Explore AI Tools', hi: 'AI टूल्स आज़माएं' },
  'dash_find_expert': { en: 'Find an Expert', hi: 'एक्सपर्ट खोजें' },
  'dash_find_expert_desc': { en: 'Hire top verified interior designers and contractors in your area.', hi: 'अपने इलाके के टॉप वेरिफाइड इंटीरियर डिज़ाइनर और कॉन्ट्रैक्टर से काम करवाएं।' },
  'dash_browse_experts': { en: 'Browse Experts', hi: 'एक्सपर्ट्स देखें' },

  // 4. Professionals Directory
  'dir_title': { en: 'Hire Top Professionals', hi: 'टॉप प्रोफेशनल्स को हायर करें' },
  'dir_subtitle': { en: 'Hire verified interior designers and contractors to bring your dream home to life.', hi: 'अपने सपनों के घर को सच करने के लिए वेरिफाइड इंटीरियर डिज़ाइनर और कॉन्ट्रैक्टर हायर करें।' },
  'dir_search_placeholder': { en: 'Search by name, city, or specialty...', hi: 'नाम, शहर या विशेषता से खोजें...' },
  'dir_verified': { en: 'Verified Pro', hi: 'वेरिफाइड प्रो' },
  'dir_exp_years': { en: '{{years}} years experience', hi: '{{years}} साल का अनुभव' },
  'dir_consult_fee': { en: 'Consultation: {{fee}}', hi: 'कंसल्टेशन फीस: {{fee}}' },
  'dir_book_btn': { en: 'Book Consultation', hi: 'कंसल्टेशन बुक करें' },
  'dir_view_portfolio': { en: 'View Portfolio', hi: 'पोर्टफोलियो देखें' },
  'dir_all': { en: 'All Professionals', hi: 'सभी प्रोफेशनल्स' },
  'dir_designers_only': { en: 'Designers Only', hi: 'सिर्फ डिज़ाइनर' },
  'dir_contractors_only': { en: 'Contractors Only', hi: 'सिर्फ कॉन्ट्रैक्टर' },
  'dir_no_results': { en: 'No professionals found matching your search.', hi: 'आपकी खोज के अनुसार कोई प्रोफेशनल नहीं मिला।' },
  'dir_city_filter': { en: 'Filter by City', hi: 'शहर से फ़िल्टर करें' },
  'dir_all_cities': { en: 'All Cities', hi: 'सभी शहर' },
  'dir_specialty': { en: 'Specialty', hi: 'विशेषता' },
  'dir_about_pro': { en: 'About Professional', hi: 'प्रोफेशनल के बारे में' },
  'dir_contact_info': { en: 'Contact Information', hi: 'सम्पर्क करने की जानकारी' },

  // 5. Booking Flow (Customer Facing)
  'book_title': { en: 'Book {{name}}', hi: '{{name}} को बुक करें' },
  'book_choose_service': { en: 'Choose Service Type', hi: 'सर्विस का प्रकार चुनें' },
  'book_service_consultation': { en: '1-on-1 Consultation', hi: '1-on-1 कंसल्टेशन' },
  'book_service_consultation_desc': { en: 'Discuss ideas, budget, and get initial suggestions.', hi: 'विचारों, बजट पर चर्चा करें और शुरुआती सुझाव पाएं।' },
  'book_service_project': { en: 'Full Room Design Project', hi: 'पूरे कमरे का डिज़ाइन प्रोजेक्ट' },
  'book_service_project_desc': { en: 'Complete layout, 3D modeling, and end-to-end support.', hi: 'पूरा लेआउट, 3D मॉडलिंग और शुरू से अंत तक पूरा सपोर्ट।' },
  'book_select_slot': { en: 'Select Date & Time Slot', hi: 'तारीख और समय का स्लॉट चुनें' },
  'book_project_brief': { en: 'Project Brief / Requirements', hi: 'प्रोजेक्ट की जानकारी / ज़रूरतें' },
  'book_project_brief_placeholder': { en: 'e.g., I want to redesign my living room to have a modern look with high Vastu score...', hi: 'जैसे: मैं अपने लिविंग रूम को मॉडर्न लुक और अच्छे वास्तु स्कोर के साथ डिज़ाइन करवाना चाहता हूँ...' },
  'book_summary': { en: 'Booking Summary', hi: 'बुकिंग समरी' },
  'book_subtotal': { en: 'Subtotal', hi: 'सबटोटल' },
  'book_tax': { en: 'GST / Taxes', hi: 'GST / टैक्स' },
  'book_total': { en: 'Total Amount', hi: 'कुल राशि' },
  'book_pay_btn': { en: 'Pay & Book with Razorpay', hi: 'Razorpay से भुगतान और बुकिंग करें' },
  'book_secure_payment': { en: '₹{{amount}} secure payment', hi: '₹{{amount}} का सुरक्षित भुगतान' },
  'book_success_title': { en: 'Booking Successful!', hi: 'बुकिंग सफल रही!' },
  'book_success_desc': { en: 'Your slot has been reserved. The professional will respond shortly.', hi: 'आपका स्लॉट बुक हो गया है। प्रोफेशनल जल्द ही आपसे संपर्क करेंगे।' },
  'book_go_bookings': { en: 'Go to My Bookings', hi: 'मेरी बुकिंग्स पर जाएं' },
  'book_failed_title': { en: 'Booking Failed', hi: 'बुकिंग फेल हो गई' },

  // 6. My Bookings (Customer Portal)
  'myb_title': { en: 'My Bookings', hi: 'मेरी बुकिंग्स' },
  'myb_subtitle': { en: 'Track your consultations, view briefs, and chat with designers.', hi: 'अपनी बातचीत ट्रैक करें, प्रोजेक्ट ब्रीफ देखें और डिज़ाइनर से चैट करें।' },
  'myb_no_bookings': { en: 'No bookings yet', hi: 'अभी तक कोई बुकिंग नहीं है' },
  'myb_no_bookings_desc': { en: 'Start by browsing our expert designers and contractors.', hi: 'हमारे एक्सपर्ट डिज़ाइनर और कॉन्ट्रैक्टर को देखकर शुरुआत करें।' },
  'myb_browse_experts': { en: 'Browse Experts', hi: 'एक्सपर्ट्स देखें' },
  'myb_status_pending_payment': { en: 'Pending Payment', hi: 'पेमेंट बाकी है' },
  'myb_status_pending_designer': { en: 'Awaiting Action', hi: 'मंज़ूरी का इंतज़ार' },
  'myb_status_confirmed': { en: 'Confirmed', hi: 'कन्फर्म हो गया' },
  'myb_status_rejected': { en: 'Rejected', hi: 'अस्वीकार' },
  'myb_status_cancelled': { en: 'Cancelled', hi: 'रद्द हो गया' },
  'myb_status_expired': { en: 'Expired', hi: 'समय सीमा समाप्त' },
  'myb_status_completed': { en: 'Completed', hi: 'पूरा हो गया' },
  'myb_type_consultation': { en: 'Consultation', hi: 'कंसल्टेशन' },
  'myb_type_project': { en: 'Design Project', hi: 'डिज़ाइन प्रोजेक्ट' },
  'myb_slot': { en: 'Requested Slot', hi: 'चुना हुआ स्लॉट' },
  'myb_brief': { en: 'Project Brief', hi: 'प्रोजेक्ट ब्रीफ' },
  'myb_deadline': { en: 'must respond by {{date}}', hi: '{{date}} तक जवाब देना ज़रूरी है' },
  'myb_rejection_reason': { en: 'Reason for rejection', hi: 'अस्वीकार करने का कारण' },
  'myb_refund_failed': { en: 'Refund failed. Please contact support.', hi: 'रिफ़ंड फ़ेल हो गया। कृपया सपोर्ट से संपर्क करें।' },
  'myb_refund_initiated': { en: 'Refund of {{amount}} initiated on {{date}}', hi: '{{amount}} का रिफंड {{date}} को शुरू कर दिया गया है' },
  'myb_refund_processing': { en: 'Refund processing (2–5 business days)', hi: 'रिफंड प्रोसेस हो रहा है (2-5 वर्किंग डेज)' },
  'myb_cancel_booking': { en: 'Cancel Booking', hi: 'बुकिंग रद्द करें' },
  'myb_chat_btn': { en: 'Chat with {{name}}', hi: '{{name}} से चैट करें' },
  'myb_review_btn': { en: 'Leave a Review', hi: 'रिव्यु लिखें' },
  'myb_review_submitted': { en: 'Review submitted successfully', hi: 'रिव्यु सफलतापूर्वक सबमिट हो गया' },
  'myb_cancel_confirm_title': { en: 'Cancel this booking?', hi: 'क्या आप यह बुकिंग रद्द करना चाहते हैं?' },
  'myb_cancel_confirm_desc': { en: 'Your payment will be fully refunded within 2–5 business days. This cannot be undone.', hi: 'आपका पेमेंट 2-5 वर्किंग डेज में पूरा रिफंड हो जाएगा। इसे बदला नहीं जा सकता।' },
  'myb_cancel_keep': { en: 'Keep Booking', hi: 'बुकिंग जारी रखें' },
  'myb_cancel_yes': { en: 'Yes, Cancel', hi: 'हाँ, रद्द करें' },
  'myb_cancelling': { en: 'Cancelling...', hi: 'रद्द किया जा रहा है...' },
  'myb_description': { en: 'Description', hi: 'विवरण' },
  'myb_contractor': { en: 'Contractor', hi: 'कॉन्ट्रैक्टर' },
  'myb_designer': { en: 'Designer', hi: 'डिज़ाइनर' },

  // 7. Designer Bookings (Provider Portal)
  'desb_title': { en: 'Booking Requests', hi: 'बुकिंग अनुरोध' },
  'desb_subtitle': { en: 'Accept or reject customer bookings and manage active consults.', hi: 'कस्टमर की बुकिंग्स को स्वीकार/अस्वीकार करें और एक्टिव बातचीत मैनेज करें।' },
  'desb_accept_btn': { en: 'Accept Booking', hi: 'बुकिंग स्वीकार करें' },
  'desb_reject_btn': { en: 'Reject & Refund', hi: 'अस्वीकार और रिफंड करें' },
  'desb_complete_btn': { en: 'Mark as Complete', hi: 'पूरा घोषित करें' },
  'desb_chat_btn': { en: 'Chat with Customer', hi: 'कस्टमर से चैट करें' },
  'desb_accept_confirm': { en: 'Are you sure you want to accept this booking?', hi: 'क्या आप इस बुकिंग को स्वीकार करना चाहते हैं?' },
  'desb_complete_confirm': { en: 'Are you sure you want to mark this booking as complete? This will allow the customer to leave a review.', hi: 'क्या आप इस बुकिंग को पूरा घोषित करना चाहते हैं? इससे कस्टमर अपना रिव्यु दे सकेंगे।' },
  'desb_reject_title': { en: 'Reject Booking', hi: 'बुकिंग अस्वीकार करें' },
  'desb_reject_desc': { en: 'Please provide a clear reason for the customer. This will trigger a full refund.', hi: 'कृपया कस्टमर के लिए स्पष्ट कारण बताएं। इससे उनका पूरा पेमेंट रिफंड हो जाएगा।' },
  'desb_reject_placeholder': { en: "e.g., I'm fully booked during this period and unable to take on new clients...", hi: 'जैसे: मैं इस दौरान पूरी तरह व्यस्त हूँ और नया काम नहीं ले पाऊँगा...' },
  'desb_char_count': { en: '{{count}}/500 characters (min 5)', hi: '{{count}}/500 अक्षर (कम से कम 5)' },
  'desb_rejecting': { en: 'Rejecting...', hi: 'अस्वीकार किया जा रहा है...' },
  'desb_no_bookings': { en: 'No booking requests', hi: 'कोई बुकिंग अनुरोध नहीं है' },
  'desb_no_bookings_desc': { en: 'When clients book your services, they will appear here.', hi: 'जब क्लाइंट आपकी सर्विस बुक करेंगे, तो वे यहाँ दिखाई देंगे।' },
  'desb_active_queue': { en: 'Active Queue', hi: 'सक्रिय कतार' },
  'desb_action_required': { en: 'Action Required', hi: 'जवाब देना ज़रूरी है' },

  // 8. Reviews & Feedback
  'rev_title': { en: 'Leave a Review', hi: 'रिव्यु लिखें' },
  'rev_desc': { en: 'Share your honest feedback about {{name}} to help other homeowners.', hi: 'दूसरे मकान मालिकों की मदद के लिए {{name}} के बारे में अपना सच्चा फीडबैक दें।' },
  'rev_rating_label': { en: 'How would you rate their service?', hi: 'आप उनकी सर्विस को कैसी रेटिंग देंगे?' },
  'rev_rating_5': { en: 'Excellent', hi: 'बहुत बढ़िया' },
  'rev_rating_4': { en: 'Very Good', hi: 'बहुत अच्छा' },
  'rev_rating_3': { en: 'Good', hi: 'अच्छा' },
  'rev_rating_2': { en: 'Fair', hi: 'ठीक-ठाक' },
  'rev_rating_1': { en: 'Poor', hi: 'खराब' },
  'rev_feedback_label': { en: 'Detailed Review / Feedback', hi: 'विस्तृत रिव्यु / फीडबैक' },
  'rev_feedback_placeholder': { en: 'What went well? Was the communication clear? Were the designs up to your standard?', hi: 'क्या अच्छा रहा? क्या बातचीत आसान थी? क्या डिज़ाइन आपकी पसंद के थे?' },
  'rev_submit_btn': { en: 'Submit Review', hi: 'रिव्यु सबमिट करें' },
  'rev_submitting': { en: 'Submitting...', hi: 'सबमिट हो रहा है...' },

  // 9. Room Changer Tool
  'rc_title': { en: 'AI Room Changer', hi: 'AI रूम चेंजर' },
  'rc_subtitle': { en: 'Transform any room instantly with beautiful themes and styles.', hi: 'खूबसूरत थीम और स्टाइल के साथ किसी भी कमरे को तुरंत नया लुक दें।' },
  'rc_upload_photo': { en: 'Upload Room Photo', hi: 'कमरे की फोटो अपलोड करें' },
  'rc_upload_desc': { en: 'Upload a clear photo of your room (JPEG/PNG, up to 10MB)', hi: 'अपने कमरे की साफ फोटो अपलोड करें (JPEG/PNG, 10MB तक)' },
  'rc_select_options': { en: 'Select Style & Room Type', hi: 'स्टाइल और कमरे का प्रकार चुनें' },
  'rc_room_type': { en: 'Room Type', hi: 'कमरे का प्रकार' },
  'rc_design_style': { en: 'Design Style', hi: 'डिज़ाइन स्टाइल' },
  'rc_vastu_opt': { en: 'Vastu Score Optimization', hi: 'वास्तु स्कोर सुधार' },
  'rc_vastu_desc': { en: 'AI-guided element placement for highest Vastu compliance.', hi: 'सबसे अच्छे वास्तु नियमों के लिए AI-निर्देशित व्यवस्था।' },
  'rc_generate_btn': { en: 'Generate New Look', hi: 'नया लुक जनरेट करें' },
  'rc_generating': { en: 'Generating Look (takes ~15-30s)...', hi: 'नया लुक तैयार हो रहा है (15-30 सेकंड)...' },
  'rc_before_after': { en: 'Before / After Comparison', hi: 'पहले और बाद का अंतर देखें' },
  'rc_download': { en: 'Download Render', hi: 'डिज़ाइन डाउनलोड करें' },
  'rc_save': { en: 'Save to Project', hi: 'प्रोजेक्ट में सेव करें' },
  'rc_err_no_photo': { en: 'Please upload a room photo first.', hi: 'कृपया पहले कमरे की फोटो अपलोड करें।' },
  'rc_err_no_style': { en: 'Please select a design style.', hi: 'कृपया डिज़ाइन स्टाइल चुनें।' },
  'rc_err_no_room': { en: 'Please select a room type.', hi: 'कृपया कमरे का प्रकार चुनें।' },
  'rc_failed': { en: 'Failed to generate room design. Please try again.', hi: 'कमरे का डिज़ाइन जनरेट करने में विफलता। कृपया फिर से कोशिश करें।' },

  // 10. Other AI Tools descriptions
  'ai_tools_title': { en: 'AI Design Tools', hi: 'AI डिज़ाइन टूल्स' },
  'ai_tools_subtitle': { en: 'Instantly design, remodel, and optimize your home layout using AI.', hi: 'AI की मदद से अपने घर के लेआउट को तुरंत डिज़ाइन, रेनोवेट और बेहतर बनाएं।' },
  'ai_tool_room_changer': { en: 'AI Room Changer', hi: 'AI रूम चेंजर' },
  'ai_tool_room_changer_desc': { en: 'Swap styles, furniture, and color themes of any room photo.', hi: 'कमरे की फोटो के स्टाइल, फर्नीचर और रंग को तुरंत बदलें।' },
  'ai_tool_ceiling': { en: 'AI Ceiling Changer', hi: 'AI सीलिंग चेंजर' },
  'ai_tool_ceiling_desc': { en: 'Create elegant false ceiling designs and lighting setups.', hi: 'खूबसूरत फॉल्स सीलिंग डिज़ाइन और लाइटिंग सेटअप बनाएं।' },
  'ai_tool_visualizer': { en: 'AI Color Visualizer', hi: 'AI कलर विज़ुअलाइज़र' },
  'ai_tool_visualizer_desc': { en: 'Experiment with wall colors and textures instantly.', hi: 'दीवारों के रंग और टेक्सचर का तुरंत अनुभव करें।' },
  'ai_tool_furniture': { en: 'AI Furniture Placement', hi: 'AI फर्नीचर प्लेसमेंट' },
  'ai_tool_furniture_desc': { en: 'Virtually arrange furniture logically with Vastu rules.', hi: 'वास्तु नियमों के साथ घर में फर्नीचर की सही व्यवस्था करें।' },
  'ai_tool_remover': { en: 'AI Furniture Remover', hi: 'AI फर्नीचर रिमूवर' },
  'ai_tool_remover_desc': { en: 'Remove unwanted furniture or objects from any room photo.', hi: 'कमरे की फोटो से पुराना फर्नीचर या गैर-ज़रूरी चीज़ें हटाएं।' },
  'ai_tool_vastu': { en: 'Vastu Floor Plan Scan', hi: 'वास्तु फ्लोर प्लान स्कैन' },
  'ai_tool_vastu_desc': { en: 'Analyze floor plan images for Vastu scores and suggestions.', hi: 'नक्शे का विश्लेषण कर वास्तु स्कोर और सुधार के तरीके जानें।' },
  'ai_tool_dream': { en: 'Dream Room Planner', hi: 'ड्रीम रूम पाना' },
  'ai_tool_dream_desc': { en: 'Generate fully customized rooms from detailed text prompts.', hi: 'अपनी पसंद के हिसाब से कमरे का पूरा डिज़ाइन तैयार करें।' },
  'ai_tool_staging': { en: 'Virtual Staging', hi: 'वर्चुअल स्टेजिंग' },
  'ai_tool_staging_desc': { en: 'Add virtual furniture to empty room photos styled beautifully.', hi: 'खाली कमरे में सुंदर स्टाइल का वर्चुअल फर्नीचर लगाएं।' },
  'ai_tool_lighting': { en: 'AI Lighting Changer', hi: 'AI लाइटिंग चेंजर' },
  'ai_tool_lighting_desc': { en: 'Add cozy lamps, accent lighting, or natural daylight.', hi: 'कोजी लैम्प्स, एक्सेंट लाइटिंग या प्राकृतिक रोशनी जोड़ें।' },

  // 11. Vastu Advisor Page
  'vastu_title': { en: 'Vastu Floor Plan Scan', hi: 'वास्तु फ्लोर प्लान स्कैन' },
  'vastu_subtitle': { en: 'Upload your home map and get instant Vastu scores and corrections.', hi: 'अपने घर का नक्शा अपलोड करें और तुरंत वास्तु स्कोर व सुधार के तरीके पाएं।' },
  'vastu_upload_plan': { en: 'Upload Floor Plan', hi: 'नक्शा (फ्लोर प्लान) अपलोड करें' },
  'vastu_score_label': { en: 'Vastu Score', hi: 'वास्तु स्कोर' },
  'vastu_report_title': { en: 'Vastu Direction Report', hi: 'वास्तु दिशा रिपोर्ट' },
  'vastu_suggestions_label': { en: 'Remedies & Suggestions', hi: 'उपाय और सुझाव' },
  'vastu_north': { en: 'North (Kuber)', hi: 'उत्तर (कुबेर दिशा)' },
  'vastu_south': { en: 'South (Yama)', hi: 'दक्षिण (यम दिशा)' },
  'vastu_east': { en: 'East (Indra/Sun)', hi: 'पूर्व (इंद्र/सूर्य दिशा)' },
  'vastu_west': { en: 'West (Varuna)', hi: 'पश्चिम (वरुण दिशा)' },
  'vastu_northeast': { en: 'North-East (Ishanya)', hi: 'उत्तर-पूर्व (ईशान कोण)' },
  'vastu_northwest': { en: 'North-West (Vayu)', hi: 'उत्तर-पश्चिम (वायव्य कोण)' },
  'vastu_southeast': { en: 'South-East (Agneya)', hi: 'दक्षिण-पूर्व (आग्नेय कोण)' },
  'vastu_southwest': { en: 'South-West (Nairutya)', hi: 'दक्षिण-पश्चिम (नैऋत्य कोण)' },

  // 12. Renovation Cost Estimator
  'cost_title': { en: 'Renovation Cost Estimator', hi: 'रेनोवेशन कॉस्ट एस्टिमेटर' },
  'cost_subtitle': { en: 'Estimate local material and labor costs for your city.', hi: 'अपने शहर के हिसाब से सामग्री और लेबर की लागत का अनुमान लगाएं।' },
  'cost_city_select': { en: 'Select your city', hi: 'अपना शहर चुनें' },
  'cost_room_size': { en: 'Room Size (sq ft)', hi: 'कमरे का आकार (वर्ग फुट)' },
  'cost_quality_level': { en: 'Material Quality', hi: 'सामग्री की क्वालिटी' },
  'cost_quality_standard': { en: 'Standard', hi: 'स्टैंडर्ड' },
  'cost_quality_premium': { en: 'Premium', hi: 'प्रीमियम' },
  'cost_quality_luxury': { en: 'Luxury', hi: 'लक्ज़री' },
  'cost_calculate_btn': { en: 'Estimate Total Cost', hi: 'कुल लागत का अनुमान लगाएं' },
  'cost_est_total': { en: 'Estimated Total Cost', hi: 'अनुमानित कुल लागत' },
  'cost_est_breakdown': { en: 'Cost Breakdown', hi: 'लागत का विवरण' },
  'cost_est_materials': { en: 'Materials & Finishes', hi: 'सामग्री और फिनिशिंग' },
  'cost_est_labor': { en: 'Labor & Installation', hi: 'लेबर और फिटिंग' },
  'cost_est_designer': { en: 'Professional Fee', hi: 'प्रोफेशनल फीस' },

  // 13. Chat Widget
  'chat_title': { en: 'Chat with {{name}}', hi: '{{name}} से चैट करें' },
  'chat_placeholder': { en: 'Type a message here...', hi: 'यहाँ अपना संदेश लिखें...' },
  'chat_send_btn': { en: 'Send', hi: 'भेजें' },
  'chat_no_messages': { en: 'No messages yet. Say hello!', hi: 'अभी कोई बातचीत नहीं हुई है। नमस्ते कहें!' },
  'chat_unread_badge': { en: '{{count}} new', hi: '{{count}} नए' },

  // 14. Alerts & Action States
  'alert_loading': { en: 'Please wait...', hi: 'कृपया प्रतीक्षा करें...' },
  'alert_saving': { en: 'Saving changes...', hi: 'बदलाव सेव हो रहे हैं...' },
  'alert_saved': { en: 'Saved successfully!', hi: 'सफलतापूर्वक सेव हो गया!' },
  'alert_error': { en: 'Something went wrong. Please try again.', hi: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।' },
  'alert_success': { en: 'Action completed successfully!', hi: 'काम सफलतापूर्वक पूरा हुआ!' },

  // 15. More Room Styles (to reach 300+ total keys)
  'style_modern': { en: 'Modern', hi: 'मॉडर्न' },
  'style_modern_minimalist': { en: 'Modern Minimalist', hi: 'मॉडर्न मिनिमलिस्ट' },
  'style_traditional': { en: 'Traditional', hi: 'पारंपरिक' },
  'style_traditional_indian': { en: 'Traditional Indian', hi: 'पारंपरिक भारतीय' },
  'style_scandinavian': { en: 'Scandinavian', hi: 'स्कैंडिनेवियन' },
  'style_industrial': { en: 'Industrial', hi: 'इंडस्ट्रियल' },
  'style_bohemian': { en: 'Bohemian', hi: 'बोहेमियन' },
  'style_minimalist': { en: 'Minimalist', hi: 'मिनिमलिस्ट' },
  'style_rustic': { en: 'Rustic', hi: 'रस्टिक' },
  'style_midcentury': { en: 'Mid-Century', hi: 'मिड-सेंचुरी' },
  'style_artdeco': { en: 'Art Deco', hi: 'आर्ट डेको' },
  'style_coastal': { en: 'Coastal', hi: 'कोस्टल' },
  'style_contemporary': { en: 'Contemporary', hi: 'समकालीन (कंटेम्परेरी)' },

  // 16. More Room Types (to reach 300+ total keys)
  'room_living_room': { en: 'Living Room', hi: 'लिविंग रूम' },
  'room_bedroom': { en: 'Bedroom', hi: 'बेडरूम' },
  'room_kitchen': { en: 'Kitchen', hi: 'किचन' },
  'room_bathroom': { en: 'Bathroom', hi: 'बाथरूम' },
  'room_dining_room': { en: 'Dining Room', hi: 'डाइनिंग रूम' },
  'room_study_room': { en: 'Study Room', hi: 'स्टडी रूम' },
  'room_pooja_room': { en: 'Pooja Room', hi: 'पूजा रूम' },
  'room_balcony': { en: 'Balcony', hi: 'बालकनी' },
  'room_kids_room': { en: 'Kids Room', hi: 'बच्चों का कमरा' },
  'room_guest_room': { en: 'Guest Room', hi: 'गेस्ट रूम' },
  'room_home_office': { en: 'Home Office', hi: 'होम ऑफिस' },
  'room_garage': { en: 'Garage', hi: 'गैरेज' },
  'room_terrace': { en: 'Terrace', hi: 'छत (टेरेस)' },
  'room_outdoor': { en: 'Outdoor', hi: 'बाहरी' },

  // 17. Form Validation Errors (to reach 300+ total keys)
  'val_required': { en: 'This field is required', hi: 'यह फ़ील्ड भरना आवश्यक है' },
  'val_email': { en: 'Please enter a valid email address', hi: 'कृपया एक सही ईमेल पता दर्ज करें' },
  'val_phone': { en: 'Please enter a valid 10-digit phone number', hi: 'कृपया 10 अंकों का सही फ़ोन नंबर दर्ज करें' },
  'val_password_len': { en: 'Password must be at least 6 characters long', hi: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' },
  'val_confirm_password': { en: 'Passwords do not match', hi: 'पासवर्ड मेल नहीं खा रहे हैं' },

  // 18. Pricing Plans (to reach 300+ total keys)
  'price_free_plan': { en: 'Free Plan', hi: 'फ्री प्लान' },
  'price_pro_plan': { en: 'Pro Plan', hi: 'प्रो प्लान' },
  'price_unlimited_plan': { en: 'Unlimited Plan', hi: 'अनलिमिटेड प्लान' },
  'price_monthly': { en: 'Monthly', hi: 'मासिक' },
  'price_yearly': { en: 'Yearly', hi: 'वार्षिक' },
  'price_save_percent': { en: 'Save {{percent}}', hi: '{{percent}} बचाएं' },
  'price_get_started': { en: 'Get Started', hi: 'शुरू करें' },
  'price_current_plan': { en: 'Current Plan', hi: 'आपका वर्तमान प्लान' },
  'price_upgrade_btn': { en: 'Upgrade Now', hi: 'अभी अपग्रेड करें' },
  'price_billing_history': { en: 'Billing History', hi: 'बिलिंग हिस्ट्री' },
  'price_payment_methods': { en: 'Payment Methods', hi: 'पेमेंट के तरीके' },
  'price_transaction_id': { en: 'Transaction ID', hi: 'ट्रांजैक्शन ID' },
  'price_invoice': { en: 'Invoice', hi: 'इनवॉइस' },
  'price_date': { en: 'Date', hi: 'तारीख' },
  'price_amount': { en: 'Amount', hi: 'रकम' },
  'price_status': { en: 'Status', hi: 'स्टेटस' },
  'price_payment_secure': { en: 'All transactions are secure and encrypted.', hi: 'सभी लेनदेन पूरी तरह सुरक्षित और एन्क्रिप्टेड हैं।' },
  'price_active': { en: 'Active', hi: 'एक्टिव' },
  'price_expired': { en: 'Expired', hi: 'समाप्त' },
  'price_pending': { en: 'Pending', hi: 'लंबित' },
  'price_failed': { en: 'Failed', hi: 'विफल' },

  // 19. Miscellaneous UI Terms (to reach 300+ total keys)
  'misc_welcome': { en: 'Welcome', hi: 'स्वागत है' },
  'misc_help': { en: 'Help', hi: 'मदद' },
  'misc_support': { en: 'Support', hi: 'सपोर्ट' },
  'misc_faq': { en: 'FAQ', hi: 'FAQ' },
  'misc_terms': { en: 'Terms of Service', hi: 'सेवा की शर्तें' },
  'misc_privacy': { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  'misc_contact_us': { en: 'Contact Us', hi: 'हमसे संपर्क करें' },
  'misc_follow_us': { en: 'Follow Us', hi: 'हमें फॉलो करें' },
  'misc_made_in_india': { en: 'Made with ❤️ in India', hi: 'भारत में ❤️ के साथ निर्मित' },
  'misc_version': { en: 'Version', hi: 'वर्शन' },
  'misc_copied': { en: 'Copied to clipboard!', hi: 'क्लिपबोर्ड पर कॉपी हो गया!' },
  'misc_share_design': { en: 'Share Design', hi: 'डिज़ाइन साझा करें' },
  'misc_view_more': { en: 'View More', hi: 'और देखें' },
  'misc_show_less': { en: 'Show Less', hi: 'कम दिखाएं' },
  'misc_learn_more': { en: 'Learn More', hi: 'अधिक जानें' },
  'misc_get_in_touch': { en: 'Get in Touch', hi: 'संपर्क में रहें' },
  'misc_hours': { en: 'Hours', hi: 'घंटे' },
  'misc_days': { en: 'Days', hi: 'दिन' },
  'misc_minutes': { en: 'Minutes', hi: 'मिनट' },
  'misc_seconds': { en: 'Seconds', hi: 'सेकंड' },
  'misc_now': { en: 'Now', hi: 'अभी' },
  'misc_today': { en: 'Today', hi: 'आज' },
  'misc_yesterday': { en: 'Yesterday', hi: 'कल' },
  'misc_days_ago': { en: '{{count}} days ago', hi: '{{count}} दिन पहले' },
  'misc_just_now': { en: 'Just now', hi: 'अभी-अभी' },
  'misc_online': { en: 'Online', hi: 'ऑनलाइन' },
  'misc_offline': { en: 'Offline', hi: 'ऑफलाइन' },
  'misc_typing': { en: 'Typing...', hi: 'टाइप कर रहे हैं...' },
  'misc_no_internet': { en: 'No internet connection', hi: 'इंटरनेट कनेक्शन नहीं है' },
  'misc_retry': { en: 'Retry', hi: 'फिर कोशिश करें' },
  'misc_go_back': { en: 'Go Back', hi: 'वापस जाएं' },
  'misc_go_home': { en: 'Go Home', hi: 'होम पर जाएं' },
  'misc_page_not_found': { en: 'Page Not Found', hi: 'पेज नहीं मिला' },
  'misc_server_error': { en: 'Internal Server Error', hi: 'सर्वर एरर' },
  'misc_access_denied': { en: 'Access Denied', hi: 'पहुंच वर्जित है' },
  'misc_loading_text': { en: 'Please wait, loading data...', hi: 'कृपया प्रतीक्षा करें, डेटा लोड हो रहा है...' },
  'misc_all_rights_reserved': { en: 'All rights reserved.', hi: 'सर्वाधिकार सुरक्षित।' },
  
  // Custom new translation keys (Phase 1 dictionary expansion)
  'start_free': { en: 'Get started for free', hi: 'फ्री में शुरुआत करें' },
  'modern_ai_help': { en: 'With the help of modern AI...', hi: 'आधुनिक AI की मदद से...' },
  'booking_time_format': { en: 'on {{date}} at {{time}}', hi: '{{date}} को {{time}} बजे' },
  'size': { en: 'Size', hi: 'साइज़' },
  'secure_payment_amount': { en: '₹{{amount}} secure payment', hi: '₹{{amount}} का सुरक्षित भुगतान' },
  'before_after_diff': { en: 'See the before and after difference', hi: 'पहले और बाद का अंतर देखें' },
  'get_vastu_score': { en: 'Get Vastu Score', hi: 'वास्तु स्कोर पाएं' },
  'page_x_of_y': { en: 'Page {{current}} of {{total}}', hi: 'पेज {{current}} / {{total}}' },
  'myb_total_count': { en: '{{count}} bookings', hi: '{{count}} बुकिंग्स' },
  'unknown_provider': { en: 'Unknown {{role}}', hi: 'अज्ञात {{role}}' },
  'accept': { en: 'Accept', hi: 'स्वीकार करें' },
  'reject': { en: 'Reject', hi: 'अस्वीकार करें' },
  'desb_mark_complete': { en: 'Mark as Complete', hi: 'पूरा घोषित करें' },
  'desb_chat_with_customer': { en: 'Chat with Customer', hi: 'कस्टमर से चैट करें' },
  'desb_time_left': { en: '{{hours}}h {{minutes}}m left to respond', hi: 'जवाब देने के लिए {{hours}} घंटे {{minutes}} मिनट बचे हैं' },
  'desb_window_expired': { en: 'Response window expired', hi: 'जवाब देने की समय सीमा समाप्त' },
  'desb_requested_slot': { en: 'Requested Slot', hi: 'अनुरोधित समय' },
  'desb_project_brief': { en: 'Project Brief', hi: 'प्रोजेक्ट ब्रीफ' },
  'desb_need_action': { en: '· 1 needs action', hi: '· 1 पर जवाब देना ज़रूरी है' },
  'desb_needs_action': { en: '· {{count}} need action', hi: '· {{count}} पर जवाब देना ज़रूरी है' },
  'desb_confirm_complete': { en: 'Are you sure you want to mark this booking as complete? This will allow the customer to leave a review.', hi: 'क्या आप इस बुकिंग को पूरा घोषित करना चाहते हैं? इससे कस्टमर अपना रिव्यु दे सकेंगे।' },
  'desb_booking_requests': { en: 'Booking Requests', hi: 'बुकिंग अनुरोध' },
  'dir_find_pros': { en: 'Find professionals & materials', hi: 'प्रोफेशनल्स और मटीरियल खोजें' },
  'dir_find_pros_desc': { en: 'Connect with verified interior designers, skilled service contractors, and premium material stores.', hi: 'वेरिफाइड इंटीरियर डिज़ाइनर, कुशल सर्विस कॉन्ट्रैक्टर और प्रीमियम मटीरियल स्टोर से जुड़ें।' },
  'dir_verified_count': { en: '{{count}} Verified {{role}}s', hi: '{{count}} वेरिफाइड {{role}}' },
  'dir_verified_count_single': { en: '{{count}} Verified {{role}}', hi: '{{count}} वेरिफाइड {{role}}' },
  'dir_tab_designers': { en: 'Interior Designers', hi: 'इंटीरियर डिज़ाइनर' },
  'dir_tab_contractors': { en: 'Service Contractors', hi: 'सर्विस कॉन्ट्रैक्टर' },
  'dir_tab_vendors': { en: 'Material Vendors', hi: 'मटीरियल वेंडर' },
  'dir_search_name': { en: 'Search by name...', hi: 'नाम से खोजें...' },
  'dir_filter_city': { en: 'Filter by city (e.g. Bangalore)...', hi: 'शहर से फ़िल्टर करें (जैसे: बैंगलोर)...' },
  'dir_all_specialties': { en: 'All Specialties', hi: 'सभी विशेषताएं' },
  'dir_clear_all_filters': { en: 'Clear All Filters', hi: 'सभी फ़िल्टर हटाएं' },
  'dir_no_pros_found': { en: 'No {{role}} found', hi: 'कोई {{role}} नहीं मिला' },
  'dir_no_pros_found_desc': { en: 'Try refining your search terms, removing city filters, or picking a different specialty.', hi: 'अपने सर्च शब्दों को बदलें, शहर का फ़िल्टर हटाएं, या कोई अन्य विशेषता चुनें।' },
  'dir_reset_filters': { en: 'Reset Filters', hi: 'फ़िल्टर रीसेट करें' },
  'dir_years_exp_short': { en: '{{years}} yrs exp', hi: '{{years}} साल का अनुभव' },
  'dir_years_biz_short': { en: '{{years}} yrs in biz', hi: '{{years}} साल से बिज़नेस में' },
  'dir_store_address': { en: 'Store Address', hi: 'स्टोर का पता' },
  'dir_address_on_file': { en: 'Address on file', hi: 'रिकॉर्ड में उपलब्ध पता' },
  'dir_consultation': { en: 'Consultation', hi: 'कंसल्टेशन' },
  'dir_not_available': { en: 'Not available', hi: 'उपलब्ध नहीं है' },
  'dir_view_profile': { en: 'View Profile', hi: 'प्रोफ़ाइल देखें' },
  'dir_view_store': { en: 'View Store', hi: 'स्टोर देखें' },
  'dir_review_count': { en: '{{count}} reviews', hi: '{{count}} रिव्यु' },
  'dir_review_count_single': { en: '{{count}} review', hi: '{{count}} रिव्यु' },
  'dir_more_specialties': { en: '+{{count}} more', hi: '+{{count}} और' },
  'dir_vendor': { en: 'Vendor', hi: 'वेंडर' },
  'myb_vendor': { en: 'Vendor', hi: 'वेंडर' },

  // Specialty translation labels
  'specialty_modular_kitchen': { en: 'Modular Kitchen', hi: 'मॉड्यूलर किचन' },
  'specialty_bedroom': { en: 'Bedroom', hi: 'बेडरूम' },
  'specialty_living_room': { en: 'Living Room', hi: 'लिविंग रूम' },
  'specialty_bathroom': { en: 'Bathroom', hi: 'बाथरूम' },
  'specialty_office': { en: 'Office', hi: 'होम/कमर्शियल ऑफिस' },
  'specialty_vastu': { en: 'Vastu', hi: 'वास्तु' },
  'specialty_luxury': { en: 'Luxury', hi: 'लक्ज़री' },
  'specialty_budget': { en: 'Budget', hi: 'बजट-फ्रेंडली' },
  'specialty_minimalist': { en: 'Minimalist', hi: 'मिनिमलिस्ट' },
  'specialty_traditional': { en: 'Traditional', hi: 'पारंपरिक' },
  'specialty_contemporary': { en: 'Contemporary', hi: 'मॉडर्न / कंटेंपरेरी' },
  'specialty_kids_room': { en: "Kids' Room", hi: 'बच्चों का कमरा' },
  'specialty_renovation': { en: 'Renovation', hi: 'रेनोवेशन' },
  'specialty_lighting_design': { en: 'Lighting Design', hi: 'लाइटिंग डिज़ाइन' },
  'specialty_3d_visualization': { en: '3D Visualization', hi: '3D विज़ुअलाइज़ेशन' },

  // Contractor Specialties
  'specialty_painter': { en: 'Painting Services', hi: 'पेंटिंग सर्विस' },
  'specialty_carpenter': { en: 'Carpentry & Woodwork', hi: 'कारपेंट्री और वुडवर्क' },
  'specialty_electrician': { en: 'Electrical Work', hi: 'इलेक्ट्रिकल काम' },
  'specialty_plumber': { en: 'Plumbing Services', hi: 'प्लंबिंग सर्विस' },
  'specialty_modular_kitchen_installer': { en: 'Modular Kitchen Installation', hi: 'मॉड्यूलर किचन इंस्टॉलेशन' },

  // Vendor Specialties
  'specialty_tile_shop': { en: 'Tiles & Sanitaryware', hi: 'टाइल्स और सैनिटरीवेयर' },
  'specialty_paint_store': { en: 'Paints & Wall Finishes', hi: 'पेंट्स और वॉल फिनिश' },
  'specialty_furniture_seller': { en: 'Furniture & Decor Store', hi: 'फर्नीचर और डेकोर स्टोर' },
  'specialty_hardware_store': { en: 'Hardware & Tools Store', hi: 'हार्डवेयर और टूल्स स्टोर' },

  // Detail Page Translation keys
  'det_designer_not_found': { en: 'Designer not found', hi: 'डिज़ाइनर नहीं मिला' },
  'det_designer_not_found_desc': { en: "This profile may no longer be available or hasn't been verified yet.", hi: 'हो सकता है यह प्रोफाइल अब उपलब्ध न हो या अभी तक वेरिफाई न हुई हो।' },
  'det_browse_designers': { en: 'Browse Designers', hi: 'डिज़ाइनर्स देखें' },

  'det_contractor_not_found': { en: 'Contractor not found', hi: 'कॉन्ट्रैक्टर नहीं मिला' },
  'det_contractor_not_found_desc': { en: "This profile may no longer be available or hasn't been verified yet.", hi: 'हो सकता है यह प्रोफाइल अब उपलब्ध न हो या अभी तक वेरिफाई न हुई हो।' },
  'det_browse_contractors': { en: 'Browse Contractors', hi: 'कॉन्ट्रैक्टर्स देखें' },

  'det_vendor_not_found': { en: 'Vendor storefront not found', hi: 'वेंडर स्टोरफ़्रंट नहीं मिला' },
  'det_vendor_not_found_desc': { en: 'This store may no longer be listed or hasn’t been verified by our admins.', hi: 'हो सकता है यह स्टोर अब लिस्टेड न हो या हमारे एडमिन्स द्वारा वेरिफाई न किया गया हो।' },
  'det_browse_vendors': { en: 'Browse Vendors', hi: 'वेंडर्स देखें' },

  'det_all_designers': { en: 'All Designers', hi: 'सभी डिज़ाइनर्स' },
  'det_all_contractors': { en: 'All Contractors', hi: 'सभी कॉन्ट्रैक्टर्स' },
  'det_all_vendors': { en: 'All Vendors', hi: 'सभी वेंडर्स' },

  'det_sign_in_to_book': { en: 'Sign in to Book', hi: 'बुक करने के लिए साइन इन करें' },
  'det_own_profile': { en: 'This is your profile', hi: 'यह आपकी प्रोफ़ाइल है' },
  'det_own_store': { en: 'This is your own vendor storefront. You cannot send inquiries to yourself.', hi: 'यह आपका अपना वेंडर स्टोरफ्रंट है। आप खुद को इंक्वायरी नहीं भेज सकते।' },
  'det_not_accepting_bookings': { en: 'Not accepting bookings', hi: 'अभी बुकिंग्स स्वीकार नहीं कर रहे' },
  'det_book_designer': { en: 'Book this designer', hi: 'डिज़ाइनर बुक करें' },
  'det_book_contractor': { en: 'Book this contractor', hi: 'कॉन्ट्रैक्टर बुक करें' },

  'det_years_experience': { en: '{{years}} years experience', hi: '{{years}} साल का अनुभव' },
  'det_years_experience_single': { en: '1 year experience', hi: '1 साल का अनुभव' },

  'det_member_since': { en: 'Member since {{date}}', hi: '{{date}} से मेम्बर' },
  'det_listed_since': { en: 'Listed since {{date}}', hi: '{{date}} से लिस्टेड' },
  'det_about': { en: 'About', hi: 'के बारे में' },
  'det_about_store': { en: 'About Store', hi: 'स्टोर के बारे में' },

  'det_pricing': { en: 'Pricing', hi: 'प्राइसिंग और फीस' },
  'det_consultation': { en: 'Consultation', hi: 'कंसल्टेशन' },
  'det_project': { en: 'Project', hi: 'प्रोजेक्ट' },
  'det_unavailable': { en: 'Unavailable', hi: 'उपलब्ध नहीं' },
  'det_minute_session': { en: '{{minutes}} minute session', hi: '{{minutes}} मिनट का सेशन' },
  'det_minimum_fee': { en: 'minimum fee', hi: 'न्यूनतम फीस' },

  'det_portfolio': { en: 'Portfolio', hi: 'पोर्टफोलियो' },
  'det_store_gallery': { en: 'Store Gallery & materials', hi: 'स्टोर गैलरी और मटीरियल्स' },
  'det_images_count': { en: '{{count}} images', hi: '{{count}} तस्वीरें' },
  'det_images_count_single': { en: '1 image', hi: '1 तस्वीर' },
  'det_no_images': { en: 'No portfolio images uploaded yet.', hi: 'अभी तक कोई पोर्टफोलियो तस्वीर अपलोड नहीं की गई है।' },
  'det_no_vendor_images': { en: 'No store/materials showcase photos uploaded yet.', hi: 'अभी तक स्टोर/मटीरियल्स प्रदर्शन की कोई तस्वीर अपलोड नहीं की गई है।' },

  'det_client_reviews': { en: 'Client Reviews ({{count}})', hi: 'क्लाइंट रिव्यु ({{count}})' },
  'det_no_reviews_yet_designer': { en: 'No reviews yet for this designer.', hi: 'इस डिज़ाइनर के लिए अभी तक कोई रिव्यु नहीं है।' },
  'det_no_reviews_yet_contractor': { en: 'No reviews yet for this contractor.', hi: 'इस कॉन्ट्रैक्टर के लिए अभी तक कोई रिव्यु नहीं है।' },
  'det_reply_from': { en: 'Reply from {{name}}', hi: '{{name}} का जवाब' },
  'det_on_date': { en: 'on {{date}}', hi: '{{date}} को' },
  'det_load_more_reviews': { en: 'Load More Reviews', hi: 'और रिव्यु देखें' },

  'det_request_quote': { en: 'Request a Quote / Inquiry', hi: 'कोटेशन / इंक्वायरी का अनुरोध करें' },
  'det_inquiry_desc': { en: 'Need tiles, paints, modular fixtures, or custom hardware pricing? Describe what you need and request a catalog.', hi: 'टाइल्स, पेंट, मॉड्यूलर फिटिंग्स, या कस्टम हार्डवेयर की कीमत चाहिए? अपनी ज़रूरत बताएं और कैटलॉग मांगें।' },
  'det_inquiry_submitted': { en: 'Inquiry Submitted!', hi: 'इंक्वायरी सबमिट हो गई!' },
  'det_inquiry_success_desc': { en: 'Your request has been sent to {{name}}. They will contact you shortly using your preferred details.', hi: 'आपका अनुरोध {{name}} को भेज दिया गया है। वे जल्द ही आपसे संपर्क करेंगे।' },
  'det_send_another_inquiry': { en: 'Send another inquiry', hi: 'एक और इंक्वायरी भेजें' },
  'det_signin_inquire_desc': { en: 'You need to be logged in to request quotes or send direct inquiries to listed stores.', hi: 'स्टोर्स से कोटेशन मांगने या डायरेक्ट इंक्वायरी भेजने के लिए आपको लॉग इन करना होगा।' },
  'det_signin_to_inquire': { en: 'Sign in to Inquire', hi: 'इंक्वायरी के लिए साइन इन करें' },
  'det_req_msg_label': { en: 'Requirements / Materials List', hi: 'आपकी ज़रूरतें / मटीरियल्स की लिस्ट' },
  'det_req_msg_placeholder': { en: 'Hello, I would like to get a catalog/pricing for ceramic tiles. I require around 800 sq ft for a bedroom remodeling...', hi: 'नमस्ते, मुझे सेरेमिक टाइल्स का कैटलॉग और प्राइसिंग चाहिए। बेडरूम रेनोवेशन के लिए लगभग 800 स्क्वायर फीट की ज़रूरत है...' },
  'det_min_char': { en: 'Minimum 10 characters', hi: 'कम से कम 10 अक्षर' },
  'det_contact_phone': { en: 'Contact Phone (Optional)', hi: 'संपर्क फ़ोन (ऑप्शनल)' },
  'det_contact_email': { en: 'Contact Email (Optional)', hi: 'संपर्क ईमेल (ऑप्शनल)' },
  'det_sending': { en: 'Sending...', hi: 'भेजा जा रहा है...' },
  'det_send_inquiry': { en: 'Send Inquiry', hi: 'इंक्वायरी भेजें' },
  'det_inquiry_msg_len_err': { en: 'Message must be at least 10 characters long.', hi: 'मैसेज कम से कम 10 अक्षर लंबा होना चाहिए।' },
  // ── Booking Modal Translation keys ──────────────────────────────────────────
  'bk_choose_work_style': {
    en: "Choose how you'd like to work with {{name}}",
    hi: 'चुनें कि आप {{name}} के साथ कैसे काम करना चाहेंगे'
  },
  'bk_consultation_desc': {
    en: '{{minutes}}-minute 1:1 session · Book a specific time slot',
    hi: '{{minutes}} मिनट का 1:1 सेशन · एक निश्चित समय का स्लॉट चुनें'
  },
  'bk_project_from_amount': {
    en: 'From {{amount}}',
    hi: '{{amount}} से शुरू'
  },
  'bk_project_desc': {
    en: 'Full interior design engagement · Designer will review and confirm',
    hi: 'पूरे इंटीरियर डिज़ाइन का काम · डिज़ाइनर देखकर कन्फर्म करेंगे'
  },
  'bk_back': {
    en: 'Back',
    hi: 'पीछे'
  },
  'bk_select_slot': {
    en: 'Select a time slot (IST)',
    hi: 'समय का स्लॉट चुनें (IST)'
  },
  'bk_describe_project': {
    en: 'Describe your project *',
    hi: 'अपने प्रोजेक्ट के बारे में बताएं *'
  },
  'bk_describe_project_placeholder': {
    en: "Tell the designer about your space, style preferences, budget range, and what you'd like to achieve. Include room type, approximate area, and any specific requirements...",
    hi: 'डिज़ाइनर को अपनी जगह, पसंद की स्टाइल, बजट और ज़रूरतों के बारे में बताएं। कमरे का प्रकार, अनुमानित एरिया और अन्य खास नियम भी शामिल करें...'
  },
  'bk_character_count': {
    en: '{{count}}/2000 characters (min 20)',
    hi: '{{count}}/2000 अक्षर (कम से कम 20)'
  },
  'bk_preferred_start_date': {
    en: 'Preferred start date (optional)',
    hi: 'प्रोजेक्ट शुरू करने की पसंदीदा तारीख (ऑप्शनल)'
  },
  'bk_payment_upfront': {
    en: 'Payment required upfront',
    hi: 'भुगतान पहले करना होगा'
  },
  'bk_pay_and_book': {
    en: 'Pay {{fee}} & Book',
    hi: '{{fee}} भुगतान करें और बुक करें'
  },
  'bk_decline_refund_notice': {
    en: "The designer has 48 hours to accept. You'll get a full refund if they decline.",
    hi: 'डिज़ाइनर के पास स्वीकार करने के लिए 48 घंटे हैं। अस्वीकार होने पर आपको पूरा रिफंड मिलेगा।'
  },
  'bk_creating_booking': {
    en: 'Creating your booking…',
    hi: 'आपकी बुकिंग बनाई जा रही है…'
  },
  'bk_opening_payment_notice': {
    en: "Opening payment. Please don't close this window.",
    hi: 'भुगतान का पेज खुल रहा है। कृपया इस विंडो को बंद न करें।'
  },
  'bk_confirmed': {
    en: 'Booking Confirmed!',
    hi: 'बुकिंग कन्फर्म हो गई!'
  },
  'bk_confirmed_desc': {
    en: "Payment received. {{name}} has 48 hours to accept your booking. We'll notify you by email.",
    hi: 'पेमेंट मिल गया है। {{name}} के पास आपकी बुकिंग स्वीकार करने के लिए 48 घंटे हैं। हम आपको ईमेल से सूचित करेंगे।'
  },
  'bk_view_bookings': {
    en: 'View My Bookings',
    hi: 'मेरी बुकिंग्स देखें'
  },
  'bk_something_went_wrong': {
    en: 'Something went wrong',
    hi: 'कुछ गड़बड़ हो गई'
  },
  'bk_try_again': {
    en: 'Try Again',
    hi: 'फिर से कोशिश करें'
  },
  'bk_book_designer': {
    en: 'Book {{name}}',
    hi: '{{name}} को बुक करें'
  },
  'bk_book_desc': {
    en: 'Book a designer consultation or project',
    hi: 'डिज़ाइनर कंसल्टेशन या प्रोजेक्ट बुक करें'
  },
  'bk_err_select_slot': {
    en: 'Please select a time slot',
    hi: 'कृपया समय का स्लॉट चुनें'
  },
  'bk_err_desc_min': {
    en: 'Project description must be at least 20 characters',
    hi: 'प्रोजेक्ट का विवरण कम से कम 20 अक्षर का होना चाहिए'
  },
  'bk_err_desc_max': {
    en: 'Project description cannot exceed 2000 characters',
    hi: 'प्रोजेक्ट का विवरण 2000 अक्षर से अधिक नहीं हो सकता'
  },
  'bk_not_accepting_bookings': {
    en: 'This designer is not currently accepting bookings.',
    hi: 'यह डिज़ाइनर अभी बुकिंग स्वीकार नहीं कर रहे हैं।'
  },
  'bk_err_payment_failed': {
    en: 'Payment could not be processed.',
    hi: 'पेमेंट प्रोसेस नहीं किया जा सका।'
  },
  // Make It Real
  'mir_title': {
    en: 'Make It Real',
    hi: 'इसे सच बनाएं'
  },
  'mir_subtitle': {
    en: 'Hire a verified designer to execute this render',
    hi: 'इस रेंडर को हकीकत में बदलने के लिए एक वेरिफाइड डिज़ाइनर हायर करें'
  },
  'mir_placeholder': {
    en: 'Your city (e.g. Bangalore)',
    hi: 'आपका शहर (जैसे: बेंगलुरु)'
  },
  'mir_find_designers': {
    en: 'Find Designers',
    hi: 'डिज़ाइनर ढूंढें'
  },
  'mir_designers_near': {
    en: 'Designers near {{city}}',
    hi: '{{city}} के पास डिज़ाइनर'
  },
  'mir_change_city': {
    en: 'Change city',
    hi: 'शहर बदलें'
  },
  'mir_finding_in': {
    en: 'Finding designers in {{city}}…',
    hi: '{{city}} में डिज़ाइनर ढूंढ रहे हैं…'
  },
  'mir_matched_on_specialty': {
    en: 'matched on {{count}} specialty',
    hi: '{{count}} विशेषता से मैच हुआ'
  },
  'mir_matched_on_specialties': {
    en: 'matched on {{count}} specialties',
    hi: '{{count}} विशेषताओं से मैच हुआ'
  },
  'mir_no_verified': {
    en: 'No verified designers found in {{city}} yet.',
    hi: '{{city}} में अभी तक कोई वेरिफाइड डिज़ाइनर नहीं मिला।'
  },
  'mir_browse_all': {
    en: 'Browse all designers →',
    hi: 'सभी डिज़ाइनर देखें →'
  },
  'mir_render_ref': {
    en: 'Render reference: {{url}}',
    hi: 'रेंडर का संदर्भ: {{url}}'
  },
  'mir_project_desc_template': {
    en: 'I used Removation AI to generate a {{styleLabel}}{{roomLabel}} design and would like a designer to help make it a reality. Please review my render and provide a quote for the full project.',
    hi: 'मैंने Removation AI का उपयोग करके एक {{styleLabel}}{{roomLabel}} डिज़ाइन तैयार किया है और इसे हकीकत में बदलने के लिए एक डिज़ाइनर की मदद चाहता हूँ। कृपया मेरे रेंडर को देखें और पूरे प्रोजेक्ट के लिए कोटेशन प्रदान करें।'
  },
  // Designer Match Card
  'dmc_y_exp': {
    en: '{{years}}y exp',
    hi: '{{years}} साल का अनुभव'
  },
  'dmc_from': {
    en: 'From {{amount}}',
    hi: '{{amount}} से'
  },
  'dmc_quote_on_request': {
    en: 'Quote on request',
    hi: 'पूछने पर कोटेशन'
  },
  'dmc_book_project': {
    en: 'Book Project',
    hi: 'प्रोजेक्ट बुक करें'
  },
  // Booking Chat
  'chat_with': {
    en: 'Chat with {{name}}',
    hi: '{{name}} के साथ चैट'
  },
  'chat_booking': {
    en: 'Booking Chat',
    hi: 'बुकिंग चैट'
  },
  'chat_realtime': {
    en: 'Real-time collaboration',
    hi: 'रीयल-टाइम बातचीत'
  },
  'chat_loading': {
    en: 'Loading chat thread...',
    hi: 'चैट लोड हो रही है...'
  },
  'chat_err_verify': {
    en: 'Chat becomes active once the booking is verified.',
    hi: 'बुकिंग वेरिफाइड होने के बाद चैट चालू हो जाएगी।'
  },
  'chat_booking_no_messages': {
    en: 'No messages in this booking yet',
    hi: 'इस बुकिंग में अभी कोई मैसेज नहीं है'
  },
  'chat_booking_no_messages_desc': {
    en: 'Send a message to start discussing requirements.',
    hi: 'आवश्यकताओं पर चर्चा शुरू करने के लिए एक मैसेज भेजें।'
  },
  'chat_type_placeholder': {
    en: 'Type a message... (Enter to send)',
    hi: 'मैसेज टाइप करें... (भेजने के लिए Enter दबाएं)'
  },
  'chat_role_customer': {
    en: 'Client',
    hi: 'ग्राहक'
  },
  'chat_role_designer': {
    en: 'Designer',
    hi: 'डिज़ाइनर'
  },
  'chat_role_contractor': {
    en: 'Contractor',
    hi: 'ठेकेदार'
  },
  'chat_role_admin': {
    en: 'System',
    hi: 'सिस्टम'
  },
  // Room Changer
  'rc_title_repaint_': {
    en: 'Room Changer',
    hi: 'रूम चेंजर'
  },
  'rc_desc_repaint_': {
    en: 'Repaint your walls in any color — furniture and floor stay untouched',
    hi: 'अपनी दीवारों को किसी भी रंग में दोबारा पेंट करें — फर्नीचर और फर्श वैसे ही रहेंगे'
  },
  'rc_sam2_repaint_': {
    en: 'SAM2 Wall Detection',
    hi: 'SAM2 वॉल डिटेक्शन'
  },
  'rc_sdxl_repaint_': {
    en: 'SDXL Inpainting',
    hi: 'SDXL इनपेंटिंग'
  },
  'rc_preset_repaint_': {
    en: '12 Preset Colors',
    hi: '12 प्रीसेट रंग'
  },
  'rc_upload_title_repaint_': {
    en: 'Upload Room Photo',
    hi: 'कमरे की फोटो अपलोड करें'
  },
  'rc_drop_photo_repaint_': {
    en: 'Drop photo here or click to browse',
    hi: 'फोटो यहाँ छोड़ें या ब्राउज़ करने के लिए क्लिक करें'
  },
  'rc_max_size_repaint_': {
    en: 'JPG, PNG up to 20MB',
    hi: 'JPG, PNG 20MB तक'
  },
  'rc_change_image_repaint_': {
    en: 'Change image',
    hi: 'इमेज बदलें'
  },
  'rc_choose_color_repaint_': {
    en: 'Choose Wall Color',
    hi: 'दीवार का रंग चुनें'
  },
  'rc_generate_repaint_': {
    en: 'Generate',
    hi: 'तैयार करें'
  },
  'rc_generating_repaint_': {
    en: 'Generating…',
    hi: 'तैयार हो रहा है…'
  },
  'rc_retry_saved_repaint_': {
    en: 'Retry with saved masks',
    hi: 'सुरक्षित मास्क के साथ दोबारा कोशिश करें'
  },
  'rc_result_repaint_': {
    en: 'Result',
    hi: 'परिणाम'
  },
  'rc_will_appear_repaint_': {
    en: 'Your recolored room will appear here',
    hi: 'आपके नए रंग का कमरा यहाँ दिखाई देगा'
  },
  'rc_instructions_repaint_': {
    en: 'Upload a photo and pick a color to get started',
    hi: 'शुरू करने के लिए एक फोटो अपलोड करें और रंग चुनें'
  },
  'rc_original_repaint_': {
    en: 'Original',
    hi: 'असली'
  },
  'rc_recolored_repaint_': {
    en: 'Recolored',
    hi: 'नया रंग'
  },
  'rc_download_repaint_': {
    en: 'Download',
    hi: 'डाउनलोड'
  },
  'rc_save_to_project_repaint_': {
    en: 'Save to Project',
    hi: 'प्रोजेक्ट में सुरक्षित करें'
  },
  'rc_try_another_repaint_': {
    en: 'Try Another Color',
    hi: 'दूसरा रंग आज़माएं'
  },
  'rc_happy_result_repaint_': {
    en: 'Happy with this result?',
    hi: 'क्या आप इस परिणाम से खुश हैं?'
  },
  'rc_thanks_feedback_repaint_': {
    en: 'Thanks for your feedback',
    hi: 'आपके फीडबैक के लिए धन्यवाद'
  },
  'rc_glad_liked_repaint_': {
    en: 'Glad you liked it!',
    hi: 'ख़ुशी है कि आपको पसंद आया!'
  },
  'rc_sorry_improve_repaint_': {
    en: 'Sorry — help us improve',
    hi: 'माफ़ करें — हमें बेहतर बनाने में मदद करें'
  },
  'rc_feedback_worked_repaint_': {
    en: 'Tell us what worked (optional)',
    hi: 'हमें बताएं कि क्या अच्छा लगा (वैकल्पिक)'
  },
  'rc_feedback_wrong_repaint_': {
    en: 'What went wrong? (optional)',
    hi: 'क्या कमी रह गई? (वैकल्पिक)'
  },
  'rc_submit_repaint_': {
    en: 'Submit',
    hi: 'सब्मिट करें'
  },
  'rc_submitting_repaint_': {
    en: 'Submitting…',
    hi: 'सब्मिट हो रहा है…'
  },
  'rc_analyzing_repaint_': {
    en: 'Analyzing room (detecting walls, floor, objects)…',
    hi: 'कमरे का विश्लेषण कर रहे हैं (दीवारें, फर्श, वस्तुएं ढूंढ रहे हैं)…'
  },
  'rc_analyzing_done_repaint_': {
    en: 'Room analyzed',
    hi: 'कमरे का विश्लेषण हो गया'
  },
  'rc_repainting_repaint_': {
    en: 'Repainting walls in {{color}}…',
    hi: 'दीवारों को {{color}} रंग में पेंट कर रहे हैं…'
  },
  'rc_chosen_color_text_repaint_': {
    en: 'chosen color',
    hi: 'चुने गए रंग'
  },
  'rc_repainting_done_repaint_': {
    en: 'Repainting complete',
    hi: 'पेंटिंग पूरी हो गई'
  },
  'rc_starting_repaint_': {
    en: 'Starting…',
    hi: 'शुरू कर रहे हैं…'
  },
  'rc_done_repaint_': {
    en: 'Done!',
    hi: 'हो गया!'
  },
  'rc_saved_title_repaint_': {
    en: 'Saved to project',
    hi: 'प्रोजेक्ट में सेव हो गया'
  },
  'rc_saved_desc_repaint_': {
    en: '{{color}} recolor saved successfully.',
    hi: '{{color}} रीकलर सफलतापूर्वक सेव कर लिया गया है।'
  },

  // Dream Room page
  'dr_title': { en: 'Generate Your Dream Room', hi: 'अपना सपनों का कमरा बनाएं' },
  'dr_subtitle': { en: 'Upload a photo of your current room, select a theme and room type, and let AI remaster it in seconds.', hi: 'अपने कमरे की फोटो अपलोड करें, थीम और कमरे का प्रकार चुनें, और AI को सेकंडों में नया रूप देने दें।' },
  'dr_step1': { en: 'Choose your room theme', hi: 'अपनी कमरे की थीम चुनें' },
  'dr_step2': { en: 'Choose your room type', hi: 'कमरे का प्रकार चुनें' },
  'dr_step3': { en: 'Upload a picture of your room', hi: 'अपने कमरे की तस्वीर अपलोड करें' },
  'dr_theme_placeholder': { en: '--- Select Theme ---', hi: '--- थीम चुनें ---' },
  'dr_room_placeholder': { en: '--- Select Room ---', hi: '--- कमरा चुनें ---' },
  'dr_generating': { en: 'Generating (~20 seconds)...', hi: 'तैयार हो रहा है (~20 सेकंड)...' },
  'dr_generate_btn': { en: 'Generate Dream Room', hi: 'सपनों का कमरा बनाएं' },
  'dr_result_title': { en: 'Your remastered {{room}}', hi: 'आपका नया {{room}}' },
  'dr_theme_label': { en: 'Theme: {{theme}}', hi: 'थीम: {{theme}}' },
  'dr_compare': { en: 'Compare', hi: 'तुलना करें' },
  'dr_download': { en: 'Download', hi: 'डाउनलोड' },
  'dr_success': { en: 'Dream room generated successfully!', hi: 'सपनों का कमरा सफलतापूर्वक तैयार हो गया!' },
  'dr_gen_failed': { en: 'Generation Failed', hi: 'जनरेशन विफल रही' },
  'dr_gen_failed_desc': { en: 'Something went wrong, please try again later.', hi: 'कुछ गड़बड़ हो गई, कृपया बाद में दोबारा कोशिश करें।' },
  'dr_gen_error': { en: 'Failed to connect to the generation service. Check your API key.', hi: 'जनरेशन सेवा से कनेक्ट नहीं हो सका। अपनी API key जांचें।' },

  // Color Visualizer page
  'cv_title': { en: 'Room Color Visualizer', hi: 'रूम कलर विज़ुअलाइज़र' },
  'cv_subtitle': { en: 'Instantly visualize new wall, floor, or ceiling colors in your space using AI.', hi: 'AI की मदद से अपने कमरे में दीवार, फर्श या छत का नया रंग तुरंत देखें।' },
  'cv_step1': { en: 'Upload your room image', hi: 'अपने कमरे की इमेज अपलोड करें' },
  'cv_step2': { en: 'Select area to change the color', hi: 'रंग बदलने का क्षेत्र चुनें' },
  'cv_step3': { en: 'Choose the color', hi: 'रंग चुनें' },
  'cv_area_wall': { en: 'Wall', hi: 'दीवार' },
  'cv_area_floor': { en: 'Floor', hi: 'फर्श' },
  'cv_area_ceiling': { en: 'Ceiling', hi: 'छत' },
  'cv_generating': { en: 'Generating (~30 seconds)...', hi: 'तैयार हो रहा है (~30 सेकंड)...' },
  'cv_generate_btn': { en: 'Visualize Color', hi: 'रंग देखें' },
  'cv_result': { en: 'Result', hi: 'परिणाम' },
  'cv_compare_mode': { en: 'Compare Mode', hi: 'तुलना मोड' },
  'cv_download': { en: 'Download', hi: 'डाउनलोड' },
  'cv_success': { en: 'Room color updated successfully!', hi: 'कमरे का रंग सफलतापूर्वक अपडेट हो गया!' },
  'cv_failed': { en: 'Generation Failed', hi: 'जनरेशन विफल रही' },
  'cv_failed_desc': { en: 'Something went wrong, please try again later.', hi: 'कुछ गड़बड़ हो गई, कृपया बाद में दोबारा कोशिश करें।' },

  // Floor Plan page
  'fp_title': { en: 'Floor Plan Generator', hi: 'फ्लोर प्लान जनरेटर' },
  'fp_subtitle': { en: "Upload 5-12 photos of your room from different angles. We'll reconstruct a 3D model and generate a floor plan.", hi: 'अलग-अलग कोणों से अपने कमरे की 5-12 तस्वीरें अपलोड करें। हम एक 3D मॉडल बनाएंगे और फ्लोर प्लान तैयार करेंगे।' },
  'fp_photo_req': { en: 'Photo Requirements', hi: 'फोटो की ज़रूरतें' },
  'fp_room_name': { en: 'Room Name', hi: 'कमरे का नाम' },
  'fp_upload_click': { en: 'Click to upload room photos', hi: 'कमरे की फोटो अपलोड करने के लिए क्लिक करें' },
  'fp_upload_types': { en: 'JPG, PNG — 3 to 20 photos', hi: 'JPG, PNG — 3 से 20 फोटो' },
  'fp_photos_selected': { en: '{{count}} photos selected', hi: '{{count}} फोटो चुनी गई' },
  'fp_start_reconstruction': { en: 'Start 3D Reconstruction', hi: '3D पुनर्निर्माण शुरू करें' },
  'fp_uploading': { en: 'Uploading photos...', hi: 'फोटो अपलोड हो रही हैं...' },
  'fp_reconstructing': { en: 'Reconstructing 3D model...', hi: '3D मॉडल बन रहा है...' },
  'fp_takes_time': { en: 'This takes 1-3 minutes depending on photo count', hi: 'फोटो की संख्या के अनुसार इसमें 1-3 मिनट लगते हैं' },
  'fp_done_title': { en: '3D Reconstruction Complete!', hi: '3D पुनर्निर्माण पूरा हो गया!' },
  'fp_3d_points': { en: '3D Points', hi: '3D पॉइंट्स' },
  'fp_cameras': { en: 'Cameras Registered', hi: 'कैमरे रजिस्टर हुए' },
  'fp_photos_used': { en: 'Photos Used', hi: 'उपयोग की गई फोटो' },
  'fp_phase1_done': { en: '✅ Phase 1 complete. Point cloud saved. Phase 2 will extract the floor outline from this point cloud.', hi: '✅ चरण 1 पूरा हो गया। पॉइंट क्लाउड सेव हो गया। चरण 2 इस पॉइंट क्लाउड से फ्लोर आउटलाइन निकालेगा।' },
  'fp_start_new': { en: 'Start New Room', hi: 'नया कमरा शुरू करें' },
  'fp_failed_title': { en: 'Reconstruction Failed', hi: 'पुनर्निर्माण विफल रहा' },
  'fp_try_again': { en: 'Try Again', hi: 'फिर से कोशिश करें' },
  'fp_min_3': { en: 'Please select at least 3 photos', hi: 'कृपया कम से कम 3 फोटो चुनें' },
  'fp_max_20': { en: 'Maximum 20 photos allowed', hi: 'अधिकतम 20 फोटो की अनुमति है' },

  // Staging page
  'stg_title': { en: 'Room Staging', hi: 'रूम स्टेजिंग' },
  'stg_subtitle': { en: 'Instantly transform empty spaces into beautifully furnished rooms using our AI staging model.', hi: 'हमारे AI स्टेजिंग मॉडल की मदद से खाली जगहों को खूबसूरती से सजाए गए कमरों में तुरंत बदलें।' },

  // Remove Object page
  'ro_title': { en: '🗑️ Object Removal Studio', hi: '🗑️ ऑब्जेक्ट हटाने का स्टूडियो' },
  'ro_subtitle': { en: 'Professional Object Removal with LaMa, Flux.1 Fill, and SAM 2', hi: 'LaMa, Flux.1 Fill और SAM 2 के साथ प्रोफेशनल ऑब्जेक्ट रिमूवल' },
  'ro_upload_photo': { en: 'Upload Room Photo', hi: 'कमरे की फोटो अपलोड करें' },
  'ro_choose_image': { en: 'Choose Room Image', hi: 'कमरे की इमेज चुनें' },
  'ro_ready': { en: '✓ Ready for object removal', hi: '✓ ऑब्जेक्ट हटाने के लिए तैयार' },
  'ro_method': { en: 'Removal Method', hi: 'हटाने का तरीका' },
  'ro_removing': { en: 'Removing Object...', hi: 'ऑब्जेक्ट हटाया जा रहा है...' },
  'ro_remove_btn': { en: 'Remove Object', hi: 'ऑब्जेक्ट हटाएं' },
  'ro_logs': { en: 'Processing Logs', hi: 'प्रोसेसिंग लॉग्स' },
  'ro_waiting': { en: 'Waiting for configuration...', hi: 'कॉन्फ़िगरेशन का इंतज़ार है...' },
  'ro_active_method': { en: 'Active Method: {{name}}', hi: 'सक्रिय तरीका: {{name}}' },
  'ro_done_title': { en: '✅ Object Removal Complete', hi: '✅ ऑब्जेक्ट हटाना पूरा हो गया' },
  'ro_original': { en: 'Original (With Object)', hi: 'असली (ऑब्जेक्ट के साथ)' },
  'ro_removed': { en: 'Object Removed', hi: 'ऑब्जेक्ट हटाया गया' },
  'ro_success_title': { en: '🎊 Object Removal Success!', hi: '🎊 ऑब्जेक्ट हटाना सफल!' },

  // Dashboard

  'db_welcome_title': {
    en: 'Welcome to Removation.ai! 🎉',
    hi: 'Removation.ai में आपका स्वागत है! 🎉'
  },
  'db_welcome_desc': {
    en: "You have 10 free credits to start designing. Let's create something amazing!",
    hi: 'डिजाइनिंग शुरू करने के लिए आपके पास 10 फ्री क्रेडिट हैं। आइए कुछ शानदार बनाएं!'
  },
  'db_greeting_morning': {
    en: 'Good morning',
    hi: 'सुप्रभात'
  },
  'db_greeting_afternoon': {
    en: 'Good afternoon',
    hi: 'नमस्कार'
  },
  'db_greeting_evening': {
    en: 'Good evening',
    hi: 'शुभ संध्या'
  },
  'db_greeting_night': {
    en: 'Good night',
    hi: 'शुभ रात्रि'
  },
  'db_designer': {
    en: 'Designer',
    hi: 'डिजाइनर'
  },
  'db_day_streak': {
    en: '{{count}} day streak',
    hi: '{{count}} दिनों का सिलसिला'
  },
  'db_streak_tooltip': {
    en: "You've been designing for {{count}} days in a row!",
    hi: 'आप लगातार {{count}} दिनों से डिजाइन कर रहे हैं!'
  },
  'db_ready_desc': {
    en: "Ready to transform your space? Let's create something beautiful.",
    hi: 'अपने कमरे को बदलने के लिए तैयार हैं? आइए कुछ खूबसूरत बनाएं।'
  },
  'db_search_tooltip': {
    en: 'Quick search & commands',
    hi: 'क्विक सर्च और कमांड्स'
  },
  'db_search_hint': {
    en: '+ K to search',
    hi: '+ K सर्च करने के लिए'
  },
  'db_new_design': {
    en: 'New Design',
    hi: 'नया डिजाइन'
  },
  'db_total_projects': {
    en: 'Total Projects',
    hi: 'कुल प्रोजेक्ट्स'
  },
  'db_stats_week_projects': {
    en: '+3 this week',
    hi: 'इस हफ्ते +3'
  },
  'db_ai_renders': {
    en: 'AI Renders',
    hi: 'AI रेंडर'
  },
  'db_stats_week_renders': {
    en: '+12 this week',
    hi: 'इस हफ्ते +12'
  },
  'db_credits_left': {
    en: 'Credits Left',
    hi: 'बचे हुए क्रेडिट'
  },
  'db_credits_of_total': {
    en: 'of {{total}} total',
    hi: 'कुल {{total}} में से'
  },
  'db_saved_designs': {
    en: 'Saved Designs',
    hi: 'सुरक्षित डिज़ाइन'
  },
  'db_in_favorites': {
    en: 'In favorites',
    hi: 'पसंदीदा में'
  },
  'db_quick_actions': {
    en: 'Quick Actions',
    hi: 'त्वरित विकल्प'
  },
  'db_zero_cost': {
    en: 'Zero Cost',
    hi: 'मुफ़्त'
  },
  'db_popular': {
    en: 'Popular',
    hi: 'लोकप्रिय'
  },
  'db_india_first': {
    en: 'India First',
    hi: 'इंडिया फर्स्ट'
  },
  'db_new': {
    en: 'New',
    hi: 'नया'
  },
  'db_beta': {
    en: 'Beta',
    hi: 'बीटा'
  },
  'db_qa_studio_title': {
    en: 'AI Design Studio',
    hi: 'AI डिजाइन स्टूडियो'
  },
  'db_qa_studio_desc': {
    en: 'Transform rooms with RTX 4060',
    hi: 'RTX 4060 के साथ कमरे बदलें'
  },
  'db_qa_redesign_title': {
    en: 'Redesign Room',
    hi: 'रूम री-डिजाइन करें'
  },
  'db_qa_redesign_desc': {
    en: 'Transform any room with AI',
    hi: 'AI के साथ किसी भी कमरे को बदलें'
  },
  'db_qa_vastu_title': {
    en: 'Vastu Analysis',
    hi: 'वास्तु विश्लेषण'
  },
  'db_qa_vastu_desc': {
    en: 'Check Vastu compliance',
    hi: 'वास्तु अनुकूलता जांचें'
  },
  'db_qa_cost_title': {
    en: 'Cost Estimate',
    hi: 'लागत का अनुमान'
  },
  'db_qa_cost_desc': {
    en: 'Get renovation costs',
    hi: 'रेनोवेशन का खर्च जानें'
  },
  'db_qa_fill_title': {
    en: 'Fill Empty Room',
    hi: 'खाली कमरा सजाएं'
  },
  'db_qa_fill_desc': {
    en: 'Furnish vacant spaces',
    hi: 'खाली जगहों को फर्नीचर से सजाएं'
  },
  'db_qa_lighting_title': {
    en: 'AI Lighting Studio',
    hi: 'AI लाइटिंग स्टूडियो'
  },
  'db_qa_lighting_desc': {
    en: 'Cast professional shadows and lights',
    hi: 'प्रोफेशनल लाइट और शैडो इफ़ेक्ट दें'
  },
  'db_studio_title': {
    en: 'AI Design Studio',
    hi: 'AI डिजाइन स्टूडियो'
  },
  'db_studio_subtitle': {
    en: 'Transform your rooms with AI powered by your RTX 4060',
    hi: 'अपने RTX 4060 द्वारा संचालित AI के साथ कमरे बदलें'
  },
  'db_studio_launch': {
    en: 'Launch Studio',
    hi: 'स्टूडियो शुरू करें'
  },
  'db_studio_time': {
    en: '25 Seconds',
    hi: '25 सेकंड'
  },
  'db_studio_time_desc': {
    en: 'Instant AI generation',
    hi: 'तुरंत AI जनरेशन'
  },
  'db_studio_prof': {
    en: 'Professional',
    hi: 'प्रोफेशनल'
  },
  'db_studio_prof_desc': {
    en: 'SDXL quality results',
    hi: 'SDXL क्वालिटी परिणाम'
  },
  'db_recent_projects': {
    en: 'Recent Projects',
    hi: 'हाल के प्रोजेक्ट्स'
  },
  'db_view_all': {
    en: 'View all',
    hi: 'सभी देखें'
  },
  'db_project_renders_count': {
    en: '{{count}} renders',
    hi: '{{count}} रेंडर्स'
  },
  'db_project_view': {
    en: 'View',
    hi: 'देखें'
  },
  'db_project_share': {
    en: 'Share',
    hi: 'शेयर करें'
  },
  'db_project_download': {
    en: 'Download',
    hi: 'डाउनलोड'
  },
  'db_no_projects': {
    en: 'No projects yet',
    hi: 'अभी कोई प्रोजेक्ट नहीं है'
  },
  'db_no_projects_desc': {
    en: 'Create your first project and start transforming spaces with AI',
    hi: 'अपना पहला प्रोजेक्ट बनाएं और AI के साथ कमरों को बदलना शुरू करें'
  },
  'db_create_first_proj': {
    en: 'Create Your First Project',
    hi: 'अपना पहला प्रोजेक्ट बनाएं'
  },
  'db_launch': {
    en: 'Launch',
    hi: 'लॉन्च करें'
  },
  'db_rtx_ready': {
    en: 'RTX 4060 Ready',
    hi: 'RTX 4060 रेडी'
  },
  'db_per_design': {
    en: 'per design',
    hi: 'प्रति डिजाइन'
  },
  'db_generation': {
    en: 'generation',
    hi: 'जनरेशन'
  },
  'db_quick_design': {
    en: 'Quick Design',
    hi: 'त्वरित डिजाइन'
  },
  'db_browse_styles': {
    en: 'Browse Styles',
    hi: 'स्टाइल ब्राउज़ करें'
  },
  'db_ai_designs': {
    en: 'AI Designs',
    hi: 'AI डिज़ाइन'
  },
  'db_recent_activity': {
    en: 'Recent Activity',
    hi: 'हाल की गतिविधि'
  },
  'db_pro_tips': {
    en: 'Pro Tips',
    hi: 'खास टिप्स'
  },
  'db_tip_staging_title': {
    en: 'Try Virtual Staging',
    hi: 'वर्चुअल स्टेजिंग आज़माएं'
  },
  'db_tip_staging_desc': {
    en: 'Add furniture to empty rooms for better visualization',
    hi: 'बेहतर विज़ुअलाइज़ेशन के लिए खाली कमरों में फर्नीचर जोड़ें'
  },
  'db_try_now': {
    en: 'Try now',
    hi: 'अभी आज़माएं'
  },
  'db_tip_vastu_title': {
    en: 'Improve Vastu Score',
    hi: 'वास्तु स्कोर बेहतर करें'
  },
  'db_tip_vastu_desc': {
    en: 'Rearrange elements based on AI suggestions',
    hi: 'AI सुझावों के आधार पर चीज़ों को फिर से व्यवस्थित करें'
  },
  'db_learn_more': {
    en: 'Learn more',
    hi: 'अधिक जानें'
  },
  'db_tip_export_title': {
    en: 'Export in 4K',
    hi: '4K में एक्सपोर्ट करें'
  },
  'db_tip_export_desc': {
    en: 'Upgrade to Pro for high-resolution exports',
    hi: 'हाई-रिज़ॉल्यूशन एक्सपोर्ट के लिए प्रो पर अपग्रेड करें'
  },
  'db_upgrade': {
    en: 'Upgrade',
    hi: 'अपग्रेड करें'
  },
  'db_design_by_room': {
    en: 'Design by Room',
    hi: 'कमरे के अनुसार डिजाइन'
  },
  'db_popular_styles': {
    en: 'Popular Design Styles',
    hi: 'लोकप्रिय डिजाइन स्टाइल'
  },
  'db_popular_styles_desc': {
    en: 'Explore 400+ curated interior design styles',
    hi: '400+ चुनिंदा इंटीरियर डिजाइन स्टाइल देखें'
  },
  'db_explore_styles': {
    en: 'Explore all styles',
    hi: 'सभी स्टाइल देखें'
  },
  'db_style_designs_count': {
    en: '{{count}} designs',
    hi: '{{count}} डिज़ाइन'
  },
  'db_upgrade_limited': {
    en: 'Limited Time: 50% Off Pro Plan',
    hi: 'सीमित समय: प्रो प्लान पर 50% छूट'
  },
  'db_upgrade_title': {
    en: 'Upgrade to Pro & Unlock Everything',
    hi: 'प्रो पर अपग्रेड करें और सब कुछ अनलॉक करें'
  },
  'db_upgrade_desc': {
    en: 'Get unlimited AI renders, priority processing, 4K exports, advanced Vastu analysis, and detailed cost breakdowns.',
    hi: 'असीमित AI रेंडर, प्राथमिकता प्रोसेसिंग, 4K एक्सपोर्ट, उन्नत वास्तु विश्लेषण और विस्तृत लागत विवरण प्राप्त करें।'
  },
  'db_up_unlimited': {
    en: 'Unlimited renders',
    hi: 'असीमित रेंडर'
  },
  'db_up_quality': {
    en: '4K quality',
    hi: '4K क्वालिटी'
  },
  'db_up_support': {
    en: 'Priority support',
    hi: 'प्राथमिकता सपोर्ट'
  },
  'db_up_vastu': {
    en: 'Advanced Vastu',
    hi: 'उन्नत वास्तु'
  },
  'db_up_estimates': {
    en: 'Cost estimates',
    hi: 'लागत अनुमान'
  },
  'db_upgrade_now': {
    en: 'Upgrade Now',
    hi: 'अभी अपग्रेड करें'
  },
  'db_view_plans': {
    en: 'View all plans →',
    hi: 'सभी प्लान देखें →'
  },
  'db_shortcut_search': {
    en: 'Quick search',
    hi: 'क्विक सर्च'
  },
  'db_shortcut_new': {
    en: 'New design',
    hi: 'नया डिजाइन'
  },
  'db_shortcut_all': {
    en: 'Shortcuts',
    hi: 'शॉर्टकट'
  },
  'db_ai_design_btn': {
    en: 'AI Design',
    hi: 'AI डिजाइन'
  },
  'db_create_design': {
    en: 'Create Your Design',
    hi: 'अपना डिज़ाइन बनाएं'
  },
  'db_recent_activity_render': {
    en: 'AI generated "{{message}}" design',
    hi: 'AI ने "{{message}}" डिजाइन तैयार किया'
  },
  'db_recent_activity_vastu': {
    en: 'Vastu score improved to {{score}} for {{room}}',
    hi: '{{room}} के लिए वास्तु स्कोर सुधरकर {{score}} हुआ'
  },
  'db_recent_activity_achievement': {
    en: 'Unlocked "{{achievement}}" achievement',
    hi: 'अचीवमेंट "{{achievement}}" अनलॉक किया'
  },
  'db_recent_activity_project': {
    en: 'Created new project "{{project}}"',
    hi: 'नया प्रोजेक्ट "{{project}}" बनाया'
  },
  'db_streak_day': {
    en: 'day streak',
    hi: 'दिनों का सिलसिला'
  },
  'db_time_5_min_ago': {
    en: '5 min ago',
    hi: '5 मिनट पहले'
  },
  'db_time_1_hour_ago': {
    en: '1 hour ago',
    hi: '1 घंटा पहले'
  },
  'db_time_2_hours_ago': {
    en: '2 hours ago',
    hi: '2 घंटे पहले'
  },
  'db_time_3_hours_ago': {
    en: '3 hours ago',
    hi: '3 घंटे पहले'
  },
  'db_time_2_hours_ago_simple': {
    en: '2 hours ago',
    hi: '2 घंटे पहले'
  },
  'db_time_1_day_ago': {
    en: '1 day ago',
    hi: '1 दिन पहले'
  },
  'db_time_3_days_ago': {
    en: '3 days ago',
    hi: '3 दिन पहले'
  },
  'db_time_5_days_ago': {
    en: '5 days ago',
    hi: '5 दिन पहले'
  },
  'db_project_living_room_makeover': {
    en: 'Living Room Makeover',
    hi: 'लिविंग रूम बदलाव'
  },
  'db_project_bedroom_redesign': {
    en: 'Bedroom Redesign',
    hi: 'बेडरूम पुनर्रचना'
  },
  'db_project_kitchen_renovation': {
    en: 'Kitchen Renovation',
    hi: 'रसोई का नवीनीकरण'
  },
  'db_project_home_office_setup': {
    en: 'Home Office Setup',
    hi: 'होम ऑफिस सेटअप'
  },
  'select_wall_color': {
    en: 'Please select a wall color.',
    hi: 'कृपया दीवार का रंग चुनें।'
  },
  'upload_room_photo': {
    en: 'Please upload a room photo.',
    hi: 'कृपया कमरे की फोटो अपलोड करें।'
  },
  'rc_network_error': {
    en: 'Network error. Please try again.',
    hi: 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।'
  },
  'rc_submission_failed': {
    en: 'Submission failed. Please try again.',
    hi: 'सबमिशन विफल। कृपया पुनः प्रयास करें।'
  },
  'rc_pipeline_failed': {
    en: 'Pipeline failed. Please try again.',
    hi: 'पाइपलाइन विफल। कृपया पुनः प्रयास करें।'
  },
  'proj_title': {
    en: 'Projects',
    hi: 'प्रोजेक्ट्स'
  },
  'proj_subtitle': {
    en: 'Manage and organize your interior design projects',
    hi: 'अपने इंटीरियर डिज़ाइन प्रोजेक्ट्स को प्रबंधित और व्यवस्थित करें'
  },
  'proj_new': {
    en: 'New',
    hi: 'नया'
  },
  'proj_new_project': {
    en: 'New Project',
    hi: 'नया प्रोजेक्ट'
  },
  'proj_tab_all': {
    en: 'All Projects',
    hi: 'सभी प्रोजेक्ट'
  },
  'proj_tab_favorites': {
    en: 'Favorites',
    hi: 'पसंदीदा'
  },
  'proj_tab_recent': {
    en: 'Recent',
    hi: 'हाल ही का'
  },
  'proj_tab_archived': {
    en: 'Archived',
    hi: 'संग्रहित'
  },
  'proj_search_placeholder': {
    en: 'Search projects, styles, tags... (⌘K)',
    hi: 'प्रोजेक्ट्स, स्टाइल, टैग्स खोजें... (⌘K)'
  },
  'proj_sort_modified': {
    en: 'Last Modified',
    hi: 'पिछली बार संशोधित'
  },
  'proj_sort_created': {
    en: 'Date Created',
    hi: 'बनाने की तारीख'
  },
  'proj_sort_name': {
    en: 'Name A-Z',
    hi: 'नाम A-Z'
  },
  'proj_sort_renders': {
    en: 'Most Renders',
    hi: 'सर्वाधिक रेंडर्स'
  },
  'proj_sort_vastu': {
    en: 'Vastu Score',
    hi: 'वास्तु स्कोर'
  },
  'proj_view_grid': {
    en: 'Grid view (V)',
    hi: 'ग्रिड व्यू (V)'
  },
  'proj_view_list': {
    en: 'List view (V)',
    hi: 'लिस्ट व्यू (V)'
  },
  'proj_selected': {
    en: '{{count}} selected',
    hi: '{{count}} चयनित'
  },
  'proj_clear': {
    en: 'Clear',
    hi: 'साफ़ करें'
  },
  'proj_export': {
    en: 'Export',
    hi: 'एक्सपोर्ट'
  },
  'proj_archive': {
    en: 'Archive',
    hi: 'संग्रहित करें'
  },
  'proj_delete': {
    en: 'Delete',
    hi: 'हटाएं'
  },
  'proj_table_name': {
    en: 'Name',
    hi: 'नाम'
  },
  'proj_table_room': {
    en: 'Room',
    hi: 'कमरा'
  },
  'proj_table_vastu': {
    en: 'Vastu',
    hi: 'वास्तु'
  },
  'proj_table_cost': {
    en: 'Est. Cost',
    hi: 'अनुमानित लागत'
  },
  'proj_table_renders': {
    en: 'Renders',
    hi: 'रेंडर्स'
  },
  'proj_table_modified': {
    en: 'Modified',
    hi: 'संशोधित'
  },
  'proj_no_match': {
    en: 'No matching projects',
    hi: 'कोई मेल खाते प्रोजेक्ट नहीं'
  },
  'proj_no_favorites': {
    en: 'No favorites yet',
    hi: 'अभी कोई पसंदीदा नहीं'
  },
  'proj_no_archived': {
    en: 'No archived projects',
    hi: 'कोई संग्रहित प्रोजेक्ट नहीं'
  },
  'proj_no_projects': {
    en: 'No projects yet',
    hi: 'अभी कोई प्रोजेक्ट नहीं'
  },
  'proj_no_match_desc': {
    en: 'No projects matching "{{query}}". Try a different search term.',
    hi: 'कोई प्रोजेक्ट "{{query}}" से मेल नहीं खाता। दूसरा शब्द खोजें।'
  },
  'proj_no_favorites_desc': {
    en: 'Mark your favorite projects with a heart to see them here.',
    hi: 'पसंदीदा प्रोजेक्ट्स देखने के लिए उन्हें दिल से मार्क करें।'
  },
  'proj_no_archived_desc': {
    en: 'Archived projects will appear here.',
    hi: 'संग्रहित प्रोजेक्ट्स यहाँ दिखाई देंगे।'
  },
  'proj_no_projects_desc': {
    en: 'Create your first project and start transforming spaces with AI-powered interior design.',
    hi: 'अपना पहला प्रोजेक्ट बनाएं और AI-संचालित इंटीरियर डिज़ाइन के साथ कमरों को बदलना शुरू करें।'
  },
  'proj_create_first': {
    en: 'Create Your First Project',
    hi: 'अपना पहला प्रोजेक्ट बनाएं'
  },
  'proj_clear_search': {
    en: 'Clear Search',
    hi: 'खोज साफ़ करें'
  },
  'proj_showing_stats': {
    en: 'Showing {{count}} of {{total}} projects',
    hi: '{{total}} में से {{count}} प्रोजेक्ट्स दिखा रहे हैं'
  },
  'proj_delete_confirm_title_single': {
    en: 'Delete Project?',
    hi: 'प्रोजेक्ट हटाएं?'
  },
  'proj_delete_confirm_title_multiple': {
    en: 'Delete {{count}} Projects?',
    hi: '{{count}} प्रोजेक्ट हटाएं?'
  },
  'proj_delete_confirm_desc_single': {
    en: 'This action cannot be undone. This will permanently delete this project and all associated renders.',
    hi: 'यह क्रिया पूर्ववत नहीं की जा सकती। इससे यह प्रोजेक्ट और सभी संबद्ध रेंडर स्थायी रूप से हटा दिए जाएंगे।'
  },
  'proj_delete_confirm_desc_multiple': {
    en: 'This action cannot be undone. This will permanently delete {{count}} projects and all associated renders.',
    hi: 'यह क्रिया पूर्ववत नहीं की जा सकती। इससे {{count}} प्रोजेक्ट और सभी संबद्ध रेंडर स्थायी रूप से हटा दिए जाएंगे।'
  },
  'proj_cancel': {
    en: 'Cancel',
    hi: 'रद्द करें'
  },
  'proj_rename_title': {
    en: 'Rename Project',
    hi: 'प्रोजेक्ट का नाम बदलें'
  },
  'proj_rename_desc': {
    en: 'Enter a new name for your project.',
    hi: 'अपने प्रोजेक्ट के लिए नया नाम दर्ज करें।'
  },
  'proj_rename_placeholder': {
    en: 'Project name',
    hi: 'प्रोजेक्ट का नाम'
  },
  'proj_save': {
    en: 'Save',
    hi: 'सहेजें'
  },
  'proj_before_after': {
    en: 'Before / After',
    hi: 'पहले / बाद में'
  },
  'proj_original': {
    en: 'Original',
    hi: 'मूल'
  },
  'proj_ai_redesigned': {
    en: 'AI Redesigned',
    hi: 'AI द्वारा पुनर्गठित'
  },
  'proj_processing': {
    en: 'Processing',
    hi: 'प्रोसेसिंग'
  },
  'proj_download_tooltip': {
    en: 'Download all photos',
    hi: 'सभी फ़ोटो डाउनलोड करें'
  },
  'proj_vastu_score_tooltip': {
    en: 'Vastu Score',
    hi: 'वास्तु स्कोर'
  },
  'proj_remove_fav': {
    en: 'Remove from favorites',
    hi: 'पसंदीदा से हटाएं'
  },
  'proj_add_fav': {
    en: 'Add to favorites',
    hi: 'पसंदीदा में जोड़ें'
  },
  'proj_view_details': {
    en: 'View Details',
    hi: 'विवरण देखें'
  },
  'proj_compare': {
    en: 'Compare Before/After',
    hi: 'पहले/बाद में तुलना करें'
  },
  'proj_action_rename': {
    en: 'Rename',
    hi: 'नाम बदलें'
  },
  'proj_action_duplicate': {
    en: 'Duplicate',
    hi: 'डुप्लीकेट'
  },
  'proj_action_share': {
    en: 'Share',
    hi: 'शेयर करें'
  },
  'proj_action_export_all': {
    en: 'Export All',
    hi: 'सभी एक्सपोर्ट करें'
  },
  'proj_action_archive': {
    en: 'Archive',
    hi: 'संग्रहित करें'
  },
  'proj_action_delete': {
    en: 'Delete',
    hi: 'हटाएं'
  },
  'proj_estimated_cost_prefix': {
    en: 'Est. {{cost}}',
    hi: 'अनुमानित {{cost}}'
  },
  'proj_action_open': {
    en: 'Open',
    hi: 'खोलें'
  },
  'proj_preparing_download': {
    en: 'Preparing Download',
    hi: 'डाउनलोड की तैयारी कर रहे हैं'
  },
  'proj_gathering_photos': {
    en: 'Gathering photos for "{{name}}"...',
    hi: '"{{name}}" के लिए फ़ोटो एकत्र कर रहे हैं...'
  },
  'proj_download_success_title': {
    en: 'Success',
    hi: 'सफलता'
  },
  'proj_download_success_desc': {
    en: 'Photos downloaded successfully!',
    hi: 'फ़ोटो सफलतापूर्वक डाउनलोड हो गए!'
  },
  'proj_download_error_title': {
    en: 'Error',
    hi: 'त्रुटि'
  },
  'proj_download_error_desc': {
    en: 'Failed to download ZIP file.',
    hi: 'ज़िप फ़ाइल डाउनलोड करने में विफल।'
  },
  'proj_updated_toast_title': {
    en: 'Updated',
    hi: 'अपडेट किया गया'
  },
  'proj_updated_toast_desc': {
    en: 'Favorite status changed',
    hi: 'पसंदीदा स्थिति बदल दी गई'
  },
  'proj_deleted_toast_title': {
    en: 'Deleted',
    hi: 'हटा दिया गया'
  },
  'proj_deleted_toast_desc_single': {
    en: 'Project has been deleted',
    hi: 'प्रोजेक्ट हटा दिया गया है'
  },
  'proj_deleted_toast_desc_multiple': {
    en: '{{count}} projects have been deleted',
    hi: '{{count}} प्रोजेक्ट्स हटा दिए गए हैं'
  },
  'proj_duplicated_toast_title': {
    en: 'Duplicated',
    hi: 'डुप्लीकेट किया गया'
  },
  'proj_duplicated_toast_desc': {
    en: 'Project has been duplicated',
    hi: 'प्रोजेक्ट को डुप्लीकेट किया गया है'
  },
  'proj_renamed_toast_title': {
    en: 'Renamed',
    hi: 'नाम बदला गया'
  },
  'proj_renamed_toast_desc': {
    en: 'Project has been renamed',
    hi: 'प्रोजेक्ट का नाम बदल दिया गया है'
  },
  'proj_keyboard_shortcuts': {
    en: 'Shortcuts',
    hi: 'शॉर्टकट'
  },
  'proj_total_projects_count': {
    en: 'Total Projects',
    hi: 'कुल प्रोजेक्ट्स'
  },
  'proj_ai_renders_count': {
    en: 'AI Renders',
    hi: 'AI रेंडर्स'
  },
  'proj_avg_vastu_score': {
    en: 'Avg Vastu Score',
    hi: 'औसत वास्तु स्कोर'
  },
  'proj_favorites_count': {
    en: 'Favorites',
    hi: 'पसंदीदा'
  },
  'proj_view_label': {
    en: 'View',
    hi: 'व्यू'
  },
  'room_office': {
    en: 'Office',
    hi: 'ऑफिस'
  },
  'db_quick_action_ai_design': {
    en: 'AI Room Design',
    hi: 'AI रूम डिज़ाइन'
  },
  'db_quick_action_ai_design_desc': {
    en: 'Transform any room instantly',
    hi: 'किसी भी कमरे को तुरंत बदलें'
  },
  'db_quick_action_redesign': {
    en: 'Full Redesign',
    hi: 'पूरा रिडिज़ाइन'
  },
  'db_quick_action_redesign_desc': {
    en: 'Complete room transformation',
    hi: 'कमरे का पूरा बदलाव'
  },
  'db_quick_action_vastu': {
    en: 'Vastu Analysis',
    hi: 'वास्तु विश्लेषण'
  },
  'db_quick_action_vastu_desc': {
    en: 'Vastu-compliant design check',
    hi: 'वास्तु अनुरूप डिज़ाइन जांच'
  },
  'db_quick_action_cost': {
    en: 'Cost Estimator',
    hi: 'लागत अनुमान'
  },
  'db_quick_action_cost_desc': {
    en: 'Renovation cost breakdown',
    hi: 'नवीनीकरण लागत विवरण'
  },
  'db_quick_action_fill': {
    en: 'Furnish Room',
    hi: 'कमरा सजाएं'
  },
  'db_quick_action_fill_desc': {
    en: 'AI furniture placement',
    hi: 'AI फर्नीचर प्लेसमेंट'
  },
  'db_quick_action_lighting': {
    en: 'Lighting Studio',
    hi: 'लाइटिंग स्टूडियो'
  },
  'db_quick_action_lighting_desc': {
    en: 'Perfect room lighting',
    hi: 'परफेक्ट रूम लाइटिंग'
  },
  'db_badge_zero_cost': {
    en: 'Zero Cost',
    hi: 'बिल्कुल मुफ्त'
  },
  'db_badge_popular': {
    en: 'Popular',
    hi: 'लोकप्रिय'
  },
  'db_badge_india_first': {
    en: 'India First',
    hi: 'इंडिया फर्स्ट'
  },
  'db_badge_new': {
    en: 'New',
    hi: 'नया'
  },
  'db_badge_beta': {
    en: 'Beta',
    hi: 'बीटा'
  },
  'rc_repaint_title': {
    en: 'Room Changer',
    hi: 'रूम चेंजर'
  },
  'rc_repaint_desc': {
    en: 'Repaint your walls in any color — furniture and floor stay untouched',
    hi: 'अपनी दीवारों को किसी भी रंग में दोबारा पेंट करें — फर्नीचर और फर्श वैसे ही रहेंगे'
  },
  'rc_repaint_sam2': {
    en: 'SAM2 Wall Detection',
    hi: 'SAM2 वॉल डिटेक्शन'
  },
  'rc_repaint_sdxl': {
    en: 'SDXL Inpainting',
    hi: 'SDXL इनपेंटिंग'
  },
  'rc_repaint_preset': {
    en: '12 Preset Colors',
    hi: '12 प्रीसेट रंग'
  },
  'rc_repaint_upload_title': {
    en: 'Upload Room Photo',
    hi: 'कमरे की फोटो अपलोड करें'
  },
  'rc_repaint_drop_photo': {
    en: 'Drop photo here or click to browse',
    hi: 'फोटो यहाँ छोड़ें या ब्राउज़ करने के लिए क्लिक करें'
  },
  'rc_repaint_max_size': {
    en: 'JPG, PNG up to 20MB',
    hi: 'JPG, PNG 20MB तक'
  },
  'rc_repaint_change_image': {
    en: 'Change image',
    hi: 'इमेज बदलें'
  },
  'rc_repaint_choose_color': {
    en: 'Choose Wall Color',
    hi: 'दीवार का रंग चुनें'
  },
  'rc_repaint_generate': {
    en: 'Generate',
    hi: 'तैयार करें'
  },
  'rc_repaint_generating': {
    en: 'Generating…',
    hi: 'तैयार हो रहा है…'
  },
  'rc_repaint_retry_saved': {
    en: 'Retry with saved masks',
    hi: 'सुरक्षित मास्क के साथ दोबारा कोशिश करें'
  },
  'rc_repaint_result': {
    en: 'Result',
    hi: 'परिणाम'
  },
  'rc_repaint_will_appear': {
    en: 'Your recolored room will appear here',
    hi: 'आपके नए रंग का कमरा यहाँ दिखाई देगा'
  },
  'rc_repaint_instructions': {
    en: 'Upload a photo and pick a color to get started',
    hi: 'शुरू करने के लिए एक फोटो अपलोड करें और रंग चुनें'
  },
  'rc_repaint_original': {
    en: 'Original',
    hi: 'असली'
  },
  'rc_repaint_recolored': {
    en: 'Recolored',
    hi: 'नया रंग'
  },
  'rc_repaint_download': {
    en: 'Download',
    hi: 'डाउनलोड'
  },
  'rc_repaint_save_to_project': {
    en: 'Save to Project',
    hi: 'प्रोजेक्ट में सुरक्षित करें'
  },
  'rc_repaint_try_another': {
    en: 'Try Another Color',
    hi: 'दूसरा रंग आज़माएं'
  },
  'rc_repaint_happy_result': {
    en: 'Happy with this result?',
    hi: 'क्या आप इस परिणाम से खुश हैं?'
  },
  'rc_repaint_thanks_feedback': {
    en: 'Thanks for your feedback',
    hi: 'आपके फीडबैक के लिए धन्यवाद'
  },
  'rc_repaint_glad_liked': {
    en: 'Glad you liked it!',
    hi: 'ख़ुशी है कि आपको पसंद आया!'
  },
  'rc_repaint_sorry_improve': {
    en: 'Sorry — help us improve',
    hi: 'माफ़ करें — हमें बेहतर बनाने में मदद करें'
  },
  'rc_repaint_feedback_worked': {
    en: 'Tell us what worked (optional)',
    hi: 'हमें बताएं कि क्या अच्छा लगा (वैकल्पिक)'
  },
  'rc_repaint_feedback_wrong': {
    en: 'What went wrong? (optional)',
    hi: 'क्या कमी रह गई? (वैकल्पिक)'
  },
  'rc_repaint_submit': {
    en: 'Submit',
    hi: 'सब्मिट करें'
  },
  'rc_repaint_submitting': {
    en: 'Submitting…',
    hi: 'सब्मिट हो रहा है…'
  },
  'rc_repaint_analyzing': {
    en: 'Analyzing room (detecting walls, floor, objects)…',
    hi: 'कमरे का विश्लेषण कर रहे हैं (दीवारें, फर्श, वस्तुएं ढूंढ रहे हैं)…'
  },
  'rc_repaint_analyzing_done': {
    en: 'Room analyzed',
    hi: 'कमरे का विश्लेषण हो गया'
  },
  'rc_repaint_repainting': {
    en: 'Repainting walls in {{color}}…',
    hi: 'दीवारों को {{color}} रंग में पेंट कर रहे हैं…'
  },
  'rc_repaint_chosen_color_text': {
    en: 'chosen color',
    hi: 'चुने गए रंग'
  },
  'rc_repaint_repainting_done': {
    en: 'Repainting complete',
    hi: 'पेंटिंग पूरी हो गई'
  },
  'rc_repaint_starting': {
    en: 'Starting…',
    hi: 'शुरू कर रहे हैं…'
  },
  'rc_repaint_done': {
    en: 'Done!',
    hi: 'हो गया!'
  },
  'rc_repaint_saved_title': {
    en: 'Saved to project',
    hi: 'प्रोजेक्ट में सेव हो गया'
  },
  'rc_repaint_saved_desc': {
    en: '{{color}} recolor saved successfully.',
    hi: '{{color}} रीकलर सफलतापूर्वक सेव कर लिया गया है।'
  },
  'rc_analyzing': {
    en: 'Analyzing room (detecting walls, floor, objects)…',
    hi: 'कमरे का विश्लेषण कर रहे हैं (दीवारें, फर्श, वस्तुएं ढूंढ रहे हैं)…'
  },
  'rc_analyzing_done': {
    en: 'Room analyzed',
    hi: 'कमरे का विश्लेषण हो गया'
  },
  'rc_repainting_done': {
    en: 'Repainting complete',
    hi: 'पेंटिंग पूरी हो गई'
  },
  'rc_done': {
    en: 'Done!',
    hi: 'हो गया!'
  },
};

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
    let translation = translations[key]?.[language] || key;

    // Replace parameters
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
      t: (key: string) => translations[key]?.['en'] || key,
      isHindi: false,
      isEnglish: true,
    };
  }
  return context;
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

