// hooks/useGenerate.ts
'use client';

import { useState, useCallback, useRef } from 'react';
import { useEditorStore } from '@/stores/editor-store';
// Comment out or remove these if they don't exist yet
// import { useProjectStore } from '@/stores/project-store';
// import { useUserStore } from '@/stores/user-store';
import { 
  TransformationMode,
  GenerationSettings,
  Render,
  DesignStyle
} from '@/types';
// Create a simple toast function if use-toast doesn't exist
import { toast } from 'sonner'; // Alternative: use sonner toast

interface UseGenerateOptions {
  projectId?: string;
  autoSave?: boolean;
}

interface UseGenerateReturn {
  // State
  isGenerating: boolean;
  generationProgress: number;
  generationStatus: string;
  currentRender: Render | null;
  renderQueue: any[];
  
  // Generation methods
  generate: (settings: GenerationSettings) => Promise<Render | null>;
  generateFromImage: (imageUrl: string, mode: TransformationMode) => Promise<Render | null>;
  generateInpaint: (imageUrl: string, maskUrl: string, prompt: string) => Promise<Render | null>;
  generateObjectRemoval: (imageUrl: string, maskUrl: string) => Promise<Render | null>;
  generateObjectReplacement: (imageUrl: string, maskUrl: string, replacementPrompt: string) => Promise<Render | null>;
  generateMaterialChange: (imageUrl: string, maskUrl: string, materialId: string) => Promise<Render | null>;
  generateColorChange: (imageUrl: string, maskUrl: string, colorHex: string) => Promise<Render | null>;
  generateStyleTransfer: (imageUrl: string, styleId: string) => Promise<Render | null>;
  
  // Queue management
  addToQueue: (settings: GenerationSettings) => string;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  processQueue: () => Promise<void>;
  
  // History
  getHistory: () => Render[];
  getRenderById: (id: string) => Render | null;
  deleteRender: (id: string) => Promise<void>;
  favoriteRender: (id: string) => Promise<void>;
  
  // Export
  exportRender: (renderId: string, format: 'png' | 'jpg' | 'webp', quality?: number) => Promise<string | null>;
  exportWithWatermark: (renderId: string) => Promise<string | null>;
  
  // Utility
  cancelGeneration: () => void;
  retryGeneration: (renderId: string) => Promise<Render | null>;
  estimateCredits: (mode: TransformationMode) => number;
  estimateTime: (mode: TransformationMode) => number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create a simple toast function
const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
  if (typeof window !== 'undefined') {
    // Use sonner or native alert
    if ((window as any).sonner) {
      variant === 'destructive' 
        ? (window as any).sonner.error(title, { description })
        : (window as any).sonner.success(title, { description });
    } else {
      console.log(`${title}: ${description}`);
    }
  }
};

