// constants/cities.ts

export interface City {
  id: string;
  name: string;

  // Your file uses this
  nameHindi: string;

  // Your UI expects this → make optional
  nameHi?: string;

  state: string;

  // Your file uses this
  stateHindi: string;

  // Your UI sometimes expects this
  stateHi?: string;

  tier: 1 | 2 | 3;

  country: 'IN' | 'US' | 'UK' | 'AE' | 'SG' | 'AU' | 'CA';

  costMultiplier: number;

  laborRatePerSqft?: {
    basic: number;
    standard: number;
    premium: number;
    luxury: number;
  };

  materialMarkup?: number;
  avgPropertyRate?: number;

  currency: 'INR' | 'USD' | 'GBP' | 'AED' | 'SGD' | 'AUD' | 'CAD';

  timezone: string;
  popular: boolean;

  // Your UI uses these → make optional so nothing breaks
  region?: string;       
  emoji?: string;        
  population?: number;   
  avgIncome?: number;    

  coordinates: {
    lat: number;
    lng: number;
  };
}


export const INDIAN_CITIES: City[] = [
  // Tier 1 - Metro Cities
  {
    id: 'mumbai',
    name: 'Mumbai',
    nameHindi: 'मुंबई',
    state: 'Maharashtra',
    stateHindi: 'महाराष्ट्र',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.5,
    laborRatePerSqft: {
      basic: 450,
      standard: 750,
      premium: 1200,
      luxury: 2500
    },
    materialMarkup: 25,
    avgPropertyRate: 25000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 19.0760, lng: 72.8777 }
  },
  {
    id: 'delhi',
    name: 'Delhi',
    nameHindi: 'दिल्ली',
    state: 'Delhi',
    stateHindi: 'दिल्ली',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.4,
    laborRatePerSqft: {
      basic: 400,
      standard: 700,
      premium: 1100,
      luxury: 2200
    },
    materialMarkup: 20,
    avgPropertyRate: 18000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 28.6139, lng: 77.2090 }
  },
  {
    id: 'bangalore',
    name: 'Bangalore',
    nameHindi: 'बेंगलुरु',
    state: 'Karnataka',
    stateHindi: 'कर्नाटक',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.35,
    laborRatePerSqft: {
      basic: 380,
      standard: 650,
      premium: 1050,
      luxury: 2000
    },
    materialMarkup: 18,
    avgPropertyRate: 12000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 12.9716, lng: 77.5946 }
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    nameHindi: 'हैदराबाद',
    state: 'Telangana',
    stateHindi: 'तेलंगाना',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.25,
    laborRatePerSqft: {
      basic: 350,
      standard: 600,
      premium: 950,
      luxury: 1800
    },
    materialMarkup: 15,
    avgPropertyRate: 9000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 17.3850, lng: 78.4867 }
  },
  {
    id: 'chennai',
    name: 'Chennai',
    nameHindi: 'चेन्नई',
    state: 'Tamil Nadu',
    stateHindi: 'तमिल नाडु',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.3,
    laborRatePerSqft: {
      basic: 360,
      standard: 620,
      premium: 980,
      luxury: 1900
    },
    materialMarkup: 17,
    avgPropertyRate: 10000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 13.0827, lng: 80.2707 }
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    nameHindi: 'कोलकाता',
    state: 'West Bengal',
    stateHindi: 'पश्चिम बंगाल',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.2,
    laborRatePerSqft: {
      basic: 320,
      standard: 550,
      premium: 900,
      luxury: 1700
    },
    materialMarkup: 14,
    avgPropertyRate: 8000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 22.5726, lng: 88.3639 }
  },
  {
    id: 'pune',
    name: 'Pune',
    nameHindi: 'पुणे',
    state: 'Maharashtra',
    stateHindi: 'महाराष्ट्र',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.25,
    laborRatePerSqft: {
      basic: 340,
      standard: 600,
      premium: 950,
      luxury: 1850
    },
    materialMarkup: 16,
    avgPropertyRate: 10500,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 18.5204, lng: 73.8567 }
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    nameHindi: 'अहमदाबाद',
    state: 'Gujarat',
    stateHindi: 'गुजरात',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.15,
    laborRatePerSqft: {
      basic: 300,
      standard: 520,
      premium: 850,
      luxury: 1600
    },
    materialMarkup: 13,
    avgPropertyRate: 6500,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 23.0225, lng: 72.5714 }
  },

  // Tier 2 Cities
  {
    id: 'jaipur',
    name: 'Jaipur',
    nameHindi: 'जयपुर',
    state: 'Rajasthan',
    stateHindi: 'राजस्थान',
    tier: 2,
    country: 'IN',
    costMultiplier: 1.0,
    laborRatePerSqft: {
      basic: 280,
      standard: 480,
      premium: 780,
      luxury: 1400
    },
    materialMarkup: 12,
    avgPropertyRate: 5500,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 26.9124, lng: 75.7873 }
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    nameHindi: 'लखनऊ',
    state: 'Uttar Pradesh',
    stateHindi: 'उत्तर प्रदेश',
    tier: 2,
    country: 'IN',
    costMultiplier: 0.95,
    laborRatePerSqft: {
      basic: 260,
      standard: 450,
      premium: 720,
      luxury: 1300
    },
    materialMarkup: 11,
    avgPropertyRate: 4800,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 26.8467, lng: 80.9462 }
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh',
    nameHindi: 'चंडीगढ़',
    state: 'Chandigarh',
    stateHindi: 'चंडीगढ़',
    tier: 2,
    country: 'IN',
    costMultiplier: 1.1,
    laborRatePerSqft: {
      basic: 300,
      standard: 520,
      premium: 840,
      luxury: 1550
    },
    materialMarkup: 14,
    avgPropertyRate: 7000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 30.7333, lng: 76.7794 }
  },
  {
    id: 'kochi',
    name: 'Kochi',
    nameHindi: 'कोच्चि',
    state: 'Kerala',
    stateHindi: 'केरल',
    tier: 2,
    country: 'IN',
    costMultiplier: 1.05,
    laborRatePerSqft: {
      basic: 290,
      standard: 500,
      premium: 800,
      luxury: 1500
    },
    materialMarkup: 13,
    avgPropertyRate: 6000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 9.9312, lng: 76.2673 }
  },
  {
    id: 'indore',
    name: 'Indore',
    nameHindi: 'इंदौर',
    state: 'Madhya Pradesh',
    stateHindi: 'मध्य प्रदेश',
    tier: 2,
    country: 'IN',
    costMultiplier: 0.9,
    laborRatePerSqft: {
      basic: 250,
      standard: 430,
      premium: 700,
      luxury: 1250
    },
    materialMarkup: 10,
    avgPropertyRate: 4200,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 22.7196, lng: 75.8577 }
  },
  {
    id: 'nagpur',
    name: 'Nagpur',
    nameHindi: 'नागपुर',
    state: 'Maharashtra',
    stateHindi: 'महाराष्ट्र',
    tier: 2,
    country: 'IN',
    costMultiplier: 0.95,
    laborRatePerSqft: {
      basic: 260,
      standard: 450,
      premium: 720,
      luxury: 1350
    },
    materialMarkup: 11,
    avgPropertyRate: 4500,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 21.1458, lng: 79.0882 }
  },
  {
    id: 'surat',
    name: 'Surat',
    nameHindi: 'सूरत',
    state: 'Gujarat',
    stateHindi: 'गुजरात',
    tier: 2,
    country: 'IN',
    costMultiplier: 1.0,
    laborRatePerSqft: {
      basic: 270,
      standard: 470,
      premium: 750,
      luxury: 1400
    },
    materialMarkup: 12,
    avgPropertyRate: 5000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 21.1702, lng: 72.8311 }
  },
  {
    id: 'vadodara',
    name: 'Vadodara',
    nameHindi: 'वडोदरा',
    state: 'Gujarat',
    stateHindi: 'गुजरात',
    tier: 2,
    country: 'IN',
    costMultiplier: 0.95,
    laborRatePerSqft: {
      basic: 260,
      standard: 450,
      premium: 720,
      luxury: 1300
    },
    materialMarkup: 11,
    avgPropertyRate: 4600,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 22.3072, lng: 73.1812 }
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    nameHindi: 'कोयम्बटूर',
    state: 'Tamil Nadu',
    stateHindi: 'तमिल नाडु',
    tier: 2,
    country: 'IN',
    costMultiplier: 0.95,
    laborRatePerSqft: {
      basic: 260,
      standard: 450,
      premium: 720,
      luxury: 1350
    },
    materialMarkup: 11,
    avgPropertyRate: 5200,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 11.0168, lng: 76.9558 }
  },
  {
    id: 'visakhapatnam',
    name: 'Visakhapatnam',
    nameHindi: 'विशाखापत्तनम',
    state: 'Andhra Pradesh',
    stateHindi: 'आंध्र प्रदेश',
    tier: 2,
    country: 'IN',
    costMultiplier: 0.9,
    laborRatePerSqft: {
      basic: 250,
      standard: 430,
      premium: 700,
      luxury: 1280
    },
    materialMarkup: 10,
    avgPropertyRate: 4800,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 17.6868, lng: 83.2185 }
  },
  {
    id: 'bhopal',
    name: 'Bhopal',
    nameHindi: 'भोपाल',
    state: 'Madhya Pradesh',
    stateHindi: 'मध्य प्रदेश',
    tier: 2,
    country: 'IN',
    costMultiplier: 0.88,
    laborRatePerSqft: {
      basic: 240,
      standard: 420,
      premium: 680,
      luxury: 1200
    },
    materialMarkup: 10,
    avgPropertyRate: 4000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 23.2599, lng: 77.4126 }
  },
  {
    id: 'patna',
    name: 'Patna',
    nameHindi: 'पटना',
    state: 'Bihar',
    stateHindi: 'बिहार',
    tier: 2,
    country: 'IN',
    costMultiplier: 0.85,
    laborRatePerSqft: {
      basic: 230,
      standard: 400,
      premium: 650,
      luxury: 1150
    },
    materialMarkup: 10,
    avgPropertyRate: 3800,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 25.5941, lng: 85.1376 }
  },
  {
    id: 'thiruvananthapuram',
    name: 'Thiruvananthapuram',
    nameHindi: 'तिरुवनंतपुरम',
    state: 'Kerala',
    stateHindi: 'केरल',
    tier: 2,
    country: 'IN',
    costMultiplier: 1.0,
    laborRatePerSqft: {
      basic: 280,
      standard: 480,
      premium: 780,
      luxury: 1450
    },
    materialMarkup: 12,
    avgPropertyRate: 5500,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 8.5241, lng: 76.9366 }
  },
  {
    id: 'gurgaon',
    name: 'Gurgaon',
    nameHindi: 'गुरुग्राम',
    state: 'Haryana',
    stateHindi: 'हरियाणा',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.35,
    laborRatePerSqft: {
      basic: 380,
      standard: 650,
      premium: 1050,
      luxury: 2100
    },
    materialMarkup: 18,
    avgPropertyRate: 12000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 28.4595, lng: 77.0266 }
  },
  {
    id: 'noida',
    name: 'Noida',
    nameHindi: 'नोएडा',
    state: 'Uttar Pradesh',
    stateHindi: 'उत्तर प्रदेश',
    tier: 1,
    country: 'IN',
    costMultiplier: 1.25,
    laborRatePerSqft: {
      basic: 350,
      standard: 600,
      premium: 960,
      luxury: 1850
    },
    materialMarkup: 16,
    avgPropertyRate: 8500,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 28.5355, lng: 77.3910 }
  },

  // Tier 3 Cities
  {
    id: 'dehradun',
    name: 'Dehradun',
    nameHindi: 'देहरादून',
    state: 'Uttarakhand',
    stateHindi: 'उत्तराखंड',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.85,
    laborRatePerSqft: {
      basic: 230,
      standard: 400,
      premium: 650,
      luxury: 1150
    },
    materialMarkup: 10,
    avgPropertyRate: 4500,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 30.3165, lng: 78.0322 }
  },
  {
    id: 'mysore',
    name: 'Mysore',
    nameHindi: 'मैसूर',
    state: 'Karnataka',
    stateHindi: 'कर्नाटक',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.85,
    laborRatePerSqft: {
      basic: 230,
      standard: 400,
      premium: 650,
      luxury: 1180
    },
    materialMarkup: 10,
    avgPropertyRate: 4200,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 12.2958, lng: 76.6394 }
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    nameHindi: 'उदयपुर',
    state: 'Rajasthan',
    stateHindi: 'राजस्थान',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.82,
    laborRatePerSqft: {
      basic: 220,
      standard: 380,
      premium: 620,
      luxury: 1100
    },
    materialMarkup: 9,
    avgPropertyRate: 3800,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 24.5854, lng: 73.7125 }
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    nameHindi: 'वाराणसी',
    state: 'Uttar Pradesh',
    stateHindi: 'उत्तर प्रदेश',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.8,
    laborRatePerSqft: {
      basic: 210,
      standard: 360,
      premium: 600,
      luxury: 1050
    },
    materialMarkup: 9,
    avgPropertyRate: 3500,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 25.3176, lng: 82.9739 }
  },
  {
    id: 'goa',
    name: 'Goa',
    nameHindi: 'गोवा',
    state: 'Goa',
    stateHindi: 'गोवा',
    tier: 2,
    country: 'IN',
    costMultiplier: 1.15,
    laborRatePerSqft: {
      basic: 320,
      standard: 550,
      premium: 880,
      luxury: 1650
    },
    materialMarkup: 15,
    avgPropertyRate: 8000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: true,
    coordinates: { lat: 15.2993, lng: 74.1240 }
  },
  {
    id: 'pondicherry',
    name: 'Pondicherry',
    nameHindi: 'पांडिचेरी',
    state: 'Puducherry',
    stateHindi: 'पुडुचेरी',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.9,
    laborRatePerSqft: {
      basic: 250,
      standard: 430,
      premium: 700,
      luxury: 1250
    },
    materialMarkup: 11,
    avgPropertyRate: 5000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 11.9416, lng: 79.8083 }
  },
  {
    id: 'amritsar',
    name: 'Amritsar',
    nameHindi: 'अमृतसर',
    state: 'Punjab',
    stateHindi: 'पंजाब',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.88,
    laborRatePerSqft: {
      basic: 240,
      standard: 420,
      premium: 680,
      luxury: 1200
    },
    materialMarkup: 10,
    avgPropertyRate: 4000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 31.6340, lng: 74.8723 }
  },
  {
    id: 'ranchi',
    name: 'Ranchi',
    nameHindi: 'रांची',
    state: 'Jharkhand',
    stateHindi: 'झारखंड',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.78,
    laborRatePerSqft: {
      basic: 200,
      standard: 350,
      premium: 580,
      luxury: 1000
    },
    materialMarkup: 8,
    avgPropertyRate: 3200,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 23.3441, lng: 85.3096 }
  },
  {
    id: 'bhubaneswar',
    name: 'Bhubaneswar',
    nameHindi: 'भुवनेश्वर',
    state: 'Odisha',
    stateHindi: 'ओडिशा',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.82,
    laborRatePerSqft: {
      basic: 220,
      standard: 380,
      premium: 620,
      luxury: 1100
    },
    materialMarkup: 9,
    avgPropertyRate: 3800,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 20.2961, lng: 85.8245 }
  },
  {
    id: 'guwahati',
    name: 'Guwahati',
    nameHindi: 'गुवाहाटी',
    state: 'Assam',
    stateHindi: 'असम',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.85,
    laborRatePerSqft: {
      basic: 230,
      standard: 400,
      premium: 650,
      luxury: 1150
    },
    materialMarkup: 12,
    avgPropertyRate: 4000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 26.1445, lng: 91.7362 }
  },
  {
    id: 'shimla',
    name: 'Shimla',
    nameHindi: 'शिमला',
    state: 'Himachal Pradesh',
    stateHindi: 'हिमाचल प्रदेश',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.95,
    laborRatePerSqft: {
      basic: 260,
      standard: 450,
      premium: 720,
      luxury: 1300
    },
    materialMarkup: 15,
    avgPropertyRate: 7000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 31.1048, lng: 77.1734 }
  },
  {
    id: 'raipur',
    name: 'Raipur',
    nameHindi: 'रायपुर',
    state: 'Chhattisgarh',
    stateHindi: 'छत्तीसगढ़',
    tier: 3,
    country: 'IN',
    costMultiplier: 0.78,
    laborRatePerSqft: {
      basic: 200,
      standard: 350,
      premium: 580,
      luxury: 1000
    },
    materialMarkup: 8,
    avgPropertyRate: 3000,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    popular: false,
    coordinates: { lat: 21.2514, lng: 81.6296 }
  }
];

