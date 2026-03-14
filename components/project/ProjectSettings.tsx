"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Settings,
  Trash2,
  Download,
  Share2,
  Lock,
  Globe,
  Users,
  Bell,
  Palette,
  Tag,
  AlertTriangle,
  Save,
  X,
  Plus,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectSettingsProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onDelete: () => Promise<void>;
  className?: string;
}

export function ProjectSettings({
  project,
  onUpdate,
  onDelete,
  className,
}: ProjectSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [visibility, setVisibility] = useState<Project["visibility"]>(project.visibility || "private");
  const [roomType, setRoomType] = useState(project.roomType || "");
  const [tags, setTags] = useState<string[]>(project.tags || []);
  const [newTag, setNewTag] = useState("");

  // Fix: Use the correct notification structure from Project type
  const [notifications, setNotifications] = useState({
    email: project.settings?.notifications?.email ?? true,
    push: project.settings?.notifications?.push ?? true,
    aiSuggestions: project.settings?.notifications?.aiSuggestions ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = () => {
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        name: name.trim(),
        description: description.trim(),
        visibility,
        roomType,
        tags,
        settings: {
          enableVastu: project.settings?.enableVastu ?? false,
          enableCostTracking: project.settings?.enableCostTracking ?? false,
          autoSave: project.settings?.autoSave ?? true,
          defaultCurrency: project.settings?.defaultCurrency ?? 'INR',
          quality: project.settings?.quality ?? 'standard',
          language: project.settings?.language ?? 'en',
          notifications,
        },
      });
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Your project settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      toast({
        title: "Project deleted",
        description: "Your project has been permanently deleted.",
      });
      router.push("/projects");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
      handleChange();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    handleChange();
  };

  const handleExport = async () => {
    if (!project.id) {
      toast({ title: "Save your project first before exporting.", variant: "destructive" });
      return;
    }

    toast({
      title: "Preparing export…",
      description: "Your project data is being assembled.",
    });

    try {
      const response = await fetch(`/api/projects/${project.id}`);
      if (!response.ok) throw new Error("Failed to fetch project data");

      const data = await response.json();
      const exportData = {
        exportedAt: new Date().toISOString(),
        project: {
          id: data._id,
          name: data.name,
          description: data.description,
          roomType: data.roomType,
          style: data.style,
          tags: data.tags,
          visibility: data.visibility,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        renders: (data.renders || []).map((r: any) => ({
          id: r._id,
          status: r.status,
          outputImage: r.outputImage,
          createdAt: r.createdAt,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, "-")}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Export downloaded", description: `${project.name} exported successfully.` });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyShareLink = async () => {
    const url = `${window.location.origin}/projects/${project.id}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard.",
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Save bar */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl"
        >
          <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            You have unsaved changes
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setName(project.name);
                setDescription(project.description || "");
                setVisibility(project.visibility || "private");
                setTags(project.tags || []);
                setHasChanges(false);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Discard
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic information about your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                handleChange();
              }}
              placeholder="Enter project name"
              className="w-full"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                handleChange();
              }}
              placeholder="Describe your project..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select
                value={roomType}
                onValueChange={(v) => {
                  setRoomType(v);
                  handleChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="living_room">Living Room</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="bathroom">Bathroom</SelectItem>
                  <SelectItem value="home_office">Home Office</SelectItem>
                  <SelectItem value="dining_room">Dining Room</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                  <SelectItem value="garden">Garden/Patio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={project.status}
                onValueChange={(v) => onUpdate({ status: v as Project["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex items-center gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button variant="outline" size="icon" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sharing & Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Sharing & Visibility
          </CardTitle>
          <CardDescription>
            Control who can view and access your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "private" as const, icon: Lock, label: "Private", desc: "Only you" },
                { value: "unlisted" as const, icon: Users, label: "Unlisted", desc: "Link only" },
                { value: "public" as const, icon: Globe, label: "Public", desc: "Anyone" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setVisibility(option.value);
                    handleChange();
                  }}
                  className={cn(
                    "p-4 border-2 rounded-xl text-left transition-all",
                    visibility === option.value
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  )}
                >
                  <option.icon className={cn(
                    "w-5 h-5 mb-2",
                    visibility === option.value ? "text-purple-600" : "text-gray-400"
                  )} />
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Share Link</p>
              <p className="text-sm text-gray-500">
                {window.location.origin}/projects/{project.id}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyShareLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive updates about this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">
                Receive email updates when renders complete
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, email: checked });
                handleChange();
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-500">
                Get notified in your browser
              </p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, push: checked });
                handleChange();
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI Suggestions</p>
              <p className="text-sm text-gray-500">
                Receive AI-powered design suggestions
              </p>
            </div>
            <Switch
              checked={notifications.aiSuggestions}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, aiSuggestions: checked });
                handleChange();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data & Export
          </CardTitle>
          <CardDescription>
            Export your project data and renders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export All Renders</p>
              <p className="text-sm text-gray-500">
                Download all renders as a ZIP file
              </p>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Project Data</p>
              <p className="text-sm text-gray-500">
                Download project settings and metadata
              </p>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">
                Delete Project
              </p>
              <p className="text-sm text-red-600 dark:text-red-500">
                Permanently delete this project and all its renders
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    project "{project.name}" and all {project.renderCount || 0} renders
                    associated with it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Project"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectSettings;