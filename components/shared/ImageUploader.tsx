"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  ImagePlus,
  Camera,
  Link2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileImage,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { useLanguage } from "@/hooks/useLanguage";
import { ImageCropModal } from "@/components/shared/ImageCropModal";

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  onRemove?: () => void;
  currentImage?: string | null;
  disabled?: boolean;
  maxSize?: number; // in MB
  aspectRatio?: "square" | "video" | "auto";
  showUrlInput?: boolean;
  showCameraButton?: boolean;
  className?: string;
  /** When true, shows the crop/rotate modal before uploading */
  enableCrop?: boolean;
  /** Aspect ratio constraint for the crop modal (null = free crop) */
  cropAspectRatio?: number | null;
  /** Title shown in the crop modal header */
  cropTitle?: string;
}

export function ImageUploader({
  onUpload,
  onRemove,
  currentImage,
  disabled = false,
  maxSize = 10,
  aspectRatio = "auto",
  showUrlInput = true,
  showCameraButton = true,
  className,
  enableCrop = false,
  cropAspectRatio = null,
  cropTitle = "Crop & Adjust Image",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  // Crop modal state
  const [cropOpen,    setCropOpen]    = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingUrl,  setPendingUrl]  = useState("");

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        setPreviewUrl(res[0].url);
        onUpload(res[0].url);
        setIsUploading(false);
        setUploadProgress(100);
        toast({
          title: language === "hi" ? "अपलोड सफल" : "Upload successful",
          description: language === "hi" ? "छवि अपलोड हो गई" : "Image uploaded successfully",
        });
      }
    },
    onUploadError: (error) => {
      setError(error.message);
      setIsUploading(false);
      toast({
        title: language === "hi" ? "अपलोड विफल" : "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  // Core upload logic — called after optional crop step
  const doUpload = useCallback(
    async (file: File, localPreviewUrl?: string) => {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      if (localPreviewUrl) {
        setPreviewUrl(localPreviewUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);
      }

      await startUpload([file]);
    },
    [startUpload]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > maxSize * 1024 * 1024) {
        setError(
          language === "hi"
            ? `फ़ाइल ${maxSize}MB से छोटी होनी चाहिए`
            : `File must be less than ${maxSize}MB`
        );
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError(
          language === "hi"
            ? "केवल छवि फ़ाइलें स्वीकार्य हैं"
            : "Only image files are accepted"
        );
        return;
      }

      if (enableCrop) {
        // Show crop modal first — upload happens after confirmation
        const url = URL.createObjectURL(file);
        setPendingFile(file);
        setPendingUrl(url);
        setCropOpen(true);
        return;
      }

      doUpload(file);
    },
    [maxSize, language, enableCrop, doUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      },
      maxFiles: 1,
      disabled: disabled || isUploading,
    });

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    try {
      // Validate URL
      new URL(urlInput);

      setIsUploading(true);
      setShowUrlDialog(false);

      // Fetch and validate image
      const response = await fetch(urlInput);
      if (!response.ok) throw new Error("Failed to fetch image");

      const contentType = response.headers.get("content-type");
      if (!contentType?.startsWith("image/")) {
        throw new Error("URL does not point to an image");
      }

      setPreviewUrl(urlInput);
      onUpload(urlInput);
      setIsUploading(false);
      setUrlInput("");
    } catch (error) {
      setError(
        language === "hi"
          ? "अमान्य URL या छवि लोड करने में विफल"
          : "Invalid URL or failed to load image"
      );
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    setUploadProgress(0);
    onRemove?.();
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDrop([file]);
    }
  };

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "aspect-[4/3]",
  };

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="sync">
        {previewUrl && !isUploading ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "relative rounded-xl overflow-hidden",
              "border-2 border-zinc-200 dark:border-zinc-800",
              className?.includes("h-") ? "h-full w-full" : aspectRatioClasses[aspectRatio]
            )}
          >
            <Image
              src={previewUrl}
              alt="Uploaded image"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />

            {/* Remove Button */}
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-3 right-3 w-8 h-8"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Success Indicator */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {language === "hi" ? "अपलोड हो गया" : "Uploaded"}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(className?.includes("h-") && "h-full w-full")}
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative rounded-xl border-2 border-dashed transition-all duration-300",
                className?.includes("h-") ? "h-full w-full" : aspectRatioClasses[aspectRatio],
                "flex flex-col items-center justify-center p-6 text-center cursor-pointer",
                isDragActive && !isDragReject
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                  : isDragReject
                  ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-violet-500/50 bg-zinc-50 dark:bg-zinc-900/50",
                disabled && "opacity-50 cursor-not-allowed",
                isUploading && "pointer-events-none"
              )}
            >
              <input {...getInputProps()} />

              {isUploading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-violet-600">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                  <Progress value={uploadProgress} className="w-48" />
                  <p className="text-sm text-zinc-500">
                    {language === "hi" ? "अपलोड हो रहा है..." : "Uploading..."}
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                      isDragActive
                        ? "bg-violet-100 dark:bg-violet-500/20"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    )}
                  >
                    {isDragReject ? (
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    ) : (
                      <Upload
                        className={cn(
                          "w-8 h-8",
                          isDragActive ? "text-violet-500" : "text-zinc-400"
                        )}
                      />
                    )}
                  </div>

                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                    {isDragActive
                      ? language === "hi"
                        ? "यहाँ छोड़ें"
                        : "Drop here"
                      : language === "hi"
                      ? "छवि अपलोड करें"
                      : "Upload Image"}
                  </h3>

                  <p className="text-sm text-zinc-500 mb-4">
                    {isDragReject
                      ? language === "hi"
                        ? "केवल छवियाँ स्वीकार्य हैं"
                        : "Only images are accepted"
                      : language === "hi"
                      ? `खींचें और छोड़ें या क्लिक करें (अधिकतम ${maxSize}MB)`
                      : `Drag & drop or click to browse (max ${maxSize}MB)`}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <FileImage className="w-4 h-4" />
                    <span>PNG, JPG, JPEG, WEBP</span>
                  </div>
                </>
              )}
            </div>

            {/* Additional Upload Options */}
            {!isUploading && (
              <div className="flex items-center justify-center gap-3 mt-4">
                {showCameraButton && (
                  <>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleCameraChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCameraCapture}
                      disabled={disabled}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {language === "hi" ? "कैमरा" : "Camera"}
                    </Button>
                  </>
                )}

                {showUrlInput && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUrlDialog(true)}
                    disabled={disabled}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    {language === "hi" ? "URL से" : "From URL"}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-3 text-sm text-red-500"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {/* URL Input Dialog */}
      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "hi" ? "URL से छवि जोड़ें" : "Add Image from URL"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUrlDialog(false)}>
                {language === "hi" ? "रद्द करें" : "Cancel"}
              </Button>
              <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                {language === "hi" ? "जोड़ें" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop modal — only mounted when enableCrop=true */}
      {enableCrop && (
        <ImageCropModal
          isOpen={cropOpen}
          imageFile={pendingFile}
          imageUrl={pendingUrl}
          aspectRatio={cropAspectRatio}
          title={cropTitle}
          onConfirm={(croppedFile, croppedUrl) => {
            setCropOpen(false);
            if (pendingUrl) URL.revokeObjectURL(pendingUrl);
            setPendingFile(null);
            setPendingUrl("");
            doUpload(croppedFile, croppedUrl);
          }}
          onCancel={() => {
            // Skip crop — upload original file as-is
            setCropOpen(false);
            const original = pendingFile;
            const originalUrl = pendingUrl;
            setPendingFile(null);
            setPendingUrl("");
            if (original) doUpload(original, originalUrl);
          }}
        />
      )}
    </div>
  );
}

export default ImageUploader;