// constants/pricing-2025-india.ts

export interface LaborRate {
  id: string;
  name: string;
  nameHi: string;
  ratePerDay: number; // INR
  ratePerSqft?: number;
  category: 'skilled' | 'semi-skilled' | 'unskilled' | 'specialized';
  description: string;
  descriptionHi: string;
}

export interface MaterialPrice {
  id: string;
  name: string;
  nameHi: string;
  unit: string;
  unitHi: string;
  priceMin: number; // INR
  priceMax: number;
  priceAvg: number;
  category: string;
  brand?: string;
  quality: 'economy' | 'standard' | 'premium' | 'luxury';
  hsn?: string; // HSN code for GST
  gstRate: number; // percentage
}

export interface ServiceCharge {
  id: string;
  name: string;
  nameHi: string;
  chargeType: 'fixed' | 'percentage' | 'per_sqft' | 'per_unit';
  value: number;
  description: string;
}

// Labor rates across different cities (2025 rates in INR)
export const LABOR_RATES: Record<string, LaborRate[]> = {
  general: [
    {
      id: 'mason',
      name: 'Mason',
      nameHi: 'राजमिस्त्री',
      ratePerDay: 800,
      ratePerSqft: 45,
      category: 'skilled',
      description: 'Brickwork, plastering, and masonry',
      descriptionHi: 'ईंट का काम, प्लास्टरिंग और चिनाई'
    },
    {
      id: 'carpenter',
      name: 'Carpenter',
      nameHi: 'बढ़ई',
      ratePerDay: 850,
      ratePerSqft: 50,
      category: 'skilled',
      description: 'Woodwork, doors, windows, furniture',
      descriptionHi: 'लकड़ी का काम, दरवाजे, खिड़कियां, फर्नीचर'
    },
    {
      id: 'electrician',
      name: 'Electrician',
      nameHi: 'इलेक्ट्रीशियन',
      ratePerDay: 900,
      category: 'skilled',
      description: 'Electrical wiring and fittings',
      descriptionHi: 'बिजली की वायरिंग और फिटिंग'
    },
    {
      id: 'plumber',
      name: 'Plumber',
      nameHi: 'प्लंबर',
      ratePerDay: 850,
      category: 'skilled',
      description: 'Plumbing and sanitary work',
      descriptionHi: 'प्लंबिंग और सैनिटरी का काम'
    },
    {
      id: 'painter',
      name: 'Painter',
      nameHi: 'पेंटर',
      ratePerDay: 700,
      ratePerSqft: 25,
      category: 'skilled',
      description: 'Wall painting and finishing',
      descriptionHi: 'दीवार की पेंटिंग और फिनिशिंग'
    },
    {
      id: 'tile_fitter',
      name: 'Tile Fitter',
      nameHi: 'टाइल फिटर',
      ratePerDay: 800,
      ratePerSqft: 35,
      category: 'skilled',
      description: 'Floor and wall tile fitting',
      descriptionHi: 'फर्श और दीवार टाइल फिटिंग'
    },
    {
      id: 'welder',
      name: 'Welder',
      nameHi: 'वेल्डर',
      ratePerDay: 900,
      category: 'skilled',
      description: 'Metal fabrication and welding',
      descriptionHi: 'धातु निर्माण और वेल्डिंग'
    },
    {
      id: 'ac_technician',
      name: 'AC Technician',
      nameHi: 'एसी टेक्नीशियन',
      ratePerDay: 1000,
      category: 'specialized',
      description: 'AC installation and maintenance',
      descriptionHi: 'एसी इंस्टॉलेशन और मेंटेनेंस'
    },
    {
      id: 'false_ceiling',
      name: 'False Ceiling Expert',
      nameHi: 'फॉल्स सीलिंग विशेषज्ञ',
      ratePerDay: 900,
      ratePerSqft: 40,
      category: 'specialized',
      description: 'False ceiling installation',
      descriptionHi: 'फॉल्स सीलिंग इंस्टॉलेशन'
    },
    {
      id: 'helper',
      name: 'Helper/Labor',
      nameHi: 'हेल्पर/मजदूर',
      ratePerDay: 500,
      category: 'unskilled',
      description: 'General assistance work',
      descriptionHi: 'सामान्य सहायता कार्य'
    },
    {
      id: 'supervisor',
      name: 'Site Supervisor',
      nameHi: 'साइट सुपरवाइजर',
      ratePerDay: 1200,
      category: 'skilled',
      description: 'Site supervision and management',
      descriptionHi: 'साइट पर्यवेक्षण और प्रबंधन'
    },
    {
      id: 'interior_designer',
      name: 'Interior Designer',
      nameHi: 'इंटीरियर डिजाइनर',
      ratePerDay: 3000,
      category: 'specialized',
      description: 'Design consultation and planning',
      descriptionHi: 'डिजाइन परामर्श और योजना'
    },
    {
      id: 'modular_kitchen',
      name: 'Modular Kitchen Expert',
      nameHi: 'मॉड्यूलर किचन विशेषज्ञ',
      ratePerDay: 1200,
      ratePerSqft: 75,
      category: 'specialized',
      description: 'Modular kitchen installation',
      descriptionHi: 'मॉड्यूलर किचन इंस्टॉलेशन'
    },
    {
      id: 'glass_fitter',
      name: 'Glass Fitter',
      nameHi: 'ग्लास फिटर',
      ratePerDay: 1000,
      category: 'specialized',
      description: 'Glass work and installation',
      descriptionHi: 'ग्लास वर्क और इंस्टॉलेशन'
    },
    {
      id: 'waterproofing',
      name: 'Waterproofing Expert',
      nameHi: 'वाटरप्रूफिंग विशेषज्ञ',
      ratePerDay: 950,
      ratePerSqft: 30,
      category: 'specialized',
      description: 'Waterproofing treatment',
      descriptionHi: 'वाटरप्रूफिंग ट्रीटमेंट'
    }
  ]
};

