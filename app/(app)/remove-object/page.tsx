"use client";

import React, { useState } from "react";
import MaskCanvas from "@/components/editor/MaskCanvas";
import { UploadDropzone } from "@/lib/uploadthing";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { CopyX, Sparkles, Download } from "lucide-react";

export default function ObjectRemovalPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);

  const handleErase = async ({ imageBase64, maskBase64 }: { imageBase64: string, maskBase64: string }) => {
    try {
      setIsProcessing(true);
      setErrorMSG(null);
      setResultImage(null);

      const res = await fetch("/api/editor/remove-object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, maskBase64 })
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to remove object");
      }

      setResultImage(data.imageUrl);
      
    } catch (e: any) {
      console.error(e);
      setErrorMSG(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImageUrl(null);
    setResultImage(null);
    setErrorMSG(null);
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="mb-8 text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight inline-flex items-center gap-3">
          <CopyX className="w-10 h-10 text-primary" />
          AI Object Remover
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Brush over unwanted objects, people, or furniture to magically erase them from your room using our local AI.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6 min-h-[500px] flex flex-col items-center justify-center">
        
        {/* Step 1: Upload */}
        {!imageUrl && (
          <div className="w-full max-w-md">
            <UploadDropzone
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  setImageUrl(res[0].url);
                }
              }}
              onUploadError={(error: Error) => {
                setErrorMSG(`Upload failed: ${error.message}`);
              }}
              className="ut-label:text-primary ut-button:bg-primary ut-button:ut-readying:bg-primary/50 border-2 border-dashed border-gray-200 rounded-xl"
            />
          </div>
        )}

        {/* Error Banner */}
        {errorMSG && (
          <div className="w-full bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6 font-medium">
            {errorMSG}
          </div>
        )}

        {/* Step 2: Draw & Remove */}
        {imageUrl && !resultImage && (
          <div className="w-full animate-in fade-in zoom-in duration-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> 
                Draw over the object to remove
              </h3>
              <Button variant="ghost" size="sm" onClick={handleReset}>Use different photo</Button>
            </div>
            
            <MaskCanvas 
              imageUrl={imageUrl} 
              onErase={handleErase} 
              isLoading={isProcessing} 
            />
          </div>
        )}

        {/* Step 3: Result */}
        {resultImage && (
          <div className="w-full animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> 
                Object removed successfully!
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setResultImage(null)}>
                Edit Again
              </Button>
            </div>
            
            <div className="rounded-xl overflow-hidden border">
              <img src={resultImage} alt="Cleaned result" className="w-full h-auto max-h-[70vh] object-contain bg-gray-100" />
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={handleReset} variant="outline" size="lg">
                Start Over
              </Button>
              <Button size="lg" asChild>
                <a href={resultImage} download="cleaned-room.png">
                  <Download className="w-5 h-5 mr-2" /> Download Image
                </a>
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
