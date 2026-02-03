// lib/cost-engine.ts

interface CostCalculation {
    baseCost: number;
    modifiers: Record<string, number>;
    totalCost: number;
    breakdown: string[];
}

interface CostOptions {
    mode: string;
    settings?: Record<string, any>;
    numberOfVariations?: number;
}

// Base costs for different operations (in credits)
const BASE_COSTS: Record<string, number> = {
    redesign: 1,
    beautify: 1,
    creative: 1,
    furnish: 2,
    fill_room: 2,
    empty: 1,
    outdoor: 2,
    sketch: 3,
    sketch_to_render: 3,
    enhance: 1,
    inpaint: 1,
    remove_object: 1,
    replace: 2,
};

export function calculateCost(options: CostOptions): CostCalculation {
    const { mode, settings, numberOfVariations = 1 } = options;

    const baseCost = BASE_COSTS[mode] || 1;
    const modifiers: Record<string, number> = {};
    let totalCost = baseCost;
    const breakdown: string[] = [`Base cost for ${mode}: ${baseCost} credit(s)`];

    // Apply variations multiplier
    if (numberOfVariations > 1) {
        modifiers.variations = numberOfVariations - 1;
        const variationCost = baseCost * (numberOfVariations - 1);
        totalCost += variationCost;
        breakdown.push(`Additional ${numberOfVariations - 1} variation(s): +${variationCost} credit(s)`);
    }

    // Apply settings-based modifiers
    if (settings) {
        // High quality enhancement
        if (settings.enhanceQuality) {
            modifiers.quality = 0.5;
            totalCost += 0.5;
            breakdown.push('Quality enhancement: +0.5 credits');
        }

        // 4x upscaling costs more
        if (settings.scale === '4x') {
            modifiers.upscale = 1;
            totalCost += 1;
            breakdown.push('4x upscaling: +1 credit');
        }

        // Face enhancement
        if (settings.faceEnhancement) {
            modifiers.face = 0.5;
            totalCost += 0.5;
            breakdown.push('Face enhancement: +0.5 credits');
        }
    }

    // Round to nearest 0.5
    totalCost = Math.ceil(totalCost * 2) / 2;

    return {
        baseCost,
        modifiers,
        totalCost,
        breakdown,
    };
}

export function getOperationCost(mode: string): number {
    return BASE_COSTS[mode] || 1;
}

export function estimateProcessingTime(mode: string, numberOfVariations: number = 1): number {
    // Estimated time in seconds
    const baseTimes: Record<string, number> = {
        redesign: 15,
        beautify: 15,
        creative: 20,
        furnish: 25,
        fill_room: 25,
        empty: 15,
        outdoor: 25,
        sketch: 30,
        sketch_to_render: 30,
        enhance: 20,
        inpaint: 15,
        remove_object: 15,
        replace: 20,
    };

    const baseTime = baseTimes[mode] || 15;
    return baseTime * numberOfVariations;
}

// Renovation cost calculation functions
interface RenovationCostParams {
    roomType: string;
    areaInSqft: number;
    city: string;
    renovationType: 'basic' | 'standard' | 'premium' | 'luxury';
    selectedMaterials?: any;
    includeLabor?: boolean;
    includeTax?: boolean;
    timeline?: 'standard' | 'express';
    additionalRequirements?: string[];
}

interface CostResult {
    totalCost: number;
    materialCost: number;
    laborCost: number;
    taxAmount: number;
    breakdown: Array<{ category: string; cost: number; description: string }>;
    estimatedDays: number;
}

export function calculateRenovationCost(params: RenovationCostParams): CostResult {
    const { roomType, areaInSqft, city, renovationType, includeLabor = true, includeTax = true, timeline = 'standard' } = params;

    // Base cost per sqft based on renovation type
    const baseCostPerSqft: Record<string, number> = {
        basic: 800,
        standard: 1500,
        premium: 2500,
        luxury: 4000,
    };

    const cityMultiplier: Record<string, number> = {
        mumbai: 1.2,
        delhi: 1.15,
        bangalore: 1.1,
        chennai: 1.0,
        hyderabad: 0.95,
        kolkata: 0.9,
        pune: 1.05,
        ahmedabad: 0.95,
        default: 1.0,
    };

    const multiplier = cityMultiplier[city.toLowerCase()] || cityMultiplier.default;
    const baseCost = baseCostPerSqft[renovationType] * areaInSqft * multiplier;

    const materialCost = baseCost * 0.6;
    const laborCost = includeLabor ? baseCost * 0.4 : 0;
    const subtotal = materialCost + laborCost;
    const taxAmount = includeTax ? subtotal * 0.18 : 0; // 18% GST
    const totalCost = subtotal + taxAmount;

    const breakdown = [
        { category: 'Materials', cost: materialCost, description: 'Flooring, walls, ceiling, fixtures' },
        { category: 'Labor', cost: laborCost, description: 'Installation and finishing work' },
        { category: 'Tax (GST)', cost: taxAmount, description: '18% GST on materials and labor' },
    ];

    const estimatedDays = timeline === 'express' ? 15 : 30;

    return {
        totalCost: Math.round(totalCost),
        materialCost: Math.round(materialCost),
        laborCost: Math.round(laborCost),
        taxAmount: Math.round(taxAmount),
        breakdown,
        estimatedDays,
    };
}

export function getCostBreakdown(params: { roomType: string; renovationType: string; city: string }) {
    return {
        flooring: { min: 50000, max: 150000 },
        walls: { min: 30000, max: 80000 },
        ceiling: { min: 20000, max: 60000 },
        electrical: { min: 15000, max: 40000 },
        plumbing: { min: 10000, max: 30000 },
        furniture: { min: 50000, max: 200000 },
    };
}

export function getMaterialPrices(params: { category: string; city: string; currency: string }) {
    return [
        { name: 'Vitrified Tiles', category: 'flooring', price: 80, unit: 'sqft' },
        { name: 'Wooden Flooring', category: 'flooring', price: 200, unit: 'sqft' },
        { name: 'Marble', category: 'flooring', price: 300, unit: 'sqft' },
        { name: 'Paint (Premium)', category: 'wall', price: 40, unit: 'sqft' },
        { name: 'Wallpaper', category: 'wall', price: 60, unit: 'sqft' },
    ];
}

export function getLaborRates(params: { city: string; currency: string }) {
    return {
        carpenter: { rate: 800, unit: 'day' },
        painter: { rate: 600, unit: 'day' },
        electrician: { rate: 700, unit: 'day' },
        plumber: { rate: 650, unit: 'day' },
        mason: { rate: 750, unit: 'day' },
    };
}

export default calculateCost;
