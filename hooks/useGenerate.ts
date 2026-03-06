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

      // Prepare request body
      const requestBody = {
        ...settings,
        projectId,
      };

      setGenerationStatus('Sending request to AI...');
      setGenerationProgress(10);

      // Make API call
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          toast.error('Please sign in to generate images');
          return null;
        }
        if (response.status === 402) {
          toast.error('Insufficient credits', { description: data.message || `You need ${data.creditsRequired} credits` });
          return null;
        }
        if (response.status === 503) {
          toast.error('AI service unavailable', { description: data.message || 'Please try again later' });
          return null;
        }
        throw new Error(data.message || data.error || `Generation failed: ${response.statusText}`);
      }

      setGenerationStatus('AI is processing your image...');
      setGenerationProgress(30);

      // Poll for render completion
      const renderIds: string[] = data.renderIds || [];
      const firstRenderId = renderIds[0];

      if (!firstRenderId) {
        throw new Error('No render ID returned from server');
      }

      // Poll for status updates
      let render: any = null;
      let attempts = 0;
      const maxAttempts = 60; // 3 minutes max (60 * 3 seconds)

      while (attempts < maxAttempts) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;

        try {
          const statusResponse = await fetch(`/api/generate?renderId=${firstRenderId}`, {
            signal: abortControllerRef.current?.signal,
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            render = statusData.render;

            if (render?.status === 'completed') {
              setGenerationProgress(100);
              setGenerationStatus('Generation complete!');
              break;
            } else if (render?.status === 'failed') {
              throw new Error(render.error || 'AI generation failed');
            }
          }
        } catch (pollError: any) {
          if (pollError.name === 'AbortError') throw pollError;
          console.warn('Poll error (retrying):', pollError.message);
        }

        // Update progress (30-90% range during processing)
        const progressPercent = Math.min(30 + (attempts / maxAttempts) * 60, 90);
        setGenerationProgress(progressPercent);
      }

      if (!render || render.status !== 'completed') {
        throw new Error('Generation timed out. Check your renders page for results.');
      }

      // Build the Render object from API response
      const completedRender: Render = {
        id: render._id || firstRenderId,
        projectId: projectId || '',
        userId: render.userId || '',
        sourceImage: {
          url: settings.sourceImageUrl,
          width: 800,
          height: 600
        },
        outputImages: [{
          url: render.outputImage || render.resultUrl || '',
          width: 800,
          height: 600
        }],
        settings,
        provider: 'replicate',
        modelId: render.mode || 'stability-ai/sdxl',
        predictionId: render.predictionId || '',
        status: 'succeeded',
        creditsUsed: data.creditsUsed || 1,
        generationTime: render.processingTime || 0,
        isFavorite: false,
        isPublic: false,
        createdAt: new Date(render.createdAt || Date.now()),
        completedAt: new Date(render.completedAt || Date.now())
      };

      setCurrentRender(completedRender);
      setRenderHistory(prev => [...prev, completedRender]);

      // Update editor store if it has setRender method
      if (editorStore && typeof (editorStore as any).setRender === 'function') {
        (editorStore as any).setRender(completedRender);
      }

      toast.success('Generation Complete', { description: 'Your image has been generated successfully.' });

      return completedRender;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info('Generation cancelled');
      } else {
        console.error('Generation error:', error);
        toast.error('Generation Failed', { description: error.message || 'Failed to generate image. Please try again.' });
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