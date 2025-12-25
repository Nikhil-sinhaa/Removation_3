// hooks/useEditor.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { 
  EditorTool, 
  EditorState, 
  BrushSettings, 
  ZoomLevel,
  HistoryEntry,
  Layer,
  LayerData,
  HistoryCustomSettings
} from '@/types/editor';
import { useDebounce } from './useDebounce';

interface UseEditorOptions {
  projectId?: string;
  initialImage?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface UseEditorReturn {
  // State
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  isDrawing: boolean;
  currentTool: EditorTool;
  brushSettings: BrushSettings;
  zoomLevel: ZoomLevel;
  panOffset: { x: number; y: number };
  layers: Layer[];
  activeLayerId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  
  // Canvas refs
  canvasRef: React.RefObject<HTMLCanvasElement>;
  maskCanvasRef: React.RefObject<HTMLCanvasElement>;
  
  // Actions
  setCanvas: (canvas: HTMLCanvasElement) => void;
  setTool: (tool: EditorTool) => void;
  setBrushSize: (size: number) => void;
  setBrushHardness: (hardness: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushColor: (color: string) => void;
  setBrushFlow: (flow: number) => void;
  toggleBrushEraser: () => void;
  setZoom: (zoom: ZoomLevel) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  resetZoom: () => void;
  pan: (deltaX: number, deltaY: number) => void;
  resetPan: () => void;
  
  // Drawing
  startDrawing: (x: number, y: number) => void;
  draw: (x: number, y: number) => void;
  stopDrawing: () => void;
  
  // Mask operations
  getMaskData: () => ImageData | null;
  getMaskDataURL: () => string | null;
  clearMask: () => void;
  invertMask: () => void;
  expandMask: (pixels: number) => void;
  contractMask: (pixels: number) => void;
  featherMask: (pixels: number) => void;
  
  // Layer operations
  addLayer: (layer: Partial<Layer>) => string;
  removeLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  toggleLayerVisibility: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  mergeLayersDown: (layerId: string) => void;
  flattenLayers: () => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  // Image operations
  loadImage: (imageUrl: string) => Promise<void>;
  exportImage: (format: 'png' | 'jpeg' | 'webp', quality?: number) => string | null;
  getImageDimensions: () => { width: number; height: number } | null;
  cropImage: (x: number, y: number, width: number, height: number) => void;
  rotateImage: (degrees: number) => void;
  flipImage: (direction: 'horizontal' | 'vertical') => void;
  
  // Utility
  getCanvasCoordinates: (clientX: number, clientY: number) => { x: number; y: number };
  save: () => Promise<void>;
  reset: () => void;
}

const ZOOM_LEVELS: ZoomLevel[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const DEFAULT_BRUSH_SIZE = 50;
const DEFAULT_BRUSH_HARDNESS = 0.8;
const DEFAULT_BRUSH_OPACITY = 1;
const DEFAULT_BRUSH_FLOW = 1;
const DEFAULT_BRUSH_COLOR = '#ffffff';
const MAX_HISTORY_LENGTH = 50;

export function useEditor(options: UseEditorOptions = {}): UseEditorReturn {
  const {
    projectId,
    initialImage,
    autoSave = true,
    autoSaveDelay = 5000,
  } = options;

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const maskContextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Store
  const store = useEditorStore();

  // Local state
  const [canvas, setCanvasState] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [currentTool, setCurrentTool] = useState<EditorTool>('brush');
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: DEFAULT_BRUSH_SIZE,
    hardness: DEFAULT_BRUSH_HARDNESS,
    opacity: DEFAULT_BRUSH_OPACITY,
    flow: DEFAULT_BRUSH_FLOW,
    isEraser: false,
    color: DEFAULT_BRUSH_COLOR,
  });
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastDrawPoint, setLastDrawPoint] = useState<{ x: number; y: number } | null>(null);

