// types/vastu.ts
// Vastu Shastra analysis types

// ============================================
// ENUMS & TYPES
// ============================================

// Export CompassDirection from THIS file
export type CompassDirection = 'NORTH' | 'NORTHEAST' | 'EAST' | 'SOUTHEAST' | 
                               'SOUTH' | 'SOUTHWEST' | 'WEST' | 'NORTHWEST';

// ============================================
// VASTU ANALYSIS
// ============================================

export interface VastuAnalysis {
  id: string;
  renderId: string;
  projectId?: string;
  roomId?: string;
  
  // Overall score
  overallScore: VastuScore;
  
  // Category-wise analysis
  categories: VastuCategoryAnalysis[];
  
  // Individual rule evaluations
  ruleEvaluations: VastuRuleEvaluation[];
  
  // Detected elements
  detectedElements: DetectedElement[];
  
  // Suggestions
  suggestions: VastuSuggestion[];
  autoFixAvailable: boolean;
  
  // Additional analysis data
  positiveAspects?: string[]; // Added missing property
  compass?: VastuCompass; // Added missing property
  
  // Room details
  roomDirection: CompassDirection | null;
  roomType: string;
  
  // Metadata
  analysisVersion: string;
  confidence: number;
  processingTime: number;
  
  createdAt: Date;
}

export interface VastuScore {
  value: number; // 0-100
  grade: VastuGrade;
  label: string;
  labelHi: string;
  color: string;
  description: string;
  descriptionHi: string;
}

export type VastuGrade = 'excellent' | 'good' | 'average' | 'poor' | 'critical';

// ============================================
// VASTU CATEGORIES
// ============================================

export interface VastuCategoryAnalysis {
  category: VastuCategory;
  score: number;
  maxScore: number;
  percentage: number;
  status: VastuStatus;
  findings: string[];
  findingsHi: string[];
}

// Updated to include 'study' category that was causing errors
export type VastuCategory =
  | 'entrance'        // Main entrance & doors
  | 'bedroom'         // Bedroom placement & bed direction
  | 'kitchen'         // Kitchen location & stove placement
  | 'bathroom'        // Bathroom & toilet location
  | 'puja'            // Puja room / prayer area
  | 'living'          // Living room arrangement
  | 'direction'       // Overall directional compliance
  | 'elements'        // Five elements balance
  | 'colors'          // Color scheme compliance
  | 'furniture'       // Furniture placement
  | 'lighting'        // Natural & artificial lighting
  | 'plants'          // Indoor plants placement
  | 'mirrors'         // Mirror placement
  | 'water'           // Water elements (aquarium, fountain)
  | 'storage'         // Storage & clutter
  | 'study';          // Added missing category

export type VastuStatus = 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';

// ============================================
// VASTU RULES
// ============================================

export interface VastuRule {
  id: string;
  code: string; // e.g., "VR-001"
  
  // Rule details
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  
  // Category & priority
  category: VastuCategory;
  priority: VastuPriority;
  weight: number; // Impact on overall score (1-10)
  
  // Application
  applicableRoomTypes: string[];
  applicablePropertyTypes: string[];
  
  // Conditions
  conditions: VastuCondition[];
  
  // Remedies
  remedies: VastuRemedy[];
  
  // Reference
  source: string; // Vastu text reference
  isTraditional: boolean;
  isModernAdaptation: boolean;
}

export type VastuPriority = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface VastuCondition {
  type: 'element_position' | 'element_direction' | 'element_color' | 'element_material' | 'room_direction' | 'element_presence' | 'element_absence';
  element?: string;
  direction?: CompassDirection | CompassDirection[];
  position?: VastuPosition;
  color?: string | string[];
  material?: string | string[];
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'exists' | 'not_exists';
}

export type VastuPosition =
  | 'center'
  | 'north'
  | 'northeast'
  | 'east'
  | 'southeast'
  | 'south'
  | 'southwest'
  | 'west'
  | 'northwest'
  | 'corner'
  | 'wall'
  | 'near-entrance'
  | 'near-window';

// ============================================
// RULE EVALUATION
// ============================================

export interface VastuRuleEvaluation {
  ruleId: string;
  ruleCode: string;
  ruleTitle: string;
  ruleTitleHi: string;
  
  status: 'passed' | 'failed' | 'warning' | 'not-applicable';
  score: number;
  maxScore: number;
  
  details: string;
  detailsHi: string;
  
  affectedElements: string[];
  suggestedRemedyIds: string[];
  
  confidence: number;
}

// ============================================
// DETECTED ELEMENTS
// ============================================

export interface DetectedElement {
  id: string;
  type: VastuElementType;
  name: string;
  nameHi: string;
  
  // Position in image
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Vastu properties
  position: VastuPosition;
  direction?: CompassDirection;
  color?: string;
  material?: string;
  
  // Analysis
  vastuCompliance: VastuStatus;
  issues: string[];
  issuesHi: string[];
  
  confidence: number;
}

export type VastuElementType =
  | 'bed'
  | 'sofa'
  | 'dining-table'
  | 'stove'
  | 'sink'
  | 'toilet'
  | 'mirror'
  | 'window'
  | 'door'
  | 'plant'
  | 'aquarium'
  | 'fountain'
  | 'temple'
  | 'idol'
  | 'clock'
  | 'painting'
  | 'bookshelf'
  | 'wardrobe'
  | 'tv'
  | 'desk'
  | 'chair'
  | 'lamp'
  | 'chandelier'
  | 'rug'
  | 'curtain'
  | 'stairs'
  | 'pillar'
  | 'beam'
  | 'other';

// ============================================
// VASTU SUGGESTIONS
// ============================================

export interface VastuSuggestion {
  id: string;
  type: VastuSuggestionType;
  priority: VastuPriority;
  
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  
  // What needs to change
  affectedElement?: string;
  currentState: string;
  suggestedState: string;
  
  // Impact
  scoreImpact: number; // How many points this fix adds
  
  // Implementation
  difficulty: 'easy' | 'moderate' | 'difficult';
  estimatedCost?: {
    INR: { min: number; max: number };
    USD: { min: number; max: number };
  };
  
  // AI Auto-fix
  canAutoFix: boolean;
  autoFixPrompt?: string;
  
  // Reference
  relatedRuleIds: string[];
}

export type VastuSuggestionType =
  | 'relocate'      // Move element to different position
  | 'reorient'      // Change direction/orientation
  | 'add'           // Add new element
  | 'remove'        // Remove element
  | 'replace'       // Replace with different element
  | 'color-change'  // Change color
  | 'material-change' // Change material
  | 'remedy';       // Apply Vastu remedy (plants, crystals, etc.)

// ============================================
// VASTU REMEDIES
// ============================================

export interface VastuRemedy {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  
  type: VastuRemedyType;
  category: VastuCategory;
  
  // Where to apply
  placement: VastuPosition[];
  direction?: CompassDirection[];
  
  // What it fixes
  fixesIssues: string[];
  
  // Implementation
  items: VastuRemedyItem[];
  instructions: string[];
  instructionsHi: string[];
  
  // Cost
  estimatedCost: {
    INR: { min: number; max: number };
    USD: { min: number; max: number };
  };
  
  // Effectiveness
  effectiveness: 'high' | 'medium' | 'low';
  
  isTraditional: boolean;
  isModernAlternative: boolean;
}

export type VastuRemedyType =
  | 'placement'     // Strategic placement of items
  | 'color'         // Color-based remedy
  | 'element'       // Five elements balance
  | 'yantra'        // Vastu yantras
  | 'crystal'       // Crystals and gemstones
  | 'plant'         // Specific plants
  | 'metal'         // Metal objects
  | 'mirror'        // Mirror placement
  | 'light'         // Lighting adjustment
  | 'water'         // Water features
  | 'salt'          // Salt remedy
  | 'camphor';      // Camphor/incense

export interface VastuRemedyItem {
  name: string;
  nameHi: string;
  quantity: number;
  specifications?: string;
  whereToGet?: string;
}

// ============================================
// VASTU COMPASS
// ============================================

export interface VastuCompass {
  propertyFacing: CompassDirection;
  entranceFacing: CompassDirection;
  zones: VastuZone[];
}

export interface VastuZone {
  direction: CompassDirection;
  name: string;
  nameHi: string;
  deity: string;
  deityHi: string;
  element: VastuElement;
  idealFor: string[];
  avoidFor: string[];
  colors: string[];
  status: VastuStatus;
}

export type VastuElement = 'earth' | 'water' | 'fire' | 'air' | 'space';

// ============================================
// VASTU REPORT
// ============================================

export interface VastuReport {
  id: string;
  projectId: string;
  
  // Summary
  title: string;
  generatedAt: Date;
  overallScore: VastuScore;
  
  // Room-wise analysis
  roomAnalyses: {
    roomId: string;
    roomName: string;
    roomType: string;
    analysis: VastuAnalysis;
  }[];
  
  // Top issues
  topIssues: VastuRuleEvaluation[];
  
  // Priority suggestions
  prioritySuggestions: VastuSuggestion[];
  
  // Compass analysis
  compass: VastuCompass;
  
  // Export info
  format: 'pdf' | 'html';
  downloadUrl?: string;
}