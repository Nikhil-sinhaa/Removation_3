// types/cost.ts
// Renovation cost calculation types

import { RoomTypeId } from './editor';
import { PropertyType } from './project';

// ============================================
// COST ESTIMATE
// ============================================

export interface CostEstimate {
  id: string;
  renderId?: string;
  projectId?: string;
  roomId?: string;
  
  // Total costs
  totalCost: CurrencyAmount;
  costPerSqFt: CurrencyAmount;
  
  // Breakdown
  breakdown: CostBreakdown;
  
  // Timeline
  estimatedDuration: Duration;
  
  // Location
  location: CostLocation;
  
  // Quality tier
  qualityTier: QualityTier;
  
  // Detailed items
  lineItems: CostLineItem[];
  
  // Adjustments
  adjustments: CostAdjustment[];
  
  // Confidence
  confidence: number;
  priceDate: Date; // When prices were last updated
  
  // Comparison
  marketComparison?: MarketComparison;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrencyAmount {
  INR: number;
  USD: number;
}

export interface CurrencyRange {
  INR: { min: number; max: number };
  USD: { min: number; max: number };
}

// ============================================
// COST BREAKDOWN
// ============================================

export interface CostBreakdown {
  materials: CostCategory;
  labor: CostCategory;
  furniture: CostCategory;
  fixtures: CostCategory;
  appliances: CostCategory;
  decor: CostCategory;
  electrical: CostCategory;
  plumbing: CostCategory;
  painting: CostCategory;
  flooring: CostCategory;
  falseCeiling: CostCategory;
  carpentry: CostCategory;
  miscellaneous: CostCategory;
  contingency: CostCategory;
  tax: CostCategory;
}


export interface CostCategory {
  name: string;
  nameHi: string;
  amount: CurrencyAmount;
  percentage: number;
  items: CostLineItem[];
  isEditable: boolean;
}

// ============================================
// LINE ITEMS
// ============================================

export interface CostLineItem {
  id: string;
  category: keyof CostBreakdown;
  
  name: string;
  nameHi: string;
  description?: string;
  
  // Quantity
  quantity: number;
  unit: CostUnit;
  
  // Pricing
  unitPrice: CurrencyAmount;
  totalPrice: CurrencyAmount;
  
  // Options
  material?: MaterialOption;
  brand?: string;
  quality: QualityTier;
  
  // AI detected
  isDetected: boolean;
  confidence: number;
  
  // User edits
  isUserModified: boolean;
  originalPrice?: CurrencyAmount;
  
  // Alternatives
  alternatives?: CostLineItemAlternative[];
}

export interface CostLineItemAlternative {
  id: string;
  name: string;
  unitPrice: CurrencyAmount;
  quality: QualityTier;
  savings: CurrencyAmount;
  description: string;
}

export type CostUnit =
  | 'sqft'
  | 'sqm'
  | 'rft' // running feet
  | 'unit'
  | 'set'
  | 'pair'
  | 'kg'
  | 'liter'
  | 'bag'
  | 'piece'
  | 'lot'
  | 'day'
  | 'hour';

// ============================================
// QUALITY TIERS
// ============================================

export type QualityTier = 'budget' | 'standard' | 'premium' | 'luxury';

export interface QualityTierConfig {
  id: QualityTier;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  multiplier: number;
  features: string[];
  featuresHi: string[];
}

// ============================================
// MATERIAL OPTIONS
// ============================================

export interface MaterialOption {
  id: string;
  name: string;
  nameHi: string;
  category: MaterialCategory;
  
  // Pricing
  pricePerUnit: CurrencyAmount;
  unit: CostUnit;
  
  // Quality & specs
  quality: QualityTier;
  brand?: string;
  specifications?: Record<string, string>;
  
  // Visual
  thumbnail?: string;
  color?: string;
  
  // Availability
  availability: 'available' | 'limited' | 'order';
  leadTime?: number; // days
  
  // Sustainability
  isSustainable: boolean;
  sustainabilityRating?: number;
}

export type MaterialCategory =
  | 'flooring'
  | 'wall-finish'
  | 'ceiling'
  | 'countertop'
  | 'cabinet'
  | 'door'
  | 'window'
  | 'tile'
  | 'paint'
  | 'hardware'
  | 'lighting'
  | 'plumbing'
  | 'electrical';

// ============================================
// LOCATION & LABOR
// ============================================

export interface CostLocation {
  city: string;
  state: string;
  country: string;
  tier: CityTier;
  laborMultiplier: number;
  materialMultiplier: number;
}

export type CityTier = 'metro' | 'tier1' | 'tier2' | 'tier3' | 'rural';

export interface LaborRate {
  category: LaborCategory;
  name: string;
  nameHi: string;
  dailyRate: CurrencyAmount;
  hourlyRate: CurrencyAmount;
  skill: 'skilled' | 'semi-skilled' | 'unskilled';
  cityTier: CityTier;
}

export type LaborCategory =
  | 'civil-contractor'
  | 'mason'
  | 'carpenter'
  | 'electrician'
  | 'plumber'
  | 'painter'
  | 'tiler'
  | 'welder'
  | 'glass-worker'
  | 'ac-technician'
  | 'interior-designer'
  | 'architect'
  | 'supervisor'
  | 'helper';

// ============================================
// DURATION
// ============================================

export interface Duration {
  totalDays: number;
  workingDays: number;
  phases: DurationPhase[];
}

export interface DurationPhase {
  name: string;
  nameHi: string;
  days: number;
  order: number;
  dependencies: string[];
  tasks: string[];
}

// ============================================
// ADJUSTMENTS
// ============================================

export interface CostAdjustment {
  id: string;
  type: AdjustmentType;
  name: string;
  nameHi: string;
  description: string;
  
