import { ObjectId } from 'mongodb';
import { Render, ImageData, RoomTypeId } from './editor';
import { VastuAnalysis } from './vastu';
import { CostEstimate } from './cost';

// ============================================
// PROJECT (UNIFIED VERSION)
// ============================================

export interface Project {
  // Core identifiers
  _id: ObjectId | string;
  id: string;
  userId: string;
  
  // Basic info
  name: string;
  description?: string;
  thumbnail?: string;
  originalImageUrl: string;
  originalImageKey: string;
  
  // Room details
  roomType: string;
  roomTypeId?: RoomTypeId;
  style: string;
  
  // Property details
  propertyDetails?: PropertyDetails;
  
  // Rooms configuration
  rooms?: ProjectRoom[];
  
  // Budget & Currency
  budget?: number;
  currency?: 'INR' | 'USD';
  
  // Status
  status: ProjectStatus | 'draft' | 'processing' | 'completed' | 'failed';
  
  // Analysis
  vastuScore?: number;
  overallVastuScore?: number;
  costEstimate?: CostEstimate;
  totalCostEstimate?: CostEstimate;
  estimatedCost?: number;
  
  // Renders
  renders?: Render[];
  totalRenders?: number;
  renderCount: number;
  favoriteRenderId?: string;
  
  // Collaboration
  collaborators?: Collaborator[];
  shareSettings?: ShareSettings;
  
  // Visibility & Settings
  visibility: 'private' | 'public' | 'unlisted';
  settings?: ProjectSettings;
  isArchived: boolean;
  
  // Metadata
  tags: string[];
  isFavorite: boolean;
  
  // Timestamps
  lastOpenedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type ProjectStatus = 'draft' | 'in-progress' | 'completed' | 'archived';

// ============================================
// PROJECT SETTINGS
// ============================================

export interface ProjectSettings {
  enableVastu: boolean;
  enableCostTracking: boolean;
  defaultCurrency: 'INR' | 'USD';
  autoSave: boolean;
  quality: 'standard' | 'premium' | 'ultra';
  language: 'en' | 'hi';
  notifications: {
    email: boolean;
    push: boolean;
    aiSuggestions: boolean;
  };
}

// ============================================
// PROPERTY DETAILS
// ============================================

export interface PropertyDetails {
  propertyType: PropertyType;
  address?: AddressDetails;
  totalArea: number; // in sq ft
  areaUnit: 'sqft' | 'sqm';
  floors: number;
  yearBuilt?: number;
  facing: CompassDirection | null;
  budget?: {
    min: number;
    max: number;
    currency: 'INR' | 'USD';
  };
}

export type PropertyType =
  | 'apartment'
  | 'independent-house'
  | 'villa'
  | 'penthouse'
  | 'studio'
  | 'duplex'
  | 'farmhouse'
  | 'commercial'
  | 'office'
  | 'retail';

export type CompassDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface AddressDetails {
  street?: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// ============================================
// PROJECT ROOM
// ============================================

export interface ProjectRoom {
  id: string;
  projectId: string;
  
  // Room info
  name: string;
  type: RoomTypeId;
  floor: number;
  
  // Dimensions
  dimensions: RoomDimensions;
  
  // Original images
  originalImages: ImageData[];
  
  // Renders for this room
  renderIds: string[];
  selectedRenderId?: string;
  
  // Analysis
  vastuAnalysis?: VastuAnalysis;
  costEstimate?: CostEstimate;
  
  // Design preferences
  preferredStyle?: string;
  notes?: string;
  
  // Status
  status: 'pending' | 'designed' | 'approved';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'ft' | 'm';
  area: number;
  windows: WindowInfo[];
  doors: DoorInfo[];
}

export interface WindowInfo {
  id: string;
  direction: CompassDirection;
  width: number;
  height: number;
  type: 'standard' | 'bay' | 'french' | 'skylight';
}

export interface DoorInfo {
  id: string;
  direction: CompassDirection;
  width: number;
  height: number;
  type: 'single' | 'double' | 'sliding' | 'pocket';
  isMain: boolean;
}

// ============================================
// COST ESTIMATE (EXTENDED)
// ============================================

export interface CostEstimate {
  total: number;
  currency: 'INR' | 'USD';
  materials: MaterialCost[];
  labor: LaborCost[];
  taxes: Tax[];
  breakdown: {
    demolition?: number;
    construction?: number;
    electrical?: number;
    plumbing?: number;
    flooring?: number;
    painting?: number;
    furniture?: number;
    fixtures?: number;
    miscellaneous?: number;
  };
}

export interface MaterialCost {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  brand?: string;
  quality: 'economy' | 'standard' | 'premium' | 'luxury';
}

export interface LaborCost {
  id: string;
  category: string;
  hours: number;
  ratePerHour: number;
  total: number;
  workers: number;
}

export interface Tax {
  name: string;
  rate: number;
  amount: number;
}

// ============================================
// COLLABORATION
// ============================================

export interface Collaborator {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermissions;
  invitedAt: Date;
  joinedAt?: Date;
  status: 'pending' | 'active' | 'removed';
}

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface CollaboratorPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canExport: boolean;
  canComment: boolean;
  canApprove: boolean;
}

export interface ShareSettings {
  isPublic: boolean;
  publicUrl?: string;
  allowComments: boolean;
  allowDownload: boolean;
  expiresAt?: Date;
  password?: string;
}

// ============================================
// PROJECT TEMPLATES
// ============================================

export interface ProjectTemplate {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  thumbnail: string;
  propertyType: PropertyType;
  rooms: ProjectTemplateRoom[];
  defaultStyle: string;
  isPremium: boolean;
  usageCount: number;
}

export interface ProjectTemplateRoom {
  type: RoomTypeId;
  name: string;
  suggestedArea: number;
  suggestedStyle: string;
}

// ============================================
// PROJECT COMMENTS
// ============================================

export interface ProjectComment {
  id: string;
  projectId: string;
  roomId?: string;
  renderId?: string;
  
