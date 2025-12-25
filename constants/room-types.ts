// constants/room-types.ts
// Complete room types for interior design transformation

export interface RoomType {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  description: string;
  descriptionHi: string;
  promptModifier: string;
  subTypes?: SubRoomType[];
  vastuImportance: 'high' | 'medium' | 'low';
  averageSqFt: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface SubRoomType {
  id: string;
  name: string;
  nameHi: string;
  promptModifier: string;
}

export const ROOM_TYPES: RoomType[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    nameHi: 'लिविंग रूम',
    icon: '🛋️',
    description: 'Main living and entertaining space',
    descriptionHi: 'मुख्य रहने और मनोरंजन का स्थान',
    promptModifier: 'living room interior, comfortable seating, entertainment area, social gathering space',
    vastuImportance: 'high',
    averageSqFt: { small: 150, medium: 250, large: 400 },
    subTypes: [
      {
        id: 'formal-living',
        name: 'Formal Living Room',
        nameHi: 'औपचारिक लिविंग रूम',
        promptModifier: 'formal living room, elegant seating arrangement, sophisticated decor',
      },
      {
        id: 'family-room',
        name: 'Family Room',
        nameHi: 'फैमिली रूम',
        promptModifier: 'family room, casual comfortable seating, TV area, family-friendly',
      },
      {
        id: 'tv-lounge',
        name: 'TV Lounge',
        nameHi: 'टीवी लाउंज',
        promptModifier: 'TV lounge, entertainment center, comfortable viewing seating, media room',
      },
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    nameHi: 'बेडरूम',
    icon: '🛏️',
    description: 'Private sleeping and relaxation space',
    descriptionHi: 'निजी सोने और विश्राम का स्थान',
    promptModifier: 'bedroom interior, comfortable bed, relaxing atmosphere, personal space',
    vastuImportance: 'high',
    averageSqFt: { small: 100, medium: 180, large: 300 },
    subTypes: [
      {
        id: 'master-bedroom',
        name: 'Master Bedroom',
        nameHi: 'मास्टर बेडरूम',
        promptModifier: 'master bedroom, king-size bed, luxury bedding, spacious, attached bathroom',
      },
      {
        id: 'kids-bedroom',
        name: "Kids' Bedroom",
        nameHi: 'बच्चों का कमरा',
        promptModifier: "kids bedroom, playful design, study area, colorful, child-friendly furniture",
      },
      {
        id: 'guest-bedroom',
        name: 'Guest Bedroom',
        nameHi: 'गेस्ट बेडरूम',
        promptModifier: 'guest bedroom, welcoming atmosphere, comfortable bed, hotel-like amenities',
      },
      {
        id: 'teen-bedroom',
        name: "Teen's Bedroom",
        nameHi: 'किशोर का कमरा',
        promptModifier: 'teenager bedroom, modern design, study desk, personal expression, tech-friendly',
      },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    nameHi: 'किचन',
    icon: '🍳',
    description: 'Cooking and food preparation area',
    descriptionHi: 'खाना पकाने और भोजन तैयार करने का क्षेत्र',
    promptModifier: 'kitchen interior, modern appliances, counter space, storage cabinets, cooking area',
    vastuImportance: 'high',
    averageSqFt: { small: 60, medium: 120, large: 200 },
    subTypes: [
      {
        id: 'modular-kitchen',
        name: 'Modular Kitchen',
        nameHi: 'मॉड्यूलर किचन',
        promptModifier: 'modular kitchen, sleek cabinets, integrated appliances, organized storage',
      },
      {
        id: 'open-kitchen',
        name: 'Open Kitchen',
        nameHi: 'ओपन किचन',
        promptModifier: 'open kitchen, connected to living space, kitchen island, bar seating',
      },
      {
        id: 'indian-kitchen',
        name: 'Indian Kitchen',
        nameHi: 'भारतीय रसोई',
        promptModifier: 'Indian kitchen, separate wet and dry area, heavy-duty chimney, spice storage, traditional cooking setup',
      },
      {
        id: 'parallel-kitchen',
        name: 'Parallel Kitchen',
        nameHi: 'पैरेलल किचन',
        promptModifier: 'parallel kitchen layout, two counter walls, efficient workflow, galley style',
      },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    nameHi: 'बाथरूम',
    icon: '🚿',
    description: 'Personal hygiene and relaxation',
    descriptionHi: 'व्यक्तिगत स्वच्छता और विश्राम',
    promptModifier: 'bathroom interior, clean tiles, modern fixtures, vanity, shower or bathtub',
    vastuImportance: 'medium',
    averageSqFt: { small: 35, medium: 60, large: 100 },
    subTypes: [
      {
        id: 'master-bath',
        name: 'Master Bathroom',
        nameHi: 'मास्टर बाथरूम',
        promptModifier: 'master bathroom, luxury spa features, double vanity, freestanding tub, walk-in shower',
      },
      {
        id: 'guest-bath',
        name: 'Guest Bathroom',
        nameHi: 'गेस्ट बाथरूम',
        promptModifier: 'guest bathroom, welcoming, clean, essential fixtures, decorative touches',
      },
      {
        id: 'powder-room',
        name: 'Powder Room',
        nameHi: 'पाउडर रूम',
        promptModifier: 'powder room, half bath, statement vanity, decorative wallpaper, elegant',
      },
    ],
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    nameHi: 'डाइनिंग रूम',
    icon: '🍽️',
    description: 'Formal and family dining area',
    descriptionHi: 'औपचारिक और पारिवारिक भोजन क्षेत्र',
    promptModifier: 'dining room interior, dining table, chairs, chandelier, elegant atmosphere',
    vastuImportance: 'medium',
    averageSqFt: { small: 80, medium: 150, large: 250 },
    subTypes: [
      {
        id: 'formal-dining',
        name: 'Formal Dining',
        nameHi: 'औपचारिक डाइनिंग',
        promptModifier: 'formal dining room, large dining table, elegant chairs, chandelier, china cabinet',
      },
      {
        id: 'breakfast-nook',
        name: 'Breakfast Nook',
        nameHi: 'ब्रेकफास्ट नुक्कड़',
        promptModifier: 'breakfast nook, cozy seating, small dining area, near kitchen, casual',
      },
      {
        id: 'dining-kitchen',
        name: 'Kitchen Dining',
        nameHi: 'किचन डाइनिंग',
        promptModifier: 'kitchen dining area, connected to kitchen, casual dining, efficient space',
      },
    ],
  },
  {
    id: 'home-office',
    name: 'Home Office',
    nameHi: 'होम ऑफिस',
    icon: '💼',
    description: 'Work from home productivity space',
    descriptionHi: 'घर से काम करने की जगह',
    promptModifier: 'home office interior, desk, ergonomic chair, storage, good lighting, productive atmosphere',
    vastuImportance: 'medium',
    averageSqFt: { small: 60, medium: 100, large: 180 },
    subTypes: [
      {
        id: 'executive-office',
        name: 'Executive Office',
        nameHi: 'एक्जीक्यूटिव ऑफिस',
        promptModifier: 'executive home office, large desk, leather chair, bookshelf, professional atmosphere',
      },
      {
        id: 'creative-studio',
        name: 'Creative Studio',
        nameHi: 'क्रिएटिव स्टूडियो',
        promptModifier: 'creative home studio, art supplies, inspiration board, natural light, artistic atmosphere',
      },
      {
        id: 'compact-office',
        name: 'Compact Office',
        nameHi: 'कॉम्पैक्ट ऑफिस',
        promptModifier: 'compact home office, space-saving desk, wall-mounted storage, efficient layout',
      },
    ],
  },
  {
    id: 'pooja-room',
    name: 'Pooja Room',
    nameHi: 'पूजा कक्ष',
    icon: '🛕',
    description: 'Prayer and meditation space',
    descriptionHi: 'प्रार्थना और ध्यान का स्थान',
    promptModifier: 'pooja room interior, temple design, marble altar, brass bells, spiritual atmosphere, divine lighting',
    vastuImportance: 'high',
    averageSqFt: { small: 25, medium: 50, large: 100 },
    subTypes: [
      {
        id: 'traditional-mandir',
        name: 'Traditional Mandir',
        nameHi: 'पारंपरिक मंदिर',
        promptModifier: 'traditional wooden mandir, carved details, brass accents, bells, sacred space',
      },
      {
        id: 'modern-pooja',
        name: 'Modern Pooja Unit',
        nameHi: 'आधुनिक पूजा इकाई',
        promptModifier: 'modern pooja unit, clean lines, backlit panel, minimalist design, contemporary spiritual',
      },
      {
        id: 'wall-mounted-mandir',
        name: 'Wall Mounted Mandir',
        nameHi: 'दीवार पर मंदिर',
        promptModifier: 'wall mounted mandir, compact design, LED lighting, space-saving temple',
      },
    ],
  },
  {
    id: 'balcony',
    name: 'Balcony',
    nameHi: 'बालकनी',
    icon: '🌿',
    description: 'Outdoor relaxation and garden space',
    descriptionHi: 'बाहरी विश्राम और बगीचे का स्थान',
    promptModifier: 'balcony interior, outdoor furniture, plants, relaxation space, city or garden view',
    vastuImportance: 'low',
    averageSqFt: { small: 30, medium: 60, large: 120 },
    subTypes: [
      {
        id: 'garden-balcony',
        name: 'Garden Balcony',
        nameHi: 'गार्डन बालकनी',
        promptModifier: 'garden balcony, abundant plants, vertical garden, botanical atmosphere',
      },
      {
        id: 'seating-balcony',
        name: 'Seating Balcony',
        nameHi: 'सीटिंग बालकनी',
        promptModifier: 'balcony with seating, comfortable chairs, coffee table, relaxation zone',
      },
      {
        id: 'cafe-balcony',
        name: 'Café Style Balcony',
        nameHi: 'कैफे स्टाइल बालकनी',
        promptModifier: 'cafe style balcony, bistro table and chairs, string lights, cozy atmosphere',
      },
    ],
  },
  {
    id: 'foyer',
    name: 'Foyer / Entrance',
    nameHi: 'प्रवेश द्वार',
    icon: '🚪',
    description: 'First impression entryway',
    descriptionHi: 'पहला प्रभाव प्रवेश मार्ग',
    promptModifier: 'foyer entrance interior, console table, mirror, coat rack, welcoming atmosphere',
    vastuImportance: 'high',
    averageSqFt: { small: 25, medium: 50, large: 100 },
    subTypes: [
      {
        id: 'grand-foyer',
        name: 'Grand Foyer',
        nameHi: 'भव्य प्रवेश',
        promptModifier: 'grand foyer, statement chandelier, marble floor, double-height ceiling, impressive entrance',
      },
      {
        id: 'compact-entry',
        name: 'Compact Entry',
        nameHi: 'छोटा प्रवेश',
        promptModifier: 'compact entryway, wall hooks, shoe storage, small console, efficient layout',
      },
    ],
  },
  {
    id: 'study-room',
    name: 'Study Room',
    nameHi: 'अध्ययन कक्ष',
    icon: '📚',
    description: 'Reading and learning space',
    descriptionHi: 'पढ़ने और सीखने का स्थान',
    promptModifier: 'study room interior, bookshelves, reading desk, comfortable chair, quiet atmosphere',
    vastuImportance: 'medium',
    averageSqFt: { small: 60, medium: 100, large: 150 },
    subTypes: [
      {
        id: 'library',
        name: 'Home Library',
        nameHi: 'होम लाइब्रेरी',
        promptModifier: 'home library, floor-to-ceiling bookshelves, reading nook, ladder, academic atmosphere',
      },
      {
        id: 'kids-study',
        name: "Kids' Study",
        nameHi: 'बच्चों का अध्ययन',
        promptModifier: "kids study room, colorful desk, organized supplies, playful yet functional",
      },
    ],
  },
  {
    id: 'wardrobe',
    name: 'Walk-in Wardrobe',
    nameHi: 'वॉक-इन वॉर्डरोब',
    icon: '👔',
    description: 'Clothing and accessory storage',
    descriptionHi: 'कपड़े और सहायक उपकरण भंडारण',
    promptModifier: 'walk-in wardrobe interior, organized shelving, hanging space, mirror, island dresser',
    vastuImportance: 'low',
    averageSqFt: { small: 40, medium: 80, large: 150 },
    subTypes: [
      {
        id: 'luxury-closet',
        name: 'Luxury Closet',
        nameHi: 'लक्जरी क्लोजेट',
        promptModifier: 'luxury walk-in closet, custom cabinetry, chandelier, seating, boutique atmosphere',
      },
      {
        id: 'compact-wardrobe',
        name: 'Compact Wardrobe',
        nameHi: 'कॉम्पैक्ट वॉर्डरोब',
        promptModifier: 'compact wardrobe, efficient organization, sliding doors, space-maximizing design',
      },
    ],
  },
  {
    id: 'outdoor',
    name: 'Outdoor / Patio',
    nameHi: 'बाहरी / आँगन',
    icon: '🏡',
    description: 'Outdoor living and entertaining',
    descriptionHi: 'बाहरी रहने और मनोरंजन',
    promptModifier: 'outdoor patio design, outdoor furniture, landscaping, pergola, entertainment area',
    vastuImportance: 'medium',
    averageSqFt: { small: 100, medium: 250, large: 500 },
    subTypes: [
      {
        id: 'terrace-garden',
        name: 'Terrace Garden',
        nameHi: 'छत बगीचा',
        promptModifier: 'terrace garden, rooftop plants, seating area, outdoor lighting, urban oasis',
      },
      {
        id: 'backyard-patio',
        name: 'Backyard Patio',
        nameHi: 'पिछवाड़े का आँगन',
        promptModifier: 'backyard patio, outdoor dining, fire pit, landscaping, entertaining space',
      },
      {
        id: 'pool-deck',
        name: 'Pool Deck',
        nameHi: 'पूल डेक',
        promptModifier: 'pool deck area, lounge chairs, cabana, outdoor shower, resort-style',
      },
    ],
  },
  {
    id: 'gym',
    name: 'Home Gym',
    nameHi: 'होम जिम',
    icon: '🏋️',
    description: 'Fitness and workout space',
    descriptionHi: 'फिटनेस और व्यायाम स्थान',
    promptModifier: 'home gym interior, exercise equipment, mirrors, rubber flooring, motivational atmosphere',
    vastuImportance: 'low',
    averageSqFt: { small: 80, medium: 150, large: 300 },
    subTypes: [
      {
        id: 'yoga-studio',
        name: 'Yoga Studio',
        nameHi: 'योग स्टूडियो',
        promptModifier: 'home yoga studio, wooden floor, mirrors, natural light, peaceful zen atmosphere',
      },
      {
        id: 'full-gym',
        name: 'Full Gym',
        nameHi: 'पूर्ण जिम',
        promptModifier: 'full home gym, cardio machines, weight area, mirrors, professional equipment',
      },
    ],
  },
  {
    id: 'media-room',
    name: 'Media Room',
    nameHi: 'मीडिया रूम',
    icon: '🎬',
    description: 'Entertainment and movie watching',
    descriptionHi: 'मनोरंजन और फिल्म देखना',
    promptModifier: 'home media room, large screen, surround sound, theater seating, dark ambient lighting',
    vastuImportance: 'low',
    averageSqFt: { small: 120, medium: 200, large: 400 },
    subTypes: [
      {
        id: 'home-theater',
        name: 'Home Theater',
        nameHi: 'होम थिएटर',
        promptModifier: 'home theater, projector screen, tiered seating, acoustic panels, cinema experience',
      },
      {
        id: 'gaming-room',
        name: 'Gaming Room',
        nameHi: 'गेमिंग रूम',
        promptModifier: 'gaming room, multiple screens, gaming chairs, RGB lighting, tech setup',
      },
    ],
  },
  {
    id: 'bar',
    name: 'Home Bar',
    nameHi: 'होम बार',
    icon: '🍸',
    description: 'Entertainment and drink service',
    descriptionHi: 'मनोरंजन और पेय सेवा',
    promptModifier: 'home bar interior, bar counter, bar stools, bottle display, ambient lighting, cocktail lounge',
    vastuImportance: 'low',
    averageSqFt: { small: 40, medium: 80, large: 150 },
    subTypes: [
      {
        id: 'wet-bar',
        name: 'Wet Bar',
        nameHi: 'वेट बार',
        promptModifier: 'wet bar with sink, full bar setup, refrigerator, glassware display',
      },
      {
        id: 'dry-bar',
        name: 'Dry Bar',
        nameHi: 'ड्राई बार',
        promptModifier: 'dry bar, bar cart style, portable, elegant glassware, compact setup',
      },
    ],
  },
  {
    id: 'laundry',
    name: 'Laundry Room',
    nameHi: 'लॉन्ड्री रूम',
    icon: '🧺',
    description: 'Clothes washing and utility',
    descriptionHi: 'कपड़े धोने और उपयोगिता',
    promptModifier: 'laundry room interior, washer dryer, folding counter, storage cabinets, organized utility',
    vastuImportance: 'low',
    averageSqFt: { small: 30, medium: 60, large: 100 },
  },
  {
    id: 'kids-playroom',
    name: 'Kids Playroom',
    nameHi: 'बच्चों का खेल कक्ष',
    icon: '🧸',
    description: 'Play and activity space for children',
    descriptionHi: 'बच्चों के लिए खेल और गतिविधि स्थान',
    promptModifier: 'kids playroom interior, toy storage, play area, colorful design, safe furniture, creative space',
    vastuImportance: 'low',
    averageSqFt: { small: 80, medium: 150, large: 250 },
  },
  {
    id: 'basement',
    name: 'Basement',
    nameHi: 'तहखाना',
    icon: '🏠',
    description: 'Versatile underground space',
    descriptionHi: 'बहुमुखी भूमिगत स्थान',
    promptModifier: 'finished basement interior, multi-purpose space, good lighting, comfortable atmosphere',
    vastuImportance: 'low',
    averageSqFt: { small: 200, medium: 400, large: 800 },
  },
  {
    id: 'attic',
    name: 'Attic',
    nameHi: 'अटारी',
    icon: '🏚️',
    description: 'Converted upper floor space',
    descriptionHi: 'परिवर्तित ऊपरी मंजिल स्थान',
    promptModifier: 'attic room interior, sloped ceilings, skylights, cozy converted space, character',
    vastuImportance: 'low',
    averageSqFt: { small: 100, medium: 200, large: 400 },
  },
];

// Helper functions
export const getRoomById = (id: string): RoomType | undefined => {
  return ROOM_TYPES.find((room) => room.id === id);
};

export const getRoomsByVastuImportance = (
  importance: 'high' | 'medium' | 'low'
): RoomType[] => {
  return ROOM_TYPES.filter((room) => room.vastuImportance === importance);
};

export const getHighVastuRooms = (): RoomType[] => {
  return getRoomsByVastuImportance('high');
};

export const getAllSubTypes = (): SubRoomType[] => {
  return ROOM_TYPES.flatMap((room) => room.subTypes || []);
};

// ... continuing from previous

export const searchRooms = (query: string): RoomType[] => {
  const lowerQuery = query.toLowerCase();
  return ROOM_TYPES.filter(
    (room) =>
      room.name.toLowerCase().includes(lowerQuery) ||
      room.nameHi.includes(query) ||
      room.description.toLowerCase().includes(lowerQuery)
  );
};

export const getRoomWithSubType = (
  roomId: string,
  subTypeId?: string
): { room: RoomType; subType?: SubRoomType } | undefined => {
  const room = getRoomById(roomId);
  if (!room) return undefined;

  if (subTypeId && room.subTypes) {
    const subType = room.subTypes.find((st) => st.id === subTypeId);
    return { room, subType };
  }

  return { room };
};

export const calculateRoomArea = (
  roomId: string,
  size: 'small' | 'medium' | 'large'
): number => {
  const room = getRoomById(roomId);
  if (!room) return 0;
  return room.averageSqFt[size];
};

export default ROOM_TYPES;