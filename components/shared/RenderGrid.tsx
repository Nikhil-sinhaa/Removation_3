"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Heart,
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  Maximize2,
  Share2,
  Loader2,
  ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { CompareSlider } from "@/components/editor/CompareSlider";
import { useLanguage } from "@/hooks/useLanguage";

export interface Render {
  id: string;
  originalImage: string;
  renderedImage: string;
  style: string;
  roomType: string;
  mode: string;
  createdAt: Date;
  isFavorite?: boolean;
  vastuScore?: number;
  estimatedCost?: {
    inr: number;
    usd: number;
  };
  metadata?: {
    width: number;
    height: number;
    processingTime: number;
  };
}

interface RenderGridProps {
  renders: Render[];
  isLoading?: boolean;
  onFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
  onSelect?: (render: Render) => void;
  emptyMessage?: string;
  showCompare?: boolean;
  columns?: 2 | 3 | 4;
}

export function RenderGrid({
  renders,
  isLoading = false,
  onFavorite,
  onDelete,
  onDownload,
  onSelect,
  emptyMessage,
  showCompare = true,
  columns = 3,
}: RenderGridProps) {
  const [selectedRender, setSelectedRender] = useState<Render | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const handleDownload = async (render: Render) => {
    try {
      const response = await fetch(render.renderedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `removation-${render.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onDownload?.(render.id);
      toast({
        title: language === "hi" ? "डाउनलोड सफल" : "Download successful",
        description: language === "hi" ? "छवि डाउनलोड हो गई" : "Image has been downloaded",
      });
    } catch (error) {
      toast({
        title: language === "hi" ? "डाउनलोड विफल" : "Download failed",
        description: language === "hi" ? "पुनः प्रयास करें" : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async (render: Render) => {
    try {
      await navigator.clipboard.writeText(render.renderedImage);
      toast({
        title: language === "hi" ? "लिंक कॉपी हो गया" : "Link copied",
        description: language === "hi" ? "क्लिपबोर्ड में कॉपी किया गया" : "Copied to clipboard",
      });
    } catch (error) {
      toast({
        title: language === "hi" ? "कॉपी विफल" : "Copy failed",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (render: Render) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Removation.ai Render",
          text: `Check out this ${render.style} ${render.roomType} design!`,
          url: render.renderedImage,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink(render);
    }
  };

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  if (isLoading) {
    return (
      <div className={cn("grid gap-4", gridCols[columns])}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (renders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <ImageOff className="w-8 h-8 text-zinc-400" />
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-2">
          {emptyMessage || (language === "hi" ? "कोई रेंडर नहीं" : "No renders yet")}
        </p>
        <p className="text-sm text-zinc-500">
          {language === "hi"
            ? "अपना पहला डिज़ाइन बनाने के लिए छवि अपलोड करें"
            : "Upload an image to create your first design"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid gap-4", gridCols[columns])}>
        <AnimatePresence mode="popLayout">
          {renders.map((render, index) => (
            <motion.div
              key={render.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => setHoveredId(render.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative"
            >
              <div
                className={cn(
                  "relative aspect-[4/3] rounded-xl overflow-hidden",
                  "bg-zinc-100 dark:bg-zinc-800",
                  "border-2 border-transparent transition-all duration-300",
                  "hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10",
                  "cursor-pointer"
                )}
                onClick={() => {
                  setSelectedRender(render);
                  setShowLightbox(true);
                  onSelect?.(render);
                }}
              >
                <Image
                  src={render.renderedImage}
                  alt={`${render.style} ${render.roomType}`}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-500",
                    hoveredId === render.id && "scale-105"
                  )}
                />

                {/* Gradient Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  )}
                />

                {/* Quick Actions */}
                <div
                  className={cn(
                    "absolute top-3 right-3 flex gap-2",
                    "opacity-0 group-hover:opacity-100 transition-all duration-300",
                    "translate-y-2 group-hover:translate-y-0"
                  )}
                >
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 bg-white/90 hover:bg-white backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavorite?.(render.id);
                    }}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4",
                        render.isFavorite
                          ? "fill-rose-500 text-rose-500"
                          : "text-zinc-600"
                      )}
                    />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 bg-white/90 hover:bg-white backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(render);
                    }}
                  >
                    <Download className="w-4 h-4 text-zinc-600" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="w-8 h-8 bg-white/90 hover:bg-white backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4 text-zinc-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyLink(render)}>
                        <Copy className="w-4 h-4 mr-2" />
                        {language === "hi" ? "लिंक कॉपी करें" : "Copy link"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(render)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        {language === "hi" ? "शेयर करें" : "Share"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRender(render);
                          setShowLightbox(true);
                        }}
                      >
                        <Maximize2 className="w-4 h-4 mr-2" />
                        {language === "hi" ? "पूर्ण स्क्रीन" : "Full screen"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete?.(render.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {language === "hi" ? "हटाएं" : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Vastu Score Badge */}
                {render.vastuScore !== undefined && (
                  <div className="absolute top-3 left-3">
                    <Badge
                      className={cn(
                        "text-[10px] font-semibold",
                        render.vastuScore >= 80
                          ? "bg-emerald-500"
                          : render.vastuScore >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                      )}
                    >
                      Vastu {render.vastuScore}
                    </Badge>
                  </div>
                )}

                {/* Bottom Info */}
                <div
                  className={cn(
                    "absolute bottom-0 inset-x-0 p-3",
                    "opacity-0 group-hover:opacity-100 transition-all duration-300",
                    "translate-y-2 group-hover:translate-y-0"
                  )}
                >
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="font-medium text-sm">{render.style}</p>
                      <p className="text-xs text-white/70">{render.roomType}</p>
                    </div>
                    {render.estimatedCost && (
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          ₹{(render.estimatedCost.inr / 100000).toFixed(1)}L
                        </p>
                        <p className="text-xs text-white/70">est. cost</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {render.style}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {render.roomType}
                </Badge>
                {render.isFavorite && (
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          {selectedRender && showCompare ? (
            <div className="relative aspect-video w-full">
              <CompareSlider
                beforeImage={selectedRender.originalImage}
                afterImage={selectedRender.renderedImage}
                beforeLabel={language === "hi" ? "पहले" : "Before"}
                afterLabel={language === "hi" ? "बाद में" : "After"}
              />
            </div>
          ) : selectedRender ? (
            <div className="relative aspect-video w-full">
              <Image
                src={selectedRender.renderedImage}
                alt={selectedRender.style}
                fill
                className="object-contain"
              />
            </div>
          ) : null}

          {/* Actions */}
          {selectedRender && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDownload(selectedRender)}
              >
                <Download className="w-4 h-4 mr-2" />
                {language === "hi" ? "डाउनलोड" : "Download"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleShare(selectedRender)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {language === "hi" ? "शेयर" : "Share"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RenderGrid;