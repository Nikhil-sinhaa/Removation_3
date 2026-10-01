// stores/user-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================
// TYPES
// ============================================

export type SubscriptionPlan = 'free' | 'pro' | 'teams' | 'enterprise';
export type Currency = 'INR' | 'USD';
export type Language = 'en' | 'hi';
export type Theme = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

export interface Credits {
  balance: number;
  monthlyAllocation: number;
  used: number;
  resetDate: Date;
}

export interface Preferences {
  theme: Theme;
  language: Language;
  currency: Currency;
  emailNotifications: boolean;
  marketingEmails: boolean;
  autoSave: boolean;
  showTips: boolean;
  defaultStyle: string | null;
  defaultRoomType: string | null;
  vastuEnabled: boolean;
  costPanelEnabled: boolean;
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
}

// ============================================
// STORE INTERFACE
// ============================================

interface UserState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Subscription
  subscription: Subscription | null;
  
  // Credits
  credits: Credits | null;
  
  // Preferences
  preferences: Preferences;
  
  // UI State
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  notificationsOpen: boolean;
  commandPaletteOpen: boolean;
  insufficientCreditsModalOpen: boolean;
  
  // Onboarding
  onboardingComplete: boolean;
  onboardingStep: number;
}

interface UserActions {
  // Auth
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  
  // Subscription
  setSubscription: (subscription: Subscription | null) => void;
  isPro: () => boolean;
  isTeams: () => boolean;
  isEnterprise: () => boolean;
  canAccessFeature: (feature: string) => boolean;
  
  // Credits
  setCredits: (credits: Credits | null) => void;
  useCredits: (amount: number) => boolean;
  hasCredits: (amount: number) => boolean;
  getCreditsPercentage: () => number;
  
  // Preferences
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  setPreferences: (preferences: Partial<Preferences>) => void;
  resetPreferences: () => void;
  
  // Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // Language
  setLanguage: (language: Language) => void;
  
  // Currency
  setCurrency: (currency: Currency) => void;
  
  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Mobile Menu
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  
  // Notifications
  toggleNotifications: () => void;
  
  // Command Palette
  toggleCommandPalette: () => void;
  
  // Credits Modal
  setInsufficientCreditsModalOpen: (open: boolean) => void;
  
  // Onboarding
  setOnboardingComplete: (complete: boolean) => void;
  setOnboardingStep: (step: number) => void;
  nextOnboardingStep: () => void;
  skipOnboarding: () => void;
  
  // Full name
  getFullName: () => string;
  getInitials: () => string;
  
  // Reset
  reset: () => void;
}

type UserStore = UserState & UserActions;

// ============================================
// DEFAULT PREFERENCES
// ============================================

const defaultPreferences: Preferences = {
  theme: 'system',
  language: 'en',
  currency: 'INR',
  emailNotifications: true,
  marketingEmails: false,
  autoSave: true,
  showTips: true,
  defaultStyle: null,
  defaultRoomType: null,
  vastuEnabled: true,
  costPanelEnabled: true,
  soundEnabled: true,
  browserNotificationsEnabled: false,
};

// ============================================
// INITIAL STATE
// ============================================

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  subscription: null,
  credits: null,
  preferences: defaultPreferences,
  sidebarOpen: true,
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  notificationsOpen: false,
  commandPaletteOpen: false,
  insufficientCreditsModalOpen: false,
  onboardingComplete: false,
  onboardingStep: 0,
};

// ============================================
// FEATURE ACCESS MAP
// ============================================

