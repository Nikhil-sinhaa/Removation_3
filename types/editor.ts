// types/editor.ts
// Editor and rendering related types

import { VastuAnalysis } from './vastu';
import { CostEstimate } from './cost';

// ============================================
// TRANSFORMATION MODES
// ============================================

export type TransformationMode =
  | 'redesign'           // Interior AI Redesign
  | 'fill-room'          // Fill Empty Room
  | 'outdoor'            // Outdoor Spaces
  | 'sketch-to-render'   // Sketch to Render
  | 'enhance'            // AI Enhance (4K Upscale)
  | 'inpaint'            // Smart Inpainting
  | 'remove-object'      // Object Removal
  | 'replace-object'     // Object Replacement
  | 'change-material'    // Material Change
  | 'change-color'       // Color Change
  | 'declutter'          // Declutter Room
  | 'staging'            // Virtual Staging
  | 'lighting'           // Lighting Adjustment
  | 'seasonal'           // Seasonal Decoration
  | 'style-transfer'     // Style Transfer
  | 'floor-plan-3d';     // Floor Plan to 3D

export interface TransformationModeConfig {
  id: TransformationMode;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  icon: string;
  credits: number;
  isPro: boolean;
  requiresMask: boolean;
  requiresPrompt: boolean;
  estimatedTime: number; // in seconds
  category: 'design' | 'edit' | 'enhance' | 'special';
}

// ============================================
// EDITOR TOOLS & BRUSH SETTINGS
// ============================================

export type EditorTool = 
  | 'select'
  | 'crop'
  | 'brush'
  | 'mask'
  | 'text'
  | 'transform'
  | 'pan'
  | 'zoom';

export type ZoomLevel = 
  | 0.25 | 0.33 | 0.5 | 0.67 | 0.75 | 0.8 | 0.9 
  | 1 | 1.1 | 1.25 | 1.5 | 1.75 | 2 | 3 | 4;

export interface BrushSettings {
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
  isEraser: boolean;
  color: string;
}

// ============================================
// DESIGN STYLES
// ============================================

export interface DesignStyle {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  thumbnail: string;
  category: StyleCategory;
  tags: string[];
  promptModifier: string;
  popularity: number;
  isNew: boolean;
  isPremium: boolean;
}

export type StyleCategory =
  | 'modern'
  | 'traditional'
  | 'contemporary'
  | 'minimalist'
  | 'luxury'
  | 'industrial'
  | 'bohemian'
  | 'scandinavian'
  | 'coastal'
  | 'farmhouse'
  | 'mid-century'
  | 'art-deco'
  | 'indian'
  | 'asian'
  | 'mediterranean'
  | 'rustic';

// ============================================
// ROOM TYPES
// ============================================

export interface RoomType {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  thumbnail: string;
  promptModifier: string;
  defaultStyle: string;
  avgCostPerSqFt: {
    INR: { min: number; max: number };
    USD: { min: number; max: number };
  };
}

export type RoomTypeId =
  | 'living-room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'dining-room'
  | 'home-office'
  | 'kids-room'
  | 'puja-room'
  | 'balcony'
  | 'terrace'
  | 'entrance'
  | 'hallway'
  | 'basement'
  | 'garage'
  | 'outdoor'
  | 'garden'
  | 'swimming-pool'
  | 'gym'
  | 'theater'
  | 'wine-cellar';

// ============================================
// IMAGE & MASK DATA
// ============================================

export interface ImageData {
  url: string;
  width: number;
  height: number;
  file?: File;
  uploadedAt?: Date;
}

export interface MaskData {
  dataUrl: string;
  width: number;
  height: number;
  strokes: MaskStroke[];
}

export interface MaskStroke {
  points: { x: number; y: number }[];
  brushSize: number;
  brushHardness: number;
  isEraser: boolean;
}

// ============================================
// HISTORY ENTRY (Consolidated - Single Definition)
// ============================================

export type HistoryEntryType = 
  | 'upload' 
  | 'generate' 
  | 'edit' 
  | 'mask' 
  | 'transformation' 
  | 'color_change' 
  | 'material_change' 
  | 'vastu_adjustment' 
  | 'cost_update'
  | 'crop'
  | 'rotate'
  | 'flip'
  | 'mask_operation'
  | 'brush';

