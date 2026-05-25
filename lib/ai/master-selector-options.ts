/**
 * lib/ai/master-selector-options.ts
 *
 * Pure data constants — no Node.js dependencies.
 * Safe to import in both client and server components.
 * Extracted from comfyui-workflows-master.ts to break the
 * client → server-only module chain.
 */

// Master Selector Options
export const MASTER_SELECTOR_OPTIONS = {
  wallColor: ['White', 'Navy Blue', 'Terracotta', 'Olive Green', 'Deep Emerald Green', 'Charcoal Gray', 'Cream', 'Sage'],
  ceiling: ['Plain White', 'Wooden Beams', 'Modern Tray with LED', 'Industrial Exposed', 'Vaulted Wood', 'Coffered', 'Drop Ceiling'],
  furnitureStyle: ['Minimalist Oak', 'Industrial Metal', 'Bohemian Rattan', 'Luxury Velvet', 'Scandinavian Birch', 'Modern Leather', 'Vintage Walnut'],
  floorType: ['Hardwood Oak', 'Marble', 'Polished Concrete', 'Carpet', 'Terracotta Tiles', 'Dark Wood', 'Light Maple', 'Slate'],
  lighting: ['Natural Light', 'Warm LED', 'Cool White', 'Industrial Pendant', 'Chandelier', 'Recessed Lighting', 'Track Lighting'],
  decorStyle: ['Modern Minimalist', 'Industrial Chic', 'Bohemian Eclectic', 'Luxury Contemporary', 'Scandinavian', 'Traditional', 'Art Deco'],
};

// ArchAi3d-Qwen Material Presets (103+ presets)
export const ARCHAI3D_MATERIALS = {
  floors: [
    'Marble - Carrara White', 'Marble - Calacatta Gold', 'Marble - Nero Marquina', 'Marble - Emperador',
    'Hardwood - Oak Natural', 'Hardwood - Oak White', 'Hardwood - Walnut Dark', 'Hardwood - Maple Light',
    'Polished Concrete - Gray', 'Polished Concrete - White', 'Polished Concrete - Black', 'Polished Concrete - Terrazzo',
    'Terracotta Tiles - Traditional', 'Terracotta Tiles - Modern', 'Terracotta Tiles - Glazed', 'Terracotta Tiles - Patterned',
    'Slate - Black', 'Slate - Gray', 'Slate - Green', 'Slate - Rust',
    'Carpet - Neutral', 'Carpet - Patterned', 'Carpet - Shag', 'Carpet - Berber',
    'Vinyl - Wood Plank', 'Vinyl - Stone', 'Vinyl - Patterned', 'Vinyl - Solid',
  ],
  walls: [
    'Paint - White Matte', 'Paint - White Gloss', 'Paint - Navy Blue', 'Paint - Terracotta', 'Paint - Olive Green',
    'Paint - Emerald Green', 'Paint - Charcoal', 'Paint - Cream', 'Paint - Sage', 'Paint - Gray',
    'Wallpaper - Geometric', 'Wallpaper - Floral', 'Wallpaper - Textured', 'Wallpaper - Metallic',
    'Brick - Exposed Red', 'Brick - Painted White', 'Brick - Dark', 'Brick - Weathered',
    'Wood Paneling - Light', 'Wood Paneling - Dark', 'Wood Paneling - Reclaimed', 'Wood Paneling - Modern',
    'Stone - Natural', 'Stone - Veneer', 'Stone - Slate', 'Stone - Marble',
    'Tile - Subway', 'Tile - Hexagon', 'Tile - Arabesque', 'Tile - Large Format',
    'Concrete - Raw', 'Concrete - Polished', 'Concrete - Colored', 'Concrete - Textured',
  ],
  ceilings: [
    'Paint - White Flat', 'Paint - White Eggshell', 'Paint - Textured', 'Paint - Color Wash',
    'Wood Beams - Natural', 'Wood Beams - Painted', 'Wood Beams - Dark', 'Wood Beams - Reclaimed',
    'Tray - Modern LED', 'Tray - Traditional', 'Tray - Multi-Level', 'Tray - Cove Lighting',
    'Coffered - Classic', 'Coffered - Modern', 'Coffered - Deep', 'Coffered - Shallow',
    'Vaulted - Exposed Wood', 'Vaulted - Painted', 'Vaulted - Plaster', 'Vaulted - Steel Beams',
    'Industrial - Exposed Duct', 'Industrial - Metal Panels', 'Industrial - Concrete', 'Industrial - Steel Beams',
    'Drop - Acoustic Tiles', 'Drop - Gypsum', 'Drop - Perforated', 'Drop - Linear',
    'Specialty - Murals', 'Specialty - Mirrored', 'Specialty - Fabric', 'Specialty - Metallic',
  ],
};
