"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Folder,
  Image as ImageIcon,
  Clock,
  Star,
  StarOff,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onFavorite?: (id: string, favorite: boolean) => void;
  onRename?: (id: string, name: string) => void;
  variant?: "grid" | "list";
  className?: string;
}

export function ProjectCard({
  project,
  onDelete,
  onDuplicate,
  onFavorite,
  onRename,
  variant = "grid",
  className,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.(project.id);
      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
      });
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

  const handleDuplicate = () => {
    onDuplicate?.(project.id);
    toast({
      title: "Project duplicated",
      description: "A copy of your project has been created.",
    });
  };

  const handleFavorite = () => {
    onFavorite?.(project.id, !project.isFavorite);
    toast({
      title: project.isFavorite ? "Removed from favorites" : "Added to favorites",
      description: project.isFavorite
        ? "Project removed from your favorites."
        : "Project added to your favorites.",
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/projects/${project.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Project link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive",
      });
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  if (variant === "list") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "group relative flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-all duration-300",
            className
          )}
        >
          {/* Thumbnail */}
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            {project.thumbnail ? (
              <Image
                src={project.thumbnail}
                alt={project.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/projects/${project.id}`} className="group/link">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover/link:text-purple-600 transition-colors">
                  {project.name}
                </h3>
              </Link>
              {project.isFavorite && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {project.description || "No description"}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className={cn("text-xs", getStatusColor(project.status))}>
                {getStatusLabel(project.status)}
              </Badge>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {project.renderCount || 0} renders
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleFavorite}
                  >
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
            </TooltipProvider>

            <Link href={`/editor/${project.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit2 className="w-4 h-4" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Link>
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
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{project.name}"? This action cannot be
                undone and all renders will be permanently deleted.
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card
          className={cn(
            "group relative overflow-hidden border-gray-200 dark:border-gray-800 hover:border-purple-500/50 hover:shadow-xl transition-all duration-300",
            className
          )}
        >
          {/* Thumbnail */}
          <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
            {project.thumbnail ? (
              <Image
                src={project.thumbnail}
                alt={project.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Folder className="w-16 h-16 text-gray-300 dark:text-gray-600" />
              </div>
            )}

            {/* Overlay on hover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            />

            {/* Quick actions on hover */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2"
            >
              <Link href={`/editor/${project.id}`}>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Link href={`/projects/${project.id}`}>
                <Button size="sm" variant="secondary">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View
                </Button>
              </Link>
            </motion.div>

            {/* Top actions */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs backdrop-blur-md",
                  getStatusColor(project.status)
                )}
              >
                {getStatusLabel(project.status)}
              </Badge>

              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleFavorite();
                  }}
                  className="p-1.5 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-colors"
                >
                  {project.isFavorite ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="w-4 h-4 text-white" />
                  )}
                </motion.button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreHorizontal className="w-4 h-4 text-white" />
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Link
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Export All
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
            </div>
          </div>

          <CardContent className="p-4">
            <Link href={`/projects/${project.id}`} className="group/title">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover/title:text-purple-600 transition-colors">
                {project.name}
              </h3>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {project.description || "No description added"}
            </p>
          </CardContent>

          <CardFooter className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                {project.renderCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </span>
            </div>
            {project.roomType && (
              <Badge variant="secondary" className="text-xs">
                {project.roomType}
              </Badge>
            )}
          </CardFooter>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be
              undone and all renders will be permanently deleted.
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

export default ProjectCard;