export interface HistoryEntry {
  id: string;
  type: HistoryEntryType;
  action?: string;
  timestamp: Date;
  image: ImageData;
  // Use intersection type to allow both EditorState properties and custom settings
  settings: Partial<EditorState> & HistoryCustomSettings;
  prevState?: Partial<EditorState>;
}

// ============================================
// RENDER QUEUE
// ============================================

export interface RenderQueueItem {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  settings: GenerationSettings;
  result?: Render;
  error?: string;
  addedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================
// EDITOR STATE
// ============================================

export interface EditorState {
  // Current image
  originalImage: ImageData | null;
  processedImage: ImageData | null;
  currentImage: ImageData | null;
  
  // Transform settings
  mode: TransformationMode;
  style: DesignStyle | null;
  roomType: RoomType | null;
  
  // Current tool
  currentTool: EditorTool;
  
  // Mask for inpainting
  mask: MaskData | null;
  brushSize: number;
  brushHardness: number;
  brushSettings: BrushSettings;
  
  // Generation settings
  prompt: string;
  negativePrompt: string;
  strength: number; // 0-1
  guidanceScale: number; // 1-20
  seed: number | null;
  numberOfOutputs: 1 | 2 | 3 | 4;
  
  // Color/Material settings
  selectedColor: string | null;
  selectedMaterial: string | null;
  
  // UI state
  zoom: number;
  panX: number;
  panY: number;
  showOriginal: boolean;
  compareMode: 'slider' | 'side-by-side' | 'overlay';
  
  // History
  history: HistoryEntry[];
  historyIndex: number;
  
  // Render state
  isGenerating: boolean;
  generationProgress: number;
  generationStatus: string;
  renderQueue: RenderQueueItem[];
  
  // Panels
  showVastuPanel: boolean;
  showCostPanel: boolean;
  showHistoryPanel: boolean;
  showLayersPanel: boolean;
  
  // Layers
  layers: Layer[];
  activeLayerId: string | null;
  
  // Results
  currentRender: Render | null;
  vastuAnalysis: VastuAnalysis | null;
  costEstimate: CostEstimate | null;
}
export interface HistoryCustomSettings {
  operation?: string;
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: number;
  flip?: 'horizontal' | 'vertical';
  pixels?: number;
  brushSize?: number;
  brushHardness?: number;
  brushOpacity?: number;
  brushColor?: string;
  brushFlow?: number;
  brushIsEraser?: boolean;
  mode?: string;
  [key: string]: any; // Allow any additional properties
}
// ============================================
// GENERATION & RENDER
// ============================================

export interface GenerationSettings {
  mode: TransformationMode;
  styleId: string;
  roomTypeId: string;
  prompt: string;
  negativePrompt: string;
  strength: number;
  guidanceScale: number;
  seed: number | null;
  numberOfOutputs: number;
  sourceImageUrl: string;
  maskUrl?: string;
  colorHex?: string;
  materialId?: string;
}

export interface Render {
  id: string;
  projectId: string;
  userId: string;
  
  // Images
  sourceImage: ImageData;
  outputImages: ImageData[];
  maskImage?: ImageData;
  
  // Settings used
  settings: GenerationSettings;
  
  // AI provider info
  provider: 'replicate' | 'groq';
  modelId: string;
  predictionId: string;
  
  // Analysis
  vastuAnalysis?: VastuAnalysis;
  costEstimate?: CostEstimate;
  
  // Metadata
  status: RenderStatus;
  creditsUsed: number;
  generationTime: number; // in ms
  isFavorite: boolean;
  isPublic: boolean;
  
