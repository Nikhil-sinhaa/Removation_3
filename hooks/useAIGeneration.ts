"use client";

import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface GenerateParams {
    imageUrl: string;
    mode: string;
    style: string;
    roomType: string;
    settings: {
        creativity: number;
        preserveStructure: boolean;
        enhanceDetails: boolean;
        colorIntensity: number;
        lightingMode: string;
    };
    projectId?: string;
    numberOfVariations?: number;
}

interface RenderResult {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    imageUrl?: string;
    error?: string;
}

export function useAIGeneration() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentRenderIds, setCurrentRenderIds] = useState<string[]>([]);
    const { user, isLoading } = useAuth();
    const userId = user?.id || user?._id || user?.clerkId || "";
    const isLoaded = !isLoading;

    const generateDesign = useCallback(async (params: GenerateParams) => {
        if (!isLoaded || !userId) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to generate designs.",
                variant: "destructive",
            });
            return null;
        }

        if (!params.imageUrl) {
            toast({
                title: "Missing Image",
                description: "Please upload an image first.",
                variant: "destructive",
            });
            return null;
        }

        setIsGenerating(true);
        setCurrentRenderIds([]);

        try {
            // 1. Initiate Generation
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl: params.imageUrl,
                    mode: params.mode,
                    style: params.style,
                    roomType: params.roomType,
                    settings: {
                        creativity: params.settings.creativity,
                        preserveLayout: params.settings.preserveStructure,
                        enhanceQuality: params.settings.enhanceDetails,
                        lighting: params.settings.lightingMode,
                    },
                    projectId: params.projectId,
                    numberOfVariations: params.numberOfVariations || 1,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || "Generation failed");
            }

            const renderIds = data.renderIds;
            setCurrentRenderIds(renderIds);

            toast({
                title: "Generation Started",
                description: "Your design is being created. This usually takes 15-30 seconds.",
            });

            return renderIds;

        } catch (error: any) {
            console.error("Generation error:", error);
            toast({
                title: "Generation Failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
            setIsGenerating(false);
            return null;
        }
    }, [userId, isLoaded]);

    // Polling function to check status
    const checkStatus = useCallback(async (renderIds: string[]) => {
        try {
            // In a real implementation with multiple IDs, we'd check all or batch
            // For MVP we'll check the first one or assume all complete together
            const results: RenderResult[] = [];
            let isComplete = true;

            for (const id of renderIds) {
                const response = await fetch(`/api/generate?renderId=${id}`);
                if (response.ok) {
                    const data = await response.json();
                    const render = data.render;

                    results.push({
                        id: render._id,
                        status: render.status,
                        imageUrl: render.outputImage,
                        error: render.error
                    });

                    if (render.status === 'processing' || render.status === 'starting') {
                        isComplete = false;
                    }
                }
            }

            if (isComplete) {
                setIsGenerating(false);
                // Dispatch completion event or callback
            }

            return { isComplete, results };
        } catch (error) {
            console.error("Status check error:", error);
            return { isComplete: false, results: [] };
        }
    }, []);

    return {
        generateDesign,
        isGenerating,
        currentRenderIds,
        checkStatus
    };
}