  userId: string;
  userName: string;
  userAvatar?: string;
  
  content: string;
  
  // Position on image (if applicable)
  position?: { x: number; y: number };
  
  // Replies
  parentId?: string;
  replies?: ProjectComment[];
  
  // Status
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// PROJECT ACTIVITY
// ============================================

export interface ProjectActivity {
  id: string;
  projectId: string;
  
  type: ProjectActivityType;
  description: string;
  
  userId: string;
  userName: string;
  userAvatar?: string;
  
  metadata?: Record<string, unknown>;
  
  createdAt: Date;
}

export type ProjectActivityType =
  | 'project_created'
  | 'project_updated'
  | 'room_added'
  | 'room_removed'
  | 'render_created'
  | 'render_approved'
  | 'collaborator_added'
  | 'collaborator_removed'
  | 'comment_added'
  | 'comment_resolved'
  | 'export_generated'
  | 'status_changed';

// ============================================
// PROJECT FILTERS & SORTING
// ============================================

export interface ProjectFilters {
  status?: ProjectStatus[];
  propertyType?: PropertyType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasVastuAnalysis?: boolean;
  hasCostEstimate?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  search?: string;
}

export type ProjectSortField =
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'lastOpenedAt'
  | 'totalRenders'
  | 'overallVastuScore';

// ============================================
// PROJECT STATS
// ============================================

export interface ProjectStats {
  totalRooms: number;
  completedRooms: number;
  totalRenders: number;
  totalArea: number;
  avgVastuScore: number;
  totalEstimatedCost: {
    INR: number;
    USD: number;
  };
  mostUsedStyle: string;
  lastActivity: Date;
}

// ============================================
// PROJECT EXPORT
// ============================================

export interface ProjectExport {
  format: 'pdf' | 'zip' | 'pptx';
  includeOriginals: boolean;
  includeRenders: boolean;
  includeVastuReports: boolean;
  includeCostReports: boolean;
  includeComments: boolean;
  resolution: 'standard' | 'high' | 'print';
  watermark: boolean;
}

export interface ProjectExportResult {
  url: string;
  filename: string;
  size: number;
  expiresAt: Date;
}

// ============================================
// CREATE PROJECT INPUT
// ============================================

export interface CreateProjectInput {
  name: string;
  description?: string;
  roomType: string;
  style: string;
  budget?: number;
  currency?: 'INR' | 'USD';
  imageUrl: string;
  imageKey: string;
  settings?: Partial<ProjectSettings>;
}