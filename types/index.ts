// types/index.ts
// Central export file for all types with conflict resolution

// ============================================
// EDITOR TYPES
// ============================================

export * from './editor';

// ============================================
// PROJECT TYPES (with selective exports to avoid conflicts)
// ============================================

export {
  type Project,
  type ProjectStatus,
  type ProjectSettings,
  type PropertyDetails,
  type PropertyType,
  type AddressDetails,
  type ProjectRoom,
  type WindowInfo,
  type DoorInfo,
  // Export CompassDirection from project as ProjectCompassDirection to avoid conflict
  type CompassDirection as ProjectCompassDirection,
  type Collaborator,
  type CollaboratorRole,
  type CollaboratorPermissions,
  type ShareSettings,
  type ProjectTemplate,
  type ProjectTemplateRoom,
  type ProjectComment,
  type ProjectActivity,
  type ProjectActivityType,
  type ProjectFilters,
  type ProjectSortField,
  type ProjectStats,
  type ProjectExport,
  type ProjectExportResult,
  type CreateProjectInput,
  // Project-specific versions (these have different structure from editor types)
  type CostEstimate as ProjectCostEstimate,
  type MaterialCost as ProjectMaterialCost,
  type LaborCost as ProjectLaborCost,
  type Tax as ProjectTax,
  type RoomDimensions as ProjectRoomDimensions,
} from './project';

// ============================================
// VASTU TYPES (selective exports)
// ============================================

export {
  type VastuAnalysis,
  type VastuRule,
  type VastuRuleEvaluation,
  type VastuScore,
  type VastuSuggestion,
  type VastuReport,
  type VastuCategory,
  type VastuStatus,
  type VastuPriority,
  type VastuElementType,
  type VastuSuggestionType,
  type VastuRemedyType,
  type VastuElement,
  // Note: CompassDirection from vastu.ts is not exported here to avoid conflict
} from './vastu';

// Export CompassDirection from vastu separately
export { type CompassDirection as VastuCompassDirection } from './vastu';

// ============================================
// COST TYPES (selective exports - note the actual exports are different)
// ============================================

export {
  type CostEstimate,
  type CurrencyAmount,
  type CurrencyRange,
  type CostBreakdown,
  type CostCategory,
  type CostLineItem,
  type CostLineItemAlternative,
  type QualityTier,
  type QualityTierConfig,
  type MaterialOption,
  type MaterialCategory,
  type CostLocation,
  type CityTier,
  type LaborRate,
  type LaborCategory,
  type Duration,
  type DurationPhase,
  type CostAdjustment,
  type AdjustmentType,
  type MarketComparison,
  type SimilarProject,
  type PriceIndex,
  type CostSettings,
  type CostReport,
  type ChartData,
  type VendorQuote,
  type FinancingOption,
  type CurrencyType,
  type CostBreakdownData,
  type MaterialGrade,
  type LaborQuality,
  type LaborType,
  type CostChartPoint,
  type CityPricing,
  type UICostSettings,
  type UICostLineItem,
  type UICostCategory,
  type UICostEstimate,
  type CostMaterialEntry,
  type UICostChartData,
  type UIEstimateDisplay,
  type CostBreakdownProps,
  type CitySelectorProps,
  type CurrencyToggleProps,
  type MaterialSelectorProps,
  type LaborCalculatorProps,
  type CostChartProps,
  type CostComparisonProps,
  type LaborCost,
} from './cost';

// ============================================
// API TYPES (selective exports)
// ============================================