// City-wise labor rate multipliers
export const CITY_LABOR_MULTIPLIERS: Record<string, number> = {
  'mumbai': 1.4,
  'delhi': 1.3,
  'bangalore': 1.35,
  'chennai': 1.15,
  'kolkata': 1.1,
  'hyderabad': 1.2,
  'pune': 1.25,
  'ahmedabad': 1.1,
  'gurgaon': 1.35,
  'noida': 1.3,
  'ghaziabad': 1.2,
  'faridabad': 1.2,
  'jaipur': 1.05,
  'lucknow': 1.0,
  'chandigarh': 1.15,
  'indore': 1.0,
  'bhopal': 0.95,
  'patna': 0.9,
  'nagpur': 1.0,
  'surat': 1.1,
  'kochi': 1.2,
  'thiruvananthapuram': 1.15,
  'coimbatore': 1.1,
  'visakhapatnam': 1.05,
  'vadodara': 1.05,
  'ludhiana': 1.0,
  'agra': 0.95,
  'varanasi': 0.9,
  'nashik': 1.0,
  'rajkot': 1.0,
  'default': 1.0
};

// Material prices (2025 India rates in INR)
export const MATERIAL_PRICES: MaterialPrice[] = [
  // Cement
  {
    id: 'cement_opc_43',
    name: 'OPC 43 Grade Cement',
    nameHi: 'ओपीसी 43 ग्रेड सीमेंट',
    unit: 'bag (50kg)',
    unitHi: 'बैग (50 किलो)',
    priceMin: 320,
    priceMax: 380,
    priceAvg: 350,
    category: 'cement',
    quality: 'standard',
    gstRate: 28
  },
  {
    id: 'cement_opc_53',
    name: 'OPC 53 Grade Cement',
    nameHi: 'ओपीसी 53 ग्रेड सीमेंट',
    unit: 'bag (50kg)',
    unitHi: 'बैग (50 किलो)',
    priceMin: 350,
    priceMax: 420,
    priceAvg: 385,
    category: 'cement',
    quality: 'premium',
    gstRate: 28
  },
  {
    id: 'cement_ppc',
    name: 'PPC Cement',
    nameHi: 'पीपीसी सीमेंट',
    unit: 'bag (50kg)',
    unitHi: 'बैग (50 किलो)',
    priceMin: 310,
    priceMax: 360,
    priceAvg: 335,
    category: 'cement',
    quality: 'standard',
    gstRate: 28
  },

  // Sand & Aggregates
  {
    id: 'river_sand',
    name: 'River Sand',
    nameHi: 'नदी रेत',
    unit: 'cubic feet',
    unitHi: 'घन फीट',
    priceMin: 55,
    priceMax: 75,
    priceAvg: 65,
    category: 'aggregates',
    quality: 'standard',
    gstRate: 5
  },
  {
    id: 'm_sand',
    name: 'M-Sand (Manufactured)',
    nameHi: 'एम-सैंड (निर्मित)',
    unit: 'cubic feet',
    unitHi: 'घन फीट',
    priceMin: 40,
    priceMax: 55,
    priceAvg: 48,
    category: 'aggregates',
    quality: 'standard',
    gstRate: 5
  },
  {
    id: 'aggregate_20mm',
    name: '20mm Aggregate',
    nameHi: '20mm गिट्टी',
    unit: 'cubic feet',
    unitHi: 'घन फीट',
    priceMin: 45,
    priceMax: 60,
    priceAvg: 52,
    category: 'aggregates',
    quality: 'standard',
    gstRate: 5
  },
  {
    id: 'aggregate_10mm',
    name: '10mm Aggregate',
    nameHi: '10mm गिट्टी',
    unit: 'cubic feet',
    unitHi: 'घन फीट',
    priceMin: 50,
    priceMax: 65,
    priceAvg: 58,
    category: 'aggregates',
    quality: 'standard',
    gstRate: 5
  },

  // Bricks
  {
    id: 'red_brick_class1',
    name: 'Red Brick (Class 1)',
    nameHi: 'लाल ईंट (क्लास 1)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 8,
    priceMax: 12,
    priceAvg: 10,
    category: 'bricks',
    quality: 'standard',
    gstRate: 5
  },
  {
    id: 'fly_ash_brick',
    name: 'Fly Ash Brick',
    nameHi: 'फ्लाई ऐश ईंट',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 6,
    priceMax: 9,
    priceAvg: 7.5,
    category: 'bricks',
    quality: 'standard',
    gstRate: 5
  },
  {
    id: 'aac_block',
    name: 'AAC Block (600x200x200)',
    nameHi: 'एएसी ब्लॉक',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 50,
    priceMax: 70,
    priceAvg: 60,
    category: 'bricks',
    quality: 'premium',
    gstRate: 12
  },

  // Steel
  {
    id: 'tmt_steel_8mm',
    name: 'TMT Steel Bar 8mm',
    nameHi: 'टीएमटी स्टील बार 8mm',
    unit: 'kg',
    unitHi: 'किलो',
    priceMin: 58,
    priceMax: 68,
    priceAvg: 63,
    category: 'steel',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'tmt_steel_10mm',
    name: 'TMT Steel Bar 10mm',
    nameHi: 'टीएमटी स्टील बार 10mm',
    unit: 'kg',
    unitHi: 'किलो',
    priceMin: 56,
    priceMax: 66,
    priceAvg: 61,
    category: 'steel',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'tmt_steel_12mm',
    name: 'TMT Steel Bar 12mm',
    nameHi: 'टीएमटी स्टील बार 12mm',
    unit: 'kg',
    unitHi: 'किलो',
    priceMin: 55,
    priceMax: 65,
    priceAvg: 60,
    category: 'steel',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'tmt_steel_16mm',
    name: 'TMT Steel Bar 16mm',
    nameHi: 'टीएमटी स्टील बार 16mm',
    unit: 'kg',
    unitHi: 'किलो',
    priceMin: 54,
    priceMax: 64,
    priceAvg: 59,
    category: 'steel',
    quality: 'standard',
    gstRate: 18
  },

  // Tiles
  {
    id: 'ceramic_floor_tile_standard',
    name: 'Ceramic Floor Tile (2x2)',
    nameHi: 'सिरेमिक फ्लोर टाइल (2x2)',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 35,
    priceMax: 55,
    priceAvg: 45,
    category: 'tiles',
    quality: 'economy',
    gstRate: 18
  },
  {
    id: 'vitrified_tile_standard',
    name: 'Vitrified Tile (2x2)',
    nameHi: 'विट्रीफाइड टाइल (2x2)',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 55,
    priceMax: 85,
    priceAvg: 70,
    category: 'tiles',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'vitrified_tile_premium',
    name: 'Vitrified Tile Premium (2x4)',
    nameHi: 'विट्रीफाइड टाइल प्रीमियम (2x4)',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 85,
    priceMax: 140,
    priceAvg: 110,
    category: 'tiles',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'italian_marble_tile',
    name: 'Italian Marble Tile',
    nameHi: 'इटालियन मार्बल टाइल',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 200,
    priceMax: 500,
    priceAvg: 350,
    category: 'tiles',
    quality: 'luxury',
    gstRate: 28
  },
  {
    id: 'wall_tile_bathroom',
    name: 'Bathroom Wall Tile',
    nameHi: 'बाथरूम वॉल टाइल',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 30,
    priceMax: 60,
    priceAvg: 45,
    category: 'tiles',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'kitchen_wall_tile',
    name: 'Kitchen Wall Tile',
    nameHi: 'किचन वॉल टाइल',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 35,
    priceMax: 70,
    priceAvg: 52,
    category: 'tiles',
    quality: 'standard',
    gstRate: 18
  },

  // Paints
  {
    id: 'interior_emulsion_economy',
    name: 'Interior Emulsion (Economy)',
    nameHi: 'इंटीरियर इमल्शन (इकोनॉमी)',
    unit: 'litre',
    unitHi: 'लीटर',
    priceMin: 150,
    priceMax: 200,
    priceAvg: 175,
    category: 'paints',
    quality: 'economy',
    gstRate: 18
  },
  {
    id: 'interior_emulsion_premium',
    name: 'Interior Emulsion (Premium)',
    nameHi: 'इंटीरियर इमल्शन (प्रीमियम)',
    unit: 'litre',
    unitHi: 'लीटर',
    priceMin: 350,
    priceMax: 500,
    priceAvg: 425,
    category: 'paints',
    brand: 'Asian/Berger',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'exterior_emulsion',
    name: 'Exterior Emulsion',
    nameHi: 'एक्सटीरियर इमल्शन',
    unit: 'litre',
    unitHi: 'लीटर',
    priceMin: 280,
    priceMax: 400,
    priceAvg: 340,
    category: 'paints',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'primer',
    name: 'Primer',
    nameHi: 'प्राइमर',
    unit: 'litre',
    unitHi: 'लीटर',
    priceMin: 120,
    priceMax: 180,
    priceAvg: 150,
    category: 'paints',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'putty',
    name: 'Wall Putty',
    nameHi: 'वॉल पुट्टी',
    unit: 'kg',
    unitHi: 'किलो',
    priceMin: 35,
    priceMax: 55,
    priceAvg: 45,
    category: 'paints',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'texture_paint',
    name: 'Texture Paint',
    nameHi: 'टेक्सचर पेंट',
    unit: 'litre',
    unitHi: 'लीटर',
    priceMin: 500,
    priceMax: 800,
    priceAvg: 650,
    category: 'paints',
    quality: 'premium',
    gstRate: 18
  },

  // Plywood & Wood
  {
    id: 'commercial_plywood_18mm',
    name: 'Commercial Plywood 18mm',
    nameHi: 'कमर्शियल प्लाईवुड 18mm',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 55,
    priceMax: 75,
    priceAvg: 65,
    category: 'plywood',
    quality: 'economy',
    gstRate: 18
  },
  {
    id: 'bwp_plywood_18mm',
    name: 'BWP Plywood 18mm',
    nameHi: 'बीडब्ल्यूपी प्लाईवुड 18mm',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 90,
    priceMax: 120,
    priceAvg: 105,
    category: 'plywood',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'marine_plywood_18mm',
    name: 'Marine Plywood 18mm',
    nameHi: 'मरीन प्लाईवुड 18mm',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 130,
    priceMax: 180,
    priceAvg: 155,
    category: 'plywood',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'mdf_board_18mm',
    name: 'MDF Board 18mm',
    nameHi: 'एमडीएफ बोर्ड 18mm',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 45,
    priceMax: 65,
    priceAvg: 55,
    category: 'plywood',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'hdhmr_board_18mm',
    name: 'HDHMR Board 18mm',
    nameHi: 'एचडीएचएमआर बोर्ड 18mm',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 65,
    priceMax: 90,
    priceAvg: 78,
    category: 'plywood',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'teak_wood',
    name: 'Teak Wood',
    nameHi: 'सागौन की लकड़ी',
    unit: 'cubic feet',
    unitHi: 'घन फुट',
    priceMin: 3000,
    priceMax: 5000,
    priceAvg: 4000,
    category: 'wood',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'sal_wood',
    name: 'Sal Wood',
    nameHi: 'साल की लकड़ी',
    unit: 'cubic feet',
    unitHi: 'घन फुट',
    priceMin: 1800,
    priceMax: 2500,
    priceAvg: 2150,
    category: 'wood',
    quality: 'standard',
    gstRate: 18
  },

  // Electrical
  {
    id: 'copper_wire_1mm',
    name: 'Copper Wire 1mm',
    nameHi: 'कॉपर वायर 1mm',
    unit: 'metre',
    unitHi: 'मीटर',
    priceMin: 20,
    priceMax: 30,
    priceAvg: 25,
    category: 'electrical',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'copper_wire_1.5mm',
    name: 'Copper Wire 1.5mm',
    nameHi: 'कॉपर वायर 1.5mm',
    unit: 'metre',
    unitHi: 'मीटर',
    priceMin: 28,
    priceMax: 40,
    priceAvg: 34,
    category: 'electrical',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'copper_wire_2.5mm',
    name: 'Copper Wire 2.5mm',
    nameHi: 'कॉपर वायर 2.5mm',
    unit: 'metre',
    unitHi: 'मीटर',
    priceMin: 45,
    priceMax: 60,
    priceAvg: 52,
    category: 'electrical',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'modular_switch_board',
    name: 'Modular Switch Board',
    nameHi: 'मॉड्यूलर स्विच बोर्ड',
    unit: 'module',
    unitHi: 'मॉड्यूल',
    priceMin: 80,
    priceMax: 150,
    priceAvg: 115,
    category: 'electrical',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'led_panel_light',
    name: 'LED Panel Light (12W)',
    nameHi: 'एलईडी पैनल लाइट (12W)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 350,
    priceMax: 600,
    priceAvg: 475,
    category: 'electrical',
    quality: 'standard',
    gstRate: 18
  },

  // Plumbing
  {
    id: 'cpvc_pipe_half_inch',
    name: 'CPVC Pipe (1/2 inch)',
    nameHi: 'सीपीवीसी पाइप (1/2 इंच)',
    unit: 'feet',
    unitHi: 'फीट',
    priceMin: 25,
    priceMax: 35,
    priceAvg: 30,
    category: 'plumbing',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'cpvc_pipe_three_quarter',
    name: 'CPVC Pipe (3/4 inch)',
    nameHi: 'सीपीवीसी पाइप (3/4 इंच)',
    unit: 'feet',
    unitHi: 'फीट',
    priceMin: 35,
    priceMax: 50,
    priceAvg: 42,
    category: 'plumbing',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'pvc_pipe_4inch',
    name: 'PVC Pipe (4 inch)',
    nameHi: 'पीवीसी पाइप (4 इंच)',
    unit: 'feet',
    unitHi: 'फीट',
    priceMin: 80,
    priceMax: 120,
    priceAvg: 100,
    category: 'plumbing',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'bathroom_cp_fittings_set',
    name: 'Bathroom CP Fittings Set',
    nameHi: 'बाथरूम सीपी फिटिंग्स सेट',
    unit: 'set',
    unitHi: 'सेट',
    priceMin: 5000,
    priceMax: 15000,
    priceAvg: 10000,
    category: 'plumbing',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'water_tank_1000l',
    name: 'Water Tank (1000L)',
    nameHi: 'पानी की टंकी (1000L)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 6000,
    priceMax: 10000,
    priceAvg: 8000,
    category: 'plumbing',
    quality: 'standard',
    gstRate: 18
  },

  // Sanitary
  {
    id: 'toilet_seat_standard',
    name: 'Toilet Seat (Standard)',
    nameHi: 'टॉयलेट सीट (स्टैंडर्ड)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 3000,
    priceMax: 6000,
    priceAvg: 4500,
    category: 'sanitary',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'toilet_seat_premium',
    name: 'Toilet Seat (Premium)',
    nameHi: 'टॉयलेट सीट (प्रीमियम)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 8000,
    priceMax: 20000,
    priceAvg: 14000,
    category: 'sanitary',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'wash_basin_standard',
    name: 'Wash Basin (Standard)',
    nameHi: 'वॉश बेसिन (स्टैंडर्ड)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 1500,
    priceMax: 3500,
    priceAvg: 2500,
    category: 'sanitary',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'wash_basin_premium',
    name: 'Wash Basin (Premium)',
    nameHi: 'वॉश बेसिन (प्रीमियम)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 5000,
    priceMax: 15000,
    priceAvg: 10000,
    category: 'sanitary',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'shower_set_standard',
    name: 'Shower Set (Standard)',
    nameHi: 'शावर सेट (स्टैंडर्ड)',
    unit: 'set',
    unitHi: 'सेट',
    priceMin: 2000,
    priceMax: 5000,
    priceAvg: 3500,
    category: 'sanitary',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'shower_set_rain',
    name: 'Rain Shower Set',
    nameHi: 'रेन शावर सेट',
    unit: 'set',
    unitHi: 'सेट',
    priceMin: 5000,
    priceMax: 15000,
    priceAvg: 10000,
    category: 'sanitary',
    quality: 'premium',
    gstRate: 18
  },

  // False Ceiling
  {
    id: 'gypsum_board',
    name: 'Gypsum Board',
    nameHi: 'जिप्सम बोर्ड',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 55,
    priceMax: 85,
    priceAvg: 70,
    category: 'false_ceiling',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'pvc_ceiling_panel',
    name: 'PVC Ceiling Panel',
    nameHi: 'पीवीसी सीलिंग पैनल',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 25,
    priceMax: 45,
    priceAvg: 35,
    category: 'false_ceiling',
    quality: 'economy',
    gstRate: 18
  },
  {
    id: 'pop_ceiling',
    name: 'POP Ceiling',
    nameHi: 'पीओपी सीलिंग',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 70,
    priceMax: 110,
    priceAvg: 90,
    category: 'false_ceiling',
    quality: 'standard',
    gstRate: 18
  },

  // Modular Kitchen
  {
    id: 'modular_kitchen_mdf',
    name: 'Modular Kitchen (MDF)',
    nameHi: 'मॉड्यूलर किचन (MDF)',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 1200,
    priceMax: 1800,
    priceAvg: 1500,
    category: 'modular_kitchen',
    quality: 'economy',
    gstRate: 18
  },
  {
    id: 'modular_kitchen_plywood',
    name: 'Modular Kitchen (Plywood)',
    nameHi: 'मॉड्यूलर किचन (प्लाईवुड)',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 1800,
    priceMax: 2800,
    priceAvg: 2300,
    category: 'modular_kitchen',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'modular_kitchen_acrylic',
    name: 'Modular Kitchen (Acrylic Finish)',
    nameHi: 'मॉड्यूलर किचन (एक्रिलिक फिनिश)',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 2500,
    priceMax: 4000,
    priceAvg: 3250,
    category: 'modular_kitchen',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'kitchen_countertop_granite',
    name: 'Kitchen Countertop (Granite)',
    nameHi: 'किचन काउंटरटॉप (ग्रेनाइट)',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 150,
    priceMax: 350,
    priceAvg: 250,
    category: 'modular_kitchen',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'kitchen_countertop_quartz',
    name: 'Kitchen Countertop (Quartz)',
    nameHi: 'किचन काउंटरटॉप (क्वार्ट्ज)',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 350,
    priceMax: 600,
    priceAvg: 475,
    category: 'modular_kitchen',
    quality: 'premium',
    gstRate: 18
  },

  // Windows & Doors
  {
    id: 'aluminium_window',
    name: 'Aluminium Window',
    nameHi: 'एल्युमिनियम खिड़की',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 350,
    priceMax: 550,
    priceAvg: 450,
    category: 'windows_doors',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'upvc_window',
    name: 'UPVC Window',
    nameHi: 'यूपीवीसी खिड़की',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 550,
    priceMax: 850,
    priceAvg: 700,
    category: 'windows_doors',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'wooden_door_flush',
    name: 'Wooden Door (Flush)',
    nameHi: 'लकड़ी का दरवाजा (फ्लश)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 4000,
    priceMax: 8000,
    priceAvg: 6000,
    category: 'windows_doors',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'wooden_door_solid',
    name: 'Wooden Door (Solid)',
    nameHi: 'लकड़ी का दरवाजा (सॉलिड)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 12000,
    priceMax: 25000,
    priceAvg: 18500,
    category: 'windows_doors',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'main_door_teak',
    name: 'Main Door (Teak Wood)',
    nameHi: 'मेन डोर (सागौन)',
    unit: 'piece',
    unitHi: 'पीस',
    priceMin: 35000,
    priceMax: 80000,
    priceAvg: 57500,
    category: 'windows_doors',
    quality: 'luxury',
    gstRate: 18
  },

  // Flooring
  {
    id: 'wooden_flooring_laminate',
    name: 'Laminate Wooden Flooring',
    nameHi: 'लैमिनेट वुडन फ्लोरिंग',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 80,
    priceMax: 150,
    priceAvg: 115,
    category: 'flooring',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'wooden_flooring_engineered',
    name: 'Engineered Wood Flooring',
    nameHi: 'इंजीनियर्ड वुड फ्लोरिंग',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 180,
    priceMax: 350,
    priceAvg: 265,
    category: 'flooring',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'marble_flooring',
    name: 'Marble Flooring',
    nameHi: 'मार्बल फ्लोरिंग',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 100,
    priceMax: 300,
    priceAvg: 200,
    category: 'flooring',
    quality: 'premium',
    gstRate: 18
  },
  {
    id: 'granite_flooring',
    name: 'Granite Flooring',
    nameHi: 'ग्रेनाइट फ्लोरिंग',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 80,
    priceMax: 200,
    priceAvg: 140,
    category: 'flooring',
    quality: 'standard',
    gstRate: 18
  },

  // Waterproofing
  {
    id: 'waterproofing_chemical',
    name: 'Waterproofing Chemical',
    nameHi: 'वाटरप्रूफिंग केमिकल',
    unit: 'litre',
    unitHi: 'लीटर',
    priceMin: 300,
    priceMax: 500,
    priceAvg: 400,
    category: 'waterproofing',
    quality: 'standard',
    gstRate: 18
  },
  {
    id: 'waterproofing_membrane',
    name: 'Waterproofing Membrane',
    nameHi: 'वाटरप्रूफिंग मेंब्रेन',
    unit: 'sq ft',
    unitHi: 'वर्ग फुट',
    priceMin: 25,
    priceMax: 45,
    priceAvg: 35,
    category: 'waterproofing',
    quality: 'standard',
    gstRate: 18
  }
];

