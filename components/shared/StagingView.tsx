'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { Loader2, Sparkles, Sliders } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export function StagingView() {
    const { toast } = useToast();
    const router = useRouter();

    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [stagedImage, setStagedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [sliderMode, setSliderMode] = useState(true);

    const handleGenerate = async () => {
        if (!originalImage) {
            toast({
                title: 'Image Required',
                description: 'Please upload an empty room image first.',
                variant: 'destructive',
            });
            return;
        }

        if (!prompt.trim()) {
            toast({
                title: 'Prompt Required',
                description: 'Please enter a description for the staging.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        setStagedImage(null);

        try {
            const response = await fetch('/api/staging', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: originalImage,
                    prompt,
                    roomType: 'room', // Optional: could be dynamic
                    style: 'modern',  // Optional: could be dynamic
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to generate staging');
            }

            setStagedImage(data.outputImage || data.imageUrl);
            toast({
                title: 'Staging Complete',
                description: 'Your room has been successfully staged!',
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: 'Generation Failed',
                description: error.message || 'Something went wrong',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        setOriginalImage(null);
        setStagedImage(null);
        setPrompt('');
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row gap-6">

                {/* Left Side: Controls */}
                <div className="w-full md:w-1/3 space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                            Virtual Staging
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Upload an empty room photo and describe the furniture you want to add.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">1. Upload Image</h3>
                        {!originalImage ? (
                            <div className="h-48 border-2 border-dashed rounded-xl overflow-hidden hover:bg-muted/50 transition-colors">
                                <ImageUploader
                                    onUpload={(url: string) => setOriginalImage(url)}
                                />
                            </div>
                        ) : (
                            <div className="relative h-48 rounded-xl overflow-hidden border">
                                <img src={originalImage} alt="Original Room" className="w-full h-full object-cover" />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="absolute top-2 right-2 text-xs"
                                    onClick={handleReset}
                                >
                                    Change Image
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">2. Describe the Staging</h3>
                        <Textarea
                            placeholder="E.g., A modern living room with a grey sectional sofa, a glass coffee table, and an indoor plant by the window."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="resize-none h-32"
                        />
                    </div>

                    <Button
                        className="w-full h-12 text-md gap-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        onClick={handleGenerate}
                        disabled={!originalImage || isGenerating || !prompt.trim()}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Stage Room (2 Credits)
                            </>
                        )}
                    </Button>
                </div>

                {/* Right Side: Preview / Comparison */}
                <div className="w-full md:w-2/3 h-[600px] bg-muted/30 border rounded-2xl overflow-hidden relative flex flex-col items-center justify-center shadow-sm">
                    {!originalImage ? (
                        <div className="text-center p-8 space-y-4 text-muted-foreground">
                            <Sparkles className="w-12 h-12 mx-auto opacity-20" />
                            <p>Upload an empty room to see the magic happen.</p>
                        </div>
                    ) : isGenerating ? (
                        <div className="text-center p-8 space-y-6">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-pulse" />
                            </div>
                            <p className="text-lg font-medium text-foreground animate-pulse">
                                Furnishing your room...
                            </p>
                            <p className="text-sm text-muted-foreground">This usually takes 10-15 seconds.</p>
                        </div>
                    ) : stagedImage ? (
                        <div className="w-full h-full relative group">
                            {sliderMode ? (
                                <ReactCompareSlider
                                    itemOne={<ReactCompareSliderImage src={originalImage} alt="Before" />}
                                    itemTwo={<ReactCompareSliderImage src={stagedImage} alt="After" />}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img src={stagedImage} alt="Staged Room" className="w-full h-full object-contain bg-black/5" />
                            )}

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="gap-2 shadow-xl"
                                    onClick={() => setSliderMode(!sliderMode)}
                                >
                                    <Sliders className="w-4 h-4" />
                                    {sliderMode ? 'View Full Image' : 'Compare Before/After'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full p-4">
                            <img src={originalImage} alt="Original Room" className="w-full h-full object-contain rounded-xl" />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