export function useGenerate(options: UseGenerateOptions = {}): UseGenerateReturn {
  const { projectId, autoSave = true } = options;
  
  // Stores - use optional chaining or fallbacks
  const editorStore = useEditorStore();
  // const projectStore = useProjectStore?.();
  // const userStore = useUserStore?.();
  
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [currentRender, setCurrentRender] = useState<Render | null>(null);
  const [renderQueue, setRenderQueue] = useState<any[]>([]);
  const [renderHistory, setRenderHistory] = useState<Render[]>([]);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Generate function
  const generate = useCallback(async (settings: GenerationSettings): Promise<Render | null> => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus('Preparing generation...');
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      // In a real app, you'd get the token from Clerk
      // const { getToken } = useAuth();
      // const token = await getToken();
      
      // Prepare request body
      const requestBody = {
        ...settings,
        projectId,
        // userId: userId from Clerk
      };
      
      setGenerationStatus('Sending request to server...');
      setGenerationProgress(10);
      
      // Make API call
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }
      
      setGenerationStatus('Processing image...');
      setGenerationProgress(30);
      
      // For now, simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate a successful render
      const mockRender: Render = {
        id: crypto.randomUUID(),
        projectId: projectId || 'mock-project',
        userId: 'mock-user',
        sourceImage: {
          url: settings.sourceImageUrl,
          width: 800,
          height: 600
        },
        outputImages: [{
          url: settings.sourceImageUrl, // In real app, this would be the generated image
          width: 800,
          height: 600
        }],
        settings,
        provider: 'replicate',
        modelId: 'stability-ai/sdxl',
        predictionId: 'mock-prediction-id',
        status: 'succeeded',
        creditsUsed: 5,
        generationTime: 2000,
        isFavorite: false,
        isPublic: false,
        createdAt: new Date(),
        completedAt: new Date()
      };
      
      setCurrentRender(mockRender);
      setRenderHistory(prev => [...prev, mockRender]);
      setGenerationProgress(100);
      setGenerationStatus('Generation complete!');
      
      // Update editor store if it has setRender method
      if (editorStore && typeof (editorStore as any).setRender === 'function') {
        (editorStore as any).setRender(mockRender);
      }
      
      showToast('Generation Complete', 'Your image has been generated successfully.');
      
      return mockRender;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        showToast('Generation Cancelled', 'The generation was cancelled by the user.');
      } else {
        console.error('Generation error:', error);
        showToast('Generation Failed', error.message || 'Failed to generate image. Please try again.', 'destructive');
      }
      return null;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('');
      abortControllerRef.current = null;
    }
  }, [projectId, editorStore]);
  
  // Generate from image
  const generateFromImage = useCallback(async (imageUrl: string, mode: TransformationMode): Promise<Render | null> => {
    const editorState = editorStore as any;
    const settings: GenerationSettings = {
      mode,
      styleId: editorState.style?.id || 'modern',
      roomTypeId: editorState.roomType?.id || 'living-room',
      prompt: editorState.prompt || '',
      negativePrompt: editorState.negativePrompt || '',
      strength: editorState.strength || 0.75,
      guidanceScale: editorState.guidanceScale || 7.5,
      seed: editorState.seed,
      numberOfOutputs: editorState.numberOfOutputs || 1,
      sourceImageUrl: imageUrl
    };
    
    return generate(settings);
  }, [editorStore, generate]);
  
  // Generate inpainting
  const generateInpaint = useCallback(async (imageUrl: string, maskUrl: string, prompt: string): Promise<Render | null> => {
    const editorState = editorStore as any;
    const settings: GenerationSettings = {
      mode: 'inpaint',
      styleId: editorState.style?.id || 'modern',
      roomTypeId: editorState.roomType?.id || 'living-room',
      prompt,
      negativePrompt: editorState.negativePrompt || '',
      strength: editorState.strength || 0.75,
      guidanceScale: editorState.guidanceScale || 7.5,
      seed: editorState.seed,
      numberOfOutputs: editorState.numberOfOutputs || 1,
      sourceImageUrl: imageUrl,
      maskUrl
    };
    
    return generate(settings);
  }, [editorStore, generate]);
  
  // Generate object removal
  const generateObjectRemoval = useCallback(async (imageUrl: string, maskUrl: string): Promise<Render | null> => {
    const editorState = editorStore as any;
    const settings: GenerationSettings = {
      mode: 'remove-object',
      styleId: editorState.style?.id || 'modern',
      roomTypeId: editorState.roomType?.id || 'living-room',
      prompt: '',
      negativePrompt: editorState.negativePrompt || '',
      strength: editorState.strength || 0.75,
      guidanceScale: editorState.guidanceScale || 7.5,
      seed: editorState.seed,
      numberOfOutputs: editorState.numberOfOutputs || 1,
      sourceImageUrl: imageUrl,
      maskUrl
    };
    
    return generate(settings);
  }, [editorStore, generate]);
  
  // Generate object replacement
  const generateObjectReplacement = useCallback(async (imageUrl: string, maskUrl: string, replacementPrompt: string): Promise<Render | null> => {
    const editorState = editorStore as any;
    const settings: GenerationSettings = {
      mode: 'replace-object',
      styleId: editorState.style?.id || 'modern',
      roomTypeId: editorState.roomType?.id || 'living-room',
      prompt: replacementPrompt,
      negativePrompt: editorState.negativePrompt || '',
      strength: editorState.strength || 0.75,
      guidanceScale: editorState.guidanceScale || 7.5,
      seed: editorState.seed,
      numberOfOutputs: editorState.numberOfOutputs || 1,
      sourceImageUrl: imageUrl,
      maskUrl
    };
    
    return generate(settings);
  }, [editorStore, generate]);
  
  // Generate material change
  const generateMaterialChange = useCallback(async (imageUrl: string, maskUrl: string, materialId: string): Promise<Render | null> => {
    const editorState = editorStore as any;
    const settings: GenerationSettings = {
      mode: 'change-material',
      styleId: editorState.style?.id || 'modern',
      roomTypeId: editorState.roomType?.id || 'living-room',
      prompt: '',
      negativePrompt: editorState.negativePrompt || '',
      strength: editorState.strength || 0.75,
      guidanceScale: editorState.guidanceScale || 7.5,
      seed: editorState.seed,
      numberOfOutputs: editorState.numberOfOutputs || 1,
      sourceImageUrl: imageUrl,
      maskUrl,
      materialId
    };
    
    return generate(settings);
  }, [editorStore, generate]);
  
  // Generate color change
  const generateColorChange = useCallback(async (imageUrl: string, maskUrl: string, colorHex: string): Promise<Render | null> => {
    const editorState = editorStore as any;
    const settings: GenerationSettings = {
      mode: 'change-color',
      styleId: editorState.style?.id || 'modern',
      roomTypeId: editorState.roomType?.id || 'living-room',
      prompt: '',
      negativePrompt: editorState.negativePrompt || '',
      strength: editorState.strength || 0.75,
      guidanceScale: editorState.guidanceScale || 7.5,
      seed: editorState.seed,
      numberOfOutputs: editorState.numberOfOutputs || 1,
      sourceImageUrl: imageUrl,
      maskUrl,
      colorHex
    };
    
    return generate(settings);
  }, [editorStore, generate]);
  
  // Generate style transfer
  const generateStyleTransfer = useCallback(async (imageUrl: string, styleId: string): Promise<Render | null> => {
    const editorState = editorStore as any;
    const settings: GenerationSettings = {
      mode: 'style-transfer',
      styleId,
      roomTypeId: editorState.roomType?.id || 'living-room',
      prompt: editorState.prompt || '',
      negativePrompt: editorState.negativePrompt || '',
      strength: editorState.strength || 0.75,
      guidanceScale: editorState.guidanceScale || 7.5,
      seed: editorState.seed,
      numberOfOutputs: editorState.numberOfOutputs || 1,
      sourceImageUrl: imageUrl
    };
    
    return generate(settings);
  }, [editorStore, generate]);
  
  // Queue management
  const addToQueue = useCallback((settings: GenerationSettings): string => {
    const id = crypto.randomUUID();
    const queueItem = {
      id,
      settings,
      status: 'pending',
      addedAt: new Date()
    };
    
    setRenderQueue(prev => [...prev, queueItem]);
    return id;
  }, []);
  
  const removeFromQueue = useCallback((id: string) => {
    setRenderQueue(prev => prev.filter(item => item.id !== id));
  }, []);
  
  const clearQueue = useCallback(() => {
    setRenderQueue([]);
  }, []);
  
  const processQueue = useCallback(async () => {
    const pendingItems = renderQueue.filter(item => item.status === 'pending');
    
    for (const item of pendingItems) {
      try {
        // Update status to processing
        setRenderQueue(prev => 
          prev.map(q => q.id === item.id ? { ...q, status: 'processing' } : q)
        );
        
        // Process the item
        const result = await generate(item.settings);
        
        // Update status based on result
        setRenderQueue(prev => 
          prev.map(q => q.id === item.id ? { 
            ...q, 
            status: result ? 'completed' : 'failed',
            result,
            completedAt: new Date()
          } : q)
        );
      } catch (error) {
        setRenderQueue(prev => 
          prev.map(q => q.id === item.id ? { 
            ...q, 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          } : q)
        );
      }
    }
  }, [renderQueue, generate]);
  
  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('Cancelled');
    }
  }, []);
  
  // Retry generation
  const retryGeneration = useCallback(async (renderId: string): Promise<Render | null> => {
    const render = renderHistory.find(r => r.id === renderId);
    if (!render) return null;
    
    // Retry with the same settings
    return generate(render.settings);
  }, [renderHistory, generate]);
  
  // Estimate credits
  const estimateCredits = useCallback((mode: TransformationMode): number => {
    const creditMap: Record<TransformationMode, number> = {
      'redesign': 5,
      'fill-room': 3,
      'outdoor': 4,
      'sketch-to-render': 6,
      'enhance': 2,
      'inpaint': 3,
      'remove-object': 2,
      'replace-object': 3,
      'change-material': 2,
      'change-color': 1,
      'declutter': 3,
      'staging': 4,
      'lighting': 2,
      'seasonal': 3,
      'style-transfer': 4,
      'floor-plan-3d': 8
    };
    
    return creditMap[mode] || 3;
  }, []);
  
  // Estimate time
  const estimateTime = useCallback((mode: TransformationMode): number => {
    const timeMap: Record<TransformationMode, number> = {
      'redesign': 45,
      'fill-room': 30,
      'outdoor': 40,
      'sketch-to-render': 60,
      'enhance': 20,
      'inpaint': 30,
      'remove-object': 25,
      'replace-object': 35,
      'change-material': 20,
      'change-color': 15,
      'declutter': 30,
      'staging': 40,
      'lighting': 25,
      'seasonal': 30,
      'style-transfer': 35,
      'floor-plan-3d': 90
    };
    
    return timeMap[mode] || 30;
  }, []);
  
  // Other methods
  const getHistory = useCallback((): Render[] => {
    return renderHistory;
  }, [renderHistory]);
  
  const getRenderById = useCallback((id: string): Render | null => {
    return renderHistory.find(render => render.id === id) || null;
  }, [renderHistory]);
  
  const deleteRender = useCallback(async (id: string): Promise<void> => {
    setRenderHistory(prev => prev.filter(render => render.id !== id));
  }, []);
  
  const favoriteRender = useCallback(async (id: string): Promise<void> => {
    setRenderHistory(prev => 
      prev.map(render => 
        render.id === id ? { ...render, isFavorite: !render.isFavorite } : render
      )
    );
  }, []);
  
  const exportRender = useCallback(async (renderId: string, format: 'png' | 'jpg' | 'webp', quality?: number): Promise<string | null> => {
    const render = getRenderById(renderId);
    if (!render || !render.outputImages[0]) return null;
    
    // In a real app, you would generate an export
    return render.outputImages[0].url;
  }, [getRenderById]);
  
  const exportWithWatermark = useCallback(async (renderId: string): Promise<string | null> => {
    return exportRender(renderId, 'png');
  }, [exportRender]);
  
  return {
    // State
    isGenerating,
    generationProgress,
    generationStatus,
    currentRender,
    renderQueue,
    
    // Generation methods
    generate,
    generateFromImage,
    generateInpaint,
    generateObjectRemoval,
    generateObjectReplacement,
    generateMaterialChange,
    generateColorChange,
    generateStyleTransfer,
    
    // Queue management
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    
    // History
    getHistory,
    getRenderById,
    deleteRender,
    favoriteRender,
    
    // Export
    exportRender,
    exportWithWatermark,
    
    // Utility
    cancelGeneration,
    retryGeneration,
    estimateCredits,
    estimateTime
  };
}