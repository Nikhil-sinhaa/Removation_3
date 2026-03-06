/**
 * roomTypes.ts
 * Purpose: Compact, quick-access re-exports for common room types and design themes.
 * Provides the same simple string-union API as the original RoomGPT source,
 * while the full rich data lives in constants/room-types.ts and constants/styles-400.ts.
 *
 * Use this for: quick dropdown UIs, generate API calls, and editor sidebar controls.
 * Use room-types.ts / styles-400.ts for: Vastu analysis, prompt building, metadata.
 *
 * Connects to:
 *  - constants/room-types.ts  (full rich room type data)
 *  - constants/styles-400.ts  (400+ design styles)
 *  - lib/downloadPhoto.ts     (for generated image downloads)
 */

// ─── Simple Theme Type (for quick dropdowns) ─────────────────────────────────

export type ThemeType =
    | "Modern"
    | "Minimalist"
    | "Scandinavian"
    | "Japandi"
    | "Traditional"
    | "Tropical"
    | "Industrial"
    | "Bohemian"
    | "Art Deco"
    | "Mediterranean"
    | "Mid-Century Modern"
    | "Rustic"
    | "Contemporary"
    | "Vintage";

export const THEMES: ThemeType[] = [
    "Modern",
    "Minimalist",
    "Scandinavian",
    "Japandi",
    "Traditional",
    "Tropical",
    "Industrial",
    "Bohemian",
    "Art Deco",
    "Mediterranean",
    "Mid-Century Modern",
    "Rustic",
    "Contemporary",
    "Vintage",
];

// ─── Simple Room Type (for quick dropdowns) ───────────────────────────────────

export type RoomTypeSimple =
    | "Living Room"
    | "Bedroom"
    | "Kitchen"
    | "Dining Room"
    | "Bathroom"
    | "Home Office"
    | "Study Room"
    | "Balcony"
    | "Gaming Room"
    | "Home Gym"
    | "Foyer"
    | "Kids Room";

export const ROOM_TYPES_SIMPLE: RoomTypeSimple[] = [
    "Living Room",
    "Bedroom",
    "Kitchen",
    "Dining Room",
    "Bathroom",
    "Home Office",
    "Study Room",
    "Balcony",
    "Gaming Room",
    "Home Gym",
    "Foyer",
    "Kids Room",
];

// ─── Helper ────────────────────────────────────────────────────────────────────

/** Converts a simple ThemeType to a Replicate-friendly prompt string. */
export function themeToPrompt(theme: ThemeType): string {
    const map: Record<ThemeType, string> = {
        Modern: "modern contemporary interior design, clean lines, neutral palette",
        Minimalist: "minimalist interior, essential furniture only, uncluttered, white tones",
        Scandinavian: "scandinavian interior, light oak, white walls, hygge, cozy textiles",
        Japandi: "japandi interior, japanese scandinavian fusion, natural materials, zen atmosphere",
        Traditional: "traditional classic interior, symmetrical design, rich wood tones, elegant",
        Tropical: "tropical paradise interior, rattan furniture, lush plants, resort-like atmosphere",
        Industrial: "industrial loft interior, exposed brick, metal beams, concrete floors",
        Bohemian: "bohemian eclectic interior, layered textiles, global patterns, earthy colors, plants",
        "Art Deco": "art deco interior, geometric patterns, gold and black, velvet, 1920s glamour",
        Mediterranean: "mediterranean interior, terracotta tiles, arched doorways, warm earth tones",
        "Mid-Century Modern": "mid-century modern, Eames furniture, organic curves, teak wood, bold accent colors",
        Rustic: "rustic interior, reclaimed wood, stone fireplace, cozy textiles, farmhouse charm",
        Contemporary: "contemporary interior, current trends, sophisticated furnishings, sleek finishes",
        Vintage: "vintage interior, antique furniture, retro patterns, warm nostalgia, eclectic charm",
    };
    return map[theme];
}

/** Converts a simple RoomTypeSimple to a Replicate-friendly prompt string. */
export function roomTypeToPrompt(room: RoomTypeSimple): string {
    const map: Record<RoomTypeSimple, string> = {
        "Living Room": "living room, comfortable seating, entertainment area",
        Bedroom: "bedroom, comfortable bed, relaxing atmosphere",
        Kitchen: "kitchen, modern appliances, counter space, storage cabinets",
        "Dining Room": "dining room, dining table, chairs, chandelier",
        Bathroom: "bathroom, clean tiles, modern fixtures, vanity",
        "Home Office": "home office, desk, ergonomic chair, storage, good lighting",
        "Study Room": "study room, bookshelves, reading desk, quiet atmosphere",
        Balcony: "balcony, outdoor furniture, plants, relaxation space",
        "Gaming Room": "gaming room setup, gaming computers, gaming chairs, RGB lighting, multiple screens",
        "Home Gym": "home gym, exercise equipment, mirrors, rubber flooring",
        Foyer: "foyer entrance, console table, mirror, welcoming atmosphere",
        "Kids Room": "kids room, playful design, study area, colorful, child-friendly furniture",
    };
    return map[room];
}
