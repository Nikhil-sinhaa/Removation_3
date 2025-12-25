// stores/project-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Project } from '@/types/project';

// ============================================
// TYPE DEFINITIONS
// ============================================

// Add these types if they don't exist in your types/project.ts
export type ProjectSortOption = 
  | 'name' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'renders' 
  | 'status';

export interface ProjectFilter {
  status: Project['status'] | 'all';
  roomType: string | null;
  dateRange: { start: Date; end: Date } | null;
  style?: string | null;
  minCost?: number | null;
  maxCost?: number | null;
}

// ============================================
// STORE INTERFACE
// ============================================

interface ProjectState {
  // Data
  projects: Project[];
  currentProject: Project | null;
  favorites: string[]; // Project IDs
  recentlyViewed: string[]; // Project IDs
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Filters & Sort
  searchQuery: string;
  sortBy: ProjectSortOption;
  filter: ProjectFilter;
  view: 'grid' | 'list';
  
  // Selection
  selectedProjects: string[];
  isSelectMode: boolean;
  
  // Pagination
  page: number;
  perPage: number;
  totalCount: number;
  hasMore: boolean;
}

interface ProjectActions {
  // CRUD
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  deleteProjects: (ids: string[]) => void;
  
  // Current Project
  setCurrentProject: (project: Project | null) => void;
  
  // Favorites
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  
  // Recently Viewed
  addToRecentlyViewed: (id: string) => void;
  clearRecentlyViewed: () => void;
  
  // Loading & Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Filters & Sort
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: ProjectSortOption) => void;
  setFilter: (filter: ProjectFilter) => void;
  setView: (view: 'grid' | 'list') => void;
  clearFilters: () => void;
  
  // Selection
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSelectMode: (mode: boolean) => void;
  
  // Pagination
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setTotalCount: (count: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Computed
  getFilteredProjects: () => Project[];
  getProjectById: (id: string) => Project | undefined;
  getFavoriteProjects: () => Project[];
  getRecentProjects: (limit?: number) => Project[];
  
  // Reset
  reset: () => void;
}

type ProjectStore = ProjectState & ProjectActions;

// ============================================
// INITIAL STATE
// ============================================

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  favorites: [],
  recentlyViewed: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  sortBy: 'updatedAt',
  filter: {
    status: 'all',
    roomType: null,
    dateRange: null,
  },
  view: 'grid',
  selectedProjects: [],
  isSelectMode: false,
  page: 1,
  perPage: 12,
  totalCount: 0,
  hasMore: false,
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ============================================
        // CRUD
        // ============================================

        setProjects: (projects) =>
          set((state) => {
            state.projects = projects;
            state.hasMore = projects.length >= state.perPage;
          }),

        addProject: (project) =>
          set((state) => {
            state.projects.unshift(project);
            state.totalCount += 1;
          }),

        updateProject: (id, updates) =>
          set((state) => {
            const index = state.projects.findIndex((p: Project) => p.id === id);
            if (index !== -1) {
              state.projects[index] = { ...state.projects[index], ...updates };
            }
            if (state.currentProject?.id === id) {
              state.currentProject = { ...state.currentProject, ...updates };
            }
          }),

        deleteProject: (id) =>
          set((state) => {
            state.projects = state.projects.filter((p: Project) => p.id !== id);
            state.favorites = state.favorites.filter((fid: string) => fid !== id);
            state.recentlyViewed = state.recentlyViewed.filter((rid: string) => rid !== id);
            state.selectedProjects = state.selectedProjects.filter((sid: string) => sid !== id);
            state.totalCount = Math.max(0, state.totalCount - 1);
            if (state.currentProject?.id === id) {
              state.currentProject = null;
            }
          }),

        deleteProjects: (ids) =>
          set((state) => {
            state.projects = state.projects.filter((p: Project) => !ids.includes(p.id));
            state.favorites = state.favorites.filter((fid: string) => !ids.includes(fid));
            state.recentlyViewed = state.recentlyViewed.filter((rid: string) => !ids.includes(rid));
            state.selectedProjects = [];
            state.totalCount = Math.max(0, state.totalCount - ids.length);
            if (state.currentProject && ids.includes(state.currentProject.id)) {
              state.currentProject = null;
            }
          }),

        // ============================================
        // CURRENT PROJECT
        // ============================================

        setCurrentProject: (project) =>
          set((state) => {
            state.currentProject = project;
            if (project) {
              // Add to recently viewed
              state.recentlyViewed = [
                project.id,
                ...state.recentlyViewed.filter((id: string) => id !== project.id),
              ].slice(0, 10);
            }
          }),

        // ============================================
        // FAVORITES
        // ============================================

        toggleFavorite: (id) =>
          set((state) => {
            const index = state.favorites.indexOf(id);
            if (index !== -1) {
              state.favorites.splice(index, 1);
            } else {
              state.favorites.push(id);
            }
            // Update project
            const projectIndex = state.projects.findIndex((p: Project) => p.id === id);
            if (projectIndex !== -1) {
              state.projects[projectIndex].isFavorite = index === -1;
            }
          }),

        isFavorite: (id) => get().favorites.includes(id),

        // ============================================
        // RECENTLY VIEWED
        // ============================================

        addToRecentlyViewed: (id) =>
          set((state) => {
            state.recentlyViewed = [
              id,
              ...state.recentlyViewed.filter((rid: string) => rid !== id),
            ].slice(0, 10);
          }),

        clearRecentlyViewed: () =>
          set((state) => {
            state.recentlyViewed = [];
          }),

        // ============================================
        // LOADING & ERROR
        // ============================================

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        // ============================================
        // FILTERS & SORT
        // ============================================

        setSearchQuery: (query) =>
          set((state) => {
            state.searchQuery = query;
            state.page = 1;
          }),

        setSortBy: (sort) =>
          set((state) => {
            state.sortBy = sort;
          }),

        setFilter: (filter) =>
          set((state) => {
            state.filter = { ...state.filter, ...filter };
            state.page = 1;
          }),

        setView: (view) =>
          set((state) => {
            state.view = view;
          }),

        clearFilters: () =>
          set((state) => {
            state.searchQuery = '';
            state.filter = initialState.filter;
            state.page = 1;
          }),

        // ============================================
        // SELECTION
        // ============================================

        toggleSelection: (id) =>
          set((state) => {
            const index = state.selectedProjects.indexOf(id);
            if (index !== -1) {
              state.selectedProjects.splice(index, 1);
            } else {
              state.selectedProjects.push(id);
            }
          }),

        selectAll: () =>
          set((state) => {
            state.selectedProjects = state.projects.map((p: Project) => p.id);
          }),

        clearSelection: () =>
          set((state) => {
            state.selectedProjects = [];
            state.isSelectMode = false;
          }),

        setSelectMode: (mode) =>
          set((state) => {
            state.isSelectMode = mode;
            if (!mode) {
              state.selectedProjects = [];
            }
          }),

        // ============================================
        // PAGINATION
        // ============================================

        setPage: (page) =>
          set((state) => {
            state.page = page;
          }),

        setPerPage: (perPage) =>
          set((state) => {
            state.perPage = perPage;
            state.page = 1;
          }),

        setTotalCount: (count) =>
          set((state) => {
            state.totalCount = count;
            state.hasMore = state.projects.length < count;
          }),

        nextPage: () =>
          set((state) => {
            if (state.hasMore) {
              state.page += 1;
            }
          }),

        prevPage: () =>
          set((state) => {
            if (state.page > 1) {
              state.page -= 1;
            }
          }),

        // ============================================
        // COMPUTED
        // ============================================

        getFilteredProjects: () => {
          const state = get();
          let filtered = [...state.projects];

          // Search
          if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(
              (p: Project) =>
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
          }

          // Filter by status
          if (state.filter.status && state.filter.status !== 'all') {
            filtered = filtered.filter((p: Project) => p.status === state.filter.status);
          }

          // Filter by room type
          if (state.filter.roomType) {
            filtered = filtered.filter((p: Project) => p.roomType === state.filter.roomType);
          }

          // Filter by date range
          if (state.filter.dateRange) {
            const { start, end } = state.filter.dateRange;
            filtered = filtered.filter((p: Project) => {
              const date = new Date(p.createdAt);
              return date >= start && date <= end;
            });
          }

          // Sort
          filtered.sort((a: Project, b: Project) => {
            switch (state.sortBy) {
              case 'name':
                return a.name.localeCompare(b.name);
              case 'createdAt':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              case 'updatedAt':
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
              case 'renders':
                return (b.renderCount || 0) - (a.renderCount || 0);
              default:
                return 0;
            }
          });

          return filtered;
        },

        getProjectById: (id: string) => get().projects.find((p: Project) => p.id === id),

        getFavoriteProjects: () => {
          const state = get();
          return state.projects.filter((p: Project) => state.favorites.includes(p.id));
        },

        getRecentProjects: (limit = 5) => {
          const state = get();
          return state.recentlyViewed
            .slice(0, limit)
            .map((id: string) => state.projects.find((p: Project) => p.id === id))
            .filter((p: Project | undefined): p is Project => p !== undefined);
        },

        // ============================================
        // RESET
        // ============================================

        reset: () => set(() => initialState),
      })),
      {
        name: 'removation-projects',
        partialize: (state) => ({
          favorites: state.favorites,
          recentlyViewed: state.recentlyViewed,
          view: state.view,
          sortBy: state.sortBy,
          perPage: state.perPage,
        }),
      }
    ),
    { name: 'ProjectStore' }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectProjects = (state: ProjectStore) => state.projects;
export const selectCurrentProject = (state: ProjectStore) => state.currentProject;
export const selectIsLoading = (state: ProjectStore) => state.isLoading;
export const selectError = (state: ProjectStore) => state.error;
export const selectSearchQuery = (state: ProjectStore) => state.searchQuery;
export const selectSortBy = (state: ProjectStore) => state.sortBy;
export const selectFilter = (state: ProjectStore) => state.filter;
export const selectView = (state: ProjectStore) => state.view;
export const selectSelectedProjects = (state: ProjectStore) => state.selectedProjects;
export const selectIsSelectMode = (state: ProjectStore) => state.isSelectMode;
export const selectPagination = (state: ProjectStore) => ({
  page: state.page,
  perPage: state.perPage,
  totalCount: state.totalCount,
  hasMore: state.hasMore,
});

export default useProjectStore;