// Service charges
export const SERVICE_CHARGES: ServiceCharge[] = [
  {
    id: 'design_consultation',
    name: 'Design Consultation',
    nameHi: 'डिजाइन परामर्श',
    chargeType: 'fixed',
    value: 5000,
    description: 'Initial design consultation and planning'
  },
  {
    id: '3d_design',
    name: '3D Design & Visualization',
    nameHi: '3D डिजाइन और विज़ुअलाइजेशन',
    chargeType: 'per_sqft',
    value: 50,
    description: '3D rendering and visualization'
  },
  {
    id: 'project_management',
    name: 'Project Management',
    nameHi: 'प्रोजेक्ट मैनेजमेंट',
    chargeType: 'percentage',
    value: 10,
    description: 'Site supervision and project management'
  },
  {
    id: 'transportation',
    name: 'Material Transportation',
    nameHi: 'सामग्री परिवहन',
    chargeType: 'percentage',
    value: 5,
    description: 'Material delivery charges'
  },
  {
    id: 'cleaning',
    name: 'Post-work Cleaning',
    nameHi: 'कार्य के बाद सफाई',
    chargeType: 'per_sqft',
    value: 5,
    description: 'Final cleaning after work completion'
  },
  {
    id: 'contingency',
    name: 'Contingency',
    nameHi: 'आकस्मिक खर्च',
    chargeType: 'percentage',
    value: 5,
    description: 'Buffer for unexpected expenses'
  }
];

