// components/editor/ExportModal.tsx
"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Download,
  Image as ImageIcon,
  FileImage,
  Share2,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Zap,
  Mail,
  Link2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Send,
  FileDown,
  ImagePlus,
  Palette,
  Grid3X3,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  icon: React.ReactNode;
  description: string;
  quality: number[];
  isPro: boolean;
}

interface ExportSize {
  id: string;
  name: string;
  width: number;
  height: number;
  isPro: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  originalUrl?: string;
  projectName?: string;
  onExport?: (options: ExportOptions) => Promise<void>;
}

interface ExportOptions {
  format: string;
  quality: number;
  size: string;
  includeWatermark: boolean;
  includeMetadata: boolean;
  includeOriginal: boolean;
}

const exportFormats: ExportFormat[] = [
  {
    id: "png",
    name: "PNG",
    extension: ".png",
    mimeType: "image/png",
    icon: <FileImage className="w-5 h-5" />,
    description: "Lossless compression, transparent background support",
    quality: [100],
    isPro: false,
  },
  {
    id: "jpg",
    name: "JPEG",
    extension: ".jpg",
    mimeType: "image/jpeg",
    icon: <ImageIcon className="w-5 h-5" />,
    description: "Smaller file size, great for web sharing",
    quality: [60, 80, 90, 100],
    isPro: false,
  },
  {
    id: "webp",
    name: "WebP",
    extension: ".webp",
    mimeType: "image/webp",
    icon: <Zap className="w-5 h-5" />,
    description: "Modern format with excellent compression",
    quality: [60, 80, 90, 100],
    isPro: false,
  },
  {
    id: "tiff",
    name: "TIFF",
    extension: ".tiff",
    mimeType: "image/tiff",
    icon: <Layers className="w-5 h-5" />,
    description: "High quality for professional printing",
    quality: [100],
    isPro: true,
  },
  {
    id: "pdf",
    name: "PDF",
    extension: ".pdf",
    mimeType: "application/pdf",
    icon: <FileDown className="w-5 h-5" />,
    description: "Universal document format for presentations",
    quality: [100],
    isPro: true,
  },
];

const exportSizes: ExportSize[] = [
  { id: "original", name: "Original", width: 0, height: 0, isPro: false },
  { id: "1080", name: "HD (1080p)", width: 1920, height: 1080, isPro: false },
  { id: "2k", name: "2K", width: 2560, height: 1440, isPro: false },
  { id: "4k", name: "4K Ultra HD", width: 3840, height: 2160, isPro: true },
  { id: "8k", name: "8K", width: 7680, height: 4320, isPro: true },
  { id: "print_a4", name: "Print A4 (300dpi)", width: 3508, height: 2480, isPro: true },
  { id: "print_a3", name: "Print A3 (300dpi)", width: 4961, height: 3508, isPro: true },
];

const shareOptions = [
  { id: "copy", name: "Copy Link", icon: Link2, color: "bg-gray-600" },
  { id: "email", name: "Email", icon: Mail, color: "bg-red-500" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-blue-600" },
  { id: "twitter", name: "Twitter", icon: Twitter, color: "bg-sky-500" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
  { id: "whatsapp", name: "WhatsApp", icon: Send, color: "bg-green-500" },
];

export default function ExportModal({
  isOpen,
  onClose,
  imageUrl,
  originalUrl,
  projectName = "Untitled Design",
  onExport,
}: ExportModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("download");
  const [selectedFormat, setSelectedFormat] = useState("png");
  const [selectedSize, setSelectedSize] = useState("original");
  const [quality, setQuality] = useState(90);
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeOriginal, setIncludeOriginal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isPro] = useState(false); // Get from subscription hook

  const currentFormat = exportFormats.find((f) => f.id === selectedFormat);
  const currentSize = exportSizes.find((s) => s.id === selectedSize);

  const estimatedFileSize = useCallback(() => {
    const baseSize = selectedSize === "original" ? 2 : 
      (currentSize?.width || 1920) * (currentSize?.height || 1080) * 3;
    const qualityMultiplier = quality / 100;
    const formatMultiplier = 
      selectedFormat === "png" ? 1 :
      selectedFormat === "jpg" ? 0.3 :
      selectedFormat === "webp" ? 0.25 :
      selectedFormat === "tiff" ? 3 : 1;
    
    const sizeInBytes = baseSize * qualityMultiplier * formatMultiplier;
    
    if (sizeInBytes > 1024 * 1024) {
      return `~${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `~${(sizeInBytes / 1024).toFixed(0)} KB`;
  }, [selectedFormat, selectedSize, quality, currentSize]);

  const handleExport = async () => {
    if (currentFormat?.isPro && !isPro) {
      toast({
        title: "Pro Feature",
        description: `${currentFormat.name} export is available in Pro plan`,
        variant: "destructive",
      });
      return;
    }

    if (currentSize?.isPro && !isPro) {
      toast({
        title: "Pro Feature",
        description: `${currentSize.name} export is available in Pro plan`,
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      if (onExport) {
        await onExport({
          format: selectedFormat,
          quality,
          size: selectedSize,
          includeWatermark,
          includeMetadata,
          includeOriginal,
        });
      } else {
        // Default download behavior
        await downloadImage();
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      toast({
        title: "Export Complete",
        description: `Your design has been exported as ${currentFormat?.name}`,
      });

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your design",
        variant: "destructive",
      });
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${projectName.replace(/\s+/g, "_")}_${Date.now()}${currentFormat?.extension || ".png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Image link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(imageUrl);
    const encodedText = encodeURIComponent(`Check out my interior design created with Removation.ai! 🏠✨`);
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent("My Removation.ai Design")}&body=${encodedText}%20${encodedUrl}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Design
          </DialogTitle>
          <DialogDescription>
            Download or share your rendered design
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="download" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="download" className="space-y-6 py-4">
            {/* Preview */}
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt="Export preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white font-medium truncate">{projectName}</p>
                <p className="text-white/70 text-sm">{estimatedFileSize()}</p>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Format</Label>
              <RadioGroup
                value={selectedFormat}
                onValueChange={setSelectedFormat}
                className="grid grid-cols-3 gap-2"
              >
                {exportFormats.slice(0, 3).map((format) => (
                  <Label
                    key={format.id}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      selectedFormat === format.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value={format.id} className="sr-only" />
                    {format.icon}
                    <span className="text-sm font-medium">{format.name}</span>
                  </Label>
                ))}
              </RadioGroup>
              
              {/* Pro Formats */}
              <div className="flex gap-2">
                {exportFormats.slice(3).map((format) => (
                  <Label
                    key={format.id}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all flex-1",
                      selectedFormat === format.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      format.isPro && !isPro && "opacity-60"
                    )}
                  >
                    <RadioGroupItem
                      value={format.id}
                      className="sr-only"
                      disabled={format.isPro && !isPro}
                      onClick={() => !format.isPro || isPro ? setSelectedFormat(format.id) : null}
                    />
                    {format.icon}
                    <span className="text-sm font-medium">{format.name}</span>
                    {format.isPro && (
                      <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                        PRO
                      </Badge>
                    )}
                  </Label>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            {currentFormat && currentFormat.quality.length > 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Quality</Label>
                  <span className="text-sm text-muted-foreground">{quality}%</span>
                </div>
                <Slider
                  value={[quality]}
                  onValueChange={([value]) => setQuality(value)}
                  min={60}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Resolution</Label>
              <RadioGroup
                value={selectedSize}
                onValueChange={setSelectedSize}
                className="grid grid-cols-2 gap-2"
              >
                {exportSizes.slice(0, 4).map((size) => (
                  <Label
                    key={size.id}
                    className={cn(
                      "relative flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all",
                      selectedSize === size.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      size.isPro && !isPro && "opacity-60"
                    )}
                  >
                    <RadioGroupItem
                      value={size.id}
                      className="sr-only"
                      disabled={size.isPro && !isPro}
                    />
                    <span className="text-sm font-medium">{size.name}</span>
                    {size.width > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {size.width}x{size.height}
                      </span>
                    )}
                    {size.isPro && (
                      <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                        PRO
                      </Badge>
                    )}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Options</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Include metadata</Label>
                    <p className="text-xs text-muted-foreground">
                      Add creation date and style information
                    </p>
                  </div>
                  <Switch
                    checked={includeMetadata}
                    onCheckedChange={setIncludeMetadata}
                  />
                </div>
                
                {originalUrl && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Include original image</Label>
                      <p className="text-xs text-muted-foreground">
                        Download both original and rendered
                      </p>
                    </div>
                    <Switch
                      checked={includeOriginal}
                      onCheckedChange={setIncludeOriginal}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Add watermark</Label>
                    <p className="text-xs text-muted-foreground">
                      Small Removation.ai logo in corner
                    </p>
                  </div>
                  <Switch
                    checked={includeWatermark}
                    onCheckedChange={setIncludeWatermark}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="share" className="space-y-6 py-4">
            {/* Preview */}
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt="Share preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Copy Link */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Share Link</Label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg text-sm truncate">
                  {imageUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Social Share */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Share On</Label>
              <div className="grid grid-cols-3 gap-3">
                {shareOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => 
                      option.id === "copy" ? handleCopyLink() : handleShare(option.id)
                    }
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg text-white transition-all",
                      option.color
                    )}
                  >
                    <option.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Progress */}
        <AnimatePresence>
          {isExporting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exporting...</span>
                <span className="font-medium">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}