  // Amount
  amount: CurrencyAmount;
  percentage?: number;
  
  // Application
  appliesTo: 'total' | 'materials' | 'labor' | 'specific';
  specificCategories?: (keyof CostBreakdown)[];
  
  isAutoApplied: boolean;
  isRemovable: boolean;
}

export type AdjustmentType =
  | 'tax'
  | 'discount'
  | 'seasonal'
  | 'bulk'
  | 'location'
  | 'quality'
  | 'urgency'
  | 'contingency'
  | 'custom';

// ============================================
// MARKET COMPARISON
// ============================================

export interface MarketComparison {
  cityAverage: CurrencyAmount;
  cityRange: CurrencyRange;
  nationalAverage: CurrencyAmount;
  percentileRank: number; // 0-100
  
  similarProjects: SimilarProject[];
  
  priceIndex: PriceIndex;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface SimilarProject {
  id: string;
  type: PropertyType;
  roomType: RoomTypeId;
  style: string;
  area: number;
  cost: CurrencyAmount;
  location: string;
  completedAt: Date;
}

export interface PriceIndex {
  current: number;
  lastMonth: number;
  lastYear: number;
  fiveYearAvg: number;
}

// ============================================
// COST SETTINGS
// ============================================

export interface CostSettings {
  currency: 'INR' | 'USD';
  qualityTier: QualityTier;
  location: CostLocation;
  includeLabor: boolean;
  includeFurniture: boolean;
  includeAppliances: boolean;
  includeTax: boolean;
  taxRate: number;
  contingencyRate: number;
  customAdjustments: CostAdjustment[];
}

// ============================================
// COST REPORT
// ============================================

export interface CostReport {
  id: string;
  projectId: string;
  
  title: string;
  generatedAt: Date;
  
  // Summary
  totalEstimate: CostEstimate;
  
  // Room-wise
  roomEstimates: {
    roomId: string;
    roomName: string;
    estimate: CostEstimate;
  }[];
  
  // Visualizations
  charts: {
    breakdownPie: ChartData;
    categoryBar: ChartData;
    timeline: ChartData;
  };
  
  // Export
  format: 'pdf' | 'xlsx' | 'csv';
  downloadUrl?: string;
}

export interface ChartData {
  type: 'pie' | 'bar' | 'line';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
  }[];
}

// ============================================
// VENDOR & QUOTES
// ============================================

export interface VendorQuote {
  id: string;
  vendorName: string;
  vendorType: 'contractor' | 'supplier' | 'designer';
  
  items: CostLineItem[];
  totalAmount: CurrencyAmount;
  
  validUntil: Date;
  terms: string;
  
  rating?: number;
  reviewCount?: number;
  
  contactInfo?: {
    phone: string;
    email: string;
    address?: string;
  };
}

// ============================================
// FINANCING
// ============================================

export interface FinancingOption {
  id: string;
  provider: string;
  type: 'loan' | 'credit' | 'emi';
  
  // Terms
  principal: CurrencyAmount;
  interestRate: number;
  tenure: number; // months
  emi: CurrencyAmount;
  totalPayable: CurrencyAmount;
  
  // Eligibility
  minIncome?: CurrencyAmount;
  minCreditScore?: number;
  