// Renovation cost per sqft by room type (inclusive of materials and labor)
export const RENOVATION_COST_PER_SQFT: Record<string, {
  economy: { min: number; max: number };
  standard: { min: number; max: number };
  premium: { min: number; max: number };
  luxury: { min: number; max: number };
}> = {
  'living_room': {
    economy: { min: 800, max: 1200 },
    standard: { min: 1200, max: 1800 },
    premium: { min: 1800, max: 2800 },
    luxury: { min: 2800, max: 5000 }
  },
  'bedroom': {
    economy: { min: 750, max: 1100 },
    standard: { min: 1100, max: 1700 },
    premium: { min: 1700, max: 2600 },
    luxury: { min: 2600, max: 4500 }
  },
  'kitchen': {
    economy: { min: 1200, max: 1800 },
    standard: { min: 1800, max: 2800 },
    premium: { min: 2800, max: 4500 },
    luxury: { min: 4500, max: 8000 }
  },
  'bathroom': {
    economy: { min: 1500, max: 2500 },
    standard: { min: 2500, max: 4000 },
    premium: { min: 4000, max: 6500 },
    luxury: { min: 6500, max: 12000 }
  },
  'dining_room': {
    economy: { min: 700, max: 1000 },
    standard: { min: 1000, max: 1500 },
    premium: { min: 1500, max: 2400 },
    luxury: { min: 2400, max: 4000 }
  },
  'home_office': {
    economy: { min: 900, max: 1400 },
    standard: { min: 1400, max: 2200 },
    premium: { min: 2200, max: 3500 },
    luxury: { min: 3500, max: 6000 }
  },
  'balcony': {
    economy: { min: 600, max: 900 },
    standard: { min: 900, max: 1400 },
    premium: { min: 1400, max: 2200 },
    luxury: { min: 2200, max: 3500 }
  },
  'pooja_room': {
    economy: { min: 1000, max: 1500 },
    standard: { min: 1500, max: 2500 },
    premium: { min: 2500, max: 4000 },
    luxury: { min: 4000, max: 8000 }
  },
  'kids_room': {
    economy: { min: 800, max: 1200 },
    standard: { min: 1200, max: 1900 },
    premium: { min: 1900, max: 3000 },
    luxury: { min: 3000, max: 5500 }
  },
  'guest_room': {
    economy: { min: 750, max: 1100 },
    standard: { min: 1100, max: 1600 },
    premium: { min: 1600, max: 2500 },
    luxury: { min: 2500, max: 4200 }
  },
  'full_home': {
    economy: { min: 850, max: 1300 },
    standard: { min: 1300, max: 2000 },
    premium: { min: 2000, max: 3200 },
    luxury: { min: 3200, max: 5500 }
  }
};

