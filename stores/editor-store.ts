// // stores/editor-store.ts
// import { create } from 'zustand';
// import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
// import { immer } from 'zustand/middleware/immer';
// import { v4 as uuidv4 } from 'uuid';
// import {
//   EditorState,
//   EditorAction,
//   TransformationMode,
//   DesignStyle,
//   RoomType,
//   ImageData,
//   MaskData,
//   Render,
//   Layer,
//   HistoryEntry,
//   RenderQueueItem,
//   BrushSettings,
//   EditorTool,
//   initialEditorState,
//   initialBrushSettings,
// } from '@/types/editor';
// import { VastuAnalysis } from '@/types/vastu';
// import { CostEstimate } from '@/types/cost';

// // ============================================
// // STORE INTERFACE
// // ============================================

// interface EditorStore extends EditorState {
//   // Actions - Image Management
//   setOriginalImage: (image: ImageData | null) => void;
//   setCurrentImage: (image: ImageData | null) => void;
//   setProcessedImage: (image: ImageData | null) => void;

//   // Actions - Mode & Style
//   setMode: (mode: TransformationMode) => void;
//   setStyle: (style: DesignStyle | null) => void;
//   setRoomType: (roomType: RoomType | null) => void;

//   // Actions - Tool
//   setCurrentTool: (tool: EditorTool) => void;

//   // Actions - Mask
//   setMask: (mask: MaskData | null) => void;
//   clearMask: () => void;
//   setBrushSize: (size: number) => void;
//   setBrushHardness: (hardness: number) => void;
//   setBrushSettings: (settings: Partial<BrushSettings>) => void;

//   // Actions - Generation Settings
//   setPrompt: (prompt: string) => void;
//   setNegativePrompt: (negativePrompt: string) => void;
//   setStrength: (strength: number) => void;
//   setGuidanceScale: (scale: number) => void;
//   setSeed: (seed: number | null) => void;
//   setNumberOfOutputs: (num: 1 | 2 | 3 | 4) => void;

//   // Actions - Color & Material
//   setSelectedColor: (color: string | null) => void;
//   setSelectedMaterial: (material: string | null) => void;

//   // Actions - View
//   setZoom: (zoom: number) => void;
//   zoomIn: () => void;
//   zoomOut: () => void;
//   resetZoom: () => void;
//   fitToScreen: () => void;
//   setPan: (x: number, y: number) => void;
//   setShowOriginal: (show: boolean) => void;
//   toggleShowOriginal: () => void;
//   setCompareMode: (mode: 'slider' | 'side-by-side' | 'overlay') => void;

//   // Actions - Generation State
//   setIsGenerating: (generating: boolean) => void;
//   setGenerationProgress: (progress: number, status?: string) => void;
//   setCurrentRender: (render: Render | null) => void;

//   // Actions - Render Queue
//   addToQueue: (settings: RenderQueueItem['settings']) => string;
//   updateQueueItem: (id: string, updates: Partial<RenderQueueItem>) => void;
//   removeFromQueue: (id: string) => void;
//   clearQueue: () => void;

//   // Actions - Layers
//   addLayer: (layer: Omit<Layer, 'id' | 'order'>) => string;
//   updateLayer: (id: string, updates: Partial<Layer>) => void;
//   removeLayer: (id: string) => void;
//   setActiveLayer: (id: string | null) => void;
//   reorderLayers: (fromIndex: number, toIndex: number) => void;
//   duplicateLayer: (id: string) => string | null;

//   // Actions - History
//   addToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
//   undo: () => void;
//   redo: () => void;
//   canUndo: () => boolean;
//   canRedo: () => boolean;
//   clearHistory: () => void;

//   // Actions - Panels
//   toggleVastuPanel: () => void;
//   toggleCostPanel: () => void;
//   toggleHistoryPanel: () => void;
//   toggleLayersPanel: () => void;
//   closeAllPanels: () => void;

//   // Actions - Analysis Results
//   setVastuAnalysis: (analysis: VastuAnalysis | null) => void;
//   setCostEstimate: (estimate: CostEstimate | null) => void;

//   // Actions - Reset
//   reset: () => void;
//   resetGenerationSettings: () => void;
// }

// // ============================================
// // ZOOM LEVELS
// // ============================================

// const ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 3, 4];
// const MAX_HISTORY = 50;

// // ============================================
// // STORE IMPLEMENTATION
// // ============================================

// export const useEditorStore = create<EditorStore>()(
//   devtools(
//     subscribeWithSelector(
//       persist(
//         immer((set, get) => ({
//           // Initial State
//           ...initialEditorState,

//           // ============================================
//           // IMAGE MANAGEMENT
//           // ============================================

//           setOriginalImage: (image) =>
//             set((state) => {
//               state.originalImage = image;
//               state.currentImage = image;
//               if (image) {
//                 // Add to history
//                 state.history.push({
//                   id: uuidv4(),
//                   type: 'upload',
//                   action: 'Image uploaded',
//                   timestamp: new Date(),
//                   image,
//                   settings: {},
//                 });
//                 state.historyIndex = state.history.length - 1;
//               }
//             }),

//           setCurrentImage: (image) =>
//             set((state) => {
//               state.currentImage = image;
//             }),

//           setProcessedImage: (image) =>
//             set((state) => {
//               state.processedImage = image;
//               if (image) {
//                 state.currentImage = image;
//               }
//             }),

//           // ============================================
//           // MODE & STYLE
//           // ============================================

//           setMode: (mode) =>
//             set((state) => {
//               state.mode = mode;
//               // Reset mask when changing modes
//               if (!['inpaint', 'remove-object', 'replace-object'].includes(mode)) {
//                 state.mask = null;
//               }
//             }),

//           setStyle: (style) =>
//             set((state) => {
//               state.style = style;
//             }),

//           setRoomType: (roomType) =>
//             set((state) => {
//               state.roomType = roomType;
//             }),

//           // ============================================
//           // TOOL
//           // ============================================

//           setCurrentTool: (tool) =>
//             set((state) => {
//               state.currentTool = tool;
//             }),

//           // ============================================
//           // MASK
//           // ============================================

//           setMask: (mask) =>
//             set((state) => {
//               state.mask = mask;
//             }),

//           clearMask: () =>
//             set((state) => {
//               state.mask = null;
//             }),

//           setBrushSize: (size) =>
//             set((state) => {
//               state.brushSize = Math.max(1, Math.min(200, size));
//               state.brushSettings.size = state.brushSize;
//             }),

//           setBrushHardness: (hardness) =>
//             set((state) => {
//               state.brushHardness = Math.max(0, Math.min(1, hardness));
//               state.brushSettings.hardness = state.brushHardness;
//             }),

//           setBrushSettings: (settings) =>
//             set((state) => {
//               state.brushSettings = { ...state.brushSettings, ...settings };
//               if (settings.size !== undefined) state.brushSize = settings.size;
//               if (settings.hardness !== undefined) state.brushHardness = settings.hardness;
//             }),

//           // ============================================
//           // GENERATION SETTINGS
//           // ============================================

//           setPrompt: (prompt) =>
//             set((state) => {
//               state.prompt = prompt;
//             }),

//           setNegativePrompt: (negativePrompt) =>
//             set((state) => {
//               state.negativePrompt = negativePrompt;
//             }),

//           setStrength: (strength) =>
//             set((state) => {
//               state.strength = Math.max(0, Math.min(1, strength));
//             }),

//           setGuidanceScale: (scale) =>
//             set((state) => {
//               state.guidanceScale = Math.max(1, Math.min(20, scale));
//             }),

//           setSeed: (seed) =>
//             set((state) => {
//               state.seed = seed;
//             }),

//           setNumberOfOutputs: (num) =>
//             set((state) => {
//               state.numberOfOutputs = num;
//             }),

//           // ============================================
//           // COLOR & MATERIAL
//           // ============================================

//           setSelectedColor: (color) =>
//             set((state) => {
//               state.selectedColor = color;
//             }),

//           setSelectedMaterial: (material) =>
//             set((state) => {
//               state.selectedMaterial = material;
//             }),

//           // ============================================
//           // VIEW
//           // ============================================

//           setZoom: (zoom) =>
//             set((state) => {
//               state.zoom = Math.max(0.1, Math.min(10, zoom));
//             }),

//           zoomIn: () =>
//             set((state) => {
//               const currentIndex = ZOOM_LEVELS.findIndex((z: number) => z >= state.zoom);
//               const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
//               state.zoom = ZOOM_LEVELS[nextIndex];
//             }),

//           zoomOut: () =>
//             set((state) => {
//               const currentIndex = ZOOM_LEVELS.findIndex((z: number) => z >= state.zoom);
//               const prevIndex = Math.max(currentIndex - 1, 0);
//               state.zoom = ZOOM_LEVELS[prevIndex];
//             }),

//           resetZoom: () =>
//             set((state) => {
//               state.zoom = 1;
//               state.panX = 0;
//               state.panY = 0;
//             }),

//           fitToScreen: () =>
//             set((state) => {
//               // This would need container dimensions - simplified for now
//               state.zoom = 1;
//               state.panX = 0;
//               state.panY = 0;
//             }),

//           setPan: (x, y) =>
//             set((state) => {
//               state.panX = x;
//               state.panY = y;
//             }),

//           setShowOriginal: (show) =>
//             set((state) => {
//               state.showOriginal = show;
//             }),

//           toggleShowOriginal: () =>
//             set((state) => {
//               state.showOriginal = !state.showOriginal;
//             }),

//           setCompareMode: (mode) =>
//             set((state) => {
//               state.compareMode = mode;
//             }),

//           // ============================================
//           // GENERATION STATE
//           // ============================================

//           setIsGenerating: (generating) =>
//             set((state) => {
//               state.isGenerating = generating;
//               if (!generating) {
//                 state.generationProgress = 0;
//                 state.generationStatus = '';
//               }
//             }),

