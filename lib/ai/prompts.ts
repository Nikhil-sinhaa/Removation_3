// lib/ai/prompts.ts
// Purpose: Builds Replicate prompt strings for the AI generate pipeline.
// Connects to: app/api/generate/route.ts, lib/vastu-engine.ts

/** Vastu guidelines extracted from vastu-engine.getVastuGuidelines() */
export interface VastuPromptModifiers {
    colors?: string[];      // e.g. ["Light blue", "Green", "Pink"]
    elements?: string[];    // e.g. ["Earth", "Water"]
    tips?: string[];        // e.g. ["Place bed in southwest", "Avoid mirrors facing bed"]
}

interface PromptOptions {
    mode: string;
    style: string;
    roomType: string;
    settings?: Record<string, any>;
    customPrompt?: string;
    imageAnalysis?: any;
    /** Optional: Vastu guidelines to inject for Vastu-compliant generation */
    vastuModifiers?: VastuPromptModifiers;
}

export function generatePrompt(options: PromptOptions): string {
    const { mode, style, roomType, settings, customPrompt, imageAnalysis, vastuModifiers } = options;

    let prompt = '';

    // 1. Custom prompt first (user override)
    if (customPrompt) {
        prompt = customPrompt + ', ';
    }

    // 2. Core: room type + style
    prompt += `${style} style ${roomType}, `;

    // 3. Mode-specific intent
    switch (mode) {
        case 'redesign':
            prompt += 'complete interior redesign, ';
            break;
        case 'beautify':
            prompt += 'enhanced and beautified, improved aesthetics, ';
            break;
        case 'creative':
            prompt += 'creative and artistic interpretation, ';
            break;
        case 'furnish':
            prompt += 'fully furnished with appropriate furniture, ';
            break;
        case 'empty':
            prompt += 'empty room, clean walls and floors, ';
            break;
        case 'outdoor':
            prompt += 'outdoor space design, ';
            break;
        case 'sketch':
            prompt += 'photorealistic render from sketch, ';
            break;
        case 'enhance':
            prompt += 'upscaled and enhanced quality, ';
            break;
        case 'inpaint':
            prompt += 'seamlessly inpainted region, ';
            break;
        case 'remove':
            prompt += 'object removed cleanly, ';
            break;
    }

    // 4. Generation settings
    if (settings) {
        if (settings.colorScheme) {
            prompt += `${settings.colorScheme} color scheme, `;
        }
        if (settings.materials && Array.isArray(settings.materials)) {
            prompt += `materials: ${settings.materials.join(', ')}, `;
        }
        if (settings.lighting) {
            prompt += `${settings.lighting} lighting, `;
        }
        if (settings.timeOfDay) {
            prompt += `${settings.timeOfDay} time of day, `;
        }
    }

    // 5. ✨ VASTU SHASTRA MODIFIERS
    // Injected when the API has Vastu guidelines for the room type.
    // Colors and elements are woven into the prompt to influence the AI model.
    if (vastuModifiers) {
        if (vastuModifiers.colors && vastuModifiers.colors.length > 0) {
            // Only inject Vastu color if user hasn't specified a colorScheme override
            if (!settings?.colorScheme) {
                const vastuColors = vastuModifiers.colors.slice(0, 3).join(', ');
                prompt += `Vastu-compliant color palette: ${vastuColors}, `;
            }
        }
        if (vastuModifiers.elements && vastuModifiers.elements.length > 0) {
            const vastuElements = vastuModifiers.elements.join(' and ');
            prompt += `balanced ${vastuElements} elements, `;
        }
        // Inject up to 2 Vastu spatial tips as subtle guidance
        if (vastuModifiers.tips && vastuModifiers.tips.length > 0) {
            const topTips = vastuModifiers.tips.slice(0, 2).join('; ');
            prompt += `${topTips}, `;
        }
    }

    // 6. Image analysis context (from Groq vision pre-scan)
    if (imageAnalysis?.description) {
        prompt += `existing features: ${imageAnalysis.description}, `;
    }

    // 7. Final quality tail
    prompt += 'professional interior design, high quality, photorealistic, detailed, 8k';

    return prompt;
}

