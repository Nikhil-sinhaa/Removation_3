# Graph Report - .  (2026-06-02)

## Corpus Check
- Large corpus: 943 files · ~2,524,108 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 3957 nodes · 8854 edges · 193 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 3220 · imports: 2654 · imports_from: 2161 · calls: 503 · re_exports: 213 · method: 92 · rationale_for: 11


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 943 · Candidates: 1095
- Excluded: 0 untracked · 87971 ignored · 2 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `3d767e9`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `Button` - 142 edges
2. `cn()` - 137 edges
3. `Badge()` - 112 edges
4. `connectToDatabase()` - 88 edges
5. `getCurrentUser()` - 76 edges
6. `Card` - 53 edges
7. `CardContent` - 50 edges
8. `Input` - 49 edges
9. `Label` - 45 edges
10. `CardHeader` - 43 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `saveFile()`  [EXTRACTED]
  app/api/object-removal/generate/route.ts → app/api/ai/furniture-placement/generate/route.js
- `POST()` --calls--> `saveUploadAndComfy()`  [EXTRACTED]
  app/api/object-removal/generate/route.ts → app/api/ai/furniture-remover/generate/route.js
- `POST()` --calls--> `createObjectRemovalWorkflow()`  [EXTRACTED]
  app/api/remove-object/route.ts → app/api/editor/remove-object/route.ts
- `POST()` --calls--> `waitForCompletion()`  [EXTRACTED]
  app/api/remove-object/route.ts → app/api/editor/remove-object/route.ts