//           setGenerationProgress: (progress, status) =>
//             set((state) => {
//               state.generationProgress = Math.max(0, Math.min(100, progress));
//               if (status) state.generationStatus = status;
//             }),

//           setCurrentRender: (render) =>
//             set((state) => {
//               state.currentRender = render;
//               if (render && render.outputImages.length > 0) {
//                 state.processedImage = render.outputImages[0];
//                 state.currentImage = render.outputImages[0];
//                 // Add to history
//                 state.history.push({
//                   id: uuidv4(),
//                   type: 'generate',
//                   action: `Generated with ${render.settings.styleId} style`,
//                   timestamp: new Date(),
//                   image: render.outputImages[0],
//                   settings: {
//                     mode: state.mode,
//                     style: state.style,
//                     prompt: state.prompt,
//                   },
//                 });
//                 // Trim history if needed
//                 if (state.history.length > MAX_HISTORY) {
//                   state.history = state.history.slice(-MAX_HISTORY);
//                 }
//                 state.historyIndex = state.history.length - 1;
//               }
//             }),

//           // ============================================
//           // RENDER QUEUE
//           // ============================================

//           addToQueue: (settings) => {
//             const id = uuidv4();
//             set((state) => {
//               state.renderQueue.push({
//                 id,
//                 status: 'pending',
//                 settings,
//                 addedAt: new Date(),
//               });
//             });
//             return id;
//           },

//           updateQueueItem: (id, updates) =>
//             set((state) => {
//               const index = state.renderQueue.findIndex((item: RenderQueueItem) => item.id === id);
//               if (index !== -1) {
//                 state.renderQueue[index] = { ...state.renderQueue[index], ...updates };
//               }
//             }),

//           removeFromQueue: (id) =>
//             set((state) => {
//               state.renderQueue = state.renderQueue.filter((item: RenderQueueItem) => item.id !== id);
//             }),

//           clearQueue: () =>
//             set((state) => {
//               state.renderQueue = [];
//             }),

//           // ============================================
//           // LAYERS
//           // ============================================

//           addLayer: (layerData) => {
//             const id = uuidv4();
//             set((state) => {
//               const newLayer: Layer = {
//                 ...layerData,
//                 id,
//                 order: state.layers.length,
//               };
//               state.layers.push(newLayer);
//               state.activeLayerId = id;
//             });
//             return id;
//           },

//           updateLayer: (id, updates) =>
//             set((state) => {
//               const index = state.layers.findIndex((l: Layer) => l.id === id);
//               if (index !== -1) {
//                 state.layers[index] = { ...state.layers[index], ...updates };
//               }
//             }),

//           removeLayer: (id) =>
//             set((state) => {
//               state.layers = state.layers.filter((l: Layer) => l.id !== id);
//               // Update order
//               state.layers.forEach((l: Layer, i: number) => {
//                 l.order = i;
//               });
//               // Update active layer
//               if (state.activeLayerId === id) {
//                 state.activeLayerId = state.layers.length > 0 ? state.layers[0].id : null;
//               }
//             }),

//           setActiveLayer: (id) =>
//             set((state) => {
//               state.activeLayerId = id;
//             }),

//           reorderLayers: (fromIndex, toIndex) =>
//             set((state) => {
//               const [removed] = state.layers.splice(fromIndex, 1);
//               state.layers.splice(toIndex, 0, removed);
//               // Update order
//               state.layers.forEach((l: Layer, i: number) => {
//                 l.order = i;
//               });
//             }),

//           duplicateLayer: (id) => {
//             const state = get();
//             const layer = state.layers.find((l: Layer) => l.id === id);
//             if (!layer) return null;

//             const newId = uuidv4();
//             set((state) => {
//               const newLayer: Layer = {
//                 ...layer,
//                 id: newId,
//                 name: `${layer.name} (copy)`,
//                 order: state.layers.length,
//               };
//               state.layers.push(newLayer);
//               state.activeLayerId = newId;
//             });
//             return newId;
//           },

//           // ============================================
//           // HISTORY
//           // ============================================

//           addToHistory: (entry) =>
//             set((state) => {
//               // Remove any redo history
//               state.history = state.history.slice(0, state.historyIndex + 1);

//               state.history.push({
//                 ...entry,
//                 id: uuidv4(),
//                 timestamp: new Date(),
//               });

//               // Trim history if needed
//               if (state.history.length > MAX_HISTORY) {
//                 state.history = state.history.slice(-MAX_HISTORY);
//               }

//               state.historyIndex = state.history.length - 1;
//             }),

//           undo: () =>
//             set((state) => {
//               if (state.historyIndex > 0) {
//                 state.historyIndex -= 1;
//                 const entry = state.history[state.historyIndex];
//                 if (entry) {
//                   state.currentImage = entry.image;
//                   // Restore settings if available
//                   if (entry.settings.mode) state.mode = entry.settings.mode as TransformationMode;
//                   if (entry.settings.style) state.style = entry.settings.style as DesignStyle;
//                   if (entry.settings.prompt) state.prompt = entry.settings.prompt as string;
//                 }
//               }
//             }),

//           redo: () =>
//             set((state) => {
//               if (state.historyIndex < state.history.length - 1) {
//                 state.historyIndex += 1;
//                 const entry = state.history[state.historyIndex];
//                 if (entry) {
//                   state.currentImage = entry.image;
//                   if (entry.settings.mode) state.mode = entry.settings.mode as TransformationMode;
//                   if (entry.settings.style) state.style = entry.settings.style as DesignStyle;
//                   if (entry.settings.prompt) state.prompt = entry.settings.prompt as string;
//                 }
//               }
//             }),

//           canUndo: () => get().historyIndex > 0,

//           canRedo: () => get().historyIndex < get().history.length - 1,

//           clearHistory: () =>
//             set((state) => {
//               state.history = [];
//               state.historyIndex = -1;
//             }),

//           // ============================================
//           // PANELS
//           // ============================================

//           toggleVastuPanel: () =>
//             set((state) => {
//               state.showVastuPanel = !state.showVastuPanel;
//               if (state.showVastuPanel) {
//                 state.showCostPanel = false;
//               }
//             }),

//           toggleCostPanel: () =>
//             set((state) => {
//               state.showCostPanel = !state.showCostPanel;
//               if (state.showCostPanel) {
//                 state.showVastuPanel = false;
//               }
//             }),

//           toggleHistoryPanel: () =>
//             set((state) => {
//               state.showHistoryPanel = !state.showHistoryPanel;
//             }),

//           toggleLayersPanel: () =>
//             set((state) => {
//               state.showLayersPanel = !state.showLayersPanel;
//             }),

//           closeAllPanels: () =>
//             set((state) => {
//               state.showVastuPanel = false;
//               state.showCostPanel = false;
//               state.showHistoryPanel = false;
//               state.showLayersPanel = false;
//             }),

//           // ============================================
//           // ANALYSIS RESULTS
//           // ============================================

//           setVastuAnalysis: (analysis) =>
//             set((state) => {
//               state.vastuAnalysis = analysis;
//             }),

//           setCostEstimate: (estimate) =>
//             set((state) => {
//               state.costEstimate = estimate;
//             }),

//           // ============================================
//           // RESET
//           // ============================================

//           reset: () =>
//             set((state) => {
//               Object.assign(state, initialEditorState);
//             }),

//           resetGenerationSettings: () =>
//             set((state) => {
//               state.prompt = '';
//               state.negativePrompt = '';
//               state.strength = 0.75;
//               state.guidanceScale = 7.5;
//               state.seed = null;
//               state.numberOfOutputs = 1;
//               state.selectedColor = null;
//               state.selectedMaterial = null;
//             }),
//         })),
//         {
//           name: 'removation-editor',
//           partialize: (state) => ({
//             // Only persist user preferences, not images or renders
//             mode: state.mode,
//             brushSize: state.brushSize,
//             brushHardness: state.brushHardness,
//             brushSettings: state.brushSettings,
//             compareMode: state.compareMode,
//             showVastuPanel: state.showVastuPanel,
//             showCostPanel: state.showCostPanel,
//           }),
//         }
//       )
//     ),
//     { name: 'EditorStore' }
//   )
// );

// // ============================================
// // SELECTORS
// // ============================================

// export const selectCurrentImage = (state: EditorStore) => state.currentImage;
// export const selectOriginalImage = (state: EditorStore) => state.originalImage;
// export const selectProcessedImage = (state: EditorStore) => state.processedImage;
// export const selectMode = (state: EditorStore) => state.mode;
// export const selectStyle = (state: EditorStore) => state.style;
// export const selectRoomType = (state: EditorStore) => state.roomType;
// export const selectIsGenerating = (state: EditorStore) => state.isGenerating;
// export const selectGenerationProgress = (state: EditorStore) => state.generationProgress;
// export const selectCurrentRender = (state: EditorStore) => state.currentRender;
// export const selectVastuAnalysis = (state: EditorStore) => state.vastuAnalysis;
// export const selectCostEstimate = (state: EditorStore) => state.costEstimate;
// export const selectLayers = (state: EditorStore) => state.layers;
// export const selectActiveLayer = (state: EditorStore) => 
//   state.layers.find((l: Layer) => l.id === state.activeLayerId);
// export const selectHistory = (state: EditorStore) => state.history;
// export const selectRenderQueue = (state: EditorStore) => state.renderQueue;

// export default useEditorStore;
// stores/editor-store.ts
import { create, StateCreator } from 'zustand';
import {
  devtools,
  persist,
  subscribeWithSelector,
  PersistOptions,
} from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { shallow } from 'zustand/shallow';
import { v4 as uuidv4 } from 'uuid';

// Import types from centralized types file
import type {
  EditorTool,
  BrushSettings as BaseBrushSettings,
  TransformationMode,
  DesignStyle,
  RoomType,
} from '@/types/editor';

