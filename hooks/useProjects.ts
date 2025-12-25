'use client';

import { useState, useCallback, useEffect } from 'react';
import { Project, ProjectStatus } from '@/types/project';
import { Render } from '@/types/editor'; // Import from editor types
import { useProjectStore } from '@/stores/project-store';
import { toast } from '@/components/ui/use-toast';

interface UseProjectsOptions {
  autoFetch?: boolean;
  userId?: string;
}

interface UseProjectsReturn {
  // State
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // CRUD operations
  fetchProjects: () => Promise<void>;
  fetchProject: (projectId: string) => Promise<Project | null>;
  createProject: (data: Partial<Project>) => Promise<Project | null>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  duplicateProject: (projectId: string) => Promise<Project | null>;
  
  // Project state management
  setCurrentProject: (project: Project | null) => void;
  
  // Render operations
  addRender: (projectId: string, render: Render) => Promise<void>;
  removeRender: (projectId: string, renderId: string) => Promise<void>;
  favoriteRender: (projectId: string, renderId: string) => Promise<void>;
  downloadRender: (render: Render, quality?: 'original' | 'hd' | '4k') => Promise<void>;
  
  // Bulk operations
  deleteMultipleProjects: (projectIds: string[]) => Promise<boolean>;
  archiveProject: (projectId: string) => Promise<boolean>;
  unarchiveProject: (projectId: string) => Promise<boolean>;
  
  // Search & filter
  searchProjects: (query: string) => Project[];
  filterByStatus: (status: ProjectStatus) => Project[];
  filterByDateRange: (startDate: Date, endDate: Date) => Project[];
  sortProjects: (by: 'name' | 'date' | 'renders', order: 'asc' | 'desc') => Project[];
  
  // Stats
  getProjectStats: () => {
    total: number;
    active: number;
    archived: number;
    totalRenders: number;
  };
  
  // Utility
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const { autoFetch = true, userId } = options;
  