// GST rates for different categories
export const GST_RATES: Record<string, number> = {
  'construction_services': 18,
  'interior_design': 18,
  'cement': 28,
  'steel': 18,
  'tiles': 18,
  'sanitary': 18,
  'electrical': 18,
  'plumbing': 18,
  'paints': 18,
  'wood': 18,
  'furniture': 18,
  'appliances': 18,
  'sand_aggregates': 5,
  'bricks': 5
};

// Currency conversion (approximate)
export const CURRENCY_RATES = {
  INR_TO_USD: 0.012,
  USD_TO_INR: 83.5
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    nameHi: 'मुफ्त',
    priceINR: 0,
    priceUSD: 0,
    credits: 5,
    features: [
      '5 AI renders per month',
      'Basic room styles',
      'Standard quality exports',
      'Email support',
      'Vastu basic score'
    ],
    featuresHi: [
      'प्रति माह 5 AI रेंडर',
      'बेसिक रूम स्टाइल्स',
      'स्टैंडर्ड क्वालिटी एक्सपोर्ट',
      'ईमेल सपोर्ट',
      'वास्तु बेसिक स्कोर'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameHi: 'प्रो',
    priceINR: 2499,
    priceUSD: 29,
    credits: 100,
    features: [
      '100 AI renders per month',
      'All 400+ room styles',
      '4K quality exports',
      'Priority support',
      'Full Vastu analysis',
      'Renovation cost calculator',
      'Inpainting & object removal',
      'Commercial use license'
    ],
    featuresHi: [
      'प्रति माह 100 AI रेंडर',
      'सभी 400+ रूम स्टाइल्स',
      '4K क्वालिटी एक्सपोर्ट',
      'प्राथमिकता सपोर्ट',
      'पूर्ण वास्तु विश्लेषण',
      'रेनोवेशन कॉस्ट कैलकुलेटर',
      'इनपेंटिंग और ऑब्जेक्ट रिमूवल',
      'कमर्शियल उपयोग लाइसेंस'
    ]
  },
  teams: {
    id: 'teams',
    name: 'Teams',
    nameHi: 'टीम्स',
    priceINR: 8299,
    priceUSD: 99,
    credits: 500,
    features: [
      '500 AI renders per user/month',
      'All Pro features',
      'Team collaboration',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Training sessions'
    ],
    featuresHi: [
      'प्रति उपयोगकर्ता/माह 500 AI रेंडर',
      'सभी प्रो फीचर्स',
      'टीम कोलैबोरेशन',
      'कस्टम ब्रांडिंग',
      'API एक्सेस',
      'डेडिकेटेड अकाउंट मैनेजर',
      'कस्टम इंटीग्रेशन',
      'SLA गारंटी',
      'ट्रेनिंग सेशंस'
    ]
  }
};

export default {
  LABOR_RATES,
  CITY_LABOR_MULTIPLIERS,
  MATERIAL_PRICES,
  SERVICE_CHARGES,
  RENOVATION_COST_PER_SQFT,
  GST_RATES,
  CURRENCY_RATES,
  SUBSCRIPTION_PLANS
};