// Extend BrushSettings to include store-specific properties
export interface BrushSettings extends BaseBrushSettings {
  spacing?: number;
  smoothing?: number;
  pressureSensitivity?: boolean;
  shape?: 'round' | 'square' | 'custom';
}

// ============================================
// STORE-SPECIFIC TYPE DEFINITIONS
// ============================================

// Image Types (store-specific extended version)
export interface ImageData {
  id: string;
  url: string;
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
  size: number;
  createdAt: Date;
  metadata?: {
    originalName?: string;
    uploadSource?: 'file' | 'url' | 'camera' | 'clipboard';
    exif?: Record<string, any>;
  };
}

// Mask Types (store-specific extended version)
export interface MaskPoint {
  x: number;
  y: number;
  pressure: number;
}

export interface MaskStroke {
  id: string;
  points: MaskPoint[];
  brushSize: number;
  brushHardness: number;
  isEraser: boolean;
  color: string;
}

export interface MaskData {
  id: string;
  strokes: MaskStroke[];
  dataUrl: string | null;
  width: number;
  height: number;
  coverage: number;
}

// Layer Types
export type LayerType = 'image' | 'mask' | 'adjustment' | 'text' | 'shape' | 'group';
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'soft-light'
  | 'hard-light'
  | 'difference'
  | 'exclusion';

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  order: number;
  image?: ImageData;
  mask?: MaskData;
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    flipX: boolean;
    flipY: boolean;
  };
  effects: LayerEffect[];
  parentId: string | null;
  children?: string[];
}

export interface LayerEffect {
  id: string;
  type: 'blur' | 'shadow' | 'glow' | 'sharpen' | 'noise' | 'vignette';
  enabled: boolean;
  settings: Record<string, any>;
}

// History Entry
export interface HistoryEntry {
  id: string;
  type: 'upload' | 'generate' | 'edit' | 'layer' | 'mask' | 'transform' | 'settings' | 'color_change' | 'material_change' | 'vastu_adjustment' | 'cost_update';
  action: string;
  description?: string;
  timestamp: Date;
  image: ImageData | null;
  settings: Record<string, any>;
  snapshot?: Partial<EditorState>;
}

// Render Types
export type RenderStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface RenderSettings {
  mode: TransformationMode;
  styleId: string | null;
  roomTypeId: string | null;
  prompt: string;
  negativePrompt: string;
  strength: number;
  guidanceScale: number;
  seed: number | null;
  numberOfOutputs: 1 | 2 | 3 | 4;
  aspectRatio: string;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  colorPalette?: string[];
  material?: string;
}

export interface Render {
  id: string;
  projectId: string;
  inputImage: ImageData;
  outputImages: ImageData[];
  settings: RenderSettings;
  status: RenderStatus;
  progress: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  processingTime?: number;
  model: string;
  cost: number;
}

export interface RenderQueueItem {
  id: string;
  status: RenderStatus;
  settings: RenderSettings;
  inputImage: ImageData;
  addedAt: Date;
  priority: 'low' | 'normal' | 'high';
  estimatedTime?: number;
  progress?: number;
  error?: string;
  retryCount: number;
}

// Canvas State
export interface CanvasState {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  fitMode: 'fit' | 'fill' | 'actual' | 'custom';
}

// Selection State
export interface SelectionState {
  type: 'none' | 'rectangle' | 'ellipse' | 'lasso' | 'magic-wand' | 'all';
  bounds: { x: number; y: number; width: number; height: number } | null;
  path: { x: number; y: number }[] | null;
  feather: number;
  inverted: boolean;
}

// Crop State
export interface CropState {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number | null;
  rotation: number;
}

// Generation Settings
export interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  strength: number;
  guidanceScale: number;
  seed: number | null;
  numberOfOutputs: 1 | 2 | 3 | 4;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  preserveDetails: boolean;
  enhancePrompt: boolean;
}

// Presets
export interface Preset {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  category: string;
  settings: Partial<GenerationSettings>;
  styleId?: string;
  createdAt: Date;
  isDefault: boolean;
  isFavorite: boolean;
}

// Vastu Analysis
export interface VastuAnalysis {
  score: number;
  direction: string;
  issues: VastuIssue[];
  suggestions: VastuSuggestion[];
  roomAnalysis: Record<string, any>;
  lastAnalyzedAt: Date;
}

export interface VastuIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  location?: { x: number; y: number };
  affectedArea?: string;
}

export interface VastuSuggestion {
  id: string;
  priority: number;
  category: string;
  title: string;
  description: string;
  impact: number;
  effort: 'easy' | 'medium' | 'hard';
  autoFixAvailable: boolean;
}

// Cost Estimate
export interface CostEstimate {
  totalCost: number;
  currency: 'INR' | 'USD';
  breakdown: CostBreakdownItem[];
  laborCost: number;
  materialCost: number;
  taxAmount: number;
  contingency: number;
  timeline: {
    minDays: number;
    maxDays: number;
  };
  lastCalculatedAt: Date;
  city: string;
  squareFootage: number;
}

export interface CostBreakdownItem {
  id: string;
  category: string;
  subcategory: string;
  item: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  brand?: string;
  quality: 'economy' | 'standard' | 'premium' | 'luxury';
}

// UI State
export interface UIState {
  showVastuPanel: boolean;
  showCostPanel: boolean;
  showHistoryPanel: boolean;
  showLayersPanel: boolean;
  showStylesPanel: boolean;
  showSettingsPanel: boolean;
  showCompareView: boolean;
  compareMode: 'slider' | 'side-by-side' | 'overlay' | 'onion-skin';
  comparePosition: number;
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  gridSize: number;
  sidebarWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'hi';
}

// Keyboard State
export interface KeyboardState {
  shiftPressed: boolean;
  ctrlPressed: boolean;
  altPressed: boolean;
  spacePressed: boolean;
}

// Error State
export interface EditorError {
  id: string;
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  dismissed: boolean;
  action?: {
    label: string;
    handler: string;
  };
}

// Collaboration
export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: SelectionState;
  lastActive: Date;
}

// Project State
export interface ProjectState {
  id: string | null;
  name: string;
  description?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  savedAt: Date | null;
  isDirty: boolean;
  autoSaveEnabled: boolean;
  version: number;
}

// ============================================
// INITIAL STATES
// ============================================

export const initialBrushSettings: BrushSettings = {
  size: 50,
  hardness: 0.8,
  opacity: 1,
  flow: 1,
  spacing: 0.1,
  smoothing: 0.5,
  pressureSensitivity: true,
  shape: 'round',
  isEraser: false,
  color: '#ffffff',
};

export const initialCanvasState: CanvasState = {
  width: 0,
  height: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
  fitMode: 'fit',
};

export const initialSelectionState: SelectionState = {
  type: 'none',
  bounds: null,
  path: null,
  feather: 0,
  inverted: false,
};

export const initialCropState: CropState = {
  active: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  aspectRatio: null,
  rotation: 0,
};

export const initialGenerationSettings: GenerationSettings = {
  prompt: '',
  negativePrompt: 'blurry, low quality, distorted, ugly, deformed',
  strength: 0.75,
  guidanceScale: 7.5,
  seed: null,
  numberOfOutputs: 1,
  quality: 'standard',
  aspectRatio: 'auto',
  preserveDetails: true,
  enhancePrompt: true,
};

export const initialUIState: UIState = {
  showVastuPanel: false,
  showCostPanel: false,
  showHistoryPanel: false,
  showLayersPanel: true,
  showStylesPanel: true,
  showSettingsPanel: false,
  showCompareView: false,
  compareMode: 'slider',
  comparePosition: 50,
  showGrid: false,
  showRulers: false,
  showGuides: true,
  snapToGrid: false,
  snapToGuides: true,
  gridSize: 10,
  sidebarWidth: 320,
  rightPanelWidth: 300,
  bottomPanelHeight: 200,
  theme: 'light',
  language: 'en',
};

export const initialKeyboardState: KeyboardState = {
  shiftPressed: false,
  ctrlPressed: false,
  altPressed: false,
  spacePressed: false,
};

export const initialProjectState: ProjectState = {
  id: null,
  name: 'Untitled Project',
  description: undefined,
  createdAt: null,
  updatedAt: null,
  savedAt: null,
  isDirty: false,
  autoSaveEnabled: true,
  version: 1,
};

// ============================================
// MAIN EDITOR STATE
// ============================================

export interface EditorState {
  project: ProjectState;
  originalImage: ImageData | null;
  currentImage: ImageData | null;
  processedImage: ImageData | null;
  referenceImages: ImageData[];
  mode: TransformationMode;
  style: DesignStyle | null;
  roomType: RoomType | null;
  currentTool: EditorTool;
  previousTool: EditorTool | null;
  brushSettings: BrushSettings;
  mask: MaskData | null;
  maskHistory: MaskData[];
  maskHistoryIndex: number;
  canvas: CanvasState;
  selection: SelectionState;
  crop: CropState;
  generationSettings: GenerationSettings;
  isGenerating: boolean;
  generationProgress: number;
  generationStatus: string;
  generationError: string | null;
  currentRender: Render | null;
  renderHistory: Render[];
  renderQueue: RenderQueueItem[];
  queueProcessing: boolean;
  layers: Layer[];
  activeLayerId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  vastuAnalysis: VastuAnalysis | null;
  vastuLoading: boolean;
  costEstimate: CostEstimate | null;
  costLoading: boolean;
  presets: Preset[];
  selectedPresetId: string | null;
  ui: UIState;
  keyboard: KeyboardState;
  errors: EditorError[];
  collaborators: Collaborator[];
  isCollaborating: boolean;
  isLoading: boolean;
  loadingMessage: string;
  isInitialized: boolean;
}

