// hooks/i18n/ai_design.ts
import type { Language } from '../useLanguage';

export const aiDesignTranslations: Record<string, Record<Language, string>> = {
  // Page header
  'ad_title': { en: 'AI Interior Design Studio', hi: 'AI इंटीरियर डिज़ाइन स्टूडियो' },
  'ad_subtitle': { en: 'Transform your space with AI-powered design. Upload a photo and watch our RTX 4060 create stunning room redesigns in seconds.', hi: 'AI-पावर्ड डिज़ाइन से अपना घर बदलें। फ़ोटो अपलोड करें और देखें हमारा RTX 4060 सेकंडों में शानदार रूम रीडिज़ाइन करे।' },
  'ad_zero_cost': { en: 'Zero Cost', hi: 'बिल्कुल मुफ़्त' },
  'ad_time': { en: '~25 seconds', hi: '~25 सेकंड' },
  'ad_pro_quality': { en: 'Professional Quality', hi: 'प्रोफ़ेशनल क्वालिटी' },

  // Upload section
  'ad_upload_title': { en: 'Upload Room Photo', hi: 'रूम फ़ोटो अपलोड करें' },
  'ad_choose_image': { en: 'Choose Room Image', hi: 'रूम इमेज चुनें' },
  'ad_ready_processing': { en: '✓ Ready for AI processing', hi: '✓ AI प्रोसेसिंग के लिए तैयार' },

  // Room type
  'ad_room_type': { en: 'Room Type', hi: 'कमरे का प्रकार' },
  'ad_room_living': { en: 'Living Room', hi: 'लिविंग रूम' },
  'ad_room_bedroom': { en: 'Bedroom', hi: 'बेडरूम' },
  'ad_room_kitchen': { en: 'Kitchen', hi: 'किचन' },
  'ad_room_bathroom': { en: 'Bathroom', hi: 'बाथरूम' },
  'ad_room_dining': { en: 'Dining Room', hi: 'डाइनिंग रूम' },
  'ad_room_office': { en: 'Home Office', hi: 'होम ऑफ़िस' },
  'ad_room_garden': { en: 'Garden/Outdoor', hi: 'बगीचा/आउटडोर' },

  // Design mode
  'ad_mode_title': { en: 'Design Mode', hi: 'डिज़ाइन मोड' },
  'ad_mode_redesign': { en: 'Redesign', hi: 'रीडिज़ाइन' },
  'ad_mode_redesign_desc': { en: 'Complete room transformation', hi: 'पूर्ण कमरा परिवर्तन' },
  'ad_mode_beautify': { en: 'Beautify', hi: 'सुंदर बनाएं' },
  'ad_mode_beautify_desc': { en: 'Enhance existing design', hi: 'मौजूदा डिज़ाइन सुधारें' },
  'ad_mode_creative': { en: 'Creative', hi: 'क्रिएटिव' },
  'ad_mode_creative_desc': { en: 'Artistic interpretation', hi: 'कलात्मक व्याख्या' },
  'ad_mode_furnish': { en: 'Furnish', hi: 'फर्निश करें' },
  'ad_mode_furnish_desc': { en: 'Add furniture and decor', hi: 'फर्नीचर और सजावट जोड़ें' },

  // Advanced settings
  'ad_settings_title': { en: 'Advanced Settings', hi: 'उन्नत सेटिंग्स' },
  'ad_arch_mode': { en: '🏛️ Architectural Mode', hi: '🏛️ आर्किटेक्चरल मोड' },
  'ad_arch_mode_on': { en: 'ControlNet active — preserves walls, windows & doors', hi: 'ControlNet सक्रिय — दीवारें, खिड़कियाँ और दरवाज़े सुरक्षित' },
  'ad_arch_mode_off': { en: 'ControlNet off — faster processing, less structure control', hi: 'ControlNet बंद — तेज़ प्रोसेसिंग, कम स्ट्रक्चर नियंत्रण' },
  'ad_creativity': { en: 'Creativity: {{value}}%', hi: 'रचनात्मकता: {{value}}%' },
  'ad_preserve_layout': { en: 'Preserve Room Layout', hi: 'रूम लेआउट सुरक्षित रखें' },
  'ad_enhance_quality': { en: 'Enhance Quality', hi: 'गुणवत्ता सुधारें' },
  'ad_color_scheme': { en: 'Color Scheme', hi: 'रंग योजना' },
  'ad_color_neutral': { en: 'Neutral', hi: 'न्यूट्रल' },
  'ad_color_warm': { en: 'Warm', hi: 'गर्म' },
  'ad_color_cool': { en: 'Cool', hi: 'ठंडा' },
  'ad_color_vibrant': { en: 'Vibrant', hi: 'जीवंत' },

  // Generate button
  'ad_generating': { en: 'Generating...', hi: 'बन रहा है...' },
  'ad_generate_btn': { en: 'Generate AI Design', hi: 'AI डिज़ाइन बनाएं' },

  // Results
  'ad_result_title': { en: 'Design Complete!', hi: 'डिज़ाइन तैयार!' },
  'ad_download': { en: 'Download', hi: 'डाउनलोड करें' },
  'ad_view_fullscreen': { en: 'View Fullscreen', hi: 'पूर्ण स्क्रीन देखें' },
  'ad_style_label': { en: 'Style:', hi: 'स्टाइल:' },
  'ad_mode_label': { en: 'Mode:', hi: 'मोड:' },
  'ad_room_label': { en: 'Room:', hi: 'कमरा:' },
  'ad_success_title': { en: '🎉 AI Design Generated Successfully!', hi: '🎉 AI डिज़ाइन सफलतापूर्वक बना!' },
  'ad_processing_time': { en: 'Processing Time:', hi: 'प्रोसेसिंग समय:' },
  'ad_cost': { en: 'Cost:', hi: 'लागत:' },
  'ad_free': { en: '$0.00 (Free!)', hi: '₹0 (मुफ़्त!)' },
  'ad_gpu_used': { en: 'GPU Used:', hi: 'GPU:' },
  'ad_quality': { en: 'Quality:', hi: 'गुणवत्ता:' },
  'ad_professional': { en: 'Professional', hi: 'प्रोफ़ेशनल' },

  // Empty state
  'ad_empty_title': { en: 'Ready to Transform Your Space?', hi: 'अपना घर बदलने के लिए तैयार?' },
  'ad_empty_desc': { en: 'Upload a room photo and let our AI create stunning redesigns. Powered by your local RTX 4060 for zero-cost generation.', hi: 'रूम फ़ोटो अपलोड करें और हमारे AI को शानदार रीडिज़ाइन बनाने दें। आपके RTX 4060 GPU से मुफ़्त में।' },
  'ad_rtx_powered': { en: 'RTX 4060 Powered', hi: 'RTX 4060 पावर्ड' },
  'ad_25sec': { en: '~25 seconds', hi: '~25 सेकंड' },

  // Progress card
  'ad_ai_processing': { en: 'AI Processing...', hi: 'AI प्रोसेस कर रहा है...' },
  'ad_gpu_status': { en: 'GPU Status', hi: 'GPU स्थिति' },
  'ad_active': { en: 'Active', hi: 'सक्रिय' },
  'ad_model': { en: 'Model', hi: 'मॉडल' },
  'ad_speed': { en: 'Speed', hi: 'गति' },

  // Feature cards
  'ad_features_title': { en: 'AI Design Features', hi: 'AI डिज़ाइन फ़ीचर्स' },
  'ad_feat_styles': { en: '7 Design Styles', hi: '7 डिज़ाइन स्टाइल' },
  'ad_feat_styles_desc': { en: 'Modern, Industrial, Bohemian, and more', hi: 'आधुनिक, इंडस्ट्रियल, बोहेमियन, और अधिक' },
  'ad_feat_rooms': { en: 'All Room Types', hi: 'सभी कमरे के प्रकार' },
  'ad_feat_rooms_desc': { en: 'Living room, bedroom, kitchen, bathroom', hi: 'लिविंग रूम, बेडरूम, किचन, बाथरूम' },
  'ad_feat_instant': { en: 'Instant Results', hi: 'तत्काल परिणाम' },
  'ad_feat_instant_desc': { en: 'Professional designs in ~25 seconds', hi: '~25 सेकंड में प्रोफ़ेशनल डिज़ाइन' },
  'ad_feat_free': { en: 'Zero Cost', hi: 'बिल्कुल मुफ़्त' },
  'ad_feat_free_desc': { en: 'Powered by your RTX 4060 GPU', hi: 'आपके RTX 4060 GPU से संचालित' },

  // Error
  'ad_select_image_error': { en: 'Please select an image first', hi: 'पहले एक इमेज चुनें' },
};
