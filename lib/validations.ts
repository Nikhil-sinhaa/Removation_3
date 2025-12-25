// lib/validations.ts
import { z } from "zod";

// ============================================
// BASE SCHEMAS
// ============================================

export const emailSchema = z
  .string()
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Please enter a valid Indian phone number");

export const urlSchema = z.string().url("Please enter a valid URL");

export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// ============================================
// USER SCHEMAS
// ============================================

export const userProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name is too long"),
  email: emailSchema,
  phone: phoneSchema.optional(),
  avatar: urlSchema.optional(),
  language: z.enum(["en", "hi"]).default("en"),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED"]).default("INR"),
});

export const userPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  weeklyDigest: z.boolean().default(true),
  defaultStyle: z.string().optional(),
  defaultRoomType: z.string().optional(),
  autoSave: z.boolean().default(true),
  highQualityRenders: z.boolean().default(false),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// ============================================
// PROJECT SCHEMAS
// ============================================

export const projectCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  roomType: z.string().min(1, "Room type is required"),
  style: z.string().optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const projectSettingsSchema = z.object({
  isPublic: z.boolean().default(false),
  allowDownload: z.boolean().default(true),
  watermark: z.boolean().default(false),
  collaborators: z.array(emailSchema).max(10).optional(),
});

export type ProjectCreate = z.infer<typeof projectCreateSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
export type ProjectSettings = z.infer<typeof projectSettingsSchema>;

// ============================================
// RENDER / GENERATION SCHEMAS
// ============================================

export const roomTypeSchema = z.enum([
  "living-room",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining-room",
  "home-office",
  "kids-room",
  "balcony",
  "terrace",
  "pooja-room",
  "entrance",
  "corridor",
  "basement",
  "attic",
  "garage",
  "garden",
  "pool",
  "outdoor",
  "commercial",
  "retail",
  "restaurant",
  "cafe",
  "hotel-lobby",
  "hotel-room",
  "spa",
  "gym",
  "clinic",
  "office",
  "coworking",
  "studio",
]);

export const styleSchema = z.string().min(1, "Style is required");

export const generateRequestSchema = z.object({
  imageUrl: urlSchema,
  roomType: roomTypeSchema,
  style: styleSchema,
  mode: z.enum([
    "redesign",
    "fill-room",
    "sketch-to-render",
    "outdoor",
    "enhance",
    "virtual-staging",
  ]).default("redesign"),
  options: z.object({
    preserveLayout: z.boolean().default(true),
    preserveColors: z.boolean().default(false),
    preserveFurniture: z.boolean().default(false),
    creativity: z.number().min(0).max(100).default(50),
    quality: z.enum(["draft", "standard", "high", "ultra"]).default("standard"),
    aspectRatio: z.enum(["1:1", "4:3", "16:9", "3:4", "9:16"]).default("4:3"),
    variations: z.number().min(1).max(4).default(1),
  }).optional(),
  customPrompt: z.string().max(500).optional(),
});

export type RoomType = z.infer<typeof roomTypeSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// ============================================
// INPAINT / OBJECT REPLACEMENT SCHEMAS
// ============================================

export const inpaintRequestSchema = z.object({
  imageUrl: urlSchema,
  maskBase64: z.string().min(1, "Mask is required"),
  prompt: z.string().min(1, "Description is required").max(500),
  negativePrompt: z.string().max(500).optional(),
  strength: z.number().min(0).max(1).default(0.8),
});

export const objectReplaceSchema = z.object({
  imageUrl: urlSchema,
  maskBase64: z.string().min(1, "Selection mask is required"),
  objectType: z.enum([
    "sofa",
    "chair",
    "table",
    "bed",
    "lamp",
    "plant",
    "artwork",
    "rug",
    "curtain",
    "shelf",
    "cabinet",
    "desk",
    "mirror",
    "other",
  ]),
  style: styleSchema.optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  customPrompt: z.string().max(300).optional(),
});

export const removeObjectSchema = z.object({
  imageUrl: urlSchema,
  maskBase64: z.string().min(1, "Selection mask is required"),
  cleanBackground: z.boolean().default(true),
});

export type InpaintRequest = z.infer<typeof inpaintRequestSchema>;
export type ObjectReplace = z.infer<typeof objectReplaceSchema>;
export type RemoveObject = z.infer<typeof removeObjectSchema>;

// ============================================
// VASTU SCHEMAS
// ============================================