export const initialEditorState: EditorState = {
  project: initialProjectState,
  originalImage: null,
  currentImage: null,
  processedImage: null,
  referenceImages: [],
  mode: 'redesign',
  style: null,
  roomType: null,
  currentTool: 'select',
  previousTool: null,
  brushSettings: initialBrushSettings,
  mask: null,
  maskHistory: [],
  maskHistoryIndex: -1,
  canvas: initialCanvasState,
  selection: initialSelectionState,
  crop: initialCropState,
  generationSettings: initialGenerationSettings,
  isGenerating: false,
  generationProgress: 0,
  generationStatus: '',
  generationError: null,
  currentRender: null,
  renderHistory: [],
  renderQueue: [],
  queueProcessing: false,
  layers: [],
  activeLayerId: null,
  history: [],
  historyIndex: -1,
  vastuAnalysis: null,
  vastuLoading: false,
  costEstimate: null,
  costLoading: false,
  presets: [],
  selectedPresetId: null,
  ui: initialUIState,
  keyboard: initialKeyboardState,
  errors: [],
  collaborators: [],
  isCollaborating: false,
  isLoading: false,
  loadingMessage: '',
  isInitialized: false,
};

// ============================================
// FIXED ACTIONS INTERFACE
// ============================================

export interface EditorActions {
  // Initialization
  initialize: () => void;
  dispose: () => void;

  // Project
  setProject: (project: Partial<ProjectState>) => void;
  createNewProject: () => void;
  saveProject: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  markDirty: () => void;

  // Image Management
  setOriginalImage: (image: ImageData | null) => void;
  setCurrentImage: (image: ImageData | null) => void;
  setProcessedImage: (image: ImageData | null) => void;
  addReferenceImage: (image: ImageData) => void;
  removeReferenceImage: (id: string) => void;
  clearReferenceImages: () => void;
  swapImages: () => void;

  // Mode & Style
  setMode: (mode: TransformationMode) => void;
  setStyle: (style: DesignStyle | null) => void;
  setRoomType: (roomType: RoomType | null) => void;

  // Tools
  setCurrentTool: (tool: EditorTool) => void;
  switchToPreviousTool: () => void;
  setTemporaryTool: (tool: EditorTool) => void;

  // Brush Settings
  setBrushSettings: (settings: Partial<BrushSettings>) => void;
  setBrushSize: (size: number) => void;
  increaseBrushSize: () => void;
  decreaseBrushSize: () => void;
  setBrushHardness: (hardness: number) => void;
  setBrushOpacity: (opacity: number) => void;

  // Mask
  setMask: (mask: MaskData | null) => void;
  addMaskStroke: (stroke: MaskStroke) => void;
  clearMask: () => void;
  invertMask: () => void;
  featherMask: (amount: number) => void;
  expandMask: (pixels: number) => void;
  contractMask: (pixels: number) => void;
  undoMask: () => void;
  redoMask: () => void;
  saveMaskToHistory: () => void;

  // Canvas
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomToFill: () => void;
  zoomToActual: () => void;
  zoomTo: (level: number, centerX?: number, centerY?: number) => void;
  setPan: (x: number, y: number) => void;
  panBy: (deltaX: number, deltaY: number) => void;
  resetView: () => void;
  setCanvasRotation: (rotation: number) => void;
  rotateCanvas: (degrees: number) => void;

  // Selection
  setSelection: (selection: Partial<SelectionState>) => void;
  selectAll: () => void;
  deselectAll: () => void;
  invertSelection: () => void;
  selectionToMask: () => void;
  maskToSelection: () => void;

  // Crop
  startCrop: () => void;
  updateCrop: (crop: Partial<CropState>) => void;
  applyCrop: () => void;
  cancelCrop: () => void;

  // Generation Settings
  setGenerationSettings: (settings: Partial<GenerationSettings>) => void;
  setPrompt: (prompt: string) => void;
  appendToPrompt: (text: string) => void;
  setNegativePrompt: (prompt: string) => void;
  setStrength: (strength: number) => void;
  setGuidanceScale: (scale: number) => void;
  setSeed: (seed: number | null) => void;
  randomizeSeed: () => void;
  setNumberOfOutputs: (num: 1 | 2 | 3 | 4) => void;
  setQuality: (quality: GenerationSettings['quality']) => void;
  resetGenerationSettings: () => void;

  // Generation
  startGeneration: () => void;
  cancelGeneration: () => void;
  setGenerationProgress: (progress: number, status?: string) => void;
  setGenerationError: (error: string | null) => void;
  setCurrentRender: (render: Render | null) => void;
  addToRenderHistory: (render: Render) => void;
  clearRenderHistory: () => void;

