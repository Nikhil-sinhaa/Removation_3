"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit2,
  Trash2,
  Copy,
  Download,
  Share2,
  Star,
  StarOff,
  MoreHorizontal,
  ExternalLink,
  Settings,
  Archive,
  FolderOpen,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
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
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectActionsProps {
  project: Project;
  onDelete?: () => Promise<void>;
  onDuplicate?: () => Promise<void>;
  onFavorite?: (isFavorite: boolean) => Promise<void>;
  onArchive?: () => Promise<void>;
  onExport?: () => Promise<void>;
  variant?: "buttons" | "dropdown" | "icons";
  size?: "sm" | "default" | "lg";
  showLabels?: boolean;
  className?: string;
}

export function ProjectActions({
  project,
  onDelete,
  onDuplicate,
  onFavorite,
  onArchive,
  onExport,
  variant = "dropdown",
  size = "default",
  showLabels = false,
  className,
}: ProjectActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
      toast({
        title: "Project deleted",
        description: "Your project has been deleted.",
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
      setShowDeleteDialog(false);
    }
  };

  const handleDuplicate = async () => {
    if (!onDuplicate) return;
    
    setIsDuplicating(true);
    try {
      await onDuplicate();
      toast({
        title: "Project duplicated",
        description: "A copy of your project has been created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate project.",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleFavorite = async () => {
    if (!onFavorite) return;
    
    try {
      await onFavorite(!project.isFavorite);
      toast({
        title: project.isFavorite ? "Removed from favorites" : "Added to favorites",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
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
          description: "Project link has been copied to clipboard.",
        });
      }
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Project link has been copied to clipboard.",
      });
    }
  };

  const handleExport = async () => {
    if (!onExport) return;
    
    setIsExporting(true);
    try {
      await onExport();
      toast({
        title: "Export started",
        description: "Your renders are being prepared for download.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export project.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleArchive = async () => {
    if (!onArchive) return;
    
    try {
      await onArchive();
      toast({
        title: project.isArchived ? "Project unarchived" : "Project archived",
        description: project.isArchived
          ? "Your project is now active."
          : "Your project has been archived.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive project.",
        variant: "destructive",
      });
    }
  };

  const buttonSize = size === "sm" ? "h-8 px-3" : size === "lg" ? "h-12 px-5" : "h-10 px-4";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  if (variant === "icons") {
    return (
      <>
        <TooltipProvider>
          <div className={cn("flex items-center gap-1", className)}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleFavorite}>
                  {project.isFavorite ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {project.isFavorite ? "Remove from favorites" : "Add to favorites"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/editor/${project.id}`}>
                  <Button variant="ghost" size="icon">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Edit project</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                  <Copy className="w-4 h-4 mr-2" />
                  {isDuplicating ? "Duplicating..." : "Duplicate"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="w-4 h-4 mr-2" />
                  {project.isArchived ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{project.name}"? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (variant === "buttons") {
    return (
      <>
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
          <Link href={`/editor/${project.id}`}>
            <Button size={size} className="bg-purple-600 hover:bg-purple-700">
              <Edit2 className={cn(iconSize, showLabels && "mr-2")} />
              {showLabels && "Edit"}
            </Button>
          </Link>

          <Button variant="outline" size={size} onClick={handleFavorite}>
            {project.isFavorite ? (
              <Star className={cn(iconSize, "text-yellow-500 fill-yellow-500", showLabels && "mr-2")} />
            ) : (
              <StarOff className={cn(iconSize, showLabels && "mr-2")} />
            )}
            {showLabels && (project.isFavorite ? "Favorited" : "Favorite")}
          </Button>

          <Button variant="outline" size={size} onClick={handleShare}>
            <Share2 className={cn(iconSize, showLabels && "mr-2")} />
            {showLabels && "Share"}
          </Button>

          <Button
            variant="outline"
            size={size}
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            {isDuplicating ? (
              <RefreshCw className={cn(iconSize, "animate-spin", showLabels && "mr-2")} />
            ) : (
              <Copy className={cn(iconSize, showLabels && "mr-2")} />
            )}
            {showLabels && (isDuplicating ? "Duplicating..." : "Duplicate")}
          </Button>

          <Button
            variant="outline"
            size={size}
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className={cn(iconSize, showLabels && "mr-2")} />
            {showLabels && (isExporting ? "Exporting..." : "Export")}
          </Button>

          <Button
            variant="outline"
            size={size}
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className={cn(iconSize, showLabels && "mr-2")} />
            {showLabels && "Delete"}
          </Button>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{project.name}"? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Default dropdown variant
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} className={className}>
            <MoreHorizontal className={iconSize} />
            {showLabels && <span className="ml-2">Actions</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/editor/${project.id}`}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Project
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}`}>
                <FolderOpen className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}/settings`}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleFavorite}>
              {project.isFavorite ? (
                <>
                  <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
                  Remove from Favorites
                </>
              ) : (
                <>
                  <StarOff className="w-4 h-4 mr-2" />
                  Add to Favorites
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
              <Copy className="w-4 h-4 mr-2" />
              {isDuplicating ? "Duplicating..." : "Duplicate Project"}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Renders"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-2" />
              {project.isArchived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This will permanently
              delete all {project.renderCount || 0} renders and cannot be undone.
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

export default ProjectActions;