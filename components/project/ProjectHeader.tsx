"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Edit2,
  Share2,
  Download,
  MoreHorizontal,
  Star,
  StarOff,
  Clock,
  Image as ImageIcon,
  Settings,
  Trash2,
  Copy,
  ExternalLink,
  ChevronDown,
  Users,
  Lock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectHeaderProps {
  project: Project;
  onUpdate?: (updates: Partial<Project>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function ProjectHeader({
  project,
  onUpdate,
  onDelete,
  onDuplicate,
  onExport,
  showBackButton = true,
  className,
}: ProjectHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== project.name) {
      onUpdate?.({ name: editedName.trim() });
      toast({
        title: "Project renamed",
        description: "Your project name has been updated.",
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditedName(project.name);
      setIsEditing(false);
    }
  };

  const handleFavorite = () => {
    onUpdate?.({ isFavorite: !project.isFavorite });
    toast({
      title: project.isFavorite ? "Removed from favorites" : "Added to favorites",
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/projects/${project.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.name,
          text: `Check out my design project: ${project.name}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied",
          description: "Project link copied to clipboard.",
        });
      }
    } catch {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Project link copied to clipboard.",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.();
      router.push("/projects");
      toast({
        title: "Project deleted",
        description: "Your project has been deleted.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "draft":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return Globe;
      case "team":
        return Users;
      case "private":
      default:
        return Lock;
    }
  };

  const VisibilityIcon = getVisibilityIcon(project.visibility || "private");

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800",
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top row - navigation and actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}

              {/* Breadcrumb */}
              <nav className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <Link href="/projects" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  Projects
                </Link>
                <span>/</span>
                <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
                  {project.name}
                </span>
              </nav>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleFavorite}>
                      {project.isFavorite ? (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-5 h-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {project.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>

              <Link href={`/editor/${project.id}`}>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export All Renders
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}/settings`}>
                      <Settings className="w-4 h-4 mr-2" />
                      Project Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Main header content */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Thumbnail */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
              {project.thumbnail ? (
                <Image
                  src={project.thumbnail}
                  alt={project.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>

            {/* Project info */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="flex items-center gap-2 mb-2">
                {isEditing ? (
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={handleKeyDown}
                    className="text-2xl font-bold h-auto py-1 px-2"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => setIsEditing(true)}
                    title="Click to edit"
                  >
                    {project.name}
                  </h1>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Description */}
              <p className="text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {project.description || "No description added. Click to add one."}
              </p>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn("capitalize", getStatusColor(project.status))}
                >
                  {project.status.replace("_", " ")}
                </Badge>

                {project.roomType && (
                  <Badge variant="secondary">{project.roomType}</Badge>
                )}

                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <VisibilityIcon className="w-4 h-4" />
                  <span className="capitalize">{project.visibility || "private"}</span>
                </span>

                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <ImageIcon className="w-4 h-4" />
                  {project.renderCount || 0} renders
                </span>

                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Team/Collaborators */}
            {project.collaborators && project.collaborators.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {project.collaborators.slice(0, 3).map((collaborator, index) => (
                    <Avatar key={`collaborator-${index}`} className="w-8 h-8 border-2 border-white dark:border-gray-900">
                      <AvatarImage src={collaborator.avatar} />
                      <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {project.collaborators.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium">
                      +{project.collaborators.length - 3}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <Users className="w-4 h-4 mr-1" />
                  Manage
                </Button>
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.renderCount || 0}
              </p>
              <p className="text-xs text-gray-500">Renders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.vastuScore || "-"}
              </p>
              <p className="text-xs text-gray-500">Vastu Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.estimatedCost ? `₹${(project.estimatedCost / 100000).toFixed(1)}L` : "-"}
              </p>
              <p className="text-xs text-gray-500">Est. Cost</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {format(new Date(project.createdAt), "MMM d, yyyy")}
              </p>
              <p className="text-xs text-gray-500">Created</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be
              undone and all {project.renderCount || 0} renders will be permanently deleted.
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
    </>
  );
}

export default ProjectHeader;