// ─── Other prompt generators (unchanged) ──────────────────────────────────────

interface FurnishingOptions {
    roomType: string;
    style: string;
    furniture?: string[];
    settings?: Record<string, any>;
}

export function generateFurnishingPrompt(options: FurnishingOptions): string {
    const { roomType, style, furniture, settings } = options;

    let prompt = `${style} style ${roomType}, `;

    if (furniture && furniture.length > 0) {
        prompt += `furnished with ${furniture.join(', ')}, `;
    } else {
        prompt += 'fully furnished with appropriate furniture, ';
    }

    if (settings) {
        if (settings.density) {
            prompt += `${settings.density} furniture density, `;
        }
        if (settings.budget) {
            prompt += `${settings.budget} budget furniture, `;
        }
        if (settings.colorScheme) {
            prompt += `${settings.colorScheme} color palette, `;
        }
        if (settings.includeDecor) {
            prompt += 'with decorative elements, ';
        }
        if (settings.includePlants) {
            prompt += 'with plants and greenery, ';
        }
        if (settings.includeLighting) {
            prompt += 'with ambient lighting fixtures, ';
        }
    }

    prompt += 'professional interior design, photorealistic, high quality, detailed';

    return prompt;
}

interface OutdoorOptions {
    outdoorType: string;
    style: string;
    settings?: Record<string, any>;
}

export function generateOutdoorPrompt(options: OutdoorOptions): string {
    const { outdoorType, style, settings } = options;

    let prompt = `${style} style ${outdoorType.replace('_', ' ')}, `;

    if (settings) {
        if (settings.season) {
            prompt += `${settings.season} season, `;
        }
        if (settings.timeOfDay) {
            prompt += `${settings.timeOfDay} lighting, `;
        }
        if (settings.weather) {
            prompt += `${settings.weather} weather, `;
        }
        if (settings.includePool) {
            prompt += 'with swimming pool, ';
        }
        if (settings.includeGarden) {
            prompt += 'with garden landscaping, ';
        }
        if (settings.plantDensity) {
            prompt += `${settings.plantDensity} plant density, `;
        }
        if (settings.waterFeatures) {
            prompt += 'with water features, ';
        }
        if (settings.firePit) {
            prompt += 'with fire pit, ';
        }
        if (settings.includeFurniture) {
            prompt += 'with outdoor furniture, ';
        }
        if (settings.includeLighting) {
            prompt += 'with outdoor lighting, ';
        }
    }

    prompt += 'professional landscape design, photorealistic, high quality, detailed, beautiful';

    return prompt;
}

interface SketchOptions {
    roomType: string;
    style: string;
    description?: string;
    settings?: Record<string, any>;
}

export function generateSketchPrompt(options: SketchOptions): string {
    const { roomType, style, description, settings } = options;

    let prompt = `photorealistic ${style} style ${roomType}, `;

    if (description) {
        prompt += `${description}, `;
    }

    if (settings) {
        if (settings.detailLevel === 'concept') {
            prompt += 'concept design, artistic interpretation, ';
        } else if (settings.detailLevel === 'detailed') {
            prompt += 'detailed design, accurate proportions, ';
        } else {
            prompt += 'photorealistic, highly detailed, accurate, ';
        }

        if (settings.colorScheme) {
            prompt += `${settings.colorScheme} color scheme, `;
        }
        if (settings.materials && Array.isArray(settings.materials)) {
            prompt += `materials: ${settings.materials.join(', ')}, `;
        }
        if (settings.lighting) {
            prompt += `${settings.lighting} lighting, `;
        }
        if (settings.timeOfDay) {
            prompt += `${settings.timeOfDay} ambiance, `;
        }
    }

    prompt += 'professional interior design, high quality, 8k, realistic textures and materials';

    return prompt;
}

export default generatePrompt;
