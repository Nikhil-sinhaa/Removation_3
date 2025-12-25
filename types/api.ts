// types/api.ts
// API request/response types

import { User, SubscriptionPlan, PaginatedResponse } from './index';
import { Project, ProjectFilters, ProjectSortField } from './project';
import { Render, GenerationSettings, TransformationMode } from './editor';
import { VastuAnalysis } from './vastu';
import { CostEstimate, CostSettings } from './cost';

// ============================================
// COMMON API TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiMeta {
  requestId: string;
  timestamp: Date;
  processingTime: number;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: Date;
  };
}

// ============================================
// AUTHENTICATION
// ============================================

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  subscription: {
    plan: SubscriptionPlan;
    credits: number;
  };
}

export interface SyncUserRequest {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

// ============================================
// PROJECT API
// ============================================

export interface CreateProjectRequest {
  name: string;
  description?: string;
  propertyType: string;
  totalArea: number;
  areaUnit: 'sqft' | 'sqm';
  city: string;
  state: string;
  country: string;
  facing?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  propertyDetails?: Partial<Project['propertyDetails']>;
  tags?: string[];
  status?: string;
  isFavorite?: boolean;
}

export interface GetProjectsRequest {
  page?: number;
  limit?: number;
  filters?: ProjectFilters;
  sortField?: ProjectSortField;
  sortDirection?: 'asc' | 'desc';
}

export type GetProjectsResponse = PaginatedResponse<Project>;

export interface AddRoomRequest {
  projectId: string;
  name: string;
  type: string;
  floor?: number;
  length?: number;
  width?: number;
  height?: number;
  unit?: 'ft' | 'm';
}

// ============================================
// GENERATION API
// ============================================

export interface GenerateRequest {
  projectId?: string;
  roomId?: string;
  
  // Image
  sourceImageUrl: string;
  maskUrl?: string;
  
  // Mode & Style
  mode: TransformationMode;
  styleId: string;
  roomType: string;
  
  // Prompts
  prompt?: string;
  negativePrompt?: string;
  
  // Settings
  strength?: number;
  guidanceScale?: number;
  seed?: number;
  numberOfOutputs?: number;
  
  // Extra options
  colorHex?: string;
  materialId?: string;
  
  // Analysis
  runVastuAnalysis?: boolean;
  runCostEstimate?: boolean;
  costSettings?: Partial<CostSettings>;
}

export interface GenerateResponse {
  renderId: string;
  status: 'pending' | 'processing';
  estimatedTime: number;
  creditsUsed: number;
  creditsRemaining: number;
}

export interface GenerationStatusResponse {
  renderId: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  progress: number;
  statusMessage: string;
  outputUrls?: string[];
  error?: string;
  render?: Render;
}

// ============================================
// INPAINT API
// ============================================

export interface InpaintRequest {
  sourceImageUrl: string;
  maskUrl: string;
  prompt: string;
  negativePrompt?: string;
  strength?: number;
  guidanceScale?: number;
}

export interface RemoveObjectRequest {
  sourceImageUrl: string;
  maskUrl: string;
}

export interface ReplaceObjectRequest {
  sourceImageUrl: string;
  maskUrl: string;
  replacementPrompt: string;
  style?: string;
}

// ============================================
// ENHANCE API
// ============================================

export interface EnhanceRequest {
  imageUrl: string;
  scale?: 2 | 4;
  faceEnhance?: boolean;
  denoiseStrength?: number;
}

export interface EnhanceResponse {
  enhancedUrl: string;
  originalResolution: { width: number; height: number };
  newResolution: { width: number; height: number };
  processingTime: number;
}

// ============================================
// VASTU API
// ============================================

export interface VastuAnalyzeRequest {
  imageUrl: string;
  roomType: string;
  roomDirection?: string;
  propertyFacing?: string;
  includeAutoFix?: boolean;
}

export interface VastuAnalyzeResponse {
  analysis: VastuAnalysis;
  processingTime: number;
}

export interface VastuAutoFixRequest {
  imageUrl: string;
  analysisId: string;
  suggestionIds: string[];
}

export interface VastuAutoFixResponse {
  fixedImageUrl: string;
  appliedFixes: string[];
  newScore: number;
  previousScore: number;
  improvement: number;
}

// ============================================
// COST API
// ============================================

export interface CostEstimateRequest {
  imageUrl?: string;
  renderId?: string;
  