export {
  type ApiResponse,
  type ApiError,
  type ValidationError,
  type ApiMeta,
  type AuthUser,
  type SyncUserRequest,
  type CreateProjectRequest,
  type UpdateProjectRequest,
  type GetProjectsRequest,
  type GetProjectsResponse,
  type AddRoomRequest,
  type GenerateRequest,
  type GenerateResponse,
  type GenerationStatusResponse,
  type InpaintRequest,
  type RemoveObjectRequest,
  type ReplaceObjectRequest,
  type EnhanceRequest,
  type EnhanceResponse,
  type VastuAnalyzeRequest,
  type VastuAnalyzeResponse,
  type VastuAutoFixRequest,
  type VastuAutoFixResponse,
  type CostEstimateRequest,
  type CostEstimateResponse,
  type CostUpdateRequest,
  type CostCompareRequest,
  type UploadResponse,
  type UploadProgress,
  type CreateCheckoutRequest,
  type CreateCheckoutResponse,
  type VerifyPaymentRequest,
  type VerifyPaymentResponse,
  type CancelSubscriptionRequest,
  type UpdateUserRequest,
  type UserCreditsResponse,
  type UserStatsResponse,
  type GetRendersRequest,
  type GetRendersResponse,
  type UpdateRenderRequest,
  type ClerkWebhookEvent,
  type StripeWebhookEvent,
  type RazorpayWebhookEvent,
  type ReplicateWebhookEvent,
  type AdminStatsRequest,
  type AdminStatsResponse,
  type AdminUsersRequest,
  type AdminUserActionRequest,
} from './api';

// ============================================
// COMMON TYPES
// ============================================

export type Locale = 'en' | 'hi';

export type Currency = 'INR' | 'USD';

export type SubscriptionPlan = 'free' | 'pro' | 'teams';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'expired' | 'trialing';

export type PaymentProvider = 'stripe' | 'razorpay';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  subscription: Subscription;
  credits: number;
  totalRenders: number;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: PaymentProvider | null;
  customerId: string | null;
  subscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface UserPreferences {
  language: Locale;
  currency: Currency;
  defaultStyle: string;
  defaultRoomType: string;
  emailNotifications: boolean;
  showVastuPanel: boolean;
  showCostPanel: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  description: string;
  priceMonthly: {
    INR: number;
    USD: number;
  };
  priceYearly: {
    INR: number;
    USD: number;
  };
  credits: number | 'unlimited';
  features: string[];
  highlighted: boolean;
  badge?: string;
}

// ============================================
// UI TYPES
// ============================================

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
  external?: boolean;
  children?: NavItem[];
}

export interface SidebarItem extends NavItem {
  isActive?: boolean;
  isCollapsed?: boolean;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  content?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  description?: string;
}

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

// ============================================
// PAGINATION & SORTING
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export type SortDirection = 'asc' | 'desc';

export interface SortParams {
  field: string;
  direction: SortDirection;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export interface UserAnalytics {
  totalProjects: number;
  totalRenders: number;
  creditsUsed: number;
  creditsRemaining: number;
  favoriteStyle: string;
  favoriteRoomType: string;
  avgVastuScore: number;
  avgRenderTime: number;
}

// ============================================
// ADMIN TYPES
// ============================================

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalRenders: number;
  revenue: {
    total: number;
    monthly: number;
    currency: Currency;
  };
  rendersByDay: {
    date: string;
    count: number;
  }[];
  usersByPlan: {
    plan: SubscriptionPlan;
    count: number;
  }[];
}

export interface AdminUser extends User {
  projects: number;
  renders: number;
  lastActive: Date;
  isAdmin: boolean;
}

// ============================================
// CHROME EXTENSION TYPES
// ============================================

export interface ExtensionMessage {
  type: 'CAPTURE_IMAGE' | 'ANALYZE_ROOM' | 'GET_USER' | 'OPEN_EDITOR';
  payload?: unknown;
}

export interface ExtensionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================
// PWA TYPES
// ============================================

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ============================================
// ERROR TYPES
// ============================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ValidationErrorLocal {
  field: string;
  message: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type WithId<T> = T & {
  id: string;
};

// ============================================
// RE-EXPORTS WITH PROPER NAMES (for convenience)
// ============================================

// Re-export commonly used types with clear names
export type {
  // From editor
  TransformationMode,
  DesignStyle,
  RoomType,
  Render,
  ImageData,
  MaskData,
  BrushSettings,
  EditorTool,
  ZoomLevel,
  InpaintRequest as EditorInpaintRequest, // Renamed to avoid conflict
  ObjectRemovalRequest,
  ObjectReplacementRequest,
  ColorOption,
  MaterialOption as EditorMaterialOption, // Renamed to avoid conflict
  Layer,
  ExportOptions,
  ExportResult,
  ComparisonData,
  EditorState,
  GenerationSettings,
  RenderQueueItem,
  HistoryEntry,
  EditorAction,
} from './editor';