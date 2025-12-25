// hooks/useCost.ts
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  CostEstimate,
  CurrencyType,
  CostBreakdown,
  CostCategory,
  CostLineItem,
  CostSettings,
  CityTier,
  CostLocation,
  UIEstimateDisplay,
  UICostEstimate,
  UICostChartData,
  MaterialGrade,
  LaborQuality,
  LaborCost,
  CostMaterialEntry,
  RoomDimensions,
  MaterialCategory,
  QualityTier,
  CityPricing,
  MaterialOption
} from '@/types/cost';
import { Material } from '@/constants/materials';
import { City } from '@/constants/cities';
import { useDebounce } from './useDebounce';

// Import constants
import PRICING_2025_INDIA from '@/constants/pricing-2025-india';
import { CITIES } from '@/constants/cities';
import { MATERIALS } from '@/constants/materials';

interface UseCostOptions {
  city?: string;
  currency?: CurrencyType;
  quality?: QualityTier;
  autoCalculate?: boolean;
}

// Extend Material interface with quantity
type MaterialWithQuantity = Material & { quantity: number };

interface UseCostReturn {
  // State
  isCalculating: boolean;
  estimate: CostEstimate | null;
  breakdown: CostBreakdown | null;
  selectedMaterials: MaterialOption[];
  laborCosts: LaborCost[];
  totalCost: number;
  currency: CurrencyType;
  city: string;
  exchangeRate: number;
  error: string | null;
  
  // Configuration
  setCity: (city: string) => void;
  setCurrency: (currency: CurrencyType) => void;
  setQuality: (quality: QualityTier) => void;
  setDimensions: (dimensions: RoomDimensions) => void;
  
  // Material operations
  addMaterial: (material: Material) => void;
  removeMaterial: (materialId: string) => void;
  updateMaterialQuantity: (materialId: string, quantity: number) => void;
  clearMaterials: () => void;
  
  // Calculation
  calculateCost: (params: {
    roomType: string;
    dimensions: RoomDimensions;
    materials?: Material[];
    includeLabor?: boolean;
    includeTax?: boolean;
  }) => Promise<CostEstimate | null>;
  
  calculateFromImage: (imageUrl: string) => Promise<CostEstimate | null>;
  
  // Utility
  getBreakdown: () => CostBreakdown;
  getMaterialsForRoom: (roomType: string) => Material[];
  getLaborRates: (workType: string) => LaborCost;
  convertCurrency: (amount: number, from: CurrencyType, to: CurrencyType) => number;
  
  // Export
  exportEstimate: (format: 'pdf' | 'excel' | 'json') => Promise<Blob>;
  shareEstimate: () => Promise<string>;
  
  // Reset
  reset: () => void;
}

const EXCHANGE_RATES: Record<CurrencyType, number> = {
  INR: 1,
  USD: 0.012,
};

const TAX_RATES: Record<string, number> = {
  'gst': 0.18,
  'service_tax': 0.12,
  'material_tax': 0.05,
};

const QUALITY_MULTIPLIERS: Record<QualityTier, number> = {
  budget: 0.7,
  standard: 1,
  premium: 1.5,
  luxury: 2.5,
};

const LABOR_MULTIPLIERS: Record<LaborQuality, number> = {
  standard: 1,
  premium: 1.4,
  luxury: 1.8,
};