  roomType: string;
  area: number;
  areaUnit: 'sqft' | 'sqm';
  
  settings: Partial<CostSettings>;
  
  detectedElements?: string[];
}

export interface CostEstimateResponse {
  estimate: CostEstimate;
  processingTime: number;
}

export interface CostUpdateRequest {
  estimateId: string;
  lineItemId: string;
  updates: {
    quantity?: number;
    unitPrice?: { INR?: number; USD?: number };
    materialId?: string;
    quality?: string;
  };
}

export interface CostCompareRequest {
  estimateId: string;
  compareWith: 'city' | 'national' | 'similar';
  similarCriteria?: {
    roomType?: string;
    style?: string;
    area?: { min: number; max: number };
  };
}

// ============================================
// UPLOAD API
// ============================================

export interface UploadResponse {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
}

export interface UploadProgress {
  progress: number;
  uploaded: number;
  total: number;
}

// ============================================
// PAYMENT API
// ============================================

export interface CreateCheckoutRequest {
  plan: SubscriptionPlan;
  billing: 'monthly' | 'yearly';
  currency: 'INR' | 'USD';
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResponse {
  provider: 'stripe' | 'razorpay';
  sessionId?: string;
  orderId?: string;
  url?: string;
  key?: string;
}

export interface VerifyPaymentRequest {
  provider: 'stripe' | 'razorpay';
  sessionId?: string;
  orderId?: string;
  paymentId?: string;
  signature?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  subscription: User['subscription'];
  credits: number;
}

export interface CancelSubscriptionRequest {
  cancelImmediately: boolean;
  reason?: string;
}

// ============================================
// USER API
// ============================================

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  preferences?: Partial<User['preferences']>;
}

export interface UserCreditsResponse {
  total: number;
  used: number;
  remaining: number;
  resetsAt?: Date;
  plan: SubscriptionPlan;
}

export interface UserStatsResponse {
  totalProjects: number;
  totalRenders: number;
  totalCreditsUsed: number;
  memberSince: Date;
  favoriteStyle: string;
  favoriteRoomType: string;
  avgVastuScore: number;
}

// ============================================
// RENDER API
// ============================================

export interface GetRendersRequest {
  projectId?: string;
  roomId?: string;
  page?: number;
  limit?: number;
  status?: string;
  isFavorite?: boolean;
}

export type GetRendersResponse = PaginatedResponse<Render>;

export interface UpdateRenderRequest {
  isFavorite?: boolean;
  isPublic?: boolean;
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    created_at: number;
    updated_at: number;
  };
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      customer: string;
      subscription?: string;
      status?: string;
      current_period_start?: number;
      current_period_end?: number;
      cancel_at_period_end?: boolean;
    };
  };
}

export interface RazorpayWebhookEvent {
  event: string;
  payload: {
    subscription?: {
      entity: {
        id: string;
        customer_id: string;
        status: string;
        current_start: number;
        current_end: number;
      };
    };
    payment?: {
      entity: {
        id: string;
        order_id: string;
        status: string;
      };
    };
  };
}

export interface ReplicateWebhookEvent {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  metrics?: {
    predict_time: number;
  };
}

// ============================================
// ADMIN API
// ============================================

export interface AdminStatsRequest {
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface AdminStatsResponse {
  users: {
    total: number;
    active: number;
    new: number;
    byPlan: Record<SubscriptionPlan, number>;
  };
  renders: {
    total: number;
    today: number;
    byMode: Record<TransformationMode, number>;
    byDay: { date: string; count: number }[];
  };
  revenue: {
    total: { INR: number; USD: number };
    monthly: { INR: number; USD: number };
    byProvider: Record<string, number>;
  };
  performance: {
    avgRenderTime: number;
    successRate: number;
    errorRate: number;
  };
}

export interface AdminUsersRequest {
  page?: number;
  limit?: number;
  search?: string;
  plan?: SubscriptionPlan;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface AdminUserActionRequest {
  userId: string;
  action: 'ban' | 'unban' | 'addCredits' | 'removeCredits' | 'changePlan';
  value?: number | string;
  reason?: string;
}