export const directionSchema = z.enum([
  "north",
  "north-east",
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
  "center",
]);

export const vastuAnalysisRequestSchema = z.object({
  imageUrl: urlSchema,
  roomType: roomTypeSchema,
  facing: directionSchema.optional(),
  floorPlan: z.boolean().default(false),
  elements: z.array(z.object({
    type: z.string(),
    position: directionSchema,
    description: z.string().optional(),
  })).optional(),
});

export const vastuRuleSchema = z.object({
  id: z.string(),
  category: z.enum([
    "entrance",
    "bedroom",
    "kitchen",
    "bathroom",
    "living",
    "pooja",
    "colors",
    "directions",
    "elements",
    "general",
  ]),
  title: z.string(),
  description: z.string(),
  recommendation: z.string(),
  severity: z.enum(["critical", "major", "minor", "suggestion"]),
  direction: directionSchema.optional(),
  isCompliant: z.boolean(),
  score: z.number().min(0).max(100),
});

export const vastuReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  grade: z.enum([
    "Excellent",
    "Very Good",
    "Good",
    "Average",
    "Below Average",
    "Needs Improvement",
  ]),
  rules: z.array(vastuRuleSchema),
  suggestions: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]),
    action: z.string(),
    impact: z.string(),
    estimatedCost: z.number().optional(),
  })),
  positives: z.array(z.string()),
  concerns: z.array(z.string()),
  autoFixAvailable: z.boolean(),
});

export type Direction = z.infer<typeof directionSchema>;
export type VastuAnalysisRequest = z.infer<typeof vastuAnalysisRequestSchema>;
export type VastuRule = z.infer<typeof vastuRuleSchema>;
export type VastuReport = z.infer<typeof vastuReportSchema>;

// ============================================
// COST CALCULATION SCHEMAS
// ============================================

export const qualityTierSchema = z.enum([
  "economy",
  "standard",
  "premium",
  "luxury",
  "ultra-luxury",
]);

export const materialCategorySchema = z.enum([
  "flooring",
  "wall-finish",
  "ceiling",
  "lighting",
  "furniture",
  "fixtures",
  "appliances",
  "soft-furnishings",
  "decor",
  "paint",
  "tiles",
  "electrical",
  "plumbing",
  "woodwork",
  "false-ceiling",
  "modular-kitchen",
  "wardrobe",
  "bathroom-fittings",
  "doors-windows",
  "glass-work",
]);

export const citySchema = z.string().min(1, "City is required");

export const costCalculationRequestSchema = z.object({
  roomType: roomTypeSchema,
  area: z.number().min(1, "Area must be at least 1 sqft").max(100000),
  areaUnit: z.enum(["sqft", "sqm"]).default("sqft"),
  city: citySchema,
  qualityTier: qualityTierSchema.default("standard"),
  style: styleSchema.optional(),
  materials: z.array(z.object({
    category: materialCategorySchema,
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    customPrice: z.number().optional(),
    quantity: z.number().optional(),
  })).optional(),
  includeLabor: z.boolean().default(true),
  includeGST: z.boolean().default(true),
  gstRate: z.number().min(0).max(28).default(18),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED"]).default("INR"),
});

export const costBreakdownSchema = z.object({
  materials: z.array(z.object({
    category: materialCategorySchema,
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    brand: z.string().optional(),
  })),
  labor: z.object({
    categories: z.array(z.object({
      type: z.string(),
      days: z.number(),
      dailyRate: z.number(),
      total: z.number(),
    })),
    total: z.number(),
  }),
  subtotal: z.number(),
  gst: z.number(),
  total: z.number(),
  perSqft: z.number(),
  currency: z.string(),
  city: z.string(),
  qualityTier: qualityTierSchema,
  generatedAt: z.date(),
});

export type QualityTier = z.infer<typeof qualityTierSchema>;
export type MaterialCategory = z.infer<typeof materialCategorySchema>;
export type CostCalculationRequest = z.infer<typeof costCalculationRequestSchema>;
export type CostBreakdown = z.infer<typeof costBreakdownSchema>;

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const planSchema = z.enum(["free", "pro", "teams"]);

export const subscriptionSchema = z.object({
  plan: planSchema,
  status: z.enum(["active", "cancelled", "past_due", "trialing"]),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  razorpayCustomerId: z.string().optional(),
  razorpaySubscriptionId: z.string().optional(),
});