  // Features
  features: string[];
  processingFee: CurrencyAmount;
  prepaymentCharges?: string;
}
// ============================================
// UI / DERIVED TYPES (Adapters for components)
// ============================================

// Currency toggle helpers
export type CurrencyType = 'INR' | 'USD';

// UI-friendly breakdown array
export type CostBreakdownData = {
  key: keyof CostBreakdown;
  category: CostCategory;
}[];

// Material grade (UI alias)
export type MaterialGrade = QualityTier;

// Labor
export type LaborQuality = 'standard' | 'premium' | 'luxury';
export type LaborType = 
  | 'carpenter'
  | 'painter'
  | 'electrician'
  | 'plumber'
  | 'flooring'
  | 'falseCeiling'
  | 'civilWork'
  | 'supervisor';

// Chart helpers
export interface CostChartPoint {
  name: string;
  value: number;
}

// City pricing (comparison UI)
export interface CityPricing {
  city: string;
  tier: CityTier;
  multiplier: number;
}

// Cost settings (UI EXTENSION)
export interface UICostSettings extends CostSettings {
  city: string;
  materialGrade: MaterialGrade;
  laborQuality: LaborQuality;
  urgency: 'low' | 'medium' | 'high';
  taxIncluded: boolean;
}
// ============================================
// UI COST TYPES (FOR REACT COMPONENTS)
// ============================================

export interface UICostLineItem {
  id: string;
  name: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
  recommended?: boolean;
}

export interface UICostCategory {
  id: string;
  name: string;
  amount: number;
  itemCount?: number;
  items: UICostLineItem[];
}

export interface UICostEstimate {
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;

  pricePerSqFt?: number;

  categories: UICostCategory[];
}
// ============================================
// COST CHART UI ADAPTER
// ============================================

export interface CostMaterialEntry {
  id: string;
  name: string;
  category?: string; // flooring, paint, carpentry, etc.
  cost: number;
  quantity?: number;
}


export interface UICostChartData {
  currency: CurrencyType;

  // Materials
  materials: CostMaterialEntry[];
  materialTotal: number;

  // Labor & tax
  laborTotal: number;
  tax: number;

  // Grand total
  grandTotal: number;

  // Timeline
  estimatedDays: number;
}

// Add these interfaces to types/cost.ts (at the end or appropriate section)

// For CostPanel component
export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'feet' | 'meters';
  area: number;
}

// For UI cost estimate display
export interface UIEstimateDisplay {
  totalCost: number;
  breakdown: {
    materials: { amount: number };
    labor: { amount: number };
    tax: { amount: number };
    other: { amount: number };
  };
  estimatedDuration: { totalDays: number };
  trend: 'up' | 'down';
  trendPercentage: number;
}

// Component props interfaces
export interface CostBreakdownProps {
  estimate: UICostEstimate;
  currency: CurrencyType;
  isLoading?: boolean;
  formatCurrency?: (amount: number) => string;
  includeGST?: boolean;
  onToggleGST?: (include: boolean) => void;
  expanded?: boolean;
}

export interface CitySelectorProps {
  value: string;
  onChange: (city: string) => void;
  currency: CurrencyType;
}

export interface CurrencyToggleProps {
  value: CurrencyType;
  onChange: (currency: CurrencyType) => void;
}

export interface MaterialSelectorProps {
  roomType: string;
  styleType: string;
  grade: MaterialGrade;
  currency: CurrencyType;
  onMaterialsChange: (materials: any[]) => void;
}

export interface LaborCalculatorProps {
  city: string;
  roomType: string;
  area: number;
  materialGrade: MaterialGrade;
  laborQuality: LaborQuality;
  currency: CurrencyType;
  onLaborCostChange: (cost: LaborCost) => void;
  className?: string;
}

export interface CostChartProps {
  data: UIEstimateDisplay['breakdown'];
  currency: CurrencyType;
  compact?: boolean;
}

export interface CostComparisonProps {
  costData?: UICostChartData;
  currentCity?: string;
  roomType?: string;
  style?: string;
  areaInSqFt?: number;
  currency?: CurrencyType;
  // Alternative props for different component versions
  currentEstimate?: UIEstimateDisplay;
  city?: string;
  area?: number;
}

export interface CitySelectorProps {
  value: string;
  onChange: (city: string) => void;
  currency: CurrencyType;
}

export interface CurrencyToggleProps {
  value: CurrencyType;
  onChange: (currency: CurrencyType) => void;
}

export interface MaterialSelectorProps {
  roomType: string;
  styleType: string;
  grade: MaterialGrade;
  currency: CurrencyType;
  onMaterialsChange: (materials: any[]) => void;
}

export interface LaborCalculatorProps {
  city: string;
  roomType: string;
  area: number;
  materialGrade: MaterialGrade;
  laborQuality: LaborQuality;
  currency: CurrencyType;
  onLaborCostChange: (cost: LaborCost) => void;
  className?: string;
}

export interface CostChartProps {
  data: UIEstimateDisplay['breakdown'];
  currency: CurrencyType;
  compact?: boolean;
}

export interface CostComparisonProps {
  costData?: UICostChartData;
  currentCity?: string;
  roomType?: string;
  style?: string;
  areaInSqFt?: number;
  currency?: CurrencyType;
  currentEstimate?: UIEstimateDisplay;
  city?: string;
  area?: number;
}
export interface LaborCost {
  breakdown: any[];
  subtotal: number;
  contingency: number;
  total: number;
  estimatedDays: number;
  currency: 'INR' | 'USD';
}