"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Folder,
  Upload,
  Sparkles,
  ArrowRight,
  Check,
  Image as ImageIcon,
  Home,
  Building2,
  Sofa,
  ChefHat,
  Bath,
  Bed,
  Car,
  TreeDeciduous,
  Briefcase,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (projectId: string) => void;
}

type Step = "type" | "details" | "upload";

interface RoomTypeOption {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

const roomTypes: RoomTypeOption[] = [
  { id: "living_room", name: "Living Room", icon: Sofa, description: "Transform your living space" },
  { id: "bedroom", name: "Bedroom", icon: Bed, description: "Create your dream bedroom" },
  { id: "kitchen", name: "Kitchen", icon: ChefHat, description: "Design a modern kitchen" },
  { id: "bathroom", name: "Bathroom", icon: Bath, description: "Renovate your bathroom" },
  { id: "home_office", name: "Home Office", icon: Briefcase, description: "Build a productive workspace" },
  { id: "dining_room", name: "Dining Room", icon: Home, description: "Design the perfect dining area" },
  { id: "exterior", name: "Exterior", icon: Building2, description: "Transform your home exterior" },
  { id: "garden", name: "Garden/Patio", icon: TreeDeciduous, description: "Create outdoor living spaces" },
  { id: "garage", name: "Garage", icon: Car, description: "Optimize your garage space" },
];

export function NewProjectModal({
  open,
  onOpenChange,
  onSuccess,
}: NewProjectModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>("type");
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [skipUpload, setSkipUpload] = useState(false);

  const resetForm = () => {
    setStep("type");
    setSelectedRoomType("");
    setProjectName("");
    setDescription("");
    setUploadedImage(null);
    setSkipUpload(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === "type" && selectedRoomType) {
      // Auto-generate project name if empty
      if (!projectName) {
        const roomType = roomTypes.find((r) => r.id === selectedRoomType);
        setProjectName(`${roomType?.name || "New"} Project`);
      }
      setStep("details");
    } else if (step === "details" && projectName.trim()) {
      setStep("upload");
    }
  };

  const handleBack = () => {
    if (step === "details") setStep("type");
    if (step === "upload") setStep("details");
  };

  const handleCreate = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: description.trim(),
          roomType: selectedRoomType,
          thumbnail: uploadedImage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();

      toast({
        title: "Project created!",
        description: "Your new project is ready.",
      });

      handleClose();
      onSuccess?.(project.id);

      // Navigate to editor
      router.push(`/editor/${project.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case "type":
        return !!selectedRoomType;
      case "details":
        return !!projectName.trim();
      case "upload":
        return true; // Upload is optional
      default:
        return false;
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case "type":
        return 1;
      case "details":
        return 2;
      case "upload":
        return 3;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Folder className="w-6 h-6 text-purple-600" />
            </div>
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Set up your design project in a few simple steps
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {["type", "details", "upload"].map((s, i) => (
            <React.Fragment key={s}>
              <motion.div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  getStepNumber() > i + 1
                    ? "bg-purple-600 text-white"
                    : getStepNumber() === i + 1
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                )}
                animate={getStepNumber() === i + 1 ? { scale: [1, 1.1, 1] } : {}}
              >
                {getStepNumber() > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </motion.div>
              {i < 2 && (
                <div
                  className={cn(
                    "w-12 h-0.5 transition-colors",
                    getStepNumber() > i + 1 ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Label className="text-base font-medium">Select Room Type</Label>
              <RadioGroup
                value={selectedRoomType}
                onValueChange={setSelectedRoomType}
                className="grid grid-cols-3 gap-3"
              >
                {roomTypes.map((room) => (
                  <Label
                    key={room.id}
                    htmlFor={room.id}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-900/10",
                      selectedRoomType === room.id
                        ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <RadioGroupItem
                      value={room.id}
                      id={room.id}
                      className="sr-only"
                    />
                    <room.icon
                      className={cn(
                        "w-8 h-8 transition-colors",
                        selectedRoomType === room.id
                          ? "text-purple-600"
                          : "text-gray-400"
                      )}
                    />
                    <span className="text-sm font-medium text-center">
                      {room.name}
                    </span>
                    {selectedRoomType === room.id && (
                      <motion.div
                        layoutId="selected"
                        className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </Label>
                ))}
              </RadioGroup>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Living Room Redesign"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your design goals, style preferences, or any specific requirements..."
                  rows={4}
                />
              </div>

              {/* Quick tips */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Quick Tips
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Use a descriptive name for easy organization</li>
                  <li>• Include style preferences (modern, traditional, etc.)</li>
                  <li>• Mention budget constraints if any</li>
                </ul>
              </div>
            </motion.div>
          )}

          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <Label>Upload Room Photo (Optional)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSkipUpload(true)}
                >
                  Skip for now
                </Button>
              </div>

              {!skipUpload ? (
                <ImageUploader
                  value={uploadedImage}
                  onChange={setUploadedImage}
                  className="h-64"
                  accept="image/*"
                  maxSize={10 * 1024 * 1024}
                />
              ) : (
                <div className="h-64 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <p>You can upload photos later from the editor</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSkipUpload(false)}
                    className="mt-2"
                  >
                    Upload now instead
                  </Button>
                </div>
              )}

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Pro tip:</strong> Upload a clear, well-lit photo of your room
                  for the best AI-generated designs. You can always add more photos in
                  the editor.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={step === "type" ? handleClose : handleBack}
          >
            {step === "type" ? "Cancel" : "Back"}
          </Button>

          <div className="flex items-center gap-2">
            {step === "upload" ? (
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                {isCreating ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NewProjectModal;