export const INTERNATIONAL_CITIES: City[] = [
  // United States
  {
    id: 'new-york',
    name: 'New York',
    nameHindi: 'न्यूयॉर्क',
    state: 'New York',
    stateHindi: 'न्यूयॉर्क',
    tier: 1,
    country: 'US',
    costMultiplier: 2.5,
    laborRatePerSqft: {
      basic: 35,
      standard: 55,
      premium: 90,
      luxury: 180
    },
    materialMarkup: 25,
    avgPropertyRate: 1500,
    currency: 'USD',
    timezone: 'America/New_York',
    popular: true,
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    nameHindi: 'लॉस एंजिल्स',
    state: 'California',
    stateHindi: 'कैलिफोर्निया',
    tier: 1,
    country: 'US',
    costMultiplier: 2.2,
    laborRatePerSqft: {
      basic: 32,
      standard: 50,
      premium: 85,
      luxury: 160
    },
    materialMarkup: 22,
    avgPropertyRate: 1200,
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    popular: true,
    coordinates: { lat: 34.0522, lng: -118.2437 }
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    nameHindi: 'सैन फ्रांसिस्को',
    state: 'California',
    stateHindi: 'कैलिफोर्निया',
    tier: 1,
    country: 'US',
    costMultiplier: 2.6,
    laborRatePerSqft: {
      basic: 38,
      standard: 60,
      premium: 100,
      luxury: 200
    },
    materialMarkup: 28,
    avgPropertyRate: 1800,
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    popular: true,
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  {
    id: 'chicago',
    name: 'Chicago',
    nameHindi: 'शिकागो',
    state: 'Illinois',
    stateHindi: 'इलिनोइस',
    tier: 1,
    country: 'US',
    costMultiplier: 1.8,
    laborRatePerSqft: {
      basic: 28,
      standard: 45,
      premium: 75,
      luxury: 140
    },
    materialMarkup: 18,
    avgPropertyRate: 350,
    currency: 'USD',
    timezone: 'America/Chicago',
    popular: true,
    coordinates: { lat: 41.8781, lng: -87.6298 }
  },
  {
    id: 'miami',
    name: 'Miami',
    nameHindi: 'मियामी',
    state: 'Florida',
    stateHindi: 'फ्लोरिडा',
    tier: 1,
    country: 'US',
    costMultiplier: 1.9,
    laborRatePerSqft: {
      basic: 30,
      standard: 48,
      premium: 80,
      luxury: 150
    },
    materialMarkup: 20,
    avgPropertyRate: 600,
    currency: 'USD',
    timezone: 'America/New_York',
    popular: true,
    coordinates: { lat: 25.7617, lng: -80.1918 }
  },
  {
    id: 'houston',
    name: 'Houston',
    nameHindi: 'ह्यूस्टन',
    state: 'Texas',
    stateHindi: 'टेक्सास',
    tier: 1,
    country: 'US',
    costMultiplier: 1.5,
    laborRatePerSqft: {
      basic: 25,
      standard: 40,
      premium: 65,
      luxury: 120
    },
    materialMarkup: 15,
    avgPropertyRate: 250,
    currency: 'USD',
    timezone: 'America/Chicago',
    popular: false,
    coordinates: { lat: 29.7604, lng: -95.3698 }
  },
  {
    id: 'seattle',
    name: 'Seattle',
    nameHindi: 'सिएटल',
    state: 'Washington',
    stateHindi: 'वाशिंगटन',
    tier: 1,
    country: 'US',
    costMultiplier: 2.0,
    laborRatePerSqft: {
      basic: 32,
      standard: 50,
      premium: 85,
      luxury: 160
    },
    materialMarkup: 20,
    avgPropertyRate: 700,
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    popular: true,
    coordinates: { lat: 47.6062, lng: -122.3321 }
  },

  // United Kingdom
  {
    id: 'london',
    name: 'London',
    nameHindi: 'लंदन',
    state: 'England',
    stateHindi: 'इंग्लैंड',
    tier: 1,
    country: 'UK',
    costMultiplier: 2.4,
    laborRatePerSqft: {
      basic: 35,
      standard: 55,
      premium: 90,
      luxury: 180
    },
    materialMarkup: 25,
    avgPropertyRate: 1100,
    currency: 'GBP',
    timezone: 'Europe/London',
    popular: true,
    coordinates: { lat: 51.5074, lng: -0.1278 }
  },
  {
    id: 'manchester',
    name: 'Manchester',
    nameHindi: 'मैनचेस्टर',
    state: 'England',
    stateHindi: 'इंग्लैंड',
    tier: 2,
    country: 'UK',
    costMultiplier: 1.6,
    laborRatePerSqft: {
      basic: 25,
      standard: 40,
      premium: 65,
      luxury: 120
    },
    materialMarkup: 18,
    avgPropertyRate: 300,
    currency: 'GBP',
    timezone: 'Europe/London',
    popular: false,
    coordinates: { lat: 53.4808, lng: -2.2426 }
  },

  // UAE
  {
    id: 'dubai',
    name: 'Dubai',
    nameHindi: 'दुबई',
    state: 'Dubai',
    stateHindi: 'दुबई',
    tier: 1,
    country: 'AE',
    costMultiplier: 2.0,
    laborRatePerSqft: {
      basic: 45,
      standard: 75,
      premium: 120,
      luxury: 250
    },
    materialMarkup: 20,
    avgPropertyRate: 1500,
    currency: 'AED',
    timezone: 'Asia/Dubai',
    popular: true,
    coordinates: { lat: 25.2048, lng: 55.2708 }
  },
  {
    id: 'abu-dhabi',
    name: 'Abu Dhabi',
    nameHindi: 'अबू धाबी',
    state: 'Abu Dhabi',
    stateHindi: 'अबू धाबी',
    tier: 1,
    country: 'AE',
    costMultiplier: 1.9,
    laborRatePerSqft: {
      basic: 42,
      standard: 70,
      premium: 115,
      luxury: 230
    },
    materialMarkup: 18,
    avgPropertyRate: 1300,
    currency: 'AED',
    timezone: 'Asia/Dubai',
    popular: false,
    coordinates: { lat: 24.4539, lng: 54.3773 }
  },

  // Singapore
  {
    id: 'singapore',
    name: 'Singapore',
    nameHindi: 'सिंगापुर',
    state: 'Singapore',
    stateHindi: 'सिंगापुर',
    tier: 1,
    country: 'SG',
    costMultiplier: 2.2,
    laborRatePerSqft: {
      basic: 45,
      standard: 75,
      premium: 120,
      luxury: 240
    },
    materialMarkup: 22,
    avgPropertyRate: 2000,
    currency: 'SGD',
    timezone: 'Asia/Singapore',
    popular: true,
    coordinates: { lat: 1.3521, lng: 103.8198 }
  },

  // Australia
  {
    id: 'sydney',
    name: 'Sydney',
    nameHindi: 'सिडनी',
    state: 'New South Wales',
    stateHindi: 'न्यू साउथ वेल्स',
    tier: 1,
    country: 'AU',
    costMultiplier: 2.1,
    laborRatePerSqft: {
      basic: 40,
      standard: 65,
      premium: 105,
      luxury: 200
    },
    materialMarkup: 22,
    avgPropertyRate: 1400,
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    popular: true,
    coordinates: { lat: -33.8688, lng: 151.2093 }
  },
  {
    id: 'melbourne',
    name: 'Melbourne',
    nameHindi: 'मेलबर्न',
    state: 'Victoria',
    stateHindi: 'विक्टोरिया',
    tier: 1,
    country: 'AU',
    costMultiplier: 1.9,
    laborRatePerSqft: {
      basic: 38,
      standard: 60,
      premium: 95,
      luxury: 180
    },
    materialMarkup: 20,
    avgPropertyRate: 1000,
    currency: 'AUD',
    timezone: 'Australia/Melbourne',
    popular: true,
    coordinates: { lat: -37.8136, lng: 144.9631 }
  },

  // Canada
  {
    id: 'toronto',
    name: 'Toronto',
    nameHindi: 'टोरंटो',
    state: 'Ontario',
    stateHindi: 'ओंटारियो',
    tier: 1,
    country: 'CA',
    costMultiplier: 2.0,
    laborRatePerSqft: {
      basic: 35,
      standard: 55,
      premium: 90,
      luxury: 170
    },
    materialMarkup: 20,
    avgPropertyRate: 1200,
    currency: 'CAD',
    timezone: 'America/Toronto',
    popular: true,
    coordinates: { lat: 43.6532, lng: -79.3832 }
  },
  {
    id: 'vancouver',
    name: 'Vancouver',
    nameHindi: 'वैंकूवर',
    state: 'British Columbia',
    stateHindi: 'ब्रिटिश कोलंबिया',
    tier: 1,
    country: 'CA',
    costMultiplier: 2.2,
    laborRatePerSqft: {
      basic: 38,
      standard: 60,
      premium: 100,
      luxury: 190
    },
    materialMarkup: 22,
    avgPropertyRate: 1500,
    currency: 'CAD',
    timezone: 'America/Vancouver',
    popular: true,
    coordinates: { lat: 49.2827, lng: -123.1207 }
  }
];

export const ALL_CITIES: City[] = [...INDIAN_CITIES, ...INTERNATIONAL_CITIES];

export const POPULAR_INDIAN_CITIES = INDIAN_CITIES.filter(city => city.popular);
export const POPULAR_INTERNATIONAL_CITIES = INTERNATIONAL_CITIES.filter(city => city.popular);

export const CITIES_BY_COUNTRY = {
  IN: INDIAN_CITIES,
  US: INTERNATIONAL_CITIES.filter(c => c.country === 'US'),
  UK: INTERNATIONAL_CITIES.filter(c => c.country === 'UK'),
  AE: INTERNATIONAL_CITIES.filter(c => c.country === 'AE'),
  SG: INTERNATIONAL_CITIES.filter(c => c.country === 'SG'),
  AU: INTERNATIONAL_CITIES.filter(c => c.country === 'AU'),
  CA: INTERNATIONAL_CITIES.filter(c => c.country === 'CA'),
};

export const CITIES_BY_TIER: Record<1 | 2 | 3, City[]> = {
  1: ALL_CITIES.filter(city => city.tier === 1),
  2: ALL_CITIES.filter(city => city.tier === 2),
  3: ALL_CITIES.filter(city => city.tier === 3),
};

export interface State {
  id: string;
  name: string;
  nameHindi: string;
  country: 'IN';
  cities: string[]; // city ids
  avgCostMultiplier: number;
}

export const INDIAN_STATES: State[] = [
  {
    id: 'maharashtra',
    name: 'Maharashtra',
    nameHindi: 'महाराष्ट्र',
    country: 'IN',
    cities: ['mumbai', 'pune', 'nagpur'],
    avgCostMultiplier: 1.35
  },
  {
    id: 'delhi',
    name: 'Delhi',
    nameHindi: 'दिल्ली',
    country: 'IN',
    cities: ['delhi'],
    avgCostMultiplier: 1.4
  },
  {
    id: 'karnataka',
    name: 'Karnataka',
    nameHindi: 'कर्नाटक',
    country: 'IN',
    cities: ['bangalore', 'mysore'],
    avgCostMultiplier: 1.2
  },
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    nameHindi: 'तमिल नाडु',
    country: 'IN',
    cities: ['chennai', 'coimbatore'],
    avgCostMultiplier: 1.15
  },
  {
    id: 'telangana',
    name: 'Telangana',
    nameHindi: 'तेलंगाना',
    country: 'IN',
    cities: ['hyderabad'],
    avgCostMultiplier: 1.2
  },
  {
    id: 'west-bengal',
    name: 'West Bengal',
    nameHindi: 'पश्चिम बंगाल',
    country: 'IN',
    cities: ['kolkata'],
    avgCostMultiplier: 1.1
  },
  {
    id: 'gujarat',
    name: 'Gujarat',
    nameHindi: 'गुजरात',
    country: 'IN',
    cities: ['ahmedabad', 'surat', 'vadodara'],
    avgCostMultiplier: 1.05
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan',
    nameHindi: 'राजस्थान',
    country: 'IN',
    cities: ['jaipur', 'udaipur'],
    avgCostMultiplier: 0.95
  },
  {
    id: 'uttar-pradesh',
    name: 'Uttar Pradesh',
    nameHindi: 'उत्तर प्रदेश',
    country: 'IN',
    cities: ['lucknow', 'noida', 'varanasi'],
    avgCostMultiplier: 0.9
  },
  {
    id: 'haryana',
    name: 'Haryana',
    nameHindi: 'हरियाणा',
    country: 'IN',
    cities: ['gurgaon'],
    avgCostMultiplier: 1.25
  },
  {
    id: 'kerala',
    name: 'Kerala',
    nameHindi: 'केरल',
    country: 'IN',
    cities: ['kochi', 'thiruvananthapuram'],
    avgCostMultiplier: 1.1
  },
  {
    id: 'punjab',
    name: 'Punjab',
    nameHindi: 'पंजाब',
    country: 'IN',
    cities: ['amritsar'],
    avgCostMultiplier: 0.95
  },
  {
    id: 'madhya-pradesh',
    name: 'Madhya Pradesh',
    nameHindi: 'मध्य प्रदेश',
    country: 'IN',
    cities: ['indore', 'bhopal'],
    avgCostMultiplier: 0.85
  },
  {
    id: 'andhra-pradesh',
    name: 'Andhra Pradesh',
    nameHindi: 'आंध्र प्रदेश',
    country: 'IN',
    cities: ['visakhapatnam'],
    avgCostMultiplier: 0.9
  },
  {
    id: 'bihar',
    name: 'Bihar',
    nameHindi: 'बिहार',
    country: 'IN',
    cities: ['patna'],
    avgCostMultiplier: 0.8
  },
  {
    id: 'goa',
    name: 'Goa',
    nameHindi: 'गोवा',
    country: 'IN',
    cities: ['goa'],
    avgCostMultiplier: 1.15
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh',
    nameHindi: 'चंडीगढ़',
    country: 'IN',
    cities: ['chandigarh'],
    avgCostMultiplier: 1.1
  },
  {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    nameHindi: 'उत्तराखंड',
    country: 'IN',
    cities: ['dehradun'],
    avgCostMultiplier: 0.88
  },
  {
    id: 'jharkhand',
    name: 'Jharkhand',
    nameHindi: 'झारखंड',
    country: 'IN',
    cities: ['ranchi'],
    avgCostMultiplier: 0.78
  },
  {
    id: 'odisha',
    name: 'Odisha',
    nameHindi: 'ओडिशा',
    country: 'IN',
    cities: ['bhubaneswar'],
    avgCostMultiplier: 0.82
  },
  {
    id: 'assam',
    name: 'Assam',
    nameHindi: 'असम',
    country: 'IN',
    cities: ['guwahati'],
    avgCostMultiplier: 0.85
  },
  {
    id: 'himachal-pradesh',
    name: 'Himachal Pradesh',
    nameHindi: 'हिमाचल प्रदेश',
    country: 'IN',
    cities: ['shimla'],
    avgCostMultiplier: 0.92
  },
  {
    id: 'chhattisgarh',
    name: 'Chhattisgarh',
    nameHindi: 'छत्तीसगढ़',
    country: 'IN',
    cities: ['raipur'],
    avgCostMultiplier: 0.78
  },
  {
    id: 'puducherry',
    name: 'Puducherry',
    nameHindi: 'पुडुचेरी',
    country: 'IN',
    cities: ['pondicherry'],
    avgCostMultiplier: 0.9
  }
];

