"use client";
import { Button } from "@/components/ui/button";
import CompareSlider from "@/components/shared/compare-slider";
import Link from "next/link";
import { Download, Loader2, Palette } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ImageUploader } from "@/components/shared/ImageUploader";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { saveAs } from "file-saver";

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

export default function ColorVisualizerPage() {
    const [imageUrl, setImageUrl] = useState<string>("");
    const [area, setArea] = useState<"wall" | "ceiling" | "floor">("wall");
    const [color, setColor] = useState<string>("#0543F5");

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [resultImageUrl, setResultImageUrl] = useState<string>("");
    const [isCompare, setIsCompare] = useState<boolean>(true);

    const { toast } = useToast();

    const handleGenerate = async () => {
        setResultImageUrl("");
        setIsLoading(true);

        try {
            const res = await axios.post("/api/color-visualizer", {
                imageUrl,
                area,
                color,
            });

            if (res.status === 200 && res.data.imageUrl) {
                setResultImageUrl(res.data.imageUrl);
                toast({
                    title: "Success",
                    description: "Room color updated successfully!",
                });
            } else {
                console.error("Failed to generate image");
                toast({
                    title: "Generation Failed",
                    description: "Something went wrong, please try again later.",
                    variant: "destructive"
                });
            }
        } catch {
            console.error("Failed to generate image");
            toast({
                title: "Generation Failed",
                description: "Something went wrong, please check your API key and try again.",
                variant: "destructive"
            });
        }

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-5xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Palette className="w-8 h-8 text-violet-600" />
                    Room Color Visualizer
                </h1>
                <p className="text-gray-500">
                    Instantly visualize new wall, floor, or ceiling colors in your space using AI.
                </p>
            </div>

            <div className="flex-1 space-y-12 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                {/* Step 1 */}
                <div className="flex flex-col gap-6 items-center">
                    <StepIcon step={1} title="Upload your room image" />
                    <div className="w-full max-w-[600px]">
                        <ImageUploader
                            onUpload={(url) => setImageUrl(url)}
                            onRemove={() => setImageUrl("")}
                            currentImage={imageUrl}
                            aspectRatio="video"
                        />
                    </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col gap-6 items-center">
                    <StepIcon step={2} title="Select area to change the color" />
                    <Select
                        value={area}
                        onValueChange={(v: "wall" | "floor" | "ceiling") => {
                            setArea(v);
                        }}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="--- choose your area ---" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="wall">Wall</SelectItem>
                            <SelectItem value="floor">Floor</SelectItem>
                            <SelectItem value="ceiling">Ceiling</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col gap-6 items-center">
                    <StepIcon step={3} title="Choose the color" />
                    <div className="flex items-center gap-4">
                        <div
                            className="w-10 h-10 rounded-full border border-gray-200 shadow-sm"
                            style={{ backgroundColor: color }}
                        />
                        <Input
                            className="w-[120px] font-mono"
                            placeholder="#HEX color"
                            type="text"
                            value={color}
                            onChange={(e) =>
                                setColor(
                                    e.target.value[0] === "#"
                                        ? e.target.value.slice(0, 7)
                                        : `#${e.target.value.slice(0, 6)}`
                                )
                            }
                        />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <HexColorPicker color={color} onChange={setColor} />
                    </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center mt-12 pt-8 border-t border-gray-100">
                    <Button
                        disabled={!imageUrl || !area || !color || isLoading}
                        className="w-full max-w-[400px] h-14 text-lg bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md shadow-violet-200"
                        onClick={handleGenerate}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin w-5 h-5 mr-2" />
                        ) : (
                            <Palette className="w-5 h-5 mr-2" />
                        )}
                        {isLoading ? "Generating (~30 seconds)..." : "Visualize Color"}
                    </Button>
                </div>

                {/* Results */}
                {resultImageUrl && (
                    <div className="w-full flex flex-col items-center justify-center mt-12 pt-8 border-t border-gray-100">
                        <div className="w-full max-w-[800px]">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    Result
                                </h3>
                                <div className="flex gap-6 items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                    <div className="flex gap-2 items-center">
                                        <Switch
                                            checked={isCompare}
                                            onCheckedChange={setIsCompare}
                                            id="compare-mode"
                                        />
                                        <label htmlFor="compare-mode" className="text-sm font-medium text-gray-700 cursor-pointer">Compare Mode</label>
                                    </div>
                                    <div className="w-px h-6 bg-gray-200" />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                        onClick={() => {
                                            saveAs(resultImageUrl, "removation-color-result.png");
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
                                        alt="Result Image"
                                        fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        style={{
                                            objectFit: "contain",
                                        }}
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

// Needed for Lucide icon in result
import { CheckCircle2 } from "lucide-react";
