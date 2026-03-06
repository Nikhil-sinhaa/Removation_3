"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3,
  List,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Folder,
  Plus,
  RefreshCw,
  Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "./ProjectCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingShimmer } from "@/components/shared/LoadingShimmer";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectGridProps {
  projects: Project[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onFavorite?: (id: string, favorite: boolean) => void;
  onRename?: (id: string, name: string) => void;
  onCreateNew?: () => void;
  onRefresh?: () => void;
  showControls?: boolean;
  className?: string;
}

type SortField = "updatedAt" | "createdAt" | "name" | "renderCount";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "completed" | "in_progress" | "draft";
type ViewMode = "grid" | "list";

export function ProjectGrid({
  projects,
  isLoading = false,
  onDelete,
  onDuplicate,
  onFavorite,
  onRename,
  onCreateNew,
  onRefresh,
  showControls = true,
  className,
}: ProjectGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);

  // Get unique room types from projects
  const roomTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach((p) => {
      if (p.roomType) types.add(p.roomType);
    });
    return Array.from(types);
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      result = result.filter((p) => p.isFavorite);
    }

    // Room type filter
    if (selectedRoomTypes.length > 0) {
      result = result.filter(
        (p) => p.roomType && selectedRoomTypes.includes(p.roomType)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "renderCount":
          aVal = a.renderCount || 0;
          bVal = b.renderCount || 0;
          break;
        case "createdAt":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
        default:
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  }, [
    projects,
    searchQuery,
    statusFilter,
    showFavoritesOnly,
    selectedRoomTypes,
    sortField,
    sortOrder,
  ]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleRoomType = (type: string) => {
    setSelectedRoomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setShowFavoritesOnly(false);
    setSelectedRoomTypes([]);
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || showFavoritesOnly || selectedRoomTypes.length > 0;

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {showControls && (
          <div className="flex items-center gap-4">
            <LoadingShimmer className="h-10 w-64" />
            <LoadingShimmer className="h-10 w-32" />
            <LoadingShimmer className="h-10 w-32" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingShimmer key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Controls */}
      {showControls && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Search and filters */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-purple-600">
                      {[
                        statusFilter !== "all",
                        showFavoritesOnly,
                        selectedRoomTypes.length > 0,
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showFavoritesOnly}
                  onCheckedChange={setShowFavoritesOnly}
                >
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  Favorites only
                </DropdownMenuCheckboxItem>
                {roomTypes.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Room Type</DropdownMenuLabel>
                    {roomTypes.map((type, idx) => (
                      <DropdownMenuCheckboxItem
                        key={type || idx}
                        checked={selectedRoomTypes.includes(type)}
                        onCheckedChange={() => toggleRoomType(type)}
                      >
                        {type}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}
                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center text-red-600"
                      onClick={clearFilters}
                    >
                      Clear all filters
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* View controls */}
          <div className="flex items-center gap-3">
            {onRefresh && (
              <Button variant="outline" size="icon" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            <Select
              value={sortField}
              onValueChange={(v) => setSortField(v as SortField)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">Last Updated</SelectItem>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="renderCount">Render Count</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={toggleSortOrder}>
              {sortOrder === "asc" ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </Button>

            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as ViewMode)}
              className="hidden sm:block"
            >
              <TabsList className="h-9">
                <TabsTrigger value="grid" className="px-3">
                  <Grid3X3 className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="px-3">
                  <List className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {onCreateNew && (
              <Button
                onClick={onCreateNew}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results info */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Project grid/list */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={searchQuery || hasActiveFilters ? Search : Folder}
          title={
            searchQuery || hasActiveFilters
              ? "No matching projects"
              : "No projects yet"
          }
          description={
            searchQuery || hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Create your first project to get started with AI-powered design"
          }
          action={
            onCreateNew && !searchQuery && !hasActiveFilters
              ? {
                  label: "Create Project",
                  onClick: onCreateNew,
                }
              : hasActiveFilters
              ? {
                  label: "Clear Filters",
                  onClick: clearFilters,
                }
              : undefined
          }
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-3"
            )}
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                variant={viewMode}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onFavorite={onFavorite}
                onRename={onRename}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default ProjectGrid;