const featureAccessMap: Record<string, SubscriptionPlan[]> = {
  'basic-generation': ['free', 'pro', 'teams', 'enterprise'],
  'hd-export': ['pro', 'teams', 'enterprise'],
  '4k-export': ['teams', 'enterprise'],
  'batch-processing': ['pro', 'teams', 'enterprise'],
  'priority-queue': ['pro', 'teams', 'enterprise'],
  'vastu-analysis': ['free', 'pro', 'teams', 'enterprise'],
  'cost-calculator': ['free', 'pro', 'teams', 'enterprise'],
  'team-collaboration': ['teams', 'enterprise'],
  'api-access': ['enterprise'],
  'custom-models': ['enterprise'],
  'white-label': ['enterprise'],
  'advanced-inpaint': ['pro', 'teams', 'enterprise'],
  'style-transfer': ['pro', 'teams', 'enterprise'],
  'floor-plan-3d': ['teams', 'enterprise'],
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ============================================
        // AUTH
        // ============================================

        setUser: (user) =>
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
            state.isLoading = false;
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        logout: () =>
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.subscription = null;
            state.credits = null;
            state.insufficientCreditsModalOpen = false;
            state.onboardingComplete = false;
            state.onboardingStep = 0;
          }),

        // ============================================
        // SUBSCRIPTION
        // ============================================

        setSubscription: (subscription) =>
          set((state) => {
            state.subscription = subscription;
          }),

        isPro: () => {
          const plan = get().subscription?.plan;
          return plan === 'pro' || plan === 'teams' || plan === 'enterprise';
        },

        isTeams: () => {
          const plan = get().subscription?.plan;
          return plan === 'teams' || plan === 'enterprise';
        },

        isEnterprise: () => get().subscription?.plan === 'enterprise',

        canAccessFeature: (feature) => {
          const plan = get().subscription?.plan || 'free';
          const allowedPlans = featureAccessMap[feature];
          return allowedPlans ? allowedPlans.includes(plan) : false;
        },

        // ============================================
        // CREDITS
        // ============================================

        setCredits: (credits) =>
          set((state) => {
            state.credits = credits;
          }),

        useCredits: (amount) => {
          const state = get();
          if (!state.credits || state.credits.balance < amount) {
            return false;
          }
          set((s) => {
            if (s.credits) {
              s.credits.balance -= amount;
              s.credits.used += amount;
            }
          });
          return true;
        },

        hasCredits: (amount) => {
          const credits = get().credits;
          return credits ? credits.balance >= amount : false;
        },

        getCreditsPercentage: () => {
          const credits = get().credits;
          if (!credits) return 0;
          return Math.round((credits.balance / credits.monthlyAllocation) * 100);
        },

        // ============================================
        // PREFERENCES
        // ============================================

        setPreference: (key, value) =>
          set((state) => {
            state.preferences[key] = value;
          }),

        setPreferences: (preferences) =>
          set((state) => {
            state.preferences = { ...state.preferences, ...preferences };
          }),

        resetPreferences: () =>
          set((state) => {
            state.preferences = defaultPreferences;
          }),

        // ============================================
        // THEME
        // ============================================

        setTheme: (theme) =>
          set((state) => {
            state.preferences.theme = theme;
          }),

        toggleTheme: () =>
          set((state) => {
            const current = state.preferences.theme;
            if (current === 'light') {
              state.preferences.theme = 'dark';
            } else if (current === 'dark') {
              state.preferences.theme = 'light';
            } else {
              // System - toggle to light or dark based on system preference
              state.preferences.theme = 'light';
            }
          }),

        // ============================================
        // LANGUAGE
        // ============================================

        setLanguage: (language) =>
          set((state) => {
            state.preferences.language = language;
            // Sync to localStorage so LanguageProvider (React Context) picks it up on next mount
            if (typeof window !== 'undefined') {
              localStorage.setItem('language', language);
              document.documentElement.lang = language;
            }
          }),

        // ============================================
        // CURRENCY
        // ============================================

        setCurrency: (currency) =>
          set((state) => {
            state.preferences.currency = currency;
          }),

        // ============================================
        // SIDEBAR
        // ============================================

        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

        setSidebarOpen: (open) =>
          set((state) => {
            state.sidebarOpen = open;
          }),

        setSidebarCollapsed: (collapsed) =>
          set((state) => {
            state.sidebarCollapsed = collapsed;
          }),

        // ============================================
        // MOBILE MENU
        // ============================================

        toggleMobileMenu: () =>
          set((state) => {
            state.mobileMenuOpen = !state.mobileMenuOpen;
          }),

        setMobileMenuOpen: (open) =>
          set((state) => {
            state.mobileMenuOpen = open;
          }),

        // ============================================
        // NOTIFICATIONS
        // ============================================

        toggleNotifications: () =>
          set((state) => {
            state.notificationsOpen = !state.notificationsOpen;
          }),

        // ============================================
        // COMMAND PALETTE
        // ============================================

        toggleCommandPalette: () =>
          set((state) => {
            state.commandPaletteOpen = !state.commandPaletteOpen;
          }),

        setInsufficientCreditsModalOpen: (open) =>
          set((state) => {
            state.insufficientCreditsModalOpen = open;
          }),

        // ============================================
        // ONBOARDING
        // ============================================

        setOnboardingComplete: (complete) =>
          set((state) => {
            state.onboardingComplete = complete;
          }),

        setOnboardingStep: (step) =>
          set((state) => {
            state.onboardingStep = step;
          }),

        nextOnboardingStep: () =>
          set((state) => {
            state.onboardingStep += 1;
          }),

        skipOnboarding: () =>
          set((state) => {
            state.onboardingComplete = true;
            state.onboardingStep = 0;
          }),

        // ============================================
        // HELPERS
        // ============================================

        getFullName: () => {
          const user = get().user;
          if (!user) return '';
          return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
        },

        getInitials: () => {
          const user = get().user;
          if (!user) return '';
          if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
          }
          if (user.firstName) {
            return user.firstName.slice(0, 2).toUpperCase();
          }
          return user.email.slice(0, 2).toUpperCase();
        },

        // ============================================
        // RESET
        // ============================================

        reset: () =>
          set(() => ({
            ...initialState,
            preferences: defaultPreferences,
          })),
      })),
      {
        name: 'removation-user',
        partialize: (state) => ({
          preferences: state.preferences,
          sidebarCollapsed: state.sidebarCollapsed,
          onboardingComplete: state.onboardingComplete,
        }),
      }
    ),
    { name: 'UserStore' }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectUser = (state: UserStore) => state.user;
export const selectIsAuthenticated = (state: UserStore) => state.isAuthenticated;
export const selectIsLoading = (state: UserStore) => state.isLoading;
export const selectSubscription = (state: UserStore) => state.subscription;
export const selectCredits = (state: UserStore) => state.credits;
export const selectPreferences = (state: UserStore) => state.preferences;
export const selectTheme = (state: UserStore) => state.preferences.theme;
export const selectLanguage = (state: UserStore) => state.preferences.language;
export const selectCurrency = (state: UserStore) => state.preferences.currency;
export const selectSidebarOpen = (state: UserStore) => state.sidebarOpen;
export const selectSidebarCollapsed = (state: UserStore) => state.sidebarCollapsed;
export const selectMobileMenuOpen = (state: UserStore) => state.mobileMenuOpen;
export const selectOnboardingComplete = (state: UserStore) => state.onboardingComplete;

// ============================================
// HOOKS FOR COMMON PATTERNS
// ============================================

export const useTheme = () => useUserStore((state) => state.preferences.theme);
/** @deprecated Use selectLanguage selector or useLanguage from @/hooks/useLanguage instead */
export const useStoredLanguage = () => useUserStore((state) => state.preferences.language);
export const useCurrency = () => useUserStore((state) => state.preferences.currency);

export default useUserStore;