  const store = useProjectStore();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects
  const fetchProjects = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data.projects);
      // Note: We need to check what methods the store actually has
      // If store.setProjects doesn't exist, we might need to add projects individually
      if (store.addProject) {
        data.projects.forEach((project: Project) => {
          // Check if project already exists in store
          const existing = store.projects.find(p => p.id === project.id);
          if (!existing) {
            store.addProject(project);
          }
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load projects';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  // Fetch single project
  const fetchProject = useCallback(async (projectId: string): Promise<Project | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      
      const data = await response.json();
      setCurrentProjectState(data.project);
      
      // Update in store if method exists
      if (store.setCurrentProject) {
        store.setCurrentProject(data.project);
      }
      
      return data.project;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load project';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  // Create project
  const createProject = useCallback(async (data: Partial<Project>): Promise<Project | null> => {
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }
      
      const newProject = await response.json();
      
      setProjects(prev => [newProject, ...prev]);
      
      // Add to store if method exists
      if (store.addProject) {
        store.addProject(newProject);
      }
      
      toast({
        title: 'Project Created',
        description: `"${newProject.name}" has been created successfully.`,
      });
      
      return newProject;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create project';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [store]);

  // Update project
  const updateProject = useCallback(async (
    projectId: string, 
    data: Partial<Project>
  ): Promise<Project | null> => {
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update project');
      }
      
      const updatedProject = await response.json();
      
      setProjects(prev => 
        prev.map(p => p.id === projectId ? updatedProject : p)
      );
      
      // Update in store if method exists
      if (store.updateProject) {
        store.updateProject(projectId, updatedProject);
      }
      
      if (currentProject?.id === projectId) {
        setCurrentProjectState(updatedProject);
      }
      
      toast({
        title: 'Project Updated',
        description: 'Your changes have been saved.',
      });
      
      return updatedProject;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update project';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [store, currentProject]);

  // Delete project - Fixed: Using correct store method
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      // Use deleteProject instead of removeProject if that's what the store has
      if (store.deleteProject) {
        store.deleteProject(projectId);
      }
      
      if (currentProject?.id === projectId) {
        setCurrentProjectState(null);
      }
      
      toast({
        title: 'Project Deleted',
        description: 'The project has been permanently deleted.',
      });
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete project';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [store, currentProject]);

  // Duplicate project
  const duplicateProject = useCallback(async (projectId: string): Promise<Project | null> => {
    const projectToDuplicate = projects.find(p => p.id === projectId);
    if (!projectToDuplicate) return null;
    
    return createProject({
      ...projectToDuplicate,
      id: undefined,
      name: `${projectToDuplicate.name} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined,
    });
  }, [projects, createProject]);

  // Add render to project
  const addRender = useCallback(async (projectId: string, render: Render): Promise<void> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/renders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(render),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add render');
      }
      
      const updatedProject = await response.json();
      
      setProjects(prev => 
        prev.map(p => p.id === projectId ? updatedProject : p)
      );
      
      if (currentProject?.id === projectId) {
        setCurrentProjectState(updatedProject);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to save render to project',
        variant: 'destructive',
      });
    }
  }, [currentProject]);

  // Remove render from project
  const removeRender = useCallback(async (projectId: string, renderId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/renders/${renderId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove render');
      }
      
      const updatedProject = await response.json();
      
      setProjects(prev => 
        prev.map(p => p.id === projectId ? updatedProject : p)
      );
      
      if (currentProject?.id === projectId) {
        setCurrentProjectState(updatedProject);
      }
      
      toast({
        title: 'Render Removed',
        description: 'The render has been removed from the project.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove render',
        variant: 'destructive',
      });
    }
  }, [currentProject]);

  // Favorite render
  const favoriteRender = useCallback(async (projectId: string, renderId: string): Promise<void> => {
    try {
      await fetch(`/api/projects/${projectId}/renders/${renderId}/favorite`, {
        method: 'POST',
      });
      
      // Update local state
      setProjects(prev => 
        prev.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            renders: p.renders?.map(r => 
              r.id === renderId ? { ...r, isFavorite: !r.isFavorite } : r
            ),
          };
        })
      );
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive',
      });
    }
  }, []);

  // Download render
  const downloadRender = useCallback(async (
    render: Render, 
    quality: 'original' | 'hd' | '4k' = 'original'
  ): Promise<void> => {
    try {
      const response = await fetch(render.outputImages[0].url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `removation-${render.id}-${quality}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Download Started',
        description: 'Your render is being downloaded.',
      });
    } catch (err) {
      toast({
        title: 'Download Failed',
        description: 'Could not download the render.',
        variant: 'destructive',
      });
    }
  }, []);

  // Delete multiple projects
  const deleteMultipleProjects = useCallback(async (projectIds: string[]): Promise<boolean> => {
    setIsDeleting(true);
    
    try {
      await Promise.all(
        projectIds.map(id => 
          fetch(`/api/projects/${id}`, { method: 'DELETE' })
        )
      );
      
      setProjects(prev => prev.filter(p => !projectIds.includes(p.id)));
      
      // Use deleteProject for each
      projectIds.forEach(id => {
        if (store.deleteProject) {
          store.deleteProject(id);
        }
      });
      
      toast({
        title: 'Projects Deleted',
        description: `${projectIds.length} projects have been deleted.`,
      });
      
      return true;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete some projects',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [store]);

  // Archive project - Fixed: Use proper status type
  const archiveProject = useCallback(async (projectId: string): Promise<boolean> => {
    const result = await updateProject(projectId, { status: 'archived' as ProjectStatus });
    return result !== null;
  }, [updateProject]);

  // Unarchive project - Fixed: Use proper status type
  const unarchiveProject = useCallback(async (projectId: string): Promise<boolean> => {
    const result = await updateProject(projectId, { status: 'active' as ProjectStatus });
    return result !== null;
  }, [updateProject]);

  // Search projects
  const searchProjects = useCallback((query: string): Project[] => {
    const lowercaseQuery = query.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.description?.toLowerCase().includes(lowercaseQuery) ||
      p.roomType?.toLowerCase().includes(lowercaseQuery)
    );
  }, [projects]);

  // Filter by status - Fixed: Use proper type
  const filterByStatus = useCallback((status: ProjectStatus): Project[] => {
    return projects.filter(p => p.status === status);
  }, [projects]);

  // Filter by date range
  const filterByDateRange = useCallback((startDate: Date, endDate: Date): Project[] => {
    return projects.filter(p => {
      const createdAt = new Date(p.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }, [projects]);

  // Sort projects
  const sortProjects = useCallback((
    by: 'name' | 'date' | 'renders', 
    order: 'asc' | 'desc'
  ): Project[] => {
    return [...projects].sort((a, b) => {
      let comparison = 0;
      
      switch (by) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'renders':
          comparison = (a.renders?.length || 0) - (b.renders?.length || 0);
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
  }, [projects]);

  // Get project stats - Fixed: Check status properly
  const getProjectStats = useCallback(() => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      archived: projects.filter(p => p.status === 'archived').length,
      totalRenders: projects.reduce((sum, p) => sum + (p.renders?.length || 0), 0),
    };
  }, [projects]);

  // Refresh projects
  const refresh = useCallback(async (): Promise<void> => {
    await fetchProjects();
  }, [fetchProjects]);

  // Reset state
  const reset = useCallback(() => {
    setProjects([]);
    setCurrentProjectState(null);
    setError(null);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchProjects();
    }
  }, [autoFetch, fetchProjects]);

  return {
    // State
    projects,
    currentProject,
    isLoading,
    isCreating,
    isDeleting,
    error,
    
    // CRUD operations
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    
    // Project state management
    setCurrentProject: setCurrentProjectState,
    
    // Render operations
    addRender,
    removeRender,
    favoriteRender,
    downloadRender,
    
    // Bulk operations
    deleteMultipleProjects,
    archiveProject,
    unarchiveProject,
    
    // Search & filter
    searchProjects,
    filterByStatus,
    filterByDateRange,
    sortProjects,
    
    // Stats
    getProjectStats,
    
    // Utility
    refresh,
    reset,
  };
}