  // Timestamps
  createdAt: Date;
  completedAt?: Date;
}

export type RenderStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface RenderEvent {
  type: 'progress' | 'completed' | 'failed';
  renderId: string;
  progress?: number;
  status?: string;
  outputUrls?: string[];
  error?: string;
}

// ============================================
// INPAINTING
// ============================================

export interface InpaintRequest {
  sourceImageUrl: string;
  maskUrl: string;
  prompt: string;
  negativePrompt?: string;
  guidanceScale?: number;
  strength?: number;
}

export interface ObjectRemovalRequest {
  sourceImageUrl: string;
  maskUrl: string;
}

export interface ObjectReplacementRequest {
  sourceImageUrl: string;
  maskUrl: string;
  replacementPrompt: string;
  style?: string;
}

// ============================================
// COLOR & MATERIAL
// ============================================

export interface ColorOption {
  id: string;
  name: string;
  nameHi: string;
  hex: string;
  category: 'neutral' | 'warm' | 'cool' | 'bold' | 'pastel';
}

export interface MaterialOption {
  id: string;
  name: string;
  nameHi: string;
  thumbnail: string;
  category: 'wood' | 'stone' | 'fabric' | 'metal' | 'glass' | 'concrete' | 'tile' | 'wallpaper';
  priceMultiplier: number;
}

// ============================================
// LAYERS (Consolidated - Single Definition)
// ============================================

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten';

export type LayerData =
  | { type: 'image'; url: string }
  | { type: 'mask'; dataUrl: string }
  | { type: 'overlay'; color: string }
  | { type: 'text'; content: string; font: string; size: number };

export interface Layer {
  id: string;
  name: string;
  type: 'image' | 'mask' | 'overlay' | 'text';
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  data: LayerData | null;
  order: number;
}

// ============================================
// EXPORT OPTIONS
// ============================================

export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp' | 'pdf';
  quality: number; // 0-100
  scale: 1 | 2 | 4;
  includeWatermark: boolean;
  includeVastuReport: boolean;
  includeCostReport: boolean;
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
  format: string;
}

// ============================================
// COMPARISON
// ============================================

export interface ComparisonData {
  before: ImageData;
  after: ImageData;
  sliderPosition: number;
  showLabels: boolean;
}

// ============================================
// EDITOR ACTIONS
// ============================================

export type EditorAction =
  | { type: 'SET_IMAGE'; payload: ImageData }
  | { type: 'SET_MODE'; payload: TransformationMode }
  | { type: 'SET_STYLE'; payload: DesignStyle }
  | { type: 'SET_ROOM_TYPE'; payload: RoomType }
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'SET_MASK'; payload: MaskData | null }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_TOOL'; payload: EditorTool }
  | { type: 'SET_BRUSH_SETTINGS'; payload: Partial<BrushSettings> }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: { progress: number; status: string } }
  | { type: 'SET_RENDER'; payload: Render }
  | { type: 'ADD_TO_QUEUE'; payload: RenderQueueItem }
  | { type: 'UPDATE_QUEUE_ITEM'; payload: { id: string; updates: Partial<RenderQueueItem> } }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'ADD_LAYER'; payload: Layer }
  | { type: 'UPDATE_LAYER'; payload: { id: string; updates: Partial<Layer> } }
  | { type: 'REMOVE_LAYER'; payload: string }
  | { type: 'SET_ACTIVE_LAYER'; payload: string | null }
  | { type: 'TOGGLE_PANEL'; payload: 'vastu' | 'cost' | 'history' | 'layers' }
  | { type: 'SET_VASTU_ANALYSIS'; payload: VastuAnalysis | null }
  | { type: 'SET_COST_ESTIMATE'; payload: CostEstimate | null }
  | { type: 'ADD_HISTORY'; payload: HistoryEntry }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' };

// ============================================
// INITIAL STATE
// ============================================

export const initialBrushSettings: BrushSettings = {
  size: 20,
  hardness: 0.8,
  opacity: 1,
  flow: 1,
  isEraser: false,
  color: '#ffffff',
};

export const initialEditorState: EditorState = {
  originalImage: null,
  processedImage: null,
  currentImage: null,
  mode: 'redesign',
  style: null,
  roomType: null,
  currentTool: 'select',
  mask: null,
  brushSize: 20,
  brushHardness: 0.8,
  brushSettings: initialBrushSettings,
  prompt: '',
  negativePrompt: '',
  strength: 0.75,
  guidanceScale: 7.5,
  seed: null,
  numberOfOutputs: 1,
  selectedColor: null,
  selectedMaterial: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  showOriginal: false,
  compareMode: 'slider',
  history: [],
  historyIndex: -1,
  isGenerating: false,
  generationProgress: 0,
  generationStatus: '',
  renderQueue: [],
  showVastuPanel: false,
  showCostPanel: false,
  showHistoryPanel: false,
  showLayersPanel: false,
  layers: [],
  activeLayerId: null,
  currentRender: null,
  vastuAnalysis: null,
  costEstimate: null,
};