  // Render Queue
  addToQueue: (item: Omit<RenderQueueItem, 'id' | 'addedAt' | 'retryCount'>) => string;
  updateQueueItem: (id: string, updates: Partial<RenderQueueItem>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  prioritizeQueueItem: (id: string) => void;
  retryQueueItem: (id: string) => void;
  pauseQueue: () => void;
  resumeQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;

  // Layers
  addLayer: (layer: Partial<Layer>) => string;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => string | null;
  mergeLayerDown: (id: string) => void;
  flattenAllLayers: () => void;
  setActiveLayer: (id: string | null) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerBlendMode: (id: string, blendMode: BlendMode) => void;
  renameLayer: (id: string, name: string) => void;
  groupLayers: (layerIds: string[]) => string;
  ungroupLayer: (groupId: string) => void;
  addLayerEffect: (layerId: string, effect: Omit<LayerEffect, 'id'>) => void;
  updateLayerEffect: (layerId: string, effectId: string, updates: Partial<LayerEffect>) => void;
  removeLayerEffect: (layerId: string, effectId: string) => void;

  // Transform
  transformLayer: (id: string, transform: Partial<Layer['transform']>) => void;
  flipLayerHorizontal: (id: string) => void;
  flipLayerVertical: (id: string) => void;
  rotateLayer: (id: string, degrees: number) => void;
  resetLayerTransform: (id: string) => void;

  // History
  addToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  undoMultiple: (steps: number) => void;
  redoMultiple: (steps: number) => void;
  goToHistoryIndex: (index: number) => void;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistoryState: (index: number) => HistoryEntry | undefined;

  // Vastu
  setVastuAnalysis: (analysis: VastuAnalysis | null) => void;
  setVastuLoading: (loading: boolean) => void;
  requestVastuAnalysis: () => Promise<void>;
  applyVastuSuggestion: (suggestionId: string) => void;
  dismissVastuIssue: (issueId: string) => void;

  // Cost
  setCostEstimate: (estimate: CostEstimate | null) => void;
  setCostLoading: (loading: boolean) => void;
  requestCostEstimate: () => Promise<void>;
  updateCostSettings: (settings: Partial<{ city: string; squareFootage: number; quality: string }>) => void;

  // Presets
  addPreset: (preset: Omit<Preset, 'id' | 'createdAt'>) => string;
  updatePreset: (id: string, updates: Partial<Preset>) => void;
  deletePreset: (id: string) => void;
  applyPreset: (id: string) => void;
  togglePresetFavorite: (id: string) => void;
  exportPreset: (id: string) => string;
  importPreset: (data: string) => string | null;

  // UI
  setUIState: (state: Partial<UIState>) => void;
  togglePanel: (panel: keyof Pick<UIState, 'showVastuPanel' | 'showCostPanel' | 'showHistoryPanel' | 'showLayersPanel' | 'showStylesPanel' | 'showSettingsPanel'>) => void;
  openPanel: (panel: keyof Pick<UIState, 'showVastuPanel' | 'showCostPanel' | 'showHistoryPanel' | 'showLayersPanel' | 'showStylesPanel' | 'showSettingsPanel'>) => void;
  closePanel: (panel: keyof Pick<UIState, 'showVastuPanel' | 'showCostPanel' | 'showHistoryPanel' | 'showLayersPanel' | 'showStylesPanel' | 'showSettingsPanel'>) => void;
  closeAllPanels: () => void;
  setCompareMode: (mode: UIState['compareMode']) => void;
  setComparePosition: (position: number) => void;
  toggleCompareView: () => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  setTheme: (theme: UIState['theme']) => void;
  setLanguage: (language: UIState['language']) => void;
  setSidebarWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;

  // Keyboard
  setKeyboardState: (state: Partial<KeyboardState>) => void;

  // Errors
  addError: (error: Omit<EditorError, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissError: (id: string) => void;
  dismissAllErrors: () => void;
  clearErrors: () => void;

  // Collaboration
  setCollaborators: (collaborators: Collaborator[]) => void;
  updateCollaborator: (id: string, updates: Partial<Collaborator>) => void;
  removeCollaborator: (id: string) => void;
  setIsCollaborating: (isCollaborating: boolean) => void;

  // Loading
  setLoading: (loading: boolean, message?: string) => void;

  // Reset
  reset: () => void;
  softReset: () => void;
}

// ============================================
// HELPER FUNCTIONS WITH PROPER TYPES
// ============================================

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const ZOOM_LEVELS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 8, 10];
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const MAX_HISTORY = 100;
const BRUSH_SIZE_STEP = 5;
const MIN_BRUSH_SIZE = 1;
const MAX_BRUSH_SIZE = 500;

const findNearestZoomLevel = (currentZoom: number, direction: 'in' | 'out'): number => {
  if (direction === 'in') {
    const nextLevel = ZOOM_LEVELS.find(level => level > currentZoom);
    return nextLevel || MAX_ZOOM;
  } else {
    const prevLevels = ZOOM_LEVELS.filter(level => level < currentZoom);
    return prevLevels.length > 0 ? prevLevels[prevLevels.length - 1] : MIN_ZOOM;
  }
};

const createLayerTransform = (): Layer['transform'] => ({
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
});

// ============================================
// FIXED STORE IMPLEMENTATION
// ============================================

type EditorStore = EditorState & EditorActions;

const editorStoreCreator: StateCreator<
  EditorStore,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  EditorStore
> = (set, get) => ({
  ...initialEditorState,

  // ============================================
  // FIXED IMPLEMENTATIONS
  // ============================================

  initialize: () => {
    set((state) => {
      state.isInitialized = true;
    });
  },

  dispose: () => {
    set((state) => {
      state.isInitialized = false;
    });
  },

  setProject: (project) => {
    set((state) => {
      state.project = { ...state.project, ...project };
    });
  },

  createNewProject: () => {
    set((state) => {
      Object.assign(state, initialEditorState);
      state.project = {
        ...initialProjectState,
        id: uuidv4(),
        createdAt: new Date(),
      };
      state.isInitialized = true;
    });
  },

  saveProject: async () => {
    try {
      set((state) => {
        state.isLoading = true;
        state.loadingMessage = 'Saving project...';
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      set((state) => {
        state.project.savedAt = new Date();
        state.project.isDirty = false;
        state.isLoading = false;
        state.loadingMessage = '';
      });
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.loadingMessage = '';
      });
      get().addError({
        type: 'error',
        code: 'SAVE_FAILED',
        message: 'Failed to save project',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  loadProject: async (id: string) => {
    try {
      set((state) => {
        state.isLoading = true;
        state.loadingMessage = 'Loading project...';
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      set((state) => {
        state.project.id = id;
        state.isLoading = false;
        state.loadingMessage = '';
      });
    } catch (error) {
      set((state) => {
        state.isLoading = false;
        state.loadingMessage = '';
      });
      get().addError({
        type: 'error',
        code: 'LOAD_FAILED',
        message: 'Failed to load project',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  markDirty: () => {
    set((state) => {
      state.project.isDirty = true;
      state.project.updatedAt = new Date();
    });
  },

  setOriginalImage: (image) => {
    set((state) => {
      state.originalImage = image;
      state.currentImage = image;
      state.processedImage = null;
      state.mask = null;

      if (image) {
        state.canvas.width = image.width;
        state.canvas.height = image.height;

        // Add base layer
        state.layers = [{
          id: uuidv4(),
          name: 'Background',
          type: 'image',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          order: 0,
          image,
          transform: createLayerTransform(),
          effects: [],
          parentId: null,
        }];
        state.activeLayerId = state.layers[0].id;

        // Add to history
        state.history.push({
          id: uuidv4(),
          type: 'upload',
          action: 'Image uploaded',
          timestamp: new Date(),
          image,
          settings: {},
        });
        state.historyIndex = state.history.length - 1;
        state.project.isDirty = true;
      }
    });
  },

  setCurrentImage: (image) => {
    set((state) => {
      state.currentImage = image;
      state.project.isDirty = true;
    });
  },

  setProcessedImage: (image) => {
    set((state) => {
      state.processedImage = image;
      if (image) {
        state.currentImage = image;
      }
      state.project.isDirty = true;
    });
  },

  addReferenceImage: (image) => {
    set((state) => {
      if (state.referenceImages.length < 10) {
        state.referenceImages.push(image);
      }
    });
  },

  removeReferenceImage: (id: string) => {
    set((state) => {
      state.referenceImages = state.referenceImages.filter((img: ImageData) => img.id !== id);
    });
  },

  clearReferenceImages: () => {
    set((state) => {
      state.referenceImages = [];
    });
  },

  swapImages: () => {
    set((state) => {
      if (state.originalImage && state.processedImage) {
        const temp = state.originalImage;
        state.originalImage = state.processedImage;
        state.processedImage = temp;
        state.currentImage = state.originalImage;
      }
    });
  },

  setMode: (mode) => {
    set((state) => {
      const previousMode = state.mode;
      state.mode = mode;

      const inpaintModes: TransformationMode[] = ['inpaint', 'remove-object', 'replace-object'];
      if (inpaintModes.includes(previousMode) && !inpaintModes.includes(mode)) {
        state.mask = null;
        state.maskHistory = [];
        state.maskHistoryIndex = -1;
      }

      if (inpaintModes.includes(mode)) {
        state.currentTool = 'brush';
      }
    });
  },

  setStyle: (style) => {
    set((state) => {
      state.style = style;
      if (style?.promptModifier) {
        const currentPrompt = state.generationSettings.prompt;
        if (!currentPrompt.includes(style.promptModifier)) {
          state.generationSettings.prompt = currentPrompt
            ? `${currentPrompt}, ${style.promptModifier}`
            : style.promptModifier;
        }
      }
    });
  },

  setRoomType: (roomType) => {
    set((state) => {
      state.roomType = roomType;
    });
  },

  setCurrentTool: (tool) => {
    set((state) => {
      if (state.currentTool !== tool) {
        state.previousTool = state.currentTool;
        state.currentTool = tool;
      }
    });
  },

  switchToPreviousTool: () => {
    set((state) => {
      if (state.previousTool) {
        const temp = state.currentTool;
        state.currentTool = state.previousTool;
        state.previousTool = temp;
      }
    });
  },

  setTemporaryTool: (tool) => {
    set((state) => {
      if (state.previousTool === null) {
        state.previousTool = state.currentTool;
        state.currentTool = tool;
      }
    });
  },

  setBrushSettings: (settings) => {
    set((state) => {
      state.brushSettings = { ...state.brushSettings, ...settings };
    });
  },

  setBrushSize: (size) => {
    set((state) => {
      state.brushSettings.size = clamp(size, MIN_BRUSH_SIZE, MAX_BRUSH_SIZE);
    });
  },

  increaseBrushSize: () => {
    set((state) => {
      state.brushSettings.size = clamp(
        state.brushSettings.size + BRUSH_SIZE_STEP,
        MIN_BRUSH_SIZE,
        MAX_BRUSH_SIZE
      );
    });
  },

  decreaseBrushSize: () => {
    set((state) => {
      state.brushSettings.size = clamp(
        state.brushSettings.size - BRUSH_SIZE_STEP,
        MIN_BRUSH_SIZE,
        MAX_BRUSH_SIZE
      );
    });
  },

  setBrushHardness: (hardness) => {
    set((state) => {
      state.brushSettings.hardness = clamp(hardness, 0, 1);
    });
  },

  setBrushOpacity: (opacity) => {
    set((state) => {
      state.brushSettings.opacity = clamp(opacity, 0, 1);
    });
  },

  setMask: (mask) => {
    set((state) => {
      state.mask = mask;
      state.project.isDirty = true;
    });
  },

  addMaskStroke: (stroke) => {
    set((state) => {
      if (!state.mask) {
        state.mask = {
          id: uuidv4(),
          strokes: [],
          dataUrl: null,
          width: state.canvas.width,
          height: state.canvas.height,
          coverage: 0,
        };
      }
      state.mask.strokes.push(stroke);
      state.project.isDirty = true;
    });
  },

  clearMask: () => {
    set((state) => {
      if (state.mask) {
        get().saveMaskToHistory();
      }
      state.mask = null;
    });
  },

  invertMask: () => {
    set((state) => {
      if (state.mask) {
        state.mask.coverage = 100 - state.mask.coverage;
        state.project.isDirty = true;
      }
    });
  },

  featherMask: (amount: number) => {
    set((state) => {
      if (state.mask) {
        state.project.isDirty = true;
      }
    });
  },

  expandMask: (pixels: number) => {
    set((state) => {
      if (state.mask) {
        state.project.isDirty = true;
      }
    });
  },

  contractMask: (pixels: number) => {
    set((state) => {
      if (state.mask) {
        state.project.isDirty = true;
      }
    });
  },

  saveMaskToHistory: () => {
    set((state) => {
      if (state.mask) {
        state.maskHistory = state.maskHistory.slice(0, state.maskHistoryIndex + 1);
        state.maskHistory.push({ ...state.mask });
        if (state.maskHistory.length > 20) {
          state.maskHistory = state.maskHistory.slice(-20);
        }
        state.maskHistoryIndex = state.maskHistory.length - 1;
      }
    });
  },

  undoMask: () => {
    set((state) => {
      if (state.maskHistoryIndex > 0) {
        state.maskHistoryIndex -= 1;
        state.mask = state.maskHistory[state.maskHistoryIndex] || null;
      }
    });
  },

  redoMask: () => {
    set((state) => {
      if (state.maskHistoryIndex < state.maskHistory.length - 1) {
        state.maskHistoryIndex += 1;
        state.mask = state.maskHistory[state.maskHistoryIndex] || null;
      }
    });
  },

  setCanvasSize: (width, height) => {
    set((state) => {
      state.canvas.width = width;
      state.canvas.height = height;
    });
  },

  setZoom: (zoom) => {
    set((state) => {
      state.canvas.zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    });
  },

  zoomIn: () => {
    set((state) => {
      state.canvas.zoom = findNearestZoomLevel(state.canvas.zoom, 'in');
    });
  },

  zoomOut: () => {
    set((state) => {
      state.canvas.zoom = findNearestZoomLevel(state.canvas.zoom, 'out');
    });
  },

  zoomToFit: () => {
    set((state) => {
      state.canvas.zoom = 1;
      state.canvas.panX = 0;
      state.canvas.panY = 0;
      state.canvas.fitMode = 'fit';
    });
  },

  zoomToFill: () => {
    set((state) => {
      state.canvas.fitMode = 'fill';
    });
  },

  zoomToActual: () => {
    set((state) => {
      state.canvas.zoom = 1;
      state.canvas.fitMode = 'actual';
    });
  },

  zoomTo: (level, centerX, centerY) => {
    set((state) => {
      const previousZoom = state.canvas.zoom;
      state.canvas.zoom = clamp(level, MIN_ZOOM, MAX_ZOOM);

      if (centerX !== undefined && centerY !== undefined) {
        const zoomRatio = state.canvas.zoom / previousZoom;
        state.canvas.panX = centerX - (centerX - state.canvas.panX) * zoomRatio;
        state.canvas.panY = centerY - (centerY - state.canvas.panY) * zoomRatio;
      }
    });
  },

  setPan: (x, y) => {
    set((state) => {
      state.canvas.panX = x;
      state.canvas.panY = y;
    });
  },

  panBy: (deltaX, deltaY) => {
    set((state) => {
      state.canvas.panX += deltaX;
      state.canvas.panY += deltaY;
    });
  },

  resetView: () => {
    set((state) => {
      state.canvas.zoom = 1;
      state.canvas.panX = 0;
      state.canvas.panY = 0;
      state.canvas.rotation = 0;
    });
  },

  setCanvasRotation: (rotation) => {
    set((state) => {
      state.canvas.rotation = rotation % 360;
    });
  },

  rotateCanvas: (degrees) => {
    set((state) => {
      state.canvas.rotation = (state.canvas.rotation + degrees) % 360;
    });
  },

  setSelection: (selection) => {
    set((state) => {
      state.selection = { ...state.selection, ...selection };
    });
  },

  selectAll: () => {
    set((state) => {
      state.selection = {
        type: 'all',
        bounds: {
          x: 0,
          y: 0,
          width: state.canvas.width,
          height: state.canvas.height,
        },
        path: null,
        feather: 0,
        inverted: false,
      };
    });
  },

  deselectAll: () => {
    set((state) => {
      state.selection = initialSelectionState;
    });
  },

  invertSelection: () => {
    set((state) => {
      state.selection.inverted = !state.selection.inverted;
    });
  },

  selectionToMask: () => {
    set((state) => {
      if (state.selection.type !== 'none' && state.selection.bounds) {
        state.mask = {
          id: uuidv4(),
          strokes: [],
          dataUrl: null,
          width: state.canvas.width,
          height: state.canvas.height,
          coverage: 0,
        };
        state.selection = initialSelectionState;
      }
    });
  },

  maskToSelection: () => {
    set((state) => {
      if (state.mask) {
        state.selection = {
          type: 'lasso',
          bounds: null,
          path: null,
          feather: 0,
          inverted: false,
        };
      }
    });
  },

  startCrop: () => {
    set((state) => {
      state.crop = {
        active: true,
        x: 0,
        y: 0,
        width: state.canvas.width,
        height: state.canvas.height,
        aspectRatio: null,
        rotation: 0,
      };
      state.previousTool = state.currentTool;
      state.currentTool = 'crop';
    });
  },

  updateCrop: (crop) => {
    set((state) => {
      state.crop = { ...state.crop, ...crop };
    });
  },

  applyCrop: () => {
    set((state) => {
      state.crop = initialCropState;
      if (state.previousTool) {
        state.currentTool = state.previousTool;
        state.previousTool = null;
      }
      state.project.isDirty = true;
    });
  },

  cancelCrop: () => {
    set((state) => {
      state.crop = initialCropState;
      if (state.previousTool) {
        state.currentTool = state.previousTool;
        state.previousTool = null;
      }
    });
  },

  setGenerationSettings: (settings) => {
    set((state) => {
      state.generationSettings = { ...state.generationSettings, ...settings };
    });
  },

  setPrompt: (prompt) => {
    set((state) => {
      state.generationSettings.prompt = prompt;
    });
  },

  appendToPrompt: (text) => {
    set((state) => {
      const current = state.generationSettings.prompt;
      state.generationSettings.prompt = current ? `${current}, ${text}` : text;
    });
  },

  setNegativePrompt: (prompt) => {
    set((state) => {
      state.generationSettings.negativePrompt = prompt;
    });
  },

  setStrength: (strength) => {
    set((state) => {
      state.generationSettings.strength = clamp(strength, 0, 1);
    });
  },

  setGuidanceScale: (scale) => {
    set((state) => {
      state.generationSettings.guidanceScale = clamp(scale, 1, 30);
    });
  },

  setSeed: (seed) => {
    set((state) => {
      state.generationSettings.seed = seed;
    });
  },

  randomizeSeed: () => {
    set((state) => {
      state.generationSettings.seed = Math.floor(Math.random() * 2147483647);
    });
  },

  setNumberOfOutputs: (num) => {
    set((state) => {
      state.generationSettings.numberOfOutputs = num;
    });
  },

  setQuality: (quality) => {
    set((state) => {
      state.generationSettings.quality = quality;
    });
  },

  resetGenerationSettings: () => {
    set((state) => {
      state.generationSettings = { ...initialGenerationSettings };
    });
  },

  startGeneration: () => {
    set((state) => {
      state.isGenerating = true;
      state.generationProgress = 0;
      state.generationStatus = 'Starting...';
      state.generationError = null;
    });
  },

  cancelGeneration: () => {
    set((state) => {
      state.isGenerating = false;
      state.generationProgress = 0;
      state.generationStatus = '';
    });
  },

  setGenerationProgress: (progress, status) => {
    set((state) => {
      state.generationProgress = clamp(progress, 0, 100);
      if (status !== undefined) {
        state.generationStatus = status;
      }
    });
  },

  setGenerationError: (error) => {
    set((state) => {
      state.generationError = error;
      if (error) {
        state.isGenerating = false;
        state.generationProgress = 0;
        state.generationStatus = '';
      }
    });
  },

  setCurrentRender: (render) => {
    set((state) => {
      state.currentRender = render;

      if (render && render.status === 'completed' && render.outputImages.length > 0) {
        state.processedImage = render.outputImages[0];
        state.currentImage = render.outputImages[0];
        state.isGenerating = false;
        state.generationProgress = 100;
        state.generationStatus = 'Complete';

        state.history.push({
          id: uuidv4(),
          type: 'generate',
          action: `Generated with ${render.settings.styleId || 'custom'} style`,
          description: render.settings.prompt,
          timestamp: new Date(),
          image: render.outputImages[0],
          settings: {
            mode: render.settings.mode,
            styleId: render.settings.styleId,
            prompt: render.settings.prompt,
            strength: render.settings.strength,
          },
        });

        if (state.history.length > MAX_HISTORY) {
          state.history = state.history.slice(-MAX_HISTORY);
        }
        state.historyIndex = state.history.length - 1;
        state.project.isDirty = true;
      }
    });
  },

  addToRenderHistory: (render) => {
    set((state) => {
      state.renderHistory.unshift(render);
      if (state.renderHistory.length > 50) {
        state.renderHistory = state.renderHistory.slice(0, 50);
      }
    });
  },

  clearRenderHistory: () => {
    set((state) => {
      state.renderHistory = [];
    });
  },

  addToQueue: (item) => {
    const id = uuidv4();
    set((state) => {
      state.renderQueue.push({
        ...item,
        id,
        addedAt: new Date(),
        retryCount: 0,
      });
    });
    return id;
  },

  updateQueueItem: (id: string, updates) => {
    set((state) => {
      const index = state.renderQueue.findIndex((item: RenderQueueItem) => item.id === id);
      if (index !== -1) {
        state.renderQueue[index] = { ...state.renderQueue[index], ...updates };
      }
    });
  },

  removeFromQueue: (id: string) => {
    set((state) => {
      state.renderQueue = state.renderQueue.filter((item: RenderQueueItem) => item.id !== id);
    });
  },

  clearQueue: () => {
    set((state) => {
      state.renderQueue = [];
      state.queueProcessing = false;
    });
  },

  prioritizeQueueItem: (id: string) => {
    set((state) => {
      const index = state.renderQueue.findIndex((item: RenderQueueItem) => item.id === id);
      if (index > 0) {
        const [item] = state.renderQueue.splice(index, 1);
        item.priority = 'high';
        state.renderQueue.unshift(item);
      }
    });
  },

  retryQueueItem: (id: string) => {
    set((state) => {
      const index = state.renderQueue.findIndex((item: RenderQueueItem) => item.id === id);
      if (index !== -1 && state.renderQueue[index].status === 'failed') {
        state.renderQueue[index].status = 'pending';
        state.renderQueue[index].retryCount += 1;
        state.renderQueue[index].error = undefined;
      }
    });
  },

  pauseQueue: () => {
    set((state) => {
      state.queueProcessing = false;
    });
  },

  resumeQueue: () => {
    set((state) => {
      state.queueProcessing = true;
    });
  },

  reorderQueue: (fromIndex, toIndex) => {
    set((state) => {
      const [item] = state.renderQueue.splice(fromIndex, 1);
      state.renderQueue.splice(toIndex, 0, item);
    });
  },

  addLayer: (layerData) => {
    const id = uuidv4();
    set((state) => {
      const maxOrder = Math.max(...state.layers.map((l: Layer) => l.order), -1);
      const newLayer: Layer = {
        id,
        name: layerData.name || `Layer ${state.layers.length + 1}`,
        type: layerData.type || 'image',
        visible: layerData.visible ?? true,
        locked: layerData.locked ?? false,
        opacity: layerData.opacity ?? 1,
        blendMode: layerData.blendMode || 'normal',
        order: maxOrder + 1,
        transform: layerData.transform || createLayerTransform(),
        effects: layerData.effects || [],
        parentId: layerData.parentId || null,
        image: layerData.image,
        mask: layerData.mask,
      };
      state.layers.push(newLayer);
      state.activeLayerId = id;
      state.project.isDirty = true;
    });
    return id;
  },

  updateLayer: (id: string, updates) => {
    set((state) => {
      const index = state.layers.findIndex((l: Layer) => l.id === id);
      if (index !== -1) {
        state.layers[index] = { ...state.layers[index], ...updates };
        state.project.isDirty = true;
      }
    });
  },

  removeLayer: (id: string) => {
    set((state) => {
      const index = state.layers.findIndex((l: Layer) => l.id === id);
      if (index !== -1 && state.layers.length > 1) {
        state.layers.splice(index, 1);
        state.layers.forEach((l: Layer, i: number) => {
          l.order = i;
        });
        if (state.activeLayerId === id) {
          state.activeLayerId = state.layers[Math.min(index, state.layers.length - 1)]?.id || null;
        }
        state.project.isDirty = true;
      }
    });
  },

  duplicateLayer: (id: string) => {
    const layer = get().layers.find((l: Layer) => l.id === id);
    if (!layer) return null;

    const newId = uuidv4();
    set((state) => {
      const newLayer: Layer = {
        ...layer,
        id: newId,
        name: `${layer.name} (copy)`,
        order: layer.order + 1,
      };

      state.layers.forEach((l: Layer) => {
        if (l.order > layer.order) {
          l.order += 1;
        }
      });

      state.layers.push(newLayer);
      state.layers.sort((a: Layer, b: Layer) => a.order - b.order);
      state.activeLayerId = newId;
      state.project.isDirty = true;
    });
    return newId;
  },

  mergeLayerDown: (id: string) => {
    set((state) => {
      const index = state.layers.findIndex((l: Layer) => l.id === id);
      if (index > 0) {
        state.layers.splice(index, 1);
        state.layers.forEach((l: Layer, i: number) => {
          l.order = i;
        });
        state.project.isDirty = true;
      }
    });
  },

  flattenAllLayers: () => {
    set((state) => {
      if (state.layers.length > 1) {
        const flattenedLayer: Layer = {
          id: uuidv4(),
          name: 'Flattened',
          type: 'image',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          order: 0,
          transform: createLayerTransform(),
          effects: [],
          parentId: null,
          image: state.currentImage || undefined,
        };
        state.layers = [flattenedLayer];
        state.activeLayerId = flattenedLayer.id;
        state.project.isDirty = true;
      }
    });
  },

  setActiveLayer: (id) => {
    set((state) => {
      state.activeLayerId = id;
    });
  },

  reorderLayers: (fromIndex, toIndex) => {
    set((state) => {
      const [layer] = state.layers.splice(fromIndex, 1);
      state.layers.splice(toIndex, 0, layer);
      state.layers.forEach((l: Layer, i: number) => {
        l.order = i;
      });
      state.project.isDirty = true;
    });
  },

  toggleLayerVisibility: (id: string) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer) {
        layer.visible = !layer.visible;
        state.project.isDirty = true;
      }
    });
  },

  toggleLayerLock: (id: string) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer) {
        layer.locked = !layer.locked;
      }
    });
  },

  setLayerOpacity: (id: string, opacity: number) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer) {
        layer.opacity = clamp(opacity, 0, 1);
        state.project.isDirty = true;
      }
    });
  },