  // Debounced save
  const debouncedIsDirty = useDebounce(isDirty, autoSaveDelay);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && debouncedIsDirty && projectId) {
      save();
    }
  }, [debouncedIsDirty, autoSave, projectId]);

  // Initialize canvas
  const setCanvas = useCallback((canvasElement: HTMLCanvasElement) => {
    setCanvasState(canvasElement);
    contextRef.current = canvasElement.getContext('2d');
    
    if (maskCanvasRef.current) {
      maskContextRef.current = maskCanvasRef.current.getContext('2d');
    }
  }, []);

  // Load initial image
  useEffect(() => {
    if (initialImage && canvas && contextRef.current) {
      loadImage(initialImage);
    }
  }, [initialImage, canvas]);

  // Tool operations
  const setTool = useCallback((tool: EditorTool) => {
    setCurrentTool(tool);
    store.setTool(tool);
  }, [store]);

  // Brush settings
  const setBrushSize = useCallback((size: number) => {
    setBrushSettings(prev => ({ ...prev, size: Math.max(1, Math.min(500, size)) }));
  }, []);

  const setBrushHardness = useCallback((hardness: number) => {
    setBrushSettings(prev => ({ ...prev, hardness: Math.max(0, Math.min(1, hardness)) }));
  }, []);

  const setBrushOpacity = useCallback((opacity: number) => {
    setBrushSettings(prev => ({ ...prev, opacity: Math.max(0, Math.min(1, opacity)) }));
  }, []);

  const setBrushColor = useCallback((color: string) => {
    setBrushSettings(prev => ({ ...prev, color }));
  }, []);

  const setBrushFlow = useCallback((flow: number) => {
    setBrushSettings(prev => ({ ...prev, flow: Math.max(0, Math.min(1, flow)) }));
  }, []);

  const toggleBrushEraser = useCallback(() => {
    setBrushSettings(prev => ({ ...prev, isEraser: !prev.isEraser }));
  }, []);

  // Zoom operations
  const setZoom = useCallback((zoom: ZoomLevel) => {
    setZoomLevel(zoom);
    store.setZoom(zoom);
  }, [store]);

  const zoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  }, [zoomLevel, setZoom]);

  const zoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel);
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  }, [zoomLevel, setZoom]);

  const fitToScreen = useCallback(() => {
    if (!canvas) return;
    
    const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
    const containerHeight = canvas.parentElement?.clientHeight || window.innerHeight;
    
    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    const closestZoom = ZOOM_LEVELS.reduce((prev, curr) => 
      Math.abs(curr - scale) < Math.abs(prev - scale) ? curr : prev
    );
    
    setZoom(closestZoom);
    resetPan();
  }, [canvas, setZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  // Pan operations
  const pan = useCallback((deltaX: number, deltaY: number) => {
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  const resetPan = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Drawing operations
  const startDrawing = useCallback((x: number, y: number) => {
    if (!maskContextRef.current) return;
    
    setIsDrawing(true);
    setLastDrawPoint({ x, y });
    
    const ctx = maskContextRef.current;
    ctx.beginPath();
    ctx.arc(x, y, brushSettings.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = brushSettings.isEraser ? 'black' : brushSettings.color;
    ctx.globalAlpha = brushSettings.opacity;
    ctx.fill();
    
    setIsDirty(true);
  }, [brushSettings]);

  const draw = useCallback((x: number, y: number) => {
    if (!isDrawing || !maskContextRef.current || !lastDrawPoint) return;
    
    const ctx = maskContextRef.current;
    ctx.lineWidth = brushSettings.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushSettings.isEraser ? 'black' : brushSettings.color;
    ctx.globalAlpha = brushSettings.opacity;
    
    ctx.beginPath();
    ctx.moveTo(lastDrawPoint.x, lastDrawPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastDrawPoint({ x, y });
  }, [isDrawing, lastDrawPoint, brushSettings]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastDrawPoint(null);
      
      // Save to history
      if (maskCanvasRef.current) {
        saveToHistory({
          type: 'brush',
          image: { 
            url: maskCanvasRef.current.toDataURL(), 
            width: maskCanvasRef.current.width, 
            height: maskCanvasRef.current.height 
          },
          settings: { 
            brushSettings: {
              size: brushSettings.size,
              hardness: brushSettings.hardness,
              opacity: brushSettings.opacity,
              flow: brushSettings.flow,
              isEraser: brushSettings.isEraser,
              color: brushSettings.color
            }
          } as Partial<EditorState> & HistoryCustomSettings
        });
      }
    }
  }, [isDrawing, brushSettings]);

  // Mask operations
  const getMaskData = useCallback((): ImageData | null => {
    if (!maskContextRef.current || !maskCanvasRef.current) return null;
    
    return maskContextRef.current.getImageData(
      0, 
      0, 
      maskCanvasRef.current.width, 
      maskCanvasRef.current.height
    );
  }, []);

  const getMaskDataURL = useCallback((): string | null => {
    if (!maskCanvasRef.current) return null;
    return maskCanvasRef.current.toDataURL('image/png');
  }, []);

  const clearMask = useCallback(() => {
    if (!maskContextRef.current || !maskCanvasRef.current) return;
    
    maskContextRef.current.clearRect(
      0, 
      0, 
      maskCanvasRef.current.width, 
      maskCanvasRef.current.height
    );
    
    setIsDirty(true);
    saveToHistory({
      type: 'mask_operation',
      image: { 
        url: maskCanvasRef.current.toDataURL(), 
        width: maskCanvasRef.current.width, 
        height: maskCanvasRef.current.height 
      },
      settings: { 
        operation: 'clearMask'
      } as Partial<EditorState> & HistoryCustomSettings
    });
  }, []);

  const invertMask = useCallback(() => {
    if (!maskContextRef.current || !maskCanvasRef.current) return;
    
    const imageData = maskContextRef.current.getImageData(
      0, 
      0, 
      maskCanvasRef.current.width, 
      maskCanvasRef.current.height
    );
    
    for (let i = 0; i <imageData.data.length; i += 4) {
      imageData.data[i] = 255 - imageData.data[i];
      imageData.data[i + 1] = 255 - imageData.data[i + 1];
      imageData.data[i + 2] = 255 - imageData.data[i + 2];
    }
    
    maskContextRef.current.putImageData(imageData, 0, 0);
    setIsDirty(true);
    saveToHistory({
      type: 'mask_operation',
      image: { 
        url: maskCanvasRef.current.toDataURL(), 
        width: maskCanvasRef.current.width, 
        height: maskCanvasRef.current.height 
      },
      settings: { 
        operation: 'invertMask'
      } as Partial<EditorState> & HistoryCustomSettings
    });
  }, []);

  const expandMask = useCallback((pixels: number) => {
    if (!maskContextRef.current || !maskCanvasRef.current) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maskCanvasRef.current.width;
    tempCanvas.height = maskCanvasRef.current.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    tempCtx.filter = `blur(${pixels}px)`;
    tempCtx.drawImage(maskCanvasRef.current, 0, 0);
    
    maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    maskContextRef.current.drawImage(tempCanvas, 0, 0);
    
    setIsDirty(true);
    saveToHistory({
      type: 'mask_operation',
      image: { 
        url: maskCanvasRef.current.toDataURL(), 
        width: maskCanvasRef.current.width, 
        height: maskCanvasRef.current.height 
      },
      settings: { 
        operation: 'expandMask',
        pixels
      } as Partial<EditorState> & HistoryCustomSettings
    });
  }, []);

  const contractMask = useCallback((pixels: number) => {
    expandMask(-pixels);
  }, [expandMask]);

  const featherMask = useCallback((pixels: number) => {
    if (!maskContextRef.current || !maskCanvasRef.current) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maskCanvasRef.current.width;
    tempCanvas.height = maskCanvasRef.current.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    tempCtx.filter = `blur(${pixels}px)`;
    tempCtx.drawImage(maskCanvasRef.current, 0, 0);
    
    maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    maskContextRef.current.drawImage(tempCanvas, 0, 0);
    
    setIsDirty(true);
    saveToHistory({
      type: 'mask_operation',
      image: { 
        url: maskCanvasRef.current.toDataURL(), 
        width: maskCanvasRef.current.width, 
        height: maskCanvasRef.current.height 
      },
      settings: { 
        operation: 'featherMask',
        pixels
      } as Partial<EditorState> & HistoryCustomSettings
    });
  }, []);

  // Layer operations
  const addLayer = useCallback((layer: Partial<Layer>): string => {
    const id = crypto.randomUUID();
    
    // Handle different data types
    let layerData: LayerData | null = null;
    if (typeof layer.data === 'string') {
      // Convert string URL to LayerData object
      layerData = { 
        type: 'image', 
        url: layer.data
      };
    } else if (layer.data) {
      layerData = layer.data;
    }
    
    const newLayer: Layer = {
      id,
      name: layer.name || `Layer ${layers.length + 1}`,
      type: layer.type || 'image',
      visible: layer.visible ?? true,
      locked: layer.locked ?? false,
      opacity: layer.opacity ?? 1,
      blendMode: layer.blendMode || 'normal',
      data: layerData,
      order: layers.length,
    };
    
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(id);
    setIsDirty(true);
    
    return id;
  }, [layers.length]);

  const removeLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(l => l.id !== layerId));
    if (activeLayerId === layerId) {
      setActiveLayerId(layers[0]?.id || null);
    }
    setIsDirty(true);
  }, [activeLayerId, layers]);

  const moveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === layerId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      
      return newLayers.map((l, i) => ({ ...l, order: i }));
    });
    setIsDirty(true);
  }, []);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => 
      prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l)
    );
    setIsDirty(true);
  }, []);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers(prev => 
      prev.map(l => l.id === layerId ? { ...l, opacity } : l)
    );
    setIsDirty(true);
  }, []);

  const mergeLayersDown = useCallback((layerId: string) => {
    // Implementation for merging layers
    setIsDirty(true);
  }, []);

  const flattenLayers = useCallback(() => {
    // Implementation for flattening all layers
    setIsDirty(true);
  }, []);

  // History operations
  const saveToHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newEntry);
      
      if (newHistory.length > MAX_HISTORY_LENGTH) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_LENGTH - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      // Apply previous state
      const prevState = history[historyIndex - 1];
      if (prevState && prevState.image && canvas) {
        // Load the previous image state
        const img = new Image();
        img.onload = () => {
          if (contextRef.current) {
            contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
            contextRef.current.drawImage(img, 0, 0);
          }
        };
        img.src = prevState.image.url;
      }
    }
  }, [historyIndex, history, canvas]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      // Apply next state
      const nextState = history[historyIndex + 1];
      if (nextState && nextState.image && canvas) {
        const img = new Image();
        img.onload = () => {
          if (contextRef.current) {
            contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
            contextRef.current.drawImage(img, 0, 0);
          }
        };
        img.src = nextState.image.url;
      }
    }
  }, [historyIndex, history.length, history, canvas]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  // Image operations
  const loadImage = useCallback(async (imageUrl: string): Promise<void> => {
    if (!contextRef.current || !canvas) return;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        if (!canvas || !contextRef.current) return reject(new Error('Canvas not available'));
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (maskCanvasRef.current) {
          maskCanvasRef.current.width = img.width;
          maskCanvasRef.current.height = img.height;
        }
        
        contextRef.current.drawImage(img, 0, 0);
        
        // Save to history
        saveToHistory({
          type: 'upload',
          image: { 
            url: canvas.toDataURL(), 
            width: img.width, 
            height: img.height 
          },
          settings: {}
        });
        
        // Add as base layer with proper LayerData object
        addLayer({
          name: 'Background',
          data: { type: 'image', url: canvas.toDataURL() }, // Proper LayerData object
          locked: true,
        });
        
        resolve();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }, [canvas, addLayer, saveToHistory]);

  const exportImage = useCallback((
    format: 'png' | 'jpeg' | 'webp', 
    quality: number = 0.92
  ): string | null => {
    if (!canvas) return null;
    
    const mimeType = `image/${format}`;
    return canvas.toDataURL(mimeType, quality);
  }, [canvas]);

  const getImageDimensions = useCallback((): { width: number; height: number } | null => {
    if (!canvas) return null;
    return { width: canvas.width, height: canvas.height };
  }, [canvas]);

  const cropImage = useCallback((x: number, y: number, width: number, height: number) => {
    if (!contextRef.current || !canvas) return;
    
    const imageData = contextRef.current.getImageData(x, y, width, height);
    canvas.width = width;
    canvas.height = height;
    contextRef.current.putImageData(imageData, 0, 0);
    
    setIsDirty(true);
    
    saveToHistory({
      type: 'crop',
      image: { 
        url: canvas.toDataURL(), 
        width, 
        height 
      },
      settings: { 
        operation: 'crop',
        crop: { x, y, width, height }
      } as Partial<EditorState> & HistoryCustomSettings
    });
  }, [canvas, saveToHistory]);

  const rotateImage = useCallback((degrees: number) => {
    if (!contextRef.current || !canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    const radians = (degrees * Math.PI) / 180;
    
    if (degrees === 90 || degrees === 270) {
      tempCanvas.width = canvas.height;
      tempCanvas.height = canvas.width;
    } else {
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
    }
    
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate(radians);
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    contextRef.current.drawImage(tempCanvas, 0, 0);
    
    setIsDirty(true);
    saveToHistory({
      type: 'rotate',
      image: { 
        url: canvas.toDataURL(), 
        width: canvas.width, 
        height: canvas.height 
      },
      settings: { 
        operation: 'rotate',
        rotate: degrees
      } as Partial<EditorState> & HistoryCustomSettings
    });
  }, [canvas, saveToHistory]);

  const flipImage = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!contextRef.current || !canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.drawImage(canvas, 0, 0);
    
    contextRef.current.save();
    if (direction === 'horizontal') {
      contextRef.current.scale(-1, 1);
      contextRef.current.drawImage(tempCanvas, -canvas.width, 0);
    } else {
      contextRef.current.scale(1, -1);
      contextRef.current.drawImage(tempCanvas, 0, -canvas.height);
    }
    contextRef.current.restore();
    
    setIsDirty(true);
    saveToHistory({
      type: 'flip',
      image: { 
        url: canvas.toDataURL(), 
        width: canvas.width, 
        height: canvas.height 
      },
      settings: { 
        operation: 'flip',
        flip: direction
      } as Partial<EditorState> & HistoryCustomSettings
    });
  }, [canvas, saveToHistory]);

  // Utility functions
  const getCanvasCoordinates = useCallback((
    clientX: number, 
    clientY: number
  ): { x: number; y: number } => {
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (clientY - rect.top - panOffset.y) / zoomLevel;
    
    return { x, y };
  }, [canvas, panOffset, zoomLevel]);

  const save = useCallback(async (): Promise<void> => {
    if (!projectId || !canvas) return;
    
    try {
      const imageData = exportImage('png');
      const maskData = getMaskDataURL();
      
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          maskData,
          layers: layers.map(l => ({ ...l })),
        }),
      });
      
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    }
  }, [projectId, canvas, exportImage, getMaskDataURL, layers]);

  const reset = useCallback(() => {
    if (contextRef.current && canvas) {
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    }
    clearMask();
    clearHistory();
    setLayers([]);
    setActiveLayerId(null);
    setZoom(1);
    resetPan();
    setIsDirty(false);
  }, [canvas, clearMask, clearHistory, setZoom, resetPan]);

  return {
    // State
    canvas,
    context: contextRef.current,
    isDrawing,
    currentTool,
    brushSettings,
    zoomLevel,
    panOffset,
    layers,
    activeLayerId,
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    isDirty,
    
    // Refs
    canvasRef,
    maskCanvasRef,
    
    // Actions
    setCanvas,
    setTool,
    setBrushSize,
    setBrushHardness,
    setBrushOpacity,
    setBrushColor,
    setBrushFlow,
    toggleBrushEraser,
    setZoom,
    zoomIn,
    zoomOut,
    fitToScreen,
    resetZoom,
    pan,
    resetPan,
    
    // Drawing
    startDrawing,
    draw,
    stopDrawing,
    
    // Mask operations
    getMaskData,
    getMaskDataURL,
    clearMask,
    invertMask,
    expandMask,
    contractMask,
    featherMask,
    
    // Layer operations
    addLayer,
    removeLayer,
    setActiveLayer: setActiveLayerId,
    moveLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    mergeLayersDown,
    flattenLayers,
    
    // History
    undo,
    redo,
    saveToHistory,
    clearHistory,
    
    // Image operations
    loadImage,
    exportImage,
    getImageDimensions,
    cropImage,
    rotateImage,
    flipImage,
    
    // Utility
    getCanvasCoordinates,
    save,
    reset,
  };
}