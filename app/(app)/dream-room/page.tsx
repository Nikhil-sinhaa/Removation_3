"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CompareSlider from "@/components/shared/compare-slider";
import { ImageUploader } from "@/components/shared/ImageUploader";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Download, Loader2, Sparkles, Wand2 } from "lucide-react";
import { saveAs } from "file-saver";

// Extracted from original utils/dropdownTypes.ts
const themes = [
    "Modern",
    "Vintage",
    "Minimalist",
    "Professional",
    "Tropical",
    "Industrial",
    "Neoclassic",
];

const rooms = [
    "Living Room",
    "Dining Room",
    "Bedroom",
    "Bathroom",
    "Office",
    "Gaming Room",
    "Guest Room",
];

interface StepIconProps {
    step: number;
    title: string;
}

function StepIcon({ step, title }: StepIconProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="bg-violet-600 rounded-full flex justify-center items-center w-8 h-8 shadow-md">
                <p className="text-white font-bold">{step}</p>
            </div>
            <h3 className="text-lg font-semibold md:text-xl text-gray-800"> {title}</h3>
        </div>
    );
}

export default function DreamRoomPage() {
    const [imageUrl, setImageUrl] = useState<string>("");
    const [theme, setTheme] = useState<string>("Modern");
    const [room, setRoom] = useState<string>("Living Room");

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [resultImageUrl, setResultImageUrl] = useState<string>("");
    const [isCompare, setIsCompare] = useState<boolean>(true);

    const { toast } = useToast();

    const handleGenerate = async () => {
        setResultImageUrl("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/dream-room", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ imageUrl, theme, room }),
            });

            const data = await res.json();

            if (res.ok && data.imageUrl) {
                // Next.js Image component needs string URLs
                // Wait briefly for Replicate image URL to be fully available
                await new Promise((resolve) => setTimeout(resolve, 500));
                setResultImageUrl(data.imageUrl);
                toast({
                    title: "Success",
                    description: "Dream room generated successfully!",
                });
            } else {
                console.error("Failed to generate image:", data.error);
                toast({
                    title: "Generation Failed",
                    description: data.error || "Something went wrong, please try again later.",
                    variant: "destructive",
                });
            }
        } catch (e) {
            console.error("Network or parsing error", e);
            toast({
                title: "Error",
                description: "Failed to connect to the generation service. Check your API key.",
                variant: "destructive",
            });
        }

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-5xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Wand2 className="w-8 h-8 text-violet-600" />
                    Generate Your Dream Room
                </h1>
                <p className="text-gray-500">
                    Upload a photo of your current room, select a theme and room type, and let AI remaster it in seconds.
                </p>
            </div>

            <div className="flex-1 space-y-12 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                {/* Step 1 */}
                <div className="flex flex-col gap-6 items-center">
                    <StepIcon step={1} title="Choose your room theme" />
                    <Select
                        value={theme}
                        onValueChange={setTheme}
                    >
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="--- Select Theme ---" />
                        </SelectTrigger>
                        <SelectContent>
                            {themes.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col gap-6 items-center">
                    <StepIcon step={2} title="Choose your room type" />
                    <Select
                        value={room}
                        onValueChange={setRoom}
                    >
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="--- Select Room ---" />
                        </SelectTrigger>
                        <SelectContent>
                            {rooms.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col gap-6 items-center">
                    <StepIcon step={3} title="Upload a picture of your room" />
                    <div className="w-full max-w-[600px]">
                        <ImageUploader
                            onUpload={(url) => setImageUrl(url)}
                            onRemove={() => setImageUrl("")}
                            currentImage={imageUrl}
                            aspectRatio="video"
                        />
                    </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center mt-12 pt-8 border-t border-gray-100">
                    <Button
                        disabled={!imageUrl || !theme || !room || isLoading}
                        className="w-full max-w-[400px] h-14 text-lg bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md shadow-violet-200"
                        onClick={handleGenerate}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin w-5 h-5 mr-2" />
                        ) : (
                            <Sparkles className="w-5 h-5 mr-2" />
                        )}
                        {isLoading ? "Generating (~20 seconds)..." : "Generate Dream Room"}
                    </Button>
                </div>

                {/* Results */}
                {resultImageUrl && (
                    <div className="w-full flex flex-col items-center justify-center mt-12 pt-8 border-t border-gray-100">
                        <div className="w-full max-w-[800px]">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Your remastered {room.toLowerCase()}
                                    </h3>
                                    <p className="text-gray-500 text-sm">Theme: {theme}</p>
                                </div>

                                <div className="flex gap-6 items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                    <div className="flex gap-2 items-center">
                                        <Switch
                                            checked={isCompare}
                                            onCheckedChange={setIsCompare}
                                            id="compare-mode"
                                        />
                                        <label htmlFor="compare-mode" className="text-sm font-medium text-gray-700 cursor-pointer">Compare</label>
                                    </div>
                                    <div className="w-px h-6 bg-gray-200" />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                        onClick={() => {
                                            saveAs(resultImageUrl, "dream-room.png");
                                        }}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>

                            <div className="w-full relative rounded-xl overflow-hidden border-2 border-gray-100 shadow-lg bg-gray-50" style={{ height: '500px' }}>
                                {!isCompare && (
                                    <Image
                                        src={resultImageUrl}
                                        alt="Restored Image"
                                        fill
                                        style={{
                                            objectFit: "cover",
                                        }}
                                        unoptimized={true} // Replicate images are external
                                    />
                                )}
                                {isCompare && (
                                    <CompareSlider
                                        firstImage={imageUrl}
                                        secondImage={resultImageUrl}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