export function useCost(options: UseCostOptions = {}): UseCostReturn {
  const {
    city: initialCity = 'mumbai',
    currency: initialCurrency = 'INR',
    quality: initialQuality = 'standard',
    autoCalculate = true,
  } = options;

  // State
  const [isCalculating, setIsCalculating] = useState(false);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialWithQuantity[]>([]);
  const [laborCosts, setLaborCosts] = useState<LaborCost[]>([]);
  const [city, setCity] = useState(initialCity);
  const [currency, setCurrency] = useState<CurrencyType>(initialCurrency);
  const [quality, setQuality] = useState<QualityTier>(initialQuality);
  const [dimensions, setDimensions] = useState<RoomDimensions | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derived values
  const exchangeRate = useMemo(() => EXCHANGE_RATES[currency], [currency]);
  
  const cityPricing = useMemo(() => {
    const cityData = CITIES.find(c => c.id === city);
    return cityData?.costMultiplier || 1;
  }, [city]);

  const qualityMultiplier = useMemo(() => QUALITY_MULTIPLIERS[quality], [quality]);

  const totalCost = useMemo(() => {
    if (!breakdown) return 0;
    
    const materialsCost = breakdown.materials?.amount?.INR || 0;
    const laborCost = breakdown.labor?.amount?.INR || 0;
    const fixturesCost = breakdown.fixtures?.amount?.INR || 0;
    const taxAmount = breakdown.tax?.amount?.INR || 0;
    const contingencyAmount = breakdown.contingency?.amount?.INR || 0;
    
    return materialsCost + laborCost + fixturesCost + taxAmount + contingencyAmount;
  }, [breakdown]);

  // Auto-calculate when dependencies change
  const debouncedMaterials = useDebounce(selectedMaterials, 500);
  
  useEffect(() => {
    if (autoCalculate && dimensions && debouncedMaterials.length > 0) {
      calculateCost({
        roomType: 'living_room',
        dimensions,
        materials: debouncedMaterials,
        includeLabor: true,
        includeTax: true,
      });
    }
  }, [debouncedMaterials, dimensions, city, quality, autoCalculate]);

  // Helper function to convert MaterialWithQuantity to MaterialOption
  const convertToMaterialOption = useCallback((material: MaterialWithQuantity): MaterialOption => {
    const avgPrice = (material.priceRange.min + material.priceRange.max) / 2;
    
    return {
      id: material.id,
      name: material.name,
      nameHi: material.nameHi,
      category: material.category as MaterialCategory,
      pricePerUnit: {
        INR: avgPrice,
        USD: avgPrice * exchangeRate
      },
      unit: material.priceRange.unit as any,
      quality: material.quality as QualityTier,
      brand: material.brands?.[0],
      specifications: material.specifications,
      isSustainable: false,
      availability: 'available',
      leadTime: 7
    };
  }, [exchangeRate]);

  // Material operations
  const addMaterial = useCallback((material: Material) => {
    setSelectedMaterials(prev => {
      const exists = prev.find(m => m.id === material.id);
      if (exists) {
        // If material exists, increment quantity
        return prev.map(m => 
          m.id === material.id 
            ? { ...m, quantity: m.quantity + 1 }
            : m
        );
      }
      // Add new material with quantity 1
      const materialWithQty: MaterialWithQuantity = { ...material, quantity: 1 };
      return [...prev, materialWithQty];
    });
  }, []);

  const removeMaterial = useCallback((materialId: string) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== materialId));
  }, []);

  const updateMaterialQuantity = useCallback((materialId: string, quantity: number) => {
    setSelectedMaterials(prev => 
      prev.map(m => m.id === materialId ? { ...m, quantity } : m)
    );
  }, []);

  const clearMaterials = useCallback(() => {
    setSelectedMaterials([]);
  }, []);

  // Calculate cost
  const calculateCost = useCallback(async (params: {
    roomType: string;
    dimensions: RoomDimensions;
    materials?: Material[];
    includeLabor?: boolean;
    includeTax?: boolean;
  }): Promise<CostEstimate | null> => {
    setIsCalculating(true);
    setError(null);
    
    try {
      // Convert incoming materials to MaterialWithQuantity if needed
      const materialsToUse = params.materials || selectedMaterials;
      const materialOptions = materialsToUse.map(material => {
        // If it's already MaterialWithQuantity, use it; otherwise add quantity
        if ('quantity' in material) {
          return convertToMaterialOption(material as MaterialWithQuantity);
        } else {
          return convertToMaterialOption({ ...material, quantity: 1 } as MaterialWithQuantity);
        }
      });
      
      const materialsCost = selectedMaterials.reduce((total, m) => {
        const avgPrice = (m.priceRange.min + m.priceRange.max) / 2;
        return total + (avgPrice * m.quantity * cityPricing * qualityMultiplier);
      }, 0);
      
      const laborCost = laborCosts.reduce((total, l) => total + (l.total || 0), 0);
      const fixturesCost = materialsCost * 0.2;
      const tax = (materialsCost + laborCost + fixturesCost) * TAX_RATES.gst;
      const contingency = (materialsCost + laborCost + fixturesCost) * 0.1;
      
      const totalAmount = materialsCost + laborCost + fixturesCost + tax + contingency;
      
      // Create cost breakdown
      const costBreakdown: CostBreakdown = {
        materials: {
          name: 'Materials',
          nameHi: 'सामग्री',
          amount: { INR: materialsCost, USD: materialsCost * exchangeRate },
          percentage: (materialsCost / totalAmount) * 100,
          items: [],
          isEditable: true
        },
        labor: {
          name: 'Labor',
          nameHi: 'श्रम',
          amount: { INR: laborCost, USD: laborCost * exchangeRate },
          percentage: (laborCost / totalAmount) * 100,
          items: [],
          isEditable: true
        },
        furniture: {
          name: 'Furniture',
          nameHi: 'फर्नीचर',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        fixtures: {
          name: 'Fixtures',
          nameHi: 'फिक्सचर्स',
          amount: { INR: fixturesCost, USD: fixturesCost * exchangeRate },
          percentage: (fixturesCost / totalAmount) * 100,
          items: [],
          isEditable: true
        },
        appliances: {
          name: 'Appliances',
          nameHi: 'उपकरण',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        decor: {
          name: 'Decor',
          nameHi: 'सजावट',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        electrical: {
          name: 'Electrical',
          nameHi: 'विद्युत',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        plumbing: {
          name: 'Plumbing',
          nameHi: 'प्लंबिंग',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        painting: {
          name: 'Painting',
          nameHi: 'पेंटिंग',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        flooring: {
          name: 'Flooring',
          nameHi: 'फ्लोरिंग',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        falseCeiling: {
          name: 'False Ceiling',
          nameHi: 'फॉल्स सीलिंग',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        carpentry: {
          name: 'Carpentry',
          nameHi: 'बढ़ईगीरी',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        miscellaneous: {
          name: 'Miscellaneous',
          nameHi: 'विविध',
          amount: { INR: 0, USD: 0 },
          percentage: 0,
          items: [],
          isEditable: true
        },
        contingency: {
          name: 'Contingency',
          nameHi: 'आकस्मिक',
          amount: { INR: contingency, USD: contingency * exchangeRate },
          percentage: (contingency / totalAmount) * 100,
          items: [],
          isEditable: true
        },
        tax: {
          name: 'Tax',
          nameHi: 'टैक्स',
          amount: { INR: tax, USD: tax * exchangeRate },
          percentage: (tax / totalAmount) * 100,
          items: [],
          isEditable: false
        }
      };
      
      // Create estimate
      const costEstimate: CostEstimate = {
        id: `estimate_${Date.now()}`,
        renderId: params.roomType,
        totalCost: { INR: totalAmount, USD: totalAmount * exchangeRate },
        costPerSqFt: { 
          INR: totalAmount / (params.dimensions.area || 1), 
          USD: (totalAmount * exchangeRate) / (params.dimensions.area || 1) 
        },
        breakdown: costBreakdown,
        estimatedDuration: {
          totalDays: Math.ceil(params.dimensions.area / 100),
          workingDays: Math.ceil(params.dimensions.area / 100),
          phases: []
        },
        location: {
          city: city,
          state: 'Maharashtra',
          country: 'India',
          tier: 'metro' as CityTier,
          laborMultiplier: cityPricing,
          materialMultiplier: cityPricing
        },
        qualityTier: quality,
        lineItems: selectedMaterials.map(material => {
          const avgPrice = (material.priceRange.min + material.priceRange.max) / 2;
          const materialOption = convertToMaterialOption(material);
          
          return {
            id: material.id,
            category: 'materials' as any,
            name: material.name,
            nameHi: material.nameHi,
            quantity: material.quantity,
            unit: material.priceRange.unit as any,
            unitPrice: materialOption.pricePerUnit,
            totalPrice: { 
              INR: avgPrice * material.quantity,
              USD: (avgPrice * material.quantity) * exchangeRate
            },
            quality: material.quality as QualityTier,
            isDetected: false,
            confidence: 1,
            isUserModified: false
          };
        }),
        adjustments: [],
        confidence: 0.85,
        priceDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setEstimate(costEstimate);
      setBreakdown(costBreakdown);
      return costEstimate;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to calculate cost';
      setError(errorMessage);
      console.error('Cost calculation error:', err);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [selectedMaterials, laborCosts, city, qualityMultiplier, cityPricing, exchangeRate, quality, convertToMaterialOption]);

  const calculateFromImage = useCallback(async (
    imageUrl: string
  ): Promise<CostEstimate | null> => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cost/from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          city,
          quality,
          currency,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Image analysis failed');
      }
      
      const data = await response.json();
      
      setEstimate(data.estimate);
      setBreakdown(data.breakdown);
      // Convert detected materials to MaterialWithQuantity
      const detectedWithQuantity = (data.detectedMaterials || []).map((m: Material) => ({ ...m, quantity: 1 }));
      setSelectedMaterials(detectedWithQuantity);
      setLaborCosts(data.laborCosts || []);
      
      return data.estimate;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze image for cost';
      setError(errorMessage);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [city, quality, currency]);

  // Utility functions
  const getBreakdown = useCallback((): CostBreakdown => {
    if (breakdown) return breakdown;
    
    const materialsCost = selectedMaterials.reduce((total, m) => {
      const avgPrice = (m.priceRange.min + m.priceRange.max) / 2;
      return total + (avgPrice * m.quantity * cityPricing * qualityMultiplier);
    }, 0);
    
    const laborCost = laborCosts.reduce((total, l) => total + (l.total || 0), 0);
    const fixturesCost = materialsCost * 0.2;
    const tax = (materialsCost + laborCost + fixturesCost) * TAX_RATES.gst;
    const contingency = (materialsCost + laborCost + fixturesCost) * 0.1;
    
    const totalAmount = materialsCost + laborCost + fixturesCost + tax + contingency;
    
    return {
      materials: {
        name: 'Materials',
        nameHi: 'सामग्री',
        amount: { INR: materialsCost, USD: materialsCost * exchangeRate },
        percentage: (materialsCost / totalAmount) * 100,
        items: [],
        isEditable: true
      },
      labor: {
        name: 'Labor',
        nameHi: 'श्रम',
        amount: { INR: laborCost, USD: laborCost * exchangeRate },
        percentage: (laborCost / totalAmount) * 100,
        items: [],
        isEditable: true
      },
      furniture: {
        name: 'Furniture',
        nameHi: 'फर्नीचर',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      fixtures: {
        name: 'Fixtures',
        nameHi: 'फिक्सचर्स',
        amount: { INR: fixturesCost, USD: fixturesCost * exchangeRate },
        percentage: (fixturesCost / totalAmount) * 100,
        items: [],
        isEditable: true
      },
      appliances: {
        name: 'Appliances',
        nameHi: 'उपकरण',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      decor: {
        name: 'Decor',
        nameHi: 'सजावट',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      electrical: {
        name: 'Electrical',
        nameHi: 'विद्युत',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      plumbing: {
        name: 'Plumbing',
        nameHi: 'प्लंबिंग',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      painting: {
        name: 'Painting',
        nameHi: 'पेंटिंग',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      flooring: {
        name: 'Flooring',
        nameHi: 'फ्लोरिंग',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      falseCeiling: {
        name: 'False Ceiling',
        nameHi: 'फॉल्स सीलिंग',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      carpentry: {
        name: 'Carpentry',
        nameHi: 'बढ़ईगीरी',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      miscellaneous: {
        name: 'Miscellaneous',
        nameHi: 'विविध',
        amount: { INR: 0, USD: 0 },
        percentage: 0,
        items: [],
        isEditable: true
      },
      contingency: {
        name: 'Contingency',
        nameHi: 'आकस्मिक',
        amount: { INR: contingency, USD: contingency * exchangeRate },
        percentage: (contingency / totalAmount) * 100,
        items: [],
        isEditable: true
      },
      tax: {
        name: 'Tax',
        nameHi: 'टैक्स',
        amount: { INR: tax, USD: tax * exchangeRate },
        percentage: (tax / totalAmount) * 100,
        items: [],
        isEditable: false
      }
    };
  }, [breakdown, selectedMaterials, laborCosts, cityPricing, qualityMultiplier, exchangeRate]);

  const getMaterialsForRoom = useCallback((roomType: string): Material[] => {
    // Filter materials based on room type
    return MATERIALS.filter(m => {
      // Simplified logic
      if (roomType.includes('kitchen')) {
        return m.category === 'kitchen' || m.category === 'flooring';
      }
      if (roomType.includes('bathroom')) {
        return m.category === 'bathroom' || m.category === 'flooring';
      }
      return true;
    });
  }, []);

  const getLaborRates = useCallback((workType: string): LaborCost => {
    const rates = PRICING_2025_INDIA.LABOR_RATES?.general || [];
    const rate = rates.find(r => r.id === workType || r.name.toLowerCase().includes(workType.toLowerCase()));
    
    return {
      breakdown: [],
      subtotal: rate?.ratePerDay || 0,
      contingency: 0,
      total: rate?.ratePerDay || 0,
      estimatedDays: 0,
      currency: currency,
    };
  }, [currency]);

  const convertCurrency = useCallback((
    amount: number, 
    from: CurrencyType, 
    to: CurrencyType
  ): number => {
    const inrAmount = amount / EXCHANGE_RATES[from];
    return inrAmount * EXCHANGE_RATES[to];
  }, []);

  const exportEstimate = useCallback(async (
    format: 'pdf' | 'excel' | 'json'
  ): Promise<Blob> => {
    if (!estimate) {
      throw new Error('No estimate available to export');
    }
    
    const response = await fetch('/api/cost/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimate,
        breakdown,
        materials: selectedMaterials,
        laborCosts,
        format,
        currency,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export estimate');
    }
    
    return response.blob();
  }, [estimate, breakdown, selectedMaterials, laborCosts, currency]);

  const shareEstimate = useCallback(async (): Promise<string> => {
    if (!estimate) {
      throw new Error('No estimate available to share');
    }
    
    const response = await fetch('/api/cost/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimate,
        breakdown,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create shareable link');
    }
    
    const { shareUrl } = await response.json();
    return shareUrl;
  }, [estimate, breakdown]);

  const reset = useCallback(() => {
    setEstimate(null);
    setBreakdown(null);
    setSelectedMaterials([]);
    setLaborCosts([]);
    setDimensions(null);
    setError(null);
  }, []);

  return {
    // State
    isCalculating,
    estimate,
    breakdown,
    selectedMaterials: selectedMaterials.map(convertToMaterialOption),
    laborCosts,
    totalCost,
    currency,
    city,
    exchangeRate,
    error,
    
    // Configuration
    setCity,
    setCurrency,
    setQuality,
    setDimensions,
    
    // Material operations
    addMaterial,
    removeMaterial,
    updateMaterialQuantity,
    clearMaterials,
    
    // Calculation
    calculateCost,
    calculateFromImage,
    
    // Utility
    getBreakdown,
    getMaterialsForRoom,
    getLaborRates,
    convertCurrency,
    
    // Export
    exportEstimate,
    shareEstimate,
    
    // Reset
    reset,
  };
}