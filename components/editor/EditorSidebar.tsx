// components/editor/EditorSidebar.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Palette,
  Home,
  Wand2,
  Layers,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  IndianRupee,
  Compass,
  SlidersHorizontal,
  Image,
  Paintbrush,
  Sun,
  Lightbulb,
  Sofa,
  BedDouble,
  UtensilsCrossed,
  Bath,
  Briefcase,
  TreePine,
  Building,
  ArrowUpRight,
  Check,
  Lock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VastuPanel } from "./VastuPanel";
import { CostPanel } from "./CostPanel";
import { useAIGeneration } from "@/hooks/useAIGeneration";
import { Loader2 } from "lucide-react";

interface StyleOption {
  id: string;
  name: string;
  preview: string;
  category: string;
  isPro?: boolean;
}

interface RoomType {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface EditorSidebarProps {
  selectedStyle: string | null;
  onStyleSelect: (styleId: string) => void;
  selectedRoomType: string | null;
  onRoomTypeSelect: (roomTypeId: string) => void;
  settings: {
    preserveStructure: boolean;
    enhanceDetails: boolean;
    creativityLevel: number;
    colorIntensity: number;
    lightingMode: string;
  };
  onSettingsChange: (settings: any) => void;
  showVastu?: boolean;
  onToggleVastu?: () => void;
  showCost?: boolean;
  onToggleCost?: () => void;
  isPro?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  currentImageUrl?: string;
  projectId?: string;
  onGenerateComplete?: (results: any[]) => void;
}

const roomTypes: RoomType[] = [
  { id: "living-room", name: "Living Room", icon: <Sofa className="w-4 h-4" /> },
  { id: "bedroom", name: "Bedroom", icon: <BedDouble className="w-4 h-4" /> },
  { id: "kitchen", name: "Kitchen", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "bathroom", name: "Bathroom", icon: <Bath className="w-4 h-4" /> },
  { id: "office", name: "Office", icon: <Briefcase className="w-4 h-4" /> },
  { id: "outdoor", name: "Outdoor", icon: <TreePine className="w-4 h-4" /> },
  { id: "commercial", name: "Commercial", icon: <Building className="w-4 h-4" /> },
];

const styleCategories = [
  "Modern",
  "Traditional",
  "Minimalist",
  "Industrial",
  "Scandinavian",
  "Bohemian",
  "Coastal",
  "Farmhouse",
  "Art Deco",
  "Mid-Century",
];

// Sample styles (in real app, import from constants/styles-400.ts)
const sampleStyles: StyleOption[] = [
  { id: "modern-1", name: "Modern Minimalist", preview: "/images/styles/modern-1.jpg", category: "Modern" },
  { id: "modern-2", name: "Modern Luxury", preview: "/images/styles/modern-2.jpg", category: "Modern", isPro: true },
  { id: "scandinavian-1", name: "Nordic White", preview: "/images/styles/scandi-1.jpg", category: "Scandinavian" },
  { id: "industrial-1", name: "Urban Loft", preview: "/images/styles/industrial-1.jpg", category: "Industrial" },
  { id: "traditional-1", name: "Classic Elegance", preview: "/images/styles/traditional-1.jpg", category: "Traditional" },
  { id: "bohemian-1", name: "Boho Chic", preview: "/images/styles/boho-1.jpg", category: "Bohemian", isPro: true },
  { id: "coastal-1", name: "Beach House", preview: "/images/styles/coastal-1.jpg", category: "Coastal" },
  { id: "minimalist-1", name: "Zen Simplicity", preview: "/images/styles/minimal-1.jpg", category: "Minimalist" },
];

const lightingModes = [
  { id: "natural", name: "Natural Light", icon: <Sun className="w-4 h-4" /> },
  { id: "warm", name: "Warm Ambient", icon: <Lightbulb className="w-4 h-4" /> },
  { id: "cool", name: "Cool White", icon: <Lightbulb className="w-4 h-4" /> },
  { id: "dramatic", name: "Dramatic", icon: <Lightbulb className="w-4 h-4" /> },
];

export default function EditorSidebar({
  selectedStyle,
  onStyleSelect,
  selectedRoomType,
  onRoomTypeSelect,
  settings,
  onSettingsChange,
  showVastu = false,
  onToggleVastu,
  showCost = false,
  onToggleCost,
  isPro = false,
  isCollapsed = false,
  onToggleCollapse,
  className,
  currentImageUrl,
  projectId,
  onGenerateComplete
}: EditorSidebarProps) {
  const [activeTab, setActiveTab] = useState("style");

  // Switch to Vastu tab when enabled
  React.useEffect(() => {
    if (showVastu) {
      setActiveTab("vastu");
    } else if (showCost) {
      setActiveTab("cost");
    }
  }, [showVastu, showCost]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Modern"]);

  const { generateDesign, isGenerating } = useAIGeneration();

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleGenerate = async () => {
    if (!selectedStyle || !selectedRoomType) return;

    // Find the full style object
    const styleObj = sampleStyles.find(s => s.id === selectedStyle);

    const renderIds = await generateDesign({
      imageUrl: currentImageUrl || "",
      mode: "redesign", // Default mode, can be enhanced to be dynamic
      style: styleObj?.name || "Modern",
      roomType: selectedRoomType,
      settings: {
        creativity: settings.creativityLevel,
        preserveStructure: settings.preserveStructure,
        enhanceDetails: settings.enhanceDetails,
        colorIntensity: settings.colorIntensity,
        lightingMode: settings.lightingMode
      },
      projectId: projectId
    });

    if (renderIds && onGenerateComplete) {
      // In a real app we'd start polling or pass callbacks
      onGenerateComplete(renderIds);
    }
  };

  const filteredStyles = sampleStyles.filter(
    (style) =>
      style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      style.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedStyles = styleCategories.reduce((acc, category) => {
    acc[category] = filteredStyles.filter((s) => s.category === category);
    return acc;
  }, {} as Record<string, StyleOption[]>);

  if (isCollapsed) {
    return (
      <div className={cn("w-12 border-r bg-background flex flex-col items-center py-4 gap-2", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={activeTab === "style" ? "secondary" : "ghost"}
                onClick={() => {
                  onToggleCollapse?.();
                  setActiveTab("style");
                }}
              >
                <Palette className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Styles</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={activeTab === "room" ? "secondary" : "ghost"}
                onClick={() => {
                  onToggleCollapse?.();
                  setActiveTab("room");
                }}
              >
                <Home className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Room Type</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={activeTab === "settings" ? "secondary" : "ghost"}
                onClick={() => {
                  onToggleCollapse?.();
                  setActiveTab("settings");
                }}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>

          <Separator className="my-2 w-8" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={showVastu ? "secondary" : "ghost"}
                onClick={onToggleVastu}
                className={cn(showVastu && "text-orange-500")}
              >
                <Compass className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Vastu Analysis</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={showCost ? "secondary" : "ghost"}
                onClick={onToggleCost}
                className={cn(showCost && "text-green-500")}
              >
                <IndianRupee className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Cost Calculator</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className={cn("w-80 border-r bg-background flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Design Options</h2>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onToggleCollapse}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Indian Superpowers Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={showVastu ? "default" : "outline"}
            size="sm"
            className={cn("flex-1 gap-1", showVastu && "bg-orange-500 hover:bg-orange-600")}
            onClick={onToggleVastu}
          >
            <Compass className="w-3 h-3" />
            Vastu
          </Button>
          <Button
            variant={showCost ? "default" : "outline"}
            size="sm"
            className={cn("flex-1 gap-1", showCost && "bg-green-500 hover:bg-green-600")}
            onClick={onToggleCost}
          >
            <IndianRupee className="w-3 h-3" />
            Cost
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 m-2">
          <TabsTrigger value="style" className="gap-1 text-xs">
            <Palette className="w-3 h-3" />
            Style
          </TabsTrigger>
          <TabsTrigger value="room" className="gap-1 text-xs">
            <Home className="w-3 h-3" />
            Room
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1 text-xs">
            <SlidersHorizontal className="w-3 h-3" />
            Settings
          </TabsTrigger>
          {showVastu && (
            <TabsTrigger value="vastu" className="gap-1 text-xs text-orange-600 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
              <Compass className="w-3 h-3" />
              Vastu
            </TabsTrigger>
          )}
          {showCost && (
            <TabsTrigger value="cost" className="gap-1 text-xs text-green-600 data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
              <IndianRupee className="w-3 h-3" />
              Cost
            </TabsTrigger>
          )}
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Style Tab */}
          <TabsContent value="style" className="m-0 p-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Style Categories */}
            <div className="space-y-2">
              {styleCategories.map((category) => {
                const styles = groupedStyles[category] || [];
                if (styles.length === 0) return null;

                return (
                  <Collapsible
                    key={category}
                    open={expandedCategories.includes(category)}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-lg transition-colors">
                      <span className="font-medium text-sm">{category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {styles.length}
                        </Badge>
                        {expandedCategories.includes(category) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {styles.map((style) => (
                          <motion.button
                            key={style.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all",
                              selectedStyle === style.id
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-transparent hover:border-primary/50"
                            )}
                            onClick={() => {
                              if (!style.isPro || isPro) {
                                onStyleSelect(style.id);
                              }
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
                            <img
                              src={style.preview}
                              alt={style.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <span className="absolute bottom-1 left-1 right-1 text-white text-xs font-medium truncate">
                              {style.name}
                            </span>
                            {selectedStyle === style.id && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                            {style.isPro && !isPro && (
                              <div className="absolute top-1 left-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Lock className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </TabsContent>

          {/* Room Type Tab */}
          <TabsContent value="room" className="m-0 p-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Select the room type for optimized results
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roomTypes.map((room) => (
                <motion.button
                  key={room.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    selectedRoomType === room.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => onRoomTypeSelect(room.id)}
                >
                  {room.icon}
                  <span className="text-sm font-medium">{room.name}</span>
                </motion.button>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="m-0 p-3 space-y-4">
            {/* Preserve Structure */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Preserve Structure</Label>
                <p className="text-xs text-muted-foreground">
                  Keep the original room layout
                </p>
              </div>
              <Switch
                checked={settings.preserveStructure}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, preserveStructure: checked })
                }
              />
            </div>

            {/* Enhance Details */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Enhance Details</Label>
                <p className="text-xs text-muted-foreground">
                  Add more decorative elements
                </p>
              </div>
              <Switch
                checked={settings.enhanceDetails}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, enhanceDetails: checked })
                }
              />
            </div>

            <Separator />

            {/* Creativity Level */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Creativity Level</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.creativityLevel}%
                </span>
              </div>
              <Slider
                value={[settings.creativityLevel]}
                onValueChange={([value]) =>
                  onSettingsChange({ ...settings, creativityLevel: value })
                }
                min={0}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Color Intensity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Color Intensity</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.colorIntensity}%
                </span>
              </div>
              <Slider
                value={[settings.colorIntensity]}
                onValueChange={([value]) =>
                  onSettingsChange({ ...settings, colorIntensity: value })
                }
                min={0}
                max={100}
                step={5}
              />
            </div>

            <Separator />

            {/* Lighting Mode */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Lighting Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                {lightingModes.map((mode) => (
                  <Button
                    key={mode.id}
                    variant={settings.lightingMode === mode.id ? "secondary" : "outline"}
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() =>
                      onSettingsChange({ ...settings, lightingMode: mode.id })
                    }
                  >
                    {mode.icon}
                    {mode.name}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Vastu Panel Content (Rendered outside TabsContent to avoid unmounting if we want persistence, 
          but for now inside Tabs structure is fine or we can use a conditional render) */}
      {showVastu && activeTab === 'vastu' && (
        <VastuPanel
          roomType={selectedRoomType || 'living-room'}
          className="flex-1 overflow-hidden"
        />
      )}

      {/* Cost Panel Content */}
      {showCost && activeTab === 'cost' && (
        <CostPanel
          roomType={selectedRoomType || 'living-room'}
          className="flex-1 overflow-hidden"
        />
      )}

      {/* Footer */}
      <div className="p-3 border-t">
        <Button
          className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
          onClick={handleGenerate}
          disabled={isGenerating || !selectedStyle || !selectedRoomType || !currentImageUrl}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Design
            </>
          )}
        </Button>
      </div>
    </div>
  );
}