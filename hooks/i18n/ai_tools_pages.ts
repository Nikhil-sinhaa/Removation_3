// hooks/i18n/ai_tools_pages.ts
import type { Language } from '../useLanguage';

export const aiToolsPagesTranslations: Record<string, Record<Language, string>> = {
  // ── Common AI Tool strings ──────────────────────────────────────────────────
  'tool_upload_photo': { en: 'Upload Photo', hi: 'फ़ोटो अपलोड करें' },
  'tool_upload_desc': { en: 'Upload a clear, well-lit photo for best results', hi: 'बेहतर परिणाम के लिए स्पष्ट, अच्छी रोशनी वाली फ़ोटो अपलोड करें' },
  'tool_choose_image': { en: 'Choose Image', hi: 'इमेज चुनें' },
  'tool_processing': { en: 'Processing...', hi: 'प्रोसेस हो रहा है...' },
  'tool_generate': { en: 'Generate', hi: 'बनाएं' },
  'tool_download': { en: 'Download Result', hi: 'परिणाम डाउनलोड करें' },
  'tool_try_again': { en: 'Try Again', hi: 'फिर कोशिश करें' },
  'tool_before': { en: 'Before', hi: 'पहले' },
  'tool_after': { en: 'After', hi: 'बाद' },
  'tool_result': { en: 'Result', hi: 'परिणाम' },
  'tool_original': { en: 'Original', hi: 'मूल' },
  'tool_no_image': { en: 'Please upload an image first', hi: 'पहले एक इमेज अपलोड करें' },

  // ── Ceiling Changer ─────────────────────────────────────────────────────────
  'ceil_title': { en: 'Ceiling Changer', hi: 'छत बदलें' },
  'ceil_subtitle': { en: 'Transform your ceiling with AI — choose from dozens of styles and textures', hi: 'AI से अपनी छत बदलें — दर्जनों स्टाइल और टेक्सचर में से चुनें' },
  'ceil_style_label': { en: 'Ceiling Style', hi: 'छत की शैली' },
  'ceil_style_plain': { en: 'Plain White', hi: 'सादा सफ़ेद' },
  'ceil_style_coffered': { en: 'Coffered', hi: 'कॉफ़र्ड' },
  'ceil_style_tray': { en: 'Tray Ceiling', hi: 'ट्रे छत' },
  'ceil_style_vaulted': { en: 'Vaulted', hi: 'मेहराबदार' },
  'ceil_style_beamed': { en: 'Exposed Beams', hi: 'उजागर बीम' },
  'ceil_style_coved': { en: 'Coved', hi: 'कोव्ड' },
  'ceil_btn': { en: 'Change Ceiling', hi: 'छत बदलें' },

  // ── Furniture Remover ───────────────────────────────────────────────────────
  'furn_remove_title': { en: 'Furniture Remover', hi: 'फ़र्नीचर हटाएं' },
  'furn_remove_subtitle': { en: 'Instantly remove furniture and objects from any room photo with AI', hi: 'AI से किसी भी रूम फ़ोटो से फ़र्नीचर और वस्तुएं हटाएं' },
  'furn_remove_hint': { en: 'Draw a mask over the furniture you want to remove', hi: 'जिस फ़र्नीचर को हटाना है उस पर मास्क खींचें' },
  'furn_remove_btn': { en: 'Remove Furniture', hi: 'फ़र्नीचर हटाएं' },
  'furn_remove_clear': { en: 'Clear Mask', hi: 'मास्क हटाएं' },
  'furn_remove_brush_size': { en: 'Brush Size', hi: 'ब्रश का आकार' },

  // ── Furniture Placement ─────────────────────────────────────────────────────
  'furn_place_title': { en: 'Furniture Placement', hi: 'फ़र्नीचर प्लेसमेंट' },
  'furn_place_subtitle': { en: 'Virtually place furniture in your room to see how it looks before buying', hi: 'खरीदने से पहले देखें फ़र्नीचर आपके कमरे में कैसा दिखेगा' },
  'furn_place_select': { en: 'Select Furniture', hi: 'फ़र्नीचर चुनें' },
  'furn_place_btn': { en: 'Place Furniture', hi: 'फ़र्नीचर रखें' },
  'furn_place_category': { en: 'Category', hi: 'श्रेणी' },
  'furn_place_sofa': { en: 'Sofa', hi: 'सोफ़ा' },
  'furn_place_bed': { en: 'Bed', hi: 'बिस्तर' },
  'furn_place_table': { en: 'Table', hi: 'मेज़' },
  'furn_place_chair': { en: 'Chair', hi: 'कुर्सी' },

  // ── Lighting ────────────────────────────────────────────────────────────────
  'light_title': { en: 'Lighting Designer', hi: 'लाइटिंग डिज़ाइनर' },
  'light_subtitle': { en: 'Instantly change the lighting atmosphere of any room', hi: 'किसी भी कमरे की लाइटिंग का माहौल तुरंत बदलें' },
  'light_type_label': { en: 'Lighting Type', hi: 'लाइटिंग का प्रकार' },
  'light_natural': { en: 'Natural Daylight', hi: 'प्राकृतिक दिन की रोशनी' },
  'light_warm': { en: 'Warm Evening', hi: 'गर्म शाम' },
  'light_cool': { en: 'Cool Office', hi: 'ठंडा ऑफ़िस' },
  'light_dramatic': { en: 'Dramatic', hi: 'नाटकीय' },
  'light_golden': { en: 'Golden Hour', hi: 'गोल्डन आवर' },
  'light_intensity': { en: 'Intensity', hi: 'तीव्रता' },
  'light_btn': { en: 'Apply Lighting', hi: 'लाइटिंग लगाएं' },

  // ── Professional Design ─────────────────────────────────────────────────────
  'prof_title': { en: 'Professional Design', hi: 'प्रोफ़ेशनल डिज़ाइन' },
  'prof_subtitle': { en: 'Get a complete interior design package with mood board, materials & cost estimate', hi: 'मूड बोर्ड, सामग्री और लागत अनुमान के साथ पूरा इंटीरियर डिज़ाइन पैकेज पाएं' },
  'prof_style_label': { en: 'Design Style', hi: 'डिज़ाइन स्टाइल' },
  'prof_budget_label': { en: 'Budget Range', hi: 'बजट सीमा' },
  'prof_budget_low': { en: 'Economy (₹50K–₹1L)', hi: 'इकॉनमी (₹50K–₹1L)' },
  'prof_budget_mid': { en: 'Standard (₹1L–₹5L)', hi: 'स्टैंडर्ड (₹1L–₹5L)' },
  'prof_budget_high': { en: 'Premium (₹5L+)', hi: 'प्रीमियम (₹5L+)' },
  'prof_btn': { en: 'Generate Design Package', hi: 'डिज़ाइन पैकेज बनाएं' },
  'prof_moodboard': { en: 'Mood Board', hi: 'मूड बोर्ड' },
  'prof_materials': { en: 'Materials List', hi: 'सामग्री सूची' },
  'prof_cost_estimate': { en: 'Cost Estimate', hi: 'लागत अनुमान' },

  // ── Style Transfer ──────────────────────────────────────────────────────────
  'style_tr_title': { en: 'Style Transfer', hi: 'स्टाइल ट्रांसफ़र' },
  'style_tr_subtitle': { en: "Apply any design style to your room — see your space through a designer's eyes", hi: 'अपने कमरे पर कोई भी डिज़ाइन स्टाइल लगाएं — एक डिज़ाइनर की नज़र से अपनी जगह देखें' },
  'style_tr_target': { en: 'Target Style', hi: 'लक्ष्य स्टाइल' },
  'style_tr_strength': { en: 'Style Strength', hi: 'स्टाइल की तीव्रता' },
  'style_tr_btn': { en: 'Apply Style', hi: 'स्टाइल लगाएं' },
  'style_tr_original': { en: 'Original Room', hi: 'मूल कमरा' },
  'style_tr_result': { en: '{{style}} Style', hi: '{{style}} स्टाइल' },

  // ── Vastu Page ──────────────────────────────────────────────────────────────
  'vastu_page_title': { en: 'Vastu Score', hi: 'वास्तु स्कोर' },
  'vastu_page_subtitle': { en: 'Upload a room photo to get an instant Vastu Shastra compliance score and personalized suggestions', hi: 'वास्तु शास्त्र अनुपालन स्कोर और व्यक्तिगत सुझाव पाने के लिए रूम फ़ोटो अपलोड करें' },
  'vastu_badge_ai': { en: 'AI Element Detection', hi: 'AI तत्व पहचान' },
  'vastu_badge_rules': { en: '120+ Vastu Rules', hi: '120+ वास्तु नियम' },
  'vastu_badge_lang': { en: 'Hindi & English', hi: 'हिंदी और अंग्रेज़ी' },
};