- `POST()` --calls--> `verifyWebhookSignature()`  [EXTRACTED]
  app/api/webhooks/razorpay/route.ts → app/api/webhook/razorpay/route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (104): categoryColors, categoryIcons, CostBreakdown(), CostBreakdownProps, Activity, cardHoverVariants, containerVariants, itemVariants (+96 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (69): Alert, mockAlerts, mockPendingItems, mockQuickStats, mockRecentRenders, mockRecentUsers, mockRevenueBreakdown, mockStats (+61 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (35): getCurrentUser(), JwtPayload, ResetTokenPayload, verifyJwt(), verifyResetToken(), PUBLIC_RENDERS, WORKFLOWS_DIR, CREDIT_PACKAGES (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (63): AIResultPanel(), AIResultPanelProps, defaultStylePresets, modes, roomTypes, DesignerMatchCard(), DesignerMatchCardProps, initials() (+55 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (27): RequiredUserType, requireRole(), RouteContext, connectToDatabase(), MongooseCache, FeedbackSchema, POST(), GET() (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (65): ActivityItem, ChartData, GeoData, MetricCardProps, mockDailyRenders, mockFeatureUsage, mockGeoData, mockMetrics (+57 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (35): checkAndDeductCredits(), DeductionResult, DeductOptions, checkIPAdapterModels(), checkNodeAvailable(), IPADAPTER_MISSING_ERROR, saveImageForComfy(), saveUploadPreview() (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (57): ExecutedEvent, LiveFeedbackSidebar(), LiveProgress, MaskData, ObjectRemovalSidebar(), Point, AIHealthPage(), ComfyHealth (+49 more)

### Community 8 - "Community 8"
Cohesion: 0.02
Nodes (43): BlendMode, BrushSettings, CanvasState, Collaborator, CostBreakdownItem, CostEstimate, CropState, EditorActions (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (86): AddRoomRequest, AdminStatsRequest, AdminStatsResponse, AdminUserActionRequest, AdminUsersRequest, ApiError, ApiMeta, ApiResponse (+78 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (56): FAQ, FAQS, FEATURE_COMPARISON, PRICING_PLANS, PricingPlan, TESTIMONIALS, COLORS, CostChartProps (+48 more)

### Community 11 - "Community 11"
Cohesion: 0.02
Nodes (76): AdminAction, adminActionSchema, AdminUserFilter, adminUserFilterSchema, apiErrorSchema, BugReport, bugReportSchema, CheckoutRequest (+68 more)

### Community 12 - "Community 12"
Cohesion: 0.03
Nodes (16): calculateCostPerSqft(), clamp(), CurrencyCode, currencyLocales, currencySymbols, deepMerge(), exchangeRates, getContrastColor() (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (38): CitySelector(), CitySelectorProps, CityTier, TIER_COLORS, TIER_LABELS, useUpload(), NewProjectModalProps, RoomTypeOption (+30 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (53): EXCHANGE_RATES, LABOR_MULTIPLIERS, MaterialWithQuantity, QUALITY_MULTIPLIERS, TAX_RATES, UseCostOptions, UseCostReturn, AdjustmentType (+45 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (45): FAQS_DATA, CompassDirection, DetectedElement, VastuAnalysis, VastuCategory, VastuCategoryAnalysis, VastuCompass, VastuCondition (+37 more)

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (35): analyzeImageWithGroq(), generateDesignSuggestions(), groq, ImageAnalysis, FurnishingOptions, generateFurnishingPrompt(), generateOutdoorPrompt(), generatePrompt() (+27 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (31): AdminContext, AdminContextType, AdminUser, mainNavItems, NavItem, Notification, QuickStat, quickStats (+23 more)

### Community 18 - "Community 18"
Cohesion: 0.08
Nodes (31): BookingDoc, checkAndExpireBooking(), findExpiredInList(), getRazorpay(), issueBookingRefund(), RefundFailure, RefundResult, RefundSuccess (+23 more)

### Community 19 - "Community 19"
Cohesion: 0.06
Nodes (29): downloadMultiRoomZip(), RatingFeedbackProps, ASIAN_PAINTS_COLORS, MultiRoomProjectDetail, Photo, cardHoverVariants, containerVariants, getProjectDetailUrl() (+21 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (27): BookingModalProps, BookingType, DesignerPricingSnapshot, ModalStep, ChromeExtensionPopupProps, translations, BeforeInstallPromptEvent, PWAPromptProps (+19 more)

### Community 21 - "Community 21"
Cohesion: 0.06
Nodes (33): LABOR_CATEGORIES, LaborCalculator(), LaborCalculatorProps, LaborCategory, MATERIAL_CATEGORIES, MaterialCategoryItem, MaterialSelector(), MaterialSelectorProps (+25 more)

### Community 22 - "Community 22"
Cohesion: 0.10
Nodes (33): CONFIG, createStage1AnalysisWorkflow(), parseStage1Output(), createStage2RedesignWorkflow(), parseStage2Output(), createStage3FurnitureWorkflow(), parseStage3Output(), createStage4LightingWorkflow() (+25 more)

### Community 23 - "Community 23"
Cohesion: 0.08
Nodes (5): ComfyUIBridge, ComfyUIErrorLogger, ErrorLog, ComfyUIMonitor, SystemHealth

### Community 24 - "Community 24"
Cohesion: 0.08
Nodes (22): ComfyUIClient, ComfyUIInput, ComfyUIOutput, generateWithComfyUI(), getComfyUIClient(), ComfyUIWorkflow, CONTROLNET_PRESETS, createInpaintingWorkflow() (+14 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (19): buildRecolorWorkflow(), buildTargetPrompt(), deleteRecolorProject(), getRecolorPresets(), getRecolorProject(), getRecolorStatus(), getTargetPrompt(), storage (+11 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (3): ComfyBridgeService, getGPURouter(), _syncSettingsFromDB()

### Community 27 - "Community 27"
Cohesion: 0.07
Nodes (34): UseEditorOptions, UseEditorReturn, ZOOM_LEVELS, BlendMode, BrushSettings, ColorOption, ComparisonData, DesignStyle (+26 more)

### Community 28 - "Community 28"
Cohesion: 0.07
Nodes (23): FAQ(), CYCLING_WORDS, FinalCTA(), BACKGROUND_IMAGES, Hero(), HowItWorks(), StepItem, STEPS_DATA (+15 more)

### Community 29 - "Community 29"
Cohesion: 0.12
Nodes (28): copyOutputsToInput(), runFullPipeline(), submitAndWait(), buildAutoEditWorkflow(), buildBackgroundWorkflow(), buildCollageWorkflow(), buildEditWorkflow(), buildEmptyRoomWorkflow() (+20 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (28): AdvancedToolParams, AdvancedToolResult, buildToolParams(), createAdvancedToolWorkflow(), createArchAi3dWorkflow(), createMasterSelectorWorkflow(), createStableSceneUnderstandingWorkflow(), DINO_PROMPTS (+20 more)

### Community 31 - "Community 31"
Cohesion: 0.06
Nodes (17): Credits, Currency, defaultPreferences, featureAccessMap, initialState, Language, Preferences, Subscription (+9 more)

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (10): determineOverallStatus(), extractGPUInfo(), getGPUStatus(), getPerformanceLevel(), getPerformanceMetrics(), getQueueStatus(), getThermalStatus(), GET() (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (25): copyOutputsToRemoteInput(), downloadOutputFromRemoteComfy(), uploadImageToRemoteComfy(), GenerationResult, PipelineProgressCallback, PipelineRequest, PipelineResult, PipelineStage (+17 more)

### Community 34 - "Community 34"
Cohesion: 0.08
Nodes (16): DEFAULT_ACCEPTED_TYPES, UploadedFile, UploadProgress, UseUploadOptions, UseUploadReturn, getImageDimensions(), getOptimizedImageUrl(), getThumbnailUrl() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.08
Nodes (12): ALL_SPECIALTIES, CONTRACTOR_SPECIALTIES, DESIGNER_SPECIALTIES, Provider, VENDOR_SPECIALTIES, useDebounce(), useDebouncedState(), ALL_SPECIALTIES (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.07
Nodes (27): RoomTypeId, AddressDetails, Collaborator, CollaboratorPermissions, CollaboratorRole, CompassDirection, CostEstimate, CreateProjectInput (+19 more)

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (25): checkAuth(), dataURLtoBlob(), elements, getAuthHeaders(), handleDrop(), handleFileSelect(), handleImage(), hideStyleModal() (+17 more)

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (16): checkComfyHealth(), getActiveComfyBaseUrl(), getActiveComfyWsUrl(), getCloudUrl(), getGPUMode(), GPUMode, isCloudMode(), pingComfyUI() (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (13): GET(), collectFiles(), disconnectDrive(), getAuthedClient(), getAuthUrl(), getOAuth2Client(), getUploadProgress(), handleCallback() (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.12
Nodes (15): BookingModal(), generateSlots(), paiseToRupees(), rupeesToPaise(), Contractor, CONTRACTOR_SPECIALTY_LABELS, Designer, DetailSkeleton() (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (12): MenuItemsProps, props, AppContext, AppProvider(), AppProviderProps, Address, AppContextType, ICart (+4 more)

### Community 42 - "Community 42"
Cohesion: 0.12
Nodes (12): CachedConfig, fetchConfigFromDB(), getAppMode(), getCachedConfig(), getCreditCosts(), getFreeCreditsOnSignup(), invalidateAppModeCache(), issueJwt() (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.08
Nodes (12): useProjects(), UseProjectsOptions, UseProjectsReturn, initialState, ProjectActions, ProjectFilter, ProjectSortOption, ProjectState (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.08
Nodes (24): CompassDirection, DetectedElement, useVastu(), VastuAnalysis, VastuCategory, VastuCategoryAnalysis, VastuCompass, VastuCondition (+16 more)

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (16): getPusherServer(), checkBookingAccess(), GET(), mongooseModelGetContractor(), mongooseModelGetDesigner(), POST(), IMessage, MessageSchema (+8 more)

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (20): checkRembg(), downloadImage(), execAsync, FURNITURE_DIR, processProductImage(), ProcessResult, removeBackground(), resizeImage() (+12 more)

### Community 47 - "Community 47"
Cohesion: 0.13
Nodes (12): AIJob, aiQueue, cache, createRedisClient(), getRedisClient(), getRedisSubscriber(), redisOptions, acquireRenderLock() (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.13
Nodes (14): dmSans, faqJsonLd, inter, jsonLd, metadata, outfit, viewport, CrispChat() (+6 more)

### Community 49 - "Community 49"
Cohesion: 0.14
Nodes (6): ACTIVE_STATUSES, SocketContext, SocketContextType, SocketProvider(), useSocket(), ACTIVE_STATUSES

### Community 50 - "Community 50"
Cohesion: 0.16
Nodes (9): publishEvent(), startOrderReadyConsumer(), startPaymentConsumer(), connectRabbitMQ(), getChannel(), IOrder, OrderSchema, router (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.10
Nodes (12): ALL_CITIES, CITIES_BY_COUNTRY, CITIES_BY_TIER, City, CURRENCY_SYMBOLS, CURRENCY_TO_INR_RATES, INDIAN_CITIES, INDIAN_STATES (+4 more)

### Community 52 - "Community 52"
Cohesion: 0.18
Nodes (11): Language, ai_toolsTranslations, authTranslations, bookingTranslations, commonTranslations, costTranslations, dashboardTranslations, allTranslations (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.16
Nodes (13): Category, CATEGORY_TABS, StylePresetSelector(), StylePresetSelectorProps, StyleReferenceGallery(), StyleReferenceGalleryProps, getPresetById(), getReferenceById() (+5 more)

### Community 54 - "Community 54"
Cohesion: 0.13
Nodes (17): costCalculationSchema, formatCurrency(), GET(), getCostSavingTips(), getSupportedCities(), materialQuerySchema, POST(), BASE_COSTS (+9 more)

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (9): BookingChat(), BookingChatProps, ChatMessage, BookingCustomer, ContractorBooking, DesignerBooking, RejectDialog(), STATUS_CONFIG (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.14
Nodes (2): useAppData(), Role

### Community 57 - "Community 57"
Cohesion: 0.11
Nodes (15): VASTU_DIRECTIONS, analyzeVastu(), DirectionalAnalysis, ElementBalance, generateId(), VastuAnalysisParams, VastuAnalysisResult, VastuCompliance (+7 more)

### Community 58 - "Community 58"
Cohesion: 0.11
Nodes (7): AsyncErrorBoundaryProps, ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, errorDetails, ErrorFallbackProps, InlineErrorProps

### Community 59 - "Community 59"
Cohesion: 0.11
Nodes (6): ASPECT_RATIOS, DEFAULT_TRANSFORM, ImagePreviewProps, TransformState, LoadingShimmer(), LoadingShimmerProps

### Community 60 - "Community 60"
Cohesion: 0.17
Nodes (15): ALLOWED_STATUSES, assignRiderToOrder, createOrder, fetchOrderForPayment, fetchRestaurantOrders, fetchSingleOrder, getCurrentOrderForRider, getMyOrders (+7 more)

### Community 61 - "Community 61"
Cohesion: 0.11
Nodes (11): FREE_MODES, LocalTransformationMode, LocalTransformationModeConfig, MODES_BY_CATEGORY, NO_MASK_MODES, NO_PROMPT_MODES, POPULAR_MODES, PRO_MODES (+3 more)

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (15): useAspectRatio(), useBreakpoint(), useColorGamut(), useDeviceCapabilities(), useDisplayMode(), useHoverCapability(), useIsPrint(), useMediaOrientation() (+7 more)

### Community 63 - "Community 63"
Cohesion: 0.11
Nodes (7): guiToApiGraph(), WIDGET_NAMES, __dirname, __filename, __dirname, __filename, targetPath

### Community 64 - "Community 64"
Cohesion: 0.15
Nodes (7): ContractorProfile, DesignerProfile, PortfolioGrid(), SPECIALTY_LABELS, StatusBanner(), Skeleton(), SkeletonProps

### Community 65 - "Community 65"
Cohesion: 0.13
Nodes (8): ChromeExtensionPopupProps, extensionFeatures, AppStorageData, defaultAppStorage, SetValue, useAppStorage(), useLocalStorage(), UseLocalStorageOptions

### Community 66 - "Community 66"
Cohesion: 0.17
Nodes (10): oauth2client, addUserRole, allowedRoles, loginUser, myProfile, Role, IUser, schema (+2 more)

### Community 67 - "Community 67"
Cohesion: 0.17
Nodes (7): signResetToken(), generateOtp(), hashOtp(), verifyOtp(), resend, sendOtpEmail(), sendPasswordResetEmail()

### Community 68 - "Community 68"
Cohesion: 0.13
Nodes (7): ProjectStatus, UploadStatus, LanguageContext, LanguageProvider(), UseLanguageReturn, _verificationKeys, StagingView()

### Community 69 - "Community 69"
Cohesion: 0.13
Nodes (11): ContactInfo, containerVariants, FAQ, faqs, inquiryTypes, itemVariants, Office, offices (+3 more)

### Community 70 - "Community 70"
Cohesion: 0.14
Nodes (7): Props, deliveryIcon, Props, riderIcon, Props, IRider, IOrder

### Community 71 - "Community 71"
Cohesion: 0.18
Nodes (11): getBuffer(), acceptOrder, addRiderProfile, fetchMyCurrentOrder, fetchMyProfile, toggleRiderAvailablity, updateOrderStatus, IRider (+3 more)

### Community 72 - "Community 72"
Cohesion: 0.23
Nodes (15): check_dependencies(), extract_camera_positions(), generate_dense_point_cloud(), log(), main(), Generate dense point cloud by combining:     1. COLMAP sparse points     2. Dept, Print timestamped log message., Verify all required packages are installed. (+7 more)

### Community 73 - "Community 73"
Cohesion: 0.24
Nodes (13): GET(), handleOrderPaid(), handlePaymentCaptured(), handlePaymentFailed(), handleSubscriptionActivated(), handleSubscriptionCancelled(), handleSubscriptionCharged(), handleSubscriptionCompleted() (+5 more)

### Community 74 - "Community 74"
Cohesion: 0.19
Nodes (12): Invoice, InvoiceHistoryProps, mockInvoices, translations, Table, TableBody, TableCaption, TableCell (+4 more)

### Community 75 - "Community 75"
Cohesion: 0.14
Nodes (12): BillingCycle, Invoice, PLANS, PlanType, Subscription, SubscriptionPlan, UserCredits, useSubscription() (+4 more)

### Community 76 - "Community 76"
Cohesion: 0.20
Nodes (9): connectDB(), getPendingRestaurant, getPendingRiders, verifyRestaurant, verifyRider, isAdmin(), router, getRestaurantCollection() (+1 more)

### Community 77 - "Community 77"
Cohesion: 0.16
Nodes (10): DEFAULT_NEGATIVE_PROMPT, StylePreset, TRANSFER_PRESETS, TRANSFER_PRESETS, getTargetDimensions(), _copyOutputsToPublic(), PUBLIC_RENDERS, runStyleTransfer() (+2 more)

### Community 78 - "Community 78"
Cohesion: 0.14
Nodes (9): getCriticalRules(), getRulesBySeverity(), VASTU_RULES, VastuCategory, VastuDirection, VastuDirectionInfo, VastuElement, VastuRule (+1 more)

### Community 79 - "Community 79"
Cohesion: 0.16
Nodes (8): AuthProvider(), CrispChat(), CrispChatProps, ProvidersProps, analytics, AnalyticsProvider(), AnalyticsProviderProps, Toaster()

### Community 80 - "Community 80"
Cohesion: 0.29
Nodes (13): build_prompt(), find_test_image(), main(), Submit one test to ComfyUI and wait for completion. Returns output filename., Pick the best available room image for testing., Wait until ComfyUI queue is empty before submitting next job., Build a ComfyUI API-format prompt from params dict., series_1() (+5 more)

### Community 81 - "Community 81"
Cohesion: 0.19
Nodes (10): features, resources, LanguageToggle(), NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger (+2 more)

### Community 82 - "Community 82"
Cohesion: 0.22
Nodes (9): publishPaymentSuccess(), razorpay, verifyRazorpaySignature(), createRazorpayOrder(), payWithStripe(), stripe, verifyRazorpayPayment(), verifyStripe() (+1 more)

### Community 83 - "Community 83"
Cohesion: 0.18
Nodes (7): addAddress, deleteAddress, getMyAddresses, TryCatch(), IAddress, schema, router

### Community 84 - "Community 84"
Cohesion: 0.29
Nodes (9): addMenuItem, deleteMenuItem, getAllItems, toggleMenuItemAvailability, AuthenticatedRequest, isAuth(), isSeller(), IUser (+1 more)

### Community 85 - "Community 85"
Cohesion: 0.22
Nodes (11): GenerationRequest, createFluxFillObjectRemovalWorkflow(), createLaMaObjectRemovalWorkflow(), createObjectRemovalWorkflow(), createOptimizedObjectRemovalWorkflow(), createSAM2ObjectRemovalWorkflow(), ObjectRemovalRequest, createHardwareOptimizedWorkflow() (+3 more)

### Community 86 - "Community 86"
Cohesion: 0.17
Nodes (9): BasePendingProfile, CONTRACTOR_SPECIALTIES, DESIGNER_SPECIALTIES, formatPrice(), PendingContractor, PendingDesigner, PendingVendor, ProfileCard() (+1 more)

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (11): getStripe(), handleCustomerCreated(), handleInvoicePaymentFailed(), handleInvoicePaymentSucceeded(), handleOneTimePayment(), handleSubscriptionCanceled(), handleSubscriptionCheckout(), handleSubscriptionCreated() (+3 more)

### Community 88 - "Community 88"
Cohesion: 0.24
Nodes (12): BlogCard(), BlogPage(), blogPosts, categories, fadeIn, fadeInUp, FeaturedPostCard(), formatDate() (+4 more)

### Community 89 - "Community 89"
Cohesion: 0.18
Nodes (11): allFeatures, fadeInLeft, fadeInRight, fadeInUp, FeatureCard(), featureCategories, getColorClasses(), HighlightedFeature() (+3 more)

### Community 90 - "Community 90"
Cohesion: 0.17
Nodes (10): AuthContext, AuthContextType, useAuth(), User, CheckoutStep, CREDIT_PACKAGES, CreditPackage, InsufficientCreditsModal() (+2 more)

### Community 91 - "Community 91"
Cohesion: 0.18
Nodes (9): EditorToolbarProps, ToolbarItem, PHASE_CONFIG, ToolProgressBar(), ToolProgressBarProps, UltraProDoneEvent, UltraProErrorEvent, UltraProStageEvent (+1 more)

### Community 92 - "Community 92"
Cohesion: 0.24
Nodes (9): addRestraunt, fetchMyRestaurant, fetchSingleRestaurant, getNearbyRestaurant, updateRestaurant, updateStatusRestaurant, storage, uploadFile (+1 more)

### Community 93 - "Community 93"
Cohesion: 0.42
Nodes (12): apply_final_corrections(), build_wf_01(), build_wf_02(), build_wf_03(), build_wf_04(), build_wf_05(), build_wf_06(), build_wf_07() (+4 more)

### Community 94 - "Community 94"
Cohesion: 0.29
Nodes (12): cleanup, DesignerSchema, fail(), pass(), run(), section(), simulateGetPending(), simulateRegister() (+4 more)

### Community 95 - "Community 95"
Cohesion: 0.17
Nodes (10): awards, fadeInLeft, fadeInRight, fadeInUp, milestones, scaleIn, staggerContainer, stats (+2 more)

### Community 96 - "Community 96"
Cohesion: 0.26
Nodes (10): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastIcon(), ToastProps, ToastTitle (+2 more)

### Community 97 - "Community 97"
Cohesion: 0.17
Nodes (11): CITY_LABOR_MULTIPLIERS, CURRENCY_RATES, GST_RATES, LABOR_RATES, LaborRate, MATERIAL_PRICES, MaterialPrice, RENOVATION_COST_PER_SQFT (+3 more)

### Community 98 - "Community 98"
Cohesion: 0.27
Nodes (11): cleanupIds, DesignerSchema, fail(), pass(), run(), section(), simulateGetMe(), simulateRegisterDesigner() (+3 more)

### Community 99 - "Community 99"
Cohesion: 0.21
Nodes (10): ensureInputFile(), transferComfyFile(), _copyOutputToPublic(), PUBLIC_RENDERS, runFurniturePlacement(), _safeFileCopy(), WORKFLOWS_DIR, LIGHTING_PRESETS (+2 more)

### Community 100 - "Community 100"
Cohesion: 0.38
Nodes (3): PipelineOrchestrator, runFullPipeline(), runUltraProPipeline()

### Community 101 - "Community 101"
Cohesion: 0.22
Nodes (8): CurrencyToggle(), CurrencyToggleProps, ToggleGroup, ToggleGroupContext, ToggleGroupContextType, ToggleGroupItem, ToggleGroupItemProps, ToggleGroupProps

### Community 102 - "Community 102"
Cohesion: 0.20
Nodes (5): footerLinks, socialLinks, Logo(), LogoProps, sizeConfig

### Community 103 - "Community 103"
Cohesion: 0.18
Nodes (6): DesignStyle, getIndianStyles(), getPopularStyles(), getStylesByCategory(), STYLE_CATEGORIES, StyleCategory

### Community 104 - "Community 104"
Cohesion: 0.27
Nodes (8): addToCart, clearCart, decrementCartItem, fetchMyCart, incrementCartItem, ICart, schema, router

### Community 105 - "Community 105"
Cohesion: 0.31
Nodes (9): generateMarbleWorld(), getApiKey(), marbleHeaders(), pollMarbleOperation(), testMarbleConnection(), uploadImageToMarble(), generateMarbleView(), paintAllPhotos() (+1 more)

### Community 106 - "Community 106"
Cohesion: 0.24
Nodes (7): buildRedesignWorkflow(), COLOR_MAP, DENOISE_MAP, POST(), ROOM_MAP, safeParseFormData(), STYLE_MAP

### Community 107 - "Community 107"
Cohesion: 0.20
Nodes (5): LS, SAMPLE_ROOMS, Step, StyleOption, STYLES

### Community 108 - "Community 108"
Cohesion: 0.20
Nodes (6): BillingCycle, comparisonCategories, Currency, fadeInUp, faqs, plans

### Community 109 - "Community 109"
Cohesion: 0.20
Nodes (4): ProgressBarProps, ProgressStep, sizeClasses, statusColors

### Community 110 - "Community 110"
Cohesion: 0.27
Nodes (7): calculateRoomArea(), getHighVastuRooms(), getRoomById(), getRoomsByVastuImportance(), getRoomWithSubType(), RoomType, SubRoomType

### Community 111 - "Community 111"
Cohesion: 0.20
Nodes (9): checkmarkIcon, commentTextArea, copyBtn, downloadPaintedBtn, exploreBtn, starButtons, submitBtn, tryAgainBtn (+1 more)

### Community 112 - "Community 112"
Cohesion: 0.20
Nodes (8): allMatches, allMissing, content, files, hook, keyMatches, missing, tMatches

### Community 113 - "Community 113"
Cohesion: 0.31
Nodes (9): cleanup, DesignerSchema, fail(), pass(), run(), section(), simulateGetDesigner(), simulateListDesigners() (+1 more)

### Community 114 - "Community 114"
Cohesion: 0.31
Nodes (7): getStripe(), handleRazorpayCheckout(), handleStripeCheckout(), PlanType, POST(), PRICING, razorpay

### Community 115 - "Community 115"
Cohesion: 0.33
Nodes (7): fetchImageAsBase64(), handleCostEstimate(), handleQuickTransform(), handleVastu(), pollForCompletion(), quickStyles, style

### Community 116 - "Community 116"
Cohesion: 0.22
Nodes (4): EmptyState(), emptyStateConfig, EmptyStateProps, EmptyStateType

### Community 117 - "Community 117"
Cohesion: 0.25
Nodes (6): calculateMaterialCost(), getMaterialById(), Material, MATERIAL_CATEGORIES, MaterialCategory, MATERIALS

### Community 118 - "Community 118"
Cohesion: 0.22
Nodes (8): card, cardDownloadButton, downloadButton, inputFiles, inputFolder, outputFiles, outputFolder, projectFolder

### Community 119 - "Community 119"
Cohesion: 0.22
Nodes (2): DeviceInfo, useMobile()

### Community 120 - "Community 120"
Cohesion: 0.22
Nodes (7): __dirname, envContent, envPath, __filename, key, parts, val

### Community 121 - "Community 121"
Cohesion: 0.47
Nodes (8): acquireMutex(), _copyOutputsToPublic(), _firstImageFromNode(), PUBLIC_RENDERS, runFurnitureRemover(), runManualFurnitureErase(), _safe(), WORKFLOWS_DIR

### Community 122 - "Community 122"
Cohesion: 0.36
Nodes (8): buildOptimizedWorkflowGroups(), buildOptimizedWorkflowLinks(), buildOptimizedWorkflowNodes(), calculateOptimalBatchSize(), calculateOptimalResolution(), ComfyUIWorkflow, createOptimizedSceneUnderstandingWorkflow(), OptimizedSceneConfig

### Community 123 - "Community 123"
Cohesion: 0.36
Nodes (8): buildOptimizedWorkflowGroups(), buildOptimizedWorkflowLinks(), buildOptimizedWorkflowNodes(), calculateOptimalBatchSize(), calculateOptimalResolution(), ComfyUIWorkflow, createOptimizedSceneUnderstandingWorkflow(), OptimizedSceneConfig

### Community 124 - "Community 124"
Cohesion: 0.22
Nodes (5): PROMPT_LIBRARY, PromptSet, QUALITY_PRESETS, RoomType, SceneUnderstandingV3Config

### Community 125 - "Community 125"
Cohesion: 0.29
Nodes (6): buildSpecialties(), GET(), ROOM_TYPE_MAP, STYLE_MAP, DesignerSpecialty, IDesigner

### Community 126 - "Community 126"
Cohesion: 0.39
Nodes (7): GET(), getStripe(), PLAN_CREDITS, POST(), razorpay, verifyRazorpayPayment(), verifyStripePayment()

### Community 127 - "Community 127"
Cohesion: 0.32
Nodes (5): CeilingColorPicker(), CeilingColorPickerProps, ColorValue, ASIAN_PAINTS_CEILING_COLORS, FAMOUS_CEILING_COLORS

### Community 128 - "Community 128"
Cohesion: 0.32
Nodes (4): get_history(), load_workflow(), run_pipeline(), wait_for_completion()

### Community 129 - "Community 129"
Cohesion: 0.25
Nodes (2): props, SellerTab

### Community 130 - "Community 130"
Cohesion: 0.25
Nodes (5): LanguageProviderProps, LanguageDetectionBannerProps, languages, LanguageToggleProps, TranslateProps

### Community 131 - "Community 131"
Cohesion: 0.32
Nodes (5): GPUMode, GPUModeStatus, ModeHealth, useGPUMode(), GPUModeSwitchProps

### Community 132 - "Community 132"
Cohesion: 0.36
Nodes (6): buildCeilingPrompt(), _copyOutputsToPublic(), PUBLIC_RENDERS, runCeilingChanger(), _safe(), WORKFLOWS_DIR

### Community 133 - "Community 133"
Cohesion: 0.36
Nodes (6): buildWallPrompt(), _copyOutputsToPublic(), PUBLIC_RENDERS, runRoomChanger(), _safe(), WORKFLOWS_DIR

### Community 134 - "Community 134"
Cohesion: 0.36
Nodes (5): io, router, server, getIO(), initSocket()

### Community 135 - "Community 135"
Cohesion: 0.25
Nodes (7): Client, ExecutionError, ExecutionResult, Lock, Redlock, ResourceLockedError, Settings

### Community 136 - "Community 136"
Cohesion: 0.33
Nodes (5): FloorPlanProjectSchema, PhotoSchema, PointCloudSchema, execAsync, POST()

### Community 137 - "Community 137"
Cohesion: 0.57
Nodes (6): DELETE(), GET(), getCurrentSubscription(), getStripe(), PUT(), razorpay

### Community 138 - "Community 138"
Cohesion: 0.29
Nodes (5): planConfig, statusConfig, SubscriptionBadgeProps, SubscriptionPlan, SubscriptionStatus

### Community 139 - "Community 139"
Cohesion: 0.29
Nodes (4): ROOM_TYPES_SIMPLE, RoomTypeSimple, THEMES, ThemeType

### Community 140 - "Community 140"
Cohesion: 0.43
Nodes (6): DesignerSchema, fail(), pass(), run(), section(), UserSchema

### Community 141 - "Community 141"
Cohesion: 0.33
Nodes (4): DriveStatus, GPUStatus, Mode, UploadFile

### Community 142 - "Community 142"
Cohesion: 0.47
Nodes (4): OrderCard(), props, statusColor(), ORDER_ACTIONS

### Community 143 - "Community 143"
Cohesion: 0.33
Nodes (3): deliveryIcon, props, riderIcon

### Community 144 - "Community 144"
Cohesion: 0.40
Nodes (3): getMemStats(), MemStats, startMemoryWatchdog()

### Community 145 - "Community 145"
Cohesion: 0.50
Nodes (3): POST(), ReplicateWebhookPayload, verifyWebhookSignature()

### Community 146 - "Community 146"
Cohesion: 0.50
Nodes (2): Footer(), Navbar()

### Community 147 - "Community 147"
Cohesion: 0.40
Nodes (1): Address

### Community 148 - "Community 148"
Cohesion: 0.60
Nodes (4): delay(), main(), results, runTest()

### Community 149 - "Community 149"
Cohesion: 0.70
Nodes (4): check_file_size(), download_file(), format_size(), main()

### Community 150 - "Community 150"
Cohesion: 0.50
Nodes (4): parseEnv(), run(), SCRIPT_DIR, WORKSPACE_DIR

### Community 151 - "Community 151"
Cohesion: 0.50
Nodes (1): FALLBACK_IMAGES

### Community 152 - "Community 152"
Cohesion: 0.50
Nodes (1): styles

### Community 153 - "Community 153"
Cohesion: 0.50
Nodes (3): container, features, item

### Community 154 - "Community 154"
Cohesion: 0.50
Nodes (3): StudioProgressBar(), StudioProgressBarProps, TAB_COLORS

### Community 155 - "Community 155"
Cohesion: 0.50
Nodes (3): AIRequest, AIResponse, useAIQueue()

### Community 156 - "Community 156"
Cohesion: 0.50
Nodes (2): UseGenerateOptions, UseGenerateReturn

### Community 157 - "Community 157"
Cohesion: 0.50
Nodes (1): IMessagePayload

### Community 158 - "Community 158"
Cohesion: 0.50
Nodes (4): getDevicePixelRatio(), isMobile(), isServer(), isTouchDevice()

### Community 159 - "Community 159"
Cohesion: 0.50
Nodes (2): config, publicPaths

### Community 160 - "Community 160"
Cohesion: 0.50
Nodes (2): AdminConfigSchema, DEFAULT_CONFIGS

### Community 161 - "Community 161"
Cohesion: 0.83
Nodes (3): delay(), main(), runTest()

### Community 162 - "Community 162"
Cohesion: 0.67
Nodes (1): metadata

### Community 163 - "Community 163"
Cohesion: 0.67
Nodes (1): contactSchema

### Community 164 - "Community 164"
Cohesion: 0.67
Nodes (1): AuthLayoutProps

### Community 165 - "Community 165"
Cohesion: 0.67
Nodes (1): metadata

### Community 166 - "Community 166"
Cohesion: 0.67
Nodes (1): metadata

### Community 167 - "Community 167"
Cohesion: 0.67
Nodes (1): metadata

### Community 168 - "Community 168"
Cohesion: 0.67
Nodes (1): metadata

### Community 169 - "Community 169"
Cohesion: 0.67
Nodes (1): BeforeAfterProps

### Community 170 - "Community 170"
Cohesion: 0.67
Nodes (1): stats

### Community 171 - "Community 171"
Cohesion: 0.67
Nodes (1): badges

### Community 172 - "Community 172"
Cohesion: 0.67
Nodes (1): navItems

### Community 173 - "Community 173"
Cohesion: 0.67
Nodes (1): props

### Community 174 - "Community 174"
Cohesion: 0.67
Nodes (1): Props

### Community 175 - "Community 175"
Cohesion: 0.67
Nodes (1): LoadingDotsProps

### Community 176 - "Community 176"
Cohesion: 0.67
Nodes (1): ResizablePanelProps

### Community 177 - "Community 177"
Cohesion: 0.67
Nodes (2): Toggle, toggleVariants

### Community 178 - "Community 178"
Cohesion: 0.67
Nodes (2): GPUStatus, useGPUStatus()

### Community 180 - "Community 180"
Cohesion: 0.67
Nodes (2): CeilingChangerRun, ceilingChangerRunSchema

### Community 181 - "Community 181"
Cohesion: 0.67
Nodes (2): FurnitureRemoverRun, furnitureRemoverRunSchema

### Community 182 - "Community 182"
Cohesion: 0.67
Nodes (2): RoomChangerRun, roomChangerRunSchema

### Community 183 - "Community 183"
Cohesion: 0.67
Nodes (2): StyleTransferRun, styleTransferRunSchema

### Community 184 - "Community 184"
Cohesion: 0.67
Nodes (1): UserSchema

### Community 185 - "Community 185"
Cohesion: 1.00
Nodes (2): delay(), main()

### Community 211 - "Community 211"
Cohesion: 1.00
Nodes (1): AppSettingsSchema

### Community 212 - "Community 212"
Cohesion: 1.00
Nodes (1): FurniturePlacementRunSchema

### Community 213 - "Community 213"
Cohesion: 1.00
Nodes (1): nextConfig

### Community 214 - "Community 214"
Cohesion: 1.00
Nodes (1): config

### Community 219 - "Community 219"
Cohesion: 1.00
Nodes (1): testUser

### Community 220 - "Community 220"
Cohesion: 1.00
Nodes (1): config

### Community 221 - "Community 221"
Cohesion: 1.00
Nodes (1): Window

### Community 222 - "Community 222"
Cohesion: 1.00
Nodes (1): AppError

## Knowledge Gaps
- **1270 isolated node(s):** `roomTypes`, `modes`, `defaultStylePresets`, `PricingPlan`, `FAQ` (+1265 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 56`** (2 nodes): `useAppData()`, `Role`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (2 nodes): `DeviceInfo`, `useMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (2 nodes): `props`, `SellerTab`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (2 nodes): `Footer()`, `Navbar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (1 nodes): `Address`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `FALLBACK_IMAGES`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `styles`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (2 nodes): `UseGenerateOptions`, `UseGenerateReturn`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (1 nodes): `IMessagePayload`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 159`** (2 nodes): `config`, `publicPaths`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 160`** (2 nodes): `AdminConfigSchema`, `DEFAULT_CONFIGS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 162`** (1 nodes): `metadata`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 163`** (1 nodes): `contactSchema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 164`** (1 nodes): `AuthLayoutProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 165`** (1 nodes): `metadata`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 166`** (1 nodes): `metadata`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 167`** (1 nodes): `metadata`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 168`** (1 nodes): `metadata`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 169`** (1 nodes): `BeforeAfterProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 170`** (1 nodes): `stats`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 171`** (1 nodes): `badges`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 172`** (1 nodes): `navItems`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 173`** (1 nodes): `props`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 174`** (1 nodes): `Props`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 175`** (1 nodes): `LoadingDotsProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 176`** (1 nodes): `ResizablePanelProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 177`** (2 nodes): `Toggle`, `toggleVariants`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 178`** (2 nodes): `GPUStatus`, `useGPUStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 180`** (2 nodes): `CeilingChangerRun`, `ceilingChangerRunSchema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 181`** (2 nodes): `FurnitureRemoverRun`, `furnitureRemoverRunSchema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 182`** (2 nodes): `RoomChangerRun`, `roomChangerRunSchema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 183`** (2 nodes): `StyleTransferRun`, `styleTransferRunSchema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 184`** (1 nodes): `UserSchema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 185`** (2 nodes): `delay()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 211`** (1 nodes): `AppSettingsSchema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 212`** (1 nodes): `FurniturePlacementRunSchema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 213`** (1 nodes): `nextConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 214`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 219`** (1 nodes): `testUser`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 220`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 221`** (1 nodes): `Window`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 222`** (1 nodes): `AppError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button` connect `Community 3` to `Community 10`, `Community 55`, `Community 64`, `Community 40`, `Community 13`, `Community 0`, `Community 35`, `Community 1`, `Community 7`, `Community 19`, `Community 21`, `Community 5`, `Community 95`, `Community 88`, `Community 69`, `Community 89`, `Community 108`, `Community 86`, `Community 20`, `Community 17`, `Community 65`, `Community 48`, `Community 101`, `Community 91`, `Community 28`, `Community 102`, `Community 81`, `Community 90`, `Community 74`, `Community 116`, `Community 58`, `Community 59`, `Community 130`, `Community 15`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 0` to `Community 10`, `Community 55`, `Community 64`, `Community 40`, `Community 13`, `Community 1`, `Community 7`, `Community 17`, `Community 107`, `Community 19`, `Community 21`, `Community 5`, `Community 53`, `Community 108`, `Community 20`, `Community 65`, `Community 48`, `Community 3`, `Community 127`, `Community 101`, `Community 91`, `Community 102`, `Community 172`, `Community 81`, `Community 90`, `Community 74`, `Community 138`, `Community 116`, `Community 58`, `Community 59`, `Community 130`, `Community 109`, `Community 75`, `Community 154`, `Community 15`, `Community 96`, `Community 177`, `Community 12`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `Badge()` connect `Community 10` to `Community 3`, `Community 55`, `Community 64`, `Community 40`, `Community 13`, `Community 0`, `Community 35`, `Community 1`, `Community 7`, `Community 19`, `Community 21`, `Community 5`, `Community 95`, `Community 88`, `Community 69`, `Community 89`, `Community 108`, `Community 86`, `Community 20`, `Community 17`, `Community 65`, `Community 169`, `Community 153`, `Community 90`, `Community 74`, `Community 138`, `Community 59`, `Community 75`, `Community 15`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `roomTypes`, `modes`, `defaultStylePresets` to the rest of the system?**
  _1270 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.027029234035603464 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02546188480049682 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.031035090812907777 - nodes in this community are weakly interconnected._