// Helper functions
export function getCityById(id: string): City | undefined {
  return ALL_CITIES.find(city => city.id === id);
}

export function getCitiesByState(stateName: string): City[] {
  return INDIAN_CITIES.filter(city => city.state.toLowerCase() === stateName.toLowerCase());
}

export function getCitiesByCountry(countryCode: City['country']): City[] {
  return ALL_CITIES.filter(city => city.country === countryCode);
}

export function getStateById(id: string): State | undefined {
  return INDIAN_STATES.find(state => state.id === id);
}

export function searchCities(query: string): City[] {
  const normalizedQuery = query.toLowerCase().trim();
  return ALL_CITIES.filter(city => 
    city.name.toLowerCase().includes(normalizedQuery) ||
    city.nameHindi.includes(query) ||
    city.state.toLowerCase().includes(normalizedQuery)
  );
}

export const CURRENCY_SYMBOLS: Record<City['currency'], string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$'
};

export const CURRENCY_TO_INR_RATES: Record<City['currency'], number> = {
  INR: 1,
  USD: 83.5,
  GBP: 106.5,
  AED: 22.7,
  SGD: 62.5,
  AUD: 55.0,
  CAD: 62.0
};

export function convertToINR(amount: number, fromCurrency: City['currency']): number {
  return amount * CURRENCY_TO_INR_RATES[fromCurrency];
}

export function convertFromINR(amount: number, toCurrency: City['currency']): number {
  return amount / CURRENCY_TO_INR_RATES[toCurrency];
}

export function formatCurrency(amount: number, currency: City['currency']): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    maximumFractionDigits: 0
  }).format(Math.round(amount));
  
  return `${symbol}${formatted}`;
}
export const CITIES = ALL_CITIES;
export default CITIES;