  setLayerBlendMode: (id: string, blendMode: BlendMode) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer) {
        layer.blendMode = blendMode;
        state.project.isDirty = true;
      }
    });
  },

  renameLayer: (id: string, name: string) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer) {
        layer.name = name;
      }
    });
  },

  groupLayers: (layerIds: string[]) => {
    const id = uuidv4();
    set((state) => {
      const layersToGroup = state.layers.filter((l: Layer) => layerIds.includes(l.id));
      if (layersToGroup.length > 1) {
        const minOrder = Math.min(...layersToGroup.map((l: Layer) => l.order));

        const group: Layer = {
          id,
          name: 'Group',
          type: 'group',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          order: minOrder,
          transform: createLayerTransform(),
          effects: [],
          parentId: null,
          children: layerIds,
        };

        layersToGroup.forEach((l: Layer) => {
          l.parentId = id;
        });

        state.layers.push(group);
        state.layers.sort((a: Layer, b: Layer) => a.order - b.order);
        state.activeLayerId = id;
        state.project.isDirty = true;
      }
    });
    return id;
  },

  ungroupLayer: (groupId: string) => {
    set((state) => {
      const group = state.layers.find((l: Layer) => l.id === groupId && l.type === 'group');
      if (group && group.children) {
        group.children.forEach((childId: string) => {
          const child = state.layers.find((l: Layer) => l.id === childId);
          if (child) {
            child.parentId = null;
          }
        });
        state.layers = state.layers.filter((l: Layer) => l.id !== groupId);
        state.layers.forEach((l: Layer, i: number) => {
          l.order = i;
        });
        state.project.isDirty = true;
      }
    });
  },

  addLayerEffect: (layerId: string, effect: Omit<LayerEffect, 'id'>) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === layerId);
      if (layer) {
        layer.effects.push({
          ...effect,
          id: uuidv4(),
        });
        state.project.isDirty = true;
      }
    });
  },

  updateLayerEffect: (layerId: string, effectId: string, updates: Partial<LayerEffect>) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === layerId);
      if (layer) {
        const effect = layer.effects.find((e: LayerEffect) => e.id === effectId);
        if (effect) {
          Object.assign(effect, updates);
          state.project.isDirty = true;
        }
      }
    });
  },

  removeLayerEffect: (layerId: string, effectId: string) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === layerId);
      if (layer) {
        layer.effects = layer.effects.filter((e: LayerEffect) => e.id !== effectId);
        state.project.isDirty = true;
      }
    });
  },

  transformLayer: (id: string, transform: Partial<Layer['transform']>) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer && !layer.locked) {
        layer.transform = { ...layer.transform, ...transform };
        state.project.isDirty = true;
      }
    });
  },

  flipLayerHorizontal: (id: string) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer && !layer.locked) {
        layer.transform.flipX = !layer.transform.flipX;
        state.project.isDirty = true;
      }
    });
  },

  flipLayerVertical: (id: string) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer && !layer.locked) {
        layer.transform.flipY = !layer.transform.flipY;
        state.project.isDirty = true;
      }
    });
  },

  rotateLayer: (id: string, degrees: number) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer && !layer.locked) {
        layer.transform.rotation = (layer.transform.rotation + degrees) % 360;
        state.project.isDirty = true;
      }
    });
  },

  resetLayerTransform: (id: string) => {
    set((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer && !layer.locked) {
        layer.transform = createLayerTransform();
        state.project.isDirty = true;
      }
    });
  },

  addToHistory: (entry) => {
    set((state) => {
      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push({
        ...entry,
        id: uuidv4(),
        timestamp: new Date(),
      });
      if (state.history.length > MAX_HISTORY) {
        state.history = state.history.slice(-MAX_HISTORY);
      }
      state.historyIndex = state.history.length - 1;
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      set((s) => {
        s.historyIndex -= 1;
        const entry = s.history[s.historyIndex];
        if (entry?.image) {
          s.currentImage = entry.image;
        }
        if (entry?.snapshot) {
          Object.assign(s, entry.snapshot);
        }
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      set((s) => {
        s.historyIndex += 1;
        const entry = s.history[s.historyIndex];
        if (entry?.image) {
          s.currentImage = entry.image;
        }
        if (entry?.snapshot) {
          Object.assign(s, entry.snapshot);
        }
      });
    }
  },

  undoMultiple: (steps: number) => {
    const state = get();
    const newIndex = Math.max(0, state.historyIndex - steps);
    if (newIndex !== state.historyIndex) {
      set((s) => {
        s.historyIndex = newIndex;
        const entry = s.history[newIndex];
        if (entry?.image) {
          s.currentImage = entry.image;
        }
      });
    }
  },

  redoMultiple: (steps: number) => {
    const state = get();
    const newIndex = Math.min(state.history.length - 1, state.historyIndex + steps);
    if (newIndex !== state.historyIndex) {
      set((s) => {
        s.historyIndex = newIndex;
        const entry = s.history[newIndex];
        if (entry?.image) {
          s.currentImage = entry.image;
        }
      });
    }
  },

  goToHistoryIndex: (index: number) => {
    set((state) => {
      if (index >= 0 && index < state.history.length) {
        state.historyIndex = index;
        const entry = state.history[index];
        if (entry?.image) {
          state.currentImage = entry.image;
        }
      }
    });
  },

  clearHistory: () => {
    set((state) => {
      state.history = [];
      state.historyIndex = -1;
    });
  },

  canUndo: () => get().historyIndex > 0,

  canRedo: () => get().historyIndex < get().history.length - 1,

  getHistoryState: (index: number) => get().history[index],

  setVastuAnalysis: (analysis) => {
    set((state) => {
      state.vastuAnalysis = analysis;
    });
  },

  setVastuLoading: (loading) => {
    set((state) => {
      state.vastuLoading = loading;
    });
  },

  requestVastuAnalysis: async () => {
    const state = get();
    if (!state.currentImage) return;

    set((s) => {
      s.vastuLoading = true;
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const analysis: VastuAnalysis = {
        score: 75,
        direction: 'North',
        issues: [],
        suggestions: [],
        roomAnalysis: {},
        lastAnalyzedAt: new Date(),
      };

      set((s) => {
        s.vastuAnalysis = analysis;
        s.vastuLoading = false;
      });
    } catch (error) {
      set((s) => {
        s.vastuLoading = false;
      });
      get().addError({
        type: 'error',
        code: 'VASTU_ANALYSIS_FAILED',
        message: 'Failed to analyze Vastu',
      });
    }
  },

  applyVastuSuggestion: (suggestionId: string) => {
    set((state) => {
      state.project.isDirty = true;
    });
  },

  dismissVastuIssue: (issueId: string) => {
    set((state) => {
      if (state.vastuAnalysis) {
        state.vastuAnalysis.issues = state.vastuAnalysis.issues.filter(
          (i: VastuIssue) => i.id !== issueId
        );
      }
    });
  },

  setCostEstimate: (estimate) => {
    set((state) => {
      state.costEstimate = estimate;
    });
  },

  setCostLoading: (loading) => {
    set((state) => {
      state.costLoading = loading;
    });
  },

  requestCostEstimate: async () => {
    const state = get();
    if (!state.currentImage) return;

    set((s) => {
      s.costLoading = true;
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const estimate: CostEstimate = {
        totalCost: 500000,
        currency: 'INR',
        breakdown: [],
        laborCost: 100000,
        materialCost: 350000,
        taxAmount: 50000,
        contingency: 50000,
        timeline: { minDays: 30, maxDays: 45 },
        lastCalculatedAt: new Date(),
        city: 'Mumbai',
        squareFootage: 500,
      };

      set((s) => {
        s.costEstimate = estimate;
        s.costLoading = false;
      });
    } catch (error) {
      set((s) => {
        s.costLoading = false;
      });
      get().addError({
        type: 'error',
        code: 'COST_ESTIMATE_FAILED',
        message: 'Failed to calculate cost estimate',
      });
    }
  },

  updateCostSettings: (settings) => {
    // Implementation
  },

  addPreset: (preset) => {
    const id = uuidv4();
    set((state) => {
      state.presets.push({
        ...preset,
        id,
        createdAt: new Date(),
      });
    });
    return id;
  },

  updatePreset: (id: string, updates) => {
    set((state) => {
      const preset = state.presets.find((p: Preset) => p.id === id);
      if (preset) {
        Object.assign(preset, updates);
      }
    });
  },

  deletePreset: (id: string) => {
    set((state) => {
      state.presets = state.presets.filter((p: Preset) => p.id !== id);
      if (state.selectedPresetId === id) {
        state.selectedPresetId = null;
      }
    });
  },

  applyPreset: (id: string) => {
    set((state) => {
      const preset = state.presets.find((p: Preset) => p.id === id);
      if (preset) {
        state.generationSettings = {
          ...state.generationSettings,
          ...preset.settings,
        };
        state.selectedPresetId = id;
      }
    });
  },

  togglePresetFavorite: (id: string) => {
    set((state) => {
      const preset = state.presets.find((p: Preset) => p.id === id);
      if (preset) {
        preset.isFavorite = !preset.isFavorite;
      }
    });
  },

  exportPreset: (id: string) => {
    const preset = get().presets.find((p: Preset) => p.id === id);
    if (preset) {
      return JSON.stringify(preset);
    }
    return '';
  },

  importPreset: (data: string) => {
    try {
      const preset = JSON.parse(data);
      const newId = uuidv4();
      set((state) => {
        state.presets.push({
          ...preset,
          id: newId,
          createdAt: new Date(),
          isDefault: false,
        });
      });
      return newId;
    } catch {
      get().addError({
        type: 'error',
        code: 'PRESET_IMPORT_FAILED',
        message: 'Failed to import preset',
      });
      return null;
    }
  },

  setUIState: (state) => {
    set((s) => {
      s.ui = { ...s.ui, ...state };
    });
  },

  togglePanel: (panel) => {
    set((state) => {
      (state.ui[panel] as boolean) = !state.ui[panel];
    });
  },

  openPanel: (panel) => {
    set((state) => {
      state.ui[panel] = true;
    });
  },

  closePanel: (panel) => {
    set((state) => {
      state.ui[panel] = false;
    });
  },

  closeAllPanels: () => {
    set((state) => {
      state.ui.showVastuPanel = false;
      state.ui.showCostPanel = false;
      state.ui.showHistoryPanel = false;
      state.ui.showLayersPanel = false;
      state.ui.showStylesPanel = false;
      state.ui.showSettingsPanel = false;
    });
  },

  setCompareMode: (mode) => {
    set((state) => {
      state.ui.compareMode = mode;
    });
  },

  setComparePosition: (position: number) => {
    set((state) => {
      state.ui.comparePosition = clamp(position, 0, 100);
    });
  },

  toggleCompareView: () => {
    set((state) => {
      state.ui.showCompareView = !state.ui.showCompareView;
    });
  },

  toggleGrid: () => {
    set((state) => {
      state.ui.showGrid = !state.ui.showGrid;
    });
  },

  toggleRulers: () => {
    set((state) => {
      state.ui.showRulers = !state.ui.showRulers;
    });
  },

  toggleGuides: () => {
    set((state) => {
      state.ui.showGuides = !state.ui.showGuides;
    });
  },

  setTheme: (theme) => {
    set((state) => {
      state.ui.theme = theme;
    });
  },

  setLanguage: (language) => {
    set((state) => {
      state.ui.language = language;
    });
  },

  setSidebarWidth: (width: number) => {
    set((state) => {
      state.ui.sidebarWidth = clamp(width, 200, 500);
    });
  },

  setRightPanelWidth: (width: number) => {
    set((state) => {
      state.ui.rightPanelWidth = clamp(width, 200, 500);
    });
  },

  setKeyboardState: (state) => {
    set((s) => {
      s.keyboard = { ...s.keyboard, ...state };
    });
  },

  addError: (error) => {
    set((state) => {
      state.errors.push({
        ...error,
        id: uuidv4(),
        timestamp: new Date(),
        dismissed: false,
      });
    });
  },

  dismissError: (id: string) => {
    set((state) => {
      const error = state.errors.find((e: EditorError) => e.id === id);
      if (error) {
        error.dismissed = true;
      }
    });
  },

  dismissAllErrors: () => {
    set((state) => {
      state.errors.forEach((e: EditorError) => {
        e.dismissed = true;
      });
    });
  },

  clearErrors: () => {
    set((state) => {
      state.errors = [];
    });
  },

  setCollaborators: (collaborators) => {
    set((state) => {
      state.collaborators = collaborators;
    });
  },

  updateCollaborator: (id: string, updates) => {
    set((state) => {
      const collaborator = state.collaborators.find((c: Collaborator) => c.id === id);
      if (collaborator) {
        Object.assign(collaborator, updates);
      }
    });
  },

  removeCollaborator: (id: string) => {
    set((state) => {
      state.collaborators = state.collaborators.filter((c: Collaborator) => c.id !== id);
    });
  },

  setIsCollaborating: (isCollaborating) => {
    set((state) => {
      state.isCollaborating = isCollaborating;
    });
  },

  setLoading: (loading, message) => {
    set((state) => {
      state.isLoading = loading;
      state.loadingMessage = message || '';
    });
  },

  reset: () => {
    set(() => initialEditorState);
  },

  softReset: () => {
    set((state) => {
      const preserved = {
        project: state.project,
        ui: state.ui,
        presets: state.presets,
      };
      Object.assign(state, initialEditorState, preserved);
    });
  },
});

// ============================================
// CREATE STORE
// ============================================

export const useEditorStore = create<EditorStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer(editorStoreCreator),
        {
          name: 'removation-editor',
          partialize: (state) => ({
            ui: state.ui,
            brushSettings: state.brushSettings,
            generationSettings: {
              negativePrompt: state.generationSettings.negativePrompt,
              strength: state.generationSettings.strength,
              guidanceScale: state.generationSettings.guidanceScale,
              quality: state.generationSettings.quality,
              preserveDetails: state.generationSettings.preserveDetails,
              enhancePrompt: state.generationSettings.enhancePrompt,
            },
            presets: state.presets,
          }),
        } as PersistOptions<EditorStore, Partial<EditorStore>>
      )
    ),
    { name: 'EditorStore', enabled: process.env.NODE_ENV === 'development' }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectProject = (state: EditorStore) => state.project;
export const selectCurrentImage = (state: EditorStore) => state.currentImage;
export const selectOriginalImage = (state: EditorStore) => state.originalImage;
export const selectProcessedImage = (state: EditorStore) => state.processedImage;
export const selectMode = (state: EditorStore) => state.mode;
export const selectStyle = (state: EditorStore) => state.style;
export const selectRoomType = (state: EditorStore) => state.roomType;
export const selectCurrentTool = (state: EditorStore) => state.currentTool;
export const selectBrushSettings = (state: EditorStore) => state.brushSettings;
export const selectMask = (state: EditorStore) => state.mask;
export const selectCanvas = (state: EditorStore) => state.canvas;
export const selectSelection = (state: EditorStore) => state.selection;
export const selectCrop = (state: EditorStore) => state.crop;
export const selectGenerationSettings = (state: EditorStore) => state.generationSettings;
export const selectIsGenerating = (state: EditorStore) => state.isGenerating;
export const selectGenerationProgress = (state: EditorStore) => state.generationProgress;
export const selectGenerationStatus = (state: EditorStore) => state.generationStatus;
export const selectCurrentRender = (state: EditorStore) => state.currentRender;
export const selectRenderQueue = (state: EditorStore) => state.renderQueue;
export const selectLayers = (state: EditorStore) => state.layers;
export const selectActiveLayerId = (state: EditorStore) => state.activeLayerId;
export const selectHistory = (state: EditorStore) => state.history;
export const selectHistoryIndex = (state: EditorStore) => state.historyIndex;
export const selectVastuAnalysis = (state: EditorStore) => state.vastuAnalysis;
export const selectVastuLoading = (state: EditorStore) => state.vastuLoading;
export const selectCostEstimate = (state: EditorStore) => state.costEstimate;
export const selectCostLoading = (state: EditorStore) => state.costLoading;
export const selectPresets = (state: EditorStore) => state.presets;
export const selectUI = (state: EditorStore) => state.ui;
export const selectKeyboard = (state: EditorStore) => state.keyboard;
export const selectErrors = (state: EditorStore) => state.errors;
export const selectCollaborators = (state: EditorStore) => state.collaborators;
export const selectIsLoading = (state: EditorStore) => state.isLoading;
export const selectIsInitialized = (state: EditorStore) => state.isInitialized;

export const selectActiveLayer = (state: EditorStore) =>
  state.layers.find((l: Layer) => l.id === state.activeLayerId);

export const selectVisibleLayers = (state: EditorStore) =>
  state.layers.filter((l: Layer) => l.visible).sort((a: Layer, b: Layer) => a.order - b.order);

export const selectCanUndo = (state: EditorStore) => state.historyIndex > 0;

export const selectCanRedo = (state: EditorStore) =>
  state.historyIndex < state.history.length - 1;

export const selectHasChanges = (state: EditorStore) => state.project.isDirty;

export const selectZoomPercentage = (state: EditorStore) =>
  Math.round(state.canvas.zoom * 100);

// Custom hook for selecting multiple values
export function useEditorSelectors<T extends Record<string, any>>(
  selectors: { [K in keyof T]: (state: EditorStore) => T[K] }
): T {
  return useEditorStore((state) => {
    const result = {} as T;
    for (const key in selectors) {
      result[key] = selectors[key](state);
    }
    return result;
  }, shallow);
}

export default useEditorStore;