export const checkoutRequestSchema = z.object({
  plan: z.enum(["pro", "teams"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  seats: z.number().min(1).max(100).default(1),
  paymentMethod: z.enum(["stripe", "razorpay"]).default("stripe"),
  successUrl: urlSchema.optional(),
  cancelUrl: urlSchema.optional(),
  couponCode: z.string().optional(),
});

export const invoiceSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(["paid", "pending", "failed", "refunded"]),
  description: z.string(),
  createdAt: z.date(),
  pdfUrl: urlSchema.optional(),
});

export type Plan = z.infer<typeof planSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;

// ============================================
// UPLOAD SCHEMAS
// ============================================

export const uploadConfigSchema = z.object({
  maxFileSize: z.number().default(10 * 1024 * 1024), // 10MB
  acceptedTypes: z.array(z.string()).default([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
  ]),
  maxFiles: z.number().default(10),
});

export const uploadedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: urlSchema,
  size: z.number(),
  type: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  uploadedAt: z.date(),
});

export type UploadConfig = z.infer<typeof uploadConfigSchema>;
export type UploadedFile = z.infer<typeof uploadedFileSchema>;

// ============================================
// RENDER OUTPUT SCHEMAS
// ============================================

export const renderStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

export const renderSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  originalImage: urlSchema,
  generatedImage: urlSchema.optional(),
  thumbnailImage: urlSchema.optional(),
  mode: z.string(),
  roomType: roomTypeSchema,
  style: styleSchema,
  status: renderStatusSchema,
  prompt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  vastuScore: z.number().optional(),
  estimatedCost: z.number().optional(),
  processingTime: z.number().optional(),
  credits: z.number().default(1),
  isFavorite: z.boolean().default(false),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export type RenderStatus = z.infer<typeof renderStatusSchema>;
export type Render = z.infer<typeof renderSchema>;

// ============================================
// API RESPONSE SCHEMAS
// ============================================

export const apiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean(),
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// ============================================
// WEBHOOK SCHEMAS
// ============================================

export const clerkWebhookSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
  object: z.literal("event"),
});

export const stripeWebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
  created: z.number(),
});

export const razorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.record(z.unknown()),
  created_at: z.number(),
});

export const replicateWebhookSchema = z.object({
  id: z.string(),
  status: z.enum(["starting", "processing", "succeeded", "failed", "canceled"]),
  output: z.union([z.string(), z.array(z.string())]).optional(),
  error: z.string().optional(),
  metrics: z.object({
    predict_time: z.number().optional(),
  }).optional(),
});

// ============================================
// FORM SCHEMAS
// ============================================

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
  type: z.enum(["general", "support", "sales", "partnership", "feedback"]),
});

export const feedbackFormSchema = z.object({
  rating: z.number().min(1).max(5),
  category: z.enum([
    "quality",
    "speed",
    "usability",
    "features",
    "pricing",
    "support",
  ]),
  comment: z.string().max(1000).optional(),
  renderId: z.string().optional(),
  wouldRecommend: z.boolean().optional(),
});

export const bugReportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  steps: z.string().max(2000).optional(),
  expectedBehavior: z.string().max(1000).optional(),
  actualBehavior: z.string().max(1000).optional(),
  browser: z.string().optional(),
  device: z.string().optional(),
  screenshot: urlSchema.optional(),
});

export type ContactForm = z.infer<typeof contactFormSchema>;
export type FeedbackForm = z.infer<typeof feedbackFormSchema>;
export type BugReport = z.infer<typeof bugReportSchema>;

// ============================================
// ADMIN SCHEMAS
// ============================================

export const adminUserFilterSchema = z.object({
  status: z.enum(["all", "active", "inactive", "banned"]).optional(),
  plan: planSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
});

export const adminActionSchema = z.object({
  userId: z.string(),
  action: z.enum([
    "ban",
    "unban",
    "add-credits",
    "remove-credits",
    "upgrade",
    "downgrade",
    "delete",
  ]),
  reason: z.string().optional(),
  value: z.number().optional(),
});

export type AdminUserFilter = z.infer<typeof adminUserFilterSchema>;
export type AdminAction = z.infer<typeof adminActionSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate and parse data with Zod schema
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Get formatted validation errors
 */
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });
  return errors;
}

/**
 * Create form validation hook compatible schema
 */
export function createFormSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape);
}

// ============================================
// RE-EXPORT ZOD
// ============================================

export { z };