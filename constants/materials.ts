// constants/materials.ts

export interface Material {
  id: string;
  name: string;
  nameHi: string;
  category: MaterialCategory;
  subcategory: string;
  description: string;
  descriptionHi: string;
  priceRange: {
    min: number;
    max: number;
    unit: string;
  };
  quality: 'economy' | 'standard' | 'premium' | 'luxury';
  brands?: string[];
  image?: string;
  specifications?: Record<string, string>;
  advantages?: string[];
  disadvantages?: string[];
  lifespan?: string; // in years
  maintenance?: string;
}

export type MaterialCategory = 
  | 'flooring'
  | 'wall_finishes'
  | 'ceiling'
  | 'kitchen'
  | 'bathroom'
  | 'doors_windows'
  | 'electrical'
  | 'plumbing'
  | 'furniture'
  | 'lighting'
  | 'outdoor'
  | 'structural';

export const MATERIAL_CATEGORIES: Record<MaterialCategory, {
  name: string;
  nameHi: string;
  icon: string;
}> = {
  flooring: {
    name: 'Flooring',
    nameHi: 'फ्लोरिंग',
    icon: '🏠'
  },
  wall_finishes: {
    name: 'Wall Finishes',
    nameHi: 'वॉल फिनिश',
    icon: '🎨'
  },
  ceiling: {
    name: 'Ceiling',
    nameHi: 'सीलिंग',
    icon: '🔲'
  },
  kitchen: {
    name: 'Kitchen',
    nameHi: 'किचन',
    icon: '🍳'
  },
  bathroom: {
    name: 'Bathroom',
    nameHi: 'बाथरूम',
    icon: '🚿'
  },
  doors_windows: {
    name: 'Doors & Windows',
    nameHi: 'दरवाजे और खिड़कियां',
    icon: '🚪'
  },
  electrical: {
    name: 'Electrical',
    nameHi: 'इलेक्ट्रिकल',
    icon: '💡'
  },
  plumbing: {
    name: 'Plumbing',
    nameHi: 'प्लंबिंग',
    icon: '🔧'
  },
  furniture: {
    name: 'Furniture',
    nameHi: 'फर्नीचर',
    icon: '🛋️'
  },
  lighting: {
    name: 'Lighting',
    nameHi: 'लाइटिंग',
    icon: '✨'
  },
  outdoor: {
    name: 'Outdoor',
    nameHi: 'आउटडोर',
    icon: '🌳'
  },
  structural: {
    name: 'Structural',
    nameHi: 'संरचनात्मक',
    icon: '🏗️'
  }
};

export const MATERIALS: Material[] = [
  // Flooring Materials
  {
    id: 'vitrified_tiles',
    name: 'Vitrified Tiles',
    nameHi: 'विट्रीफाइड टाइल्स',
    category: 'flooring',
    subcategory: 'tiles',
    description: 'Durable, low-maintenance ceramic tiles with glass-like finish',
    descriptionHi: 'टिकाऊ, कम रखरखाव वाली सिरेमिक टाइल्स',
    priceRange: { min: 50, max: 150, unit: 'sq ft' },
    quality: 'standard',
    brands: ['Kajaria', 'Somany', 'Johnson', 'Nitco', 'RAK'],
    advantages: ['Durable', 'Easy to clean', 'Wide variety', 'Affordable'],
    disadvantages: ['Cold surface', 'Can be slippery', 'Hard underfoot'],
    lifespan: '25+ years',
    maintenance: 'Regular mopping'
  },
  {
    id: 'italian_marble',
    name: 'Italian Marble',
    nameHi: 'इटालियन मार्बल',
    category: 'flooring',
    subcategory: 'natural_stone',
    description: 'Premium natural marble imported from Italy',
    descriptionHi: 'इटली से आयातित प्रीमियम प्राकृतिक संगमरमर',
    priceRange: { min: 200, max: 600, unit: 'sq ft' },
    quality: 'luxury',
    brands: ['Carrara', 'Calacatta', 'Statuario'],
    advantages: ['Elegant look', 'Unique patterns', 'Cool surface', 'High value'],
    disadvantages: ['Expensive', 'Requires sealing', 'Can stain', 'Heavy'],
    lifespan: '100+ years',
    maintenance: 'Regular sealing and polishing'
  },
  {
    id: 'indian_marble',
    name: 'Indian Marble',
    nameHi: 'भारतीय मार्बल',
    category: 'flooring',
    subcategory: 'natural_stone',
    description: 'Quality marble sourced from Rajasthan',
    descriptionHi: 'राजस्थान से प्राप्त गुणवत्ता वाला मार्बल',
    priceRange: { min: 80, max: 250, unit: 'sq ft' },
    quality: 'premium',
    brands: ['Makrana', 'Ambaji', 'Udaipur Green'],
    advantages: ['Affordable luxury', 'Good quality', 'Local availability'],
    disadvantages: ['Requires maintenance', 'Can stain'],
    lifespan: '50+ years',
    maintenance: 'Regular polishing'
  },
  {
    id: 'granite_flooring',
    name: 'Granite',
    nameHi: 'ग्रेनाइट',
    category: 'flooring',
    subcategory: 'natural_stone',
    description: 'Hard, durable natural stone flooring',
    descriptionHi: 'कठोर, टिकाऊ प्राकृतिक पत्थर फ्लोरिंग',
    priceRange: { min: 70, max: 200, unit: 'sq ft' },
    quality: 'standard',
    brands: ['Black Galaxy', 'Absolute Black', 'Tan Brown'],
    advantages: ['Very durable', 'Scratch resistant', 'Heat resistant'],
    disadvantages: ['Heavy', 'Limited colors', 'Cold'],
    lifespan: '100+ years',
    maintenance: 'Low maintenance'
  },
  {
    id: 'laminate_flooring',
    name: 'Laminate Flooring',
    nameHi: 'लैमिनेट फ्लोरिंग',
    category: 'flooring',
    subcategory: 'wood_alternatives',
    description: 'Affordable wood-look flooring',
    descriptionHi: 'किफायती लकड़ी जैसी दिखने वाली फ्लोरिंग',
    priceRange: { min: 80, max: 200, unit: 'sq ft' },
    quality: 'standard',
    brands: ['Pergo', 'Greenlam', 'Action Tesa', 'Kronotex'],
    advantages: ['Affordable', 'Easy installation', 'Wide variety'],
    disadvantages: ['Not waterproof', 'Cannot refinish', 'Hollow sound'],
    lifespan: '15-25 years',
    maintenance: 'Dry mopping'
  },
  {
    id: 'engineered_wood',
    name: 'Engineered Wood Flooring',
    nameHi: 'इंजीनियर्ड वुड फ्लोरिंग',
    category: 'flooring',
    subcategory: 'wood',
    description: 'Real wood top layer with plywood base',
    descriptionHi: 'प्लाईवुड बेस के साथ असली लकड़ी की टॉप लेयर',
    priceRange: { min: 180, max: 400, unit: 'sq ft' },
    quality: 'premium',
    brands: ['Mikasa', 'Square Foot', 'Pergo'],
    advantages: ['Real wood look', 'Stable', 'Can refinish once'],
    disadvantages: ['Moisture sensitive', 'Limited refinishing'],
    lifespan: '20-30 years',
    maintenance: 'Careful cleaning'
  },
  {
    id: 'solid_hardwood',
    name: 'Solid Hardwood',
    nameHi: 'सॉलिड हार्डवुड',
    category: 'flooring',
    subcategory: 'wood',
    description: 'Premium solid wood flooring',
    descriptionHi: 'प्रीमियम सॉलिड वुड फ्लोरिंग',
    priceRange: { min: 350, max: 800, unit: 'sq ft' },
    quality: 'luxury',
    brands: ['Teak', 'Oak', 'Walnut'],
    advantages: ['Timeless beauty', 'Can refinish multiple times', 'Adds value'],
    disadvantages: ['Very expensive', 'Moisture sensitive', 'Climate dependent'],
    lifespan: '50+ years',
    maintenance: 'Regular care needed'
  },
  {
    id: 'vinyl_flooring',
    name: 'Vinyl/SPC Flooring',
    nameHi: 'विनाइल/एसपीसी फ्लोरिंग',
    category: 'flooring',
    subcategory: 'synthetic',
    description: 'Waterproof, durable synthetic flooring',
    descriptionHi: 'वाटरप्रूफ, टिकाऊ सिंथेटिक फ्लोरिंग',
    priceRange: { min: 100, max: 250, unit: 'sq ft' },
    quality: 'standard',
    brands: ['Welspun', 'LG Hausys', 'Armstrong'],
    advantages: ['100% waterproof', 'Easy installation', 'Comfortable'],
    disadvantages: ['Can dent', 'Not natural', 'VOC concerns'],
    lifespan: '15-20 years',
    maintenance: 'Easy maintenance'
  },
  {
    id: 'ceramic_tiles',
    name: 'Ceramic Tiles',
    nameHi: 'सिरेमिक टाइल्स',
    category: 'flooring',
    subcategory: 'tiles',
    description: 'Budget-friendly tile option',
    descriptionHi: 'बजट-अनुकूल टाइल विकल्प',
    priceRange: { min: 30, max: 60, unit: 'sq ft' },
    quality: 'economy',
    brands: ['Kajaria', 'Somany', 'Orient'],
    advantages: ['Affordable', 'Easy to install', 'Many designs'],
    disadvantages: ['Less durable', 'Can chip', 'Cold surface'],
    lifespan: '15-20 years',
    maintenance: 'Regular cleaning'
  },
  {
    id: 'kota_stone',
    name: 'Kota Stone',
    nameHi: 'कोटा स्टोन',
    category: 'flooring',
    subcategory: 'natural_stone',
    description: 'Traditional Indian limestone flooring',
    descriptionHi: 'पारंपरिक भारतीय चूना पत्थर फ्लोरिंग',
    priceRange: { min: 40, max: 80, unit: 'sq ft' },
    quality: 'economy',
    advantages: ['Affordable', 'Durable', 'Non-slippery'],
    disadvantages: ['Plain look', 'Limited colors', 'Absorbs stains'],
    lifespan: '30+ years',
    maintenance: 'Regular waxing'
  },

  // Wall Finishes
  {
    id: 'emulsion_paint',
    name: 'Interior Emulsion Paint',
    nameHi: 'इंटीरियर इमल्शन पेंट',
    category: 'wall_finishes',
    subcategory: 'paint',
    description: 'Standard interior wall paint',
    descriptionHi: 'स्टैंडर्ड इंटीरियर वॉल पेंट',
    priceRange: { min: 25, max: 45, unit: 'sq ft' },
    quality: 'standard',
    brands: ['Asian Paints', 'Berger', 'Nerolac', 'Dulux'],
    advantages: ['Affordable', 'Easy application', 'Wide colors'],
    disadvantages: ['Needs repainting every 3-5 years'],
    lifespan: '3-5 years',
    maintenance: 'Occasional touch-up'
  },
  {
    id: 'premium_paint',
    name: 'Premium Interior Paint',
    nameHi: 'प्रीमियम इंटीरियर पेंट',
    category: 'wall_finishes',
    subcategory: 'paint',
    description: 'High-quality washable paint',
    descriptionHi: 'उच्च गुणवत्ता वाला धोने योग्य पेंट',
    priceRange: { min: 35, max: 65, unit: 'sq ft' },
    quality: 'premium',
    brands: ['Royale', 'Ultima', 'Excel'],
    advantages: ['Washable', 'Better finish', 'Longer life'],
    disadvantages: ['More expensive'],
    lifespan: '5-7 years',
    maintenance: 'Washable'
  },
  {
    id: 'texture_paint',
    name: 'Texture Paint',
    nameHi: 'टेक्सचर पेंट',
    category: 'wall_finishes',
    subcategory: 'paint',
    description: 'Decorative textured wall finish',
    descriptionHi: 'डेकोरेटिव टेक्सचर्ड वॉल फिनिश',
    priceRange: { min: 50, max: 100, unit: 'sq ft' },
    quality: 'premium',
    brands: ['Royale Play', 'Berger Silk'],
    advantages: ['Unique look', 'Hides imperfections', 'Durable'],
    disadvantages: ['Expensive', 'Difficult to repair'],
    lifespan: '7-10 years',
    maintenance: 'Dust cleaning'
  },
  {
    id: 'wallpaper',
    name: 'Wallpaper',
    nameHi: 'वॉलपेपर',
    category: 'wall_finishes',
    subcategory: 'covering',
    description: 'Decorative wall covering',
    descriptionHi: 'डेकोरेटिव वॉल कवरिंग',
    priceRange: { min: 60, max: 300, unit: 'sq ft' },
    quality: 'standard',
    brands: ['Nilaya', 'Marshall', 'Excel'],
    advantages: ['Wide patterns', 'Quick transformation', 'Repairable'],
    disadvantages: ['Peeling risk', 'Moisture issues'],
    lifespan: '7-10 years',
    maintenance: 'Dry cleaning'
  },
  {
    id: 'wall_paneling',
    name: 'Wall Paneling',
    nameHi: 'वॉल पैनलिंग',
    category: 'wall_finishes',
    subcategory: 'paneling',
    description: 'Decorative wall panels',
    descriptionHi: 'डेकोरेटिव वॉल पैनल्स',
    priceRange: { min: 150, max: 500, unit: 'sq ft' },
    quality: 'premium',
    brands: ['Greenlam', 'Century', 'Merino'],
    advantages: ['Premium look', 'Durable', 'Easy installation'],
    disadvantages: ['Expensive', 'Bulky'],
    lifespan: '15-20 years',
    maintenance: 'Low maintenance'
  },
  {
    id: 'venetian_plaster',
    name: 'Venetian Plaster',
    nameHi: 'वेनेशियन प्लास्टर',
    category: 'wall_finishes',
    subcategory: 'plaster',
    description: 'Luxury polished plaster finish',
    descriptionHi: 'लग्जरी पॉलिश्ड प्लास्टर फिनिश',
    priceRange: { min: 200, max: 500, unit: 'sq ft' },
    quality: 'luxury',
    advantages: ['Luxurious look', 'Unique finish', 'Durable'],
    disadvantages: ['Very expensive', 'Skilled labor needed'],
    lifespan: '20+ years',
    maintenance: 'Occasional waxing'
  },

  // Ceiling
  {
    id: 'pop_ceiling',
    name: 'POP False Ceiling',
    nameHi: 'पीओपी फॉल्स सीलिंग',
    category: 'ceiling',
    subcategory: 'false_ceiling',
    description: 'Plaster of Paris ceiling designs',
    descriptionHi: 'प्लास्टर ऑफ पेरिस सीलिंग डिजाइन',
    priceRange: { min: 70, max: 120, unit: 'sq ft' },
    quality: 'standard',
    advantages: ['Flexible designs', 'Seamless finish', 'Affordable'],
    disadvantages: ['Cracks over time', 'Not moisture resistant'],
    lifespan: '10-15 years',
    maintenance: 'Paint touch-up'
  },
  {
    id: 'gypsum_ceiling',
    name: 'Gypsum False Ceiling',
    nameHi: 'जिप्सम फॉल्स सीलिंग',
    category: 'ceiling',
    subcategory: 'false_ceiling',
    description: 'Pre-fabricated gypsum board ceiling',
    descriptionHi: 'प्री-फैब्रिकेटेड जिप्सम बोर्ड सीलिंग',
    priceRange: { min: 85, max: 150, unit: 'sq ft' },
    quality: 'premium',
    brands: ['Gyproc', 'USG Boral', 'Everest'],
    advantages: ['Fire resistant', 'Uniform finish', 'Quick installation'],
    disadvantages: ['Visible joints possible', 'More expensive than POP'],
    lifespan: '15-20 years',
    maintenance: 'Low maintenance'
  },
  {
    id: 'pvc_ceiling',
    name: 'PVC Ceiling',
    nameHi: 'पीवीसी सीलिंग',
    category: 'ceiling',
    subcategory: 'false_ceiling',
    description: 'Waterproof PVC ceiling panels',
    descriptionHi: 'वाटरप्रूफ पीवीसी सीलिंग पैनल्स',
    priceRange: { min: 35, max: 65, unit: 'sq ft' },
    quality: 'economy',
    advantages: ['Waterproof', 'Low cost', 'Easy installation'],
    disadvantages: ['Plastic look', 'Limited designs'],
    lifespan: '10-15 years',
    maintenance: 'Wipe cleaning'
  },
  {
    id: 'wooden_ceiling',
    name: 'Wooden Ceiling',
    nameHi: 'वुडन सीलिंग',
    category: 'ceiling',
    subcategory: 'false_ceiling',
    description: 'Premium wood panel ceiling',
    descriptionHi: 'प्रीमियम वुड पैनल सीलिंग',
    priceRange: { min: 200, max: 450, unit: 'sq ft' },
    quality: 'luxury',
    advantages: ['Elegant look', 'Acoustic benefits', 'Natural feel'],
    disadvantages: ['Very expensive', 'Termite risk'],
    lifespan: '25+ years',
    maintenance: 'Regular polishing'
  },

  // Kitchen Materials
  {
    id: 'modular_kitchen_mdf',
    name: 'MDF Modular Kitchen',
    nameHi: 'MDF मॉड्यूलर किचन',
    category: 'kitchen',
    subcategory: 'cabinets',
    description: 'MDF board modular kitchen cabinets',
    descriptionHi: 'MDF बोर्ड मॉड्यूलर किचन कैबिनेट',
    priceRange: { min: 1200, max: 1800, unit: 'sq ft' },
    quality: 'economy',
    brands: ['Godrej', 'Sleek', 'Hettich'],
    advantages: ['Affordable', 'Smooth finish', 'Many colors'],
    disadvantages: ['Not waterproof', 'Swelling risk'],
    lifespan: '8-10 years',
    maintenance: 'Keep dry'
  },
  {
    id: 'modular_kitchen_plywood',
    name: 'Plywood Modular Kitchen',
    nameHi: 'प्लाईवुड मॉड्यूलर किचन',
    category: 'kitchen',
    subcategory: 'cabinets',
    description: 'BWP plywood modular kitchen',
    descriptionHi: 'BWP प्लाईवुड मॉड्यूलर किचन',
    priceRange: { min: 1800, max: 2800, unit: 'sq ft' },
    quality: 'standard',
    brands: ['Hafele', 'Blum', 'Hettich'],
    advantages: ['Water resistant', 'Durable', 'Repairable'],
    disadvantages: ['More expensive', 'Heavier'],
    lifespan: '15-20 years',
    maintenance: 'Regular cleaning'
  },
  {
    id: 'modular_kitchen_acrylic',
    name: 'Acrylic Finish Kitchen',
    nameHi: 'एक्रिलिक फिनिश किचन',
    category: 'kitchen',
    subcategory: 'cabinets',
    description: 'High-gloss acrylic finish kitchen',
    descriptionHi: 'हाई-ग्लॉस एक्रिलिक फिनिश किचन',
    priceRange: { min: 2500, max: 4000, unit: 'sq ft' },
    quality: 'premium',
    advantages: ['Glossy look', 'Easy to clean', 'Modern aesthetic'],
    disadvantages: ['Shows fingerprints', 'Scratches visible'],
    lifespan: '15-20 years',
    maintenance: 'Careful cleaning'
  },
  {
    id: 'granite_countertop',
    name: 'Granite Countertop',
    nameHi: 'ग्रेनाइट काउंटरटॉप',
    category: 'kitchen',
    subcategory: 'countertop',
    description: 'Natural granite kitchen countertop',
    descriptionHi: 'नेचुरल ग्रेनाइट किचन काउंटरटॉप',
    priceRange: { min: 150, max: 350, unit: 'sq ft' },
    quality: 'standard',
    advantages: ['Durable', 'Heat resistant', 'Natural beauty'],
    disadvantages: ['Needs sealing', 'Limited patterns'],
    lifespan: '25+ years',
    maintenance: 'Annual sealing'
  },
  {
    id: 'quartz_countertop',
    name: 'Quartz Countertop',
    nameHi: 'क्वार्ट्ज काउंटरटॉप',
    category: 'kitchen',
    subcategory: 'countertop',
    description: 'Engineered quartz countertop',
    descriptionHi: 'इंजीनियर्ड क्वार्ट्ज काउंटरटॉप',
    priceRange: { min: 300, max: 600, unit: 'sq ft' },
    quality: 'premium',
    brands: ['Kalinga Stone', 'Quantra', 'Cosentino'],
    advantages: ['Non-porous', 'Consistent color', 'Durable'],
    disadvantages: ['Expensive', 'Not heat resistant'],
    lifespan: '25+ years',
    maintenance: 'Low maintenance'
  },

  // Bathroom
  {
    id: 'standard_toilet',
    name: 'Standard Toilet',
    nameHi: 'स्टैंडर्ड टॉयलेट',
    category: 'bathroom',
    subcategory: 'sanitary',
    description: 'Standard one-piece toilet',
    descriptionHi: 'स्टैंडर्ड वन-पीस टॉयलेट',
    priceRange: { min: 3000, max: 8000, unit: 'piece' },
    quality: 'standard',
    brands: ['Hindware', 'Parryware', 'Cera'],
    lifespan: '15-20 years'
  },
  {
    id: 'premium_toilet',
    name: 'Premium/Smart Toilet',
    nameHi: 'प्रीमियम/स्मार्ट टॉयलेट',
    category: 'bathroom',
    subcategory: 'sanitary',
    description: 'Premium wall-hung or smart toilet',
    descriptionHi: 'प्रीमियम वॉल-हंग या स्मार्ट टॉयलेट',
    priceRange: { min: 15000, max: 80000, unit: 'piece' },
    quality: 'luxury',
    brands: ['Kohler', 'TOTO', 'Jaquar', 'Duravit'],
    lifespan: '20+ years'
  },
  {
    id: 'rain_shower',
    name: 'Rain Shower System',
    nameHi: 'रेन शावर सिस्टम',
    category: 'bathroom',
    subcategory: 'shower',
    description: 'Overhead rain shower system',
    descriptionHi: 'ओवरहेड रेन शावर सिस्टम',
    priceRange: { min: 5000, max: 25000, unit: 'set' },
    quality: 'premium',
    brands: ['Jaquar', 'Kohler', 'Grohe'],
    lifespan: '10-15 years'
  },

  // Doors & Windows
  {
    id: 'flush_door',
    name: 'Flush Door',
    nameHi: 'फ्लश डोर',
    category: 'doors_windows',
    subcategory: 'doors',
    description: 'Standard flush interior door',
    descriptionHi: 'स्टैंडर्ड फ्लश इंटीरियर डोर',
    priceRange: { min: 4000, max: 8000, unit: 'piece' },
    quality: 'standard',
    brands: ['Greenply', 'Century', 'Action Tesa'],
    lifespan: '15-20 years'
  },
  {
    id: 'solid_wood_door',
    name: 'Solid Wood Door',
    nameHi: 'सॉलिड वुड डोर',
    category: 'doors_windows',
    subcategory: 'doors',
    description: 'Premium solid wood door',
    descriptionHi: 'प्रीमियम सॉलिड वुड डोर',
    priceRange: { min: 15000, max: 50000, unit: 'piece' },
    quality: 'premium',
    lifespan: '30+ years'
  },
  {
    id: 'upvc_window',
    name: 'UPVC Window',
    nameHi: 'UPVC विंडो',
    category: 'doors_windows',
    subcategory: 'windows',
    description: 'Soundproof UPVC window',
    descriptionHi: 'साउंडप्रूफ UPVC विंडो',
    priceRange: { min: 500, max: 900, unit: 'sq ft' },
    quality: 'premium',
    brands: ['Fenesta', 'Prominance', 'Encraft'],
    advantages: ['Soundproof', 'Weather resistant', 'Low maintenance'],
    lifespan: '25+ years'
  },
  {
    id: 'aluminium_window',
    name: 'Aluminium Window',
    nameHi: 'एल्युमीनियम विंडो',
    category: 'doors_windows',
    subcategory: 'windows',
    description: 'Standard aluminium window',
    descriptionHi: 'स्टैंडर्ड एल्युमीनियम विंडो',
    priceRange: { min: 350, max: 600, unit: 'sq ft' },
    quality: 'standard',
    lifespan: '20+ years'
  },

  // Electrical
  {
    id: 'modular_switches',
    name: 'Modular Switches',
    nameHi: 'मॉड्यूलर स्विचेस',
    category: 'electrical',
    subcategory: 'switches',
    description: 'Premium modular switch plates',
    descriptionHi: 'प्रीमियम मॉड्यूलर स्विच प्लेट्स',
    priceRange: { min: 100, max: 400, unit: 'module' },
    quality: 'standard',
    brands: ['Legrand', 'Schneider', 'Anchor Roma', 'Havells'],
    lifespan: '15-20 years'
  },
  {
    id: 'smart_switches',
    name: 'Smart Switches',
    nameHi: 'स्मार्ट स्विचेस',
    category: 'electrical',
    subcategory: 'switches',
    description: 'WiFi-enabled smart switches',
    descriptionHi: 'वाईफाई-एनेबल्ड स्मार्ट स्विचेस',
    priceRange: { min: 500, max: 2000, unit: 'module' },
    quality: 'premium',
    brands: ['Anchor Smart', 'Schneider', 'Philips'],
    lifespan: '10-15 years'
  },
  {
    id: 'led_panel_lights',
    name: 'LED Panel Lights',
    nameHi: 'LED पैनल लाइट्स',
    category: 'electrical',
    subcategory: 'lighting',
    description: 'Recessed LED panel lights',
    descriptionHi: 'रिसेस्ड LED पैनल लाइट्स',
    priceRange: { min: 400, max: 1200, unit: 'piece' },
    quality: 'standard',
    brands: ['Philips', 'Havells', 'Crompton', 'Wipro'],
    lifespan: '10-15 years'
  },

  // Furniture
  {
    id: 'wardrobe_mdf',
    name: 'MDF Wardrobe',
    nameHi: 'MDF वार्डरोब',
    category: 'furniture',
    subcategory: 'storage',
    description: 'Modular MDF wardrobe',
    descriptionHi: 'मॉड्यूलर MDF वार्डरोब',
    priceRange: { min: 800, max: 1500, unit: 'sq ft' },
    quality: 'economy',
    brands: ['Godrej', 'Spacewood', '@home'],
    lifespan: '8-10 years'
  },
  {
    id: 'wardrobe_plywood',
    name: 'Plywood Wardrobe',
    nameHi: 'प्लाईवुड वार्डरोब',
    category: 'furniture',
    subcategory: 'storage',
    description: 'Premium plywood wardrobe',
    descriptionHi: 'प्रीमियम प्लाईवुड वार्डरोब',
    priceRange: { min: 1200, max: 2500, unit: 'sq ft' },
    quality: 'standard',
    lifespan: '15-20 years'
  },
  {
    id: 'sliding_wardrobe',
    name: 'Sliding Door Wardrobe',
    nameHi: 'स्लाइडिंग डोर वार्डरोब',
    category: 'furniture',
    subcategory: 'storage',
    description: 'Space-saving sliding wardrobe',
    descriptionHi: 'स्पेस-सेविंग स्लाइडिंग वार्डरोब',
    priceRange: { min: 1500, max: 3500, unit: 'sq ft' },
    quality: 'premium',
    brands: ['Hafele', 'Hettich', 'Blum'],
    lifespan: '15-20 years'
  }
];

// Get materials by category
export const getMaterialsByCategory = (category: MaterialCategory): Material[] => {
  return MATERIALS.filter(m => m.category === category);
};

// Get materials by quality
export const getMaterialsByQuality = (quality: Material['quality']): Material[] => {
  return MATERIALS.filter(m => m.quality === quality);
};

// Get material by ID
export const getMaterialById = (id: string): Material | undefined => {
  return MATERIALS.find(m => m.id === id);
};

// Calculate material cost
export const calculateMaterialCost = (
  materialId: string,
  quantity: number,
  quality: 'min' | 'avg' | 'max' = 'avg'
): number => {
  const material = getMaterialById(materialId);
  if (!material) return 0;

  const price = quality === 'min' 
    ? material.priceRange.min 
    : quality === 'max' 
    ? material.priceRange.max 
    : (material.priceRange.min + material.priceRange.max) / 2;

  return price * quantity;
};

export default {
  MATERIALS,
  MATERIAL_CATEGORIES,
  getMaterialsByCategory,
  getMaterialsByQuality,
  getMaterialById,
  calculateMaterialCost
};