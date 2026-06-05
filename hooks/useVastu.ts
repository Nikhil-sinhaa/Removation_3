// types/vastu.ts
// Vastu Shastra analysis types

// ============================================
// COMPASS DIRECTIONS
// ============================================

export type CompassDirection =
  | 'NORTH'
  | 'NORTHEAST'
  | 'EAST'
  | 'SOUTHEAST'
  | 'SOUTH'
  | 'SOUTHWEST'
  | 'WEST'
  | 'NORTHWEST';

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
  positiveAspects?: any[];
  compass?: any;

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
  | 'storage';        // Storage & clutter

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



import { useState, useCallback } from 'react';
import { analyzeVastu, type VastuAnalysisResult } from '@/lib/vastu-engine';

export function useVastu(initialParams?: any) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VastuAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback((params?: any) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // Simulate delay
      setTimeout(() => {
        const result = analyzeVastu(params || initialParams);
        const mappedResult: VastuAnalysis = {
          id: `vastu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          renderId: `render-${Date.now()}`,
          projectId: params?.projectId || initialParams?.projectId,
          overallScore: {
            value: result.overallScore.value,
            grade: result.overallScore.grade === 'fair' ? 'average' : result.overallScore.grade as any,
            label: result.overallScore.label,
            labelHi: result.overallScore.labelHi,
            color: result.overallScore.value >= 80 ? 'text-green-500' : result.overallScore.value >= 60 ? 'text-yellow-500' : result.overallScore.value >= 40 ? 'text-orange-500' : 'text-red-500',
            description: result.overallScore.description,
            descriptionHi: result.overallScore.descriptionHi
          },
          categories: (result.categories || []).map((cat: any) => ({
            category: cat.category || 'general',
            score: cat.score || 100,
            maxScore: cat.maxScore || 100,
            percentage: cat.percentage || 100,
            status: cat.status || 'compliant',
            findings: cat.findings || [],
            findingsHi: cat.findingsHi || []
          })),
          ruleEvaluations: (result.ruleEvaluations || []).map((rule: any) => ({
            ruleId: rule.ruleId,
            ruleCode: rule.ruleCode || rule.ruleId,
            ruleTitle: rule.ruleTitle || rule.title || '',
            ruleTitleHi: rule.ruleTitleHi || rule.titleHi || '',
            status: rule.status || (rule.passed ? 'passed' : 'failed'),
            score: rule.score || (rule.passed ? rule.points : 0),
            maxScore: rule.maxScore || rule.points || 100,
            details: rule.details || rule.reason || '',
            detailsHi: rule.detailsHi || '',
            affectedElements: rule.affectedElements || [],
            suggestedRemedyIds: rule.suggestedRemedyIds || [],
            confidence: rule.confidence || 1.0
          })),
          detectedElements: (result.detectedElements || []).map((elem: any, idx: number) => ({
            id: elem.id || `elem-${idx}`,
            type: elem.type || 'other',
            name: elem.name || elem.toString(),
            nameHi: elem.nameHi || elem.toString(),
            boundingBox: elem.boundingBox || { x: 0, y: 0, width: 0, height: 0 },
            position: elem.position || 'center',
            vastuCompliance: elem.vastuCompliance || 'compliant',
            issues: elem.issues || [],
            issuesHi: elem.issuesHi || [],
            confidence: elem.confidence || 1.0
          })),
          suggestions: (result.suggestions || []).map((sug: any) => ({
            id: sug.id,
            type: sug.type,
            priority: sug.priority === 'high' ? 'high' : sug.priority === 'medium' ? 'medium' : 'low',
            title: sug.title,
            titleHi: sug.titleHi || sug.title,
            description: sug.description,
            descriptionHi: sug.descriptionHi || sug.description,
            currentState: sug.currentState,
            suggestedState: sug.suggestedState,
            scoreImpact: sug.scoreImpact,
            difficulty: sug.difficulty,
            canAutoFix: sug.canAutoFix,
            relatedRuleIds: sug.relatedRuleIds || []
          })),
          autoFixAvailable: result.autoFixAvailable,
          positiveAspects: result.positiveAspects,
          compass: result.compass,
          roomDirection: (params?.direction || initialParams?.direction || null) as any,
          roomType: params?.roomType || initialParams?.roomType || 'general',
          analysisVersion: '2.0',
          confidence: result.confidence,
          processingTime: result.processingTime,
          createdAt: new Date()
        };
        setAnalysis(mappedResult);
        setIsAnalyzing(false);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      setIsAnalyzing(false);
    }
  }, [initialParams]);

  return {
    analyze,
    analysis,
    isAnalyzing,
    error
  };
}