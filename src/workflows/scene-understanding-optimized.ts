/**
 * OPTIMIZED Scene Understanding Workflow - Version 2.0
 * Critical fixes for memory management and performance
 * Specifically addresses RTX 4060 8GB constraints
 */

// ComfyUI workflow types (inline definition for now)
interface ComfyUIWorkflow {
  id: string;
  revision: number;
  last_node_id: number;
  last_link_id: number;
  nodes: any[];
  links: number[][];
  groups: any[];
  config: any;
  extra: any;
  version: number;
}

interface OptimizedSceneConfig {
  imageBase64: string;
  roomType?: 'living' | 'bedroom' | 'kitchen' | 'dining' | 'bathroom' | 'general';
  quality?: 'fast' | 'balanced' | 'best';
  enableDepth?: boolean;
  maxMemoryGB?: number; // Default: 6 (leave 2GB for system)
}

/**
 * Memory-optimized scene understanding workflow
 * Fixes critical VRAM issues from original design
 */
export async function createOptimizedSceneUnderstandingWorkflow(
  config: OptimizedSceneConfig
): Promise<ComfyUIWorkflow> {
  const { 
    imageBase64, 
    roomType = 'general', 
    quality = 'balanced', 
    enableDepth = true,
    maxMemoryGB = 6 
  } = config;

  // Memory-optimized parameters
  const resolution = calculateOptimalResolution(quality, maxMemoryGB);
  const batchSize = calculateOptimalBatchSize(quality, maxMemoryGB);
  
  // Sequential processing strategy to save memory
  const workflow: ComfyUIWorkflow = {
    id: 'scene-understanding-optimized-v2',
    revision: 2,
    last_node_id: 35, // Reduced from 45
    last_link_id: 50,  // Reduced from 60
    nodes: buildOptimizedWorkflowNodes(imageBase64, resolution, roomType, batchSize, enableDepth, maxMemoryGB),
    links: buildOptimizedWorkflowLinks(),
    groups: buildOptimizedWorkflowGroups(),
    config: {},
    extra: {
      ds: {
        scale: 0.6,
        offset: [200, 200]
      }
    },
    version: 0.4
  };

  return workflow;
}

/**
 * Calculate optimal resolution based on memory constraints
 */
function calculateOptimalResolution(quality: string, maxMemoryGB: number): number {
  const baseResolution = {
    'fast': 512,
    'balanced': 768,
    'best': 1024
  }[quality] || 768;
  
  // Adjust for memory constraints
  if (maxMemoryGB < 4) return Math.min(baseResolution, 512);
  if (maxMemoryGB < 6) return Math.min(baseResolution, 768);
  return baseResolution;
}

/**
 * Calculate optimal batch size to prevent OOM
 */
function calculateOptimalBatchSize(quality: string, maxMemoryGB: number): number {
  const baseBatchSize = {
    'fast': 8,
    'balanced': 4,
    'best': 2
  }[quality] || 4;
  
  // Conservative batch sizing for stability
  if (maxMemoryGB < 4) return 2;
  if (maxMemoryGB < 6) return Math.min(baseBatchSize, 4);
  return baseBatchSize;
}

/**
 * Build optimized workflow with memory management
 */
function buildOptimizedWorkflowNodes(
  imageBase64: string,
  resolution: number,
  roomType: string,
  batchSize: number,
  enableDepth: boolean,
  maxMemoryGB: number
) {
  const nodes = [];

  // === STAGE 1: INPUT & PREPROCESSING ===
  
  // Node 1: Load Image
  nodes.push({
    id: 1,
    type: "LoadImage",
    pos: [26, 100],
    size: [315, 314],
    flags: {},
    order: 0,
    mode: 0,
    inputs: [],
    outputs: [
      {name: "IMAGE", type: "IMAGE", slot_index: 0, links: [1]},
      {name: "MASK", type: "MASK", slot_index: 1, links: null}
    ],
    properties: {"Node name for S&R": "LoadImage"},
    widgets_values: [imageBase64],
    title: "📸 Load Room Photo"
  });

  // Node 2: Image Scale (Memory-Optimized)
  nodes.push({
    id: 2,
    type: "ImageScale",
    pos: [26, 460],
    size: [315, 130],
    flags: {},
    order: 1,
    mode: 0,
    inputs: [
      {name: "image", type: "IMAGE", link: 1}
    ],
    outputs: [
      {name: "IMAGE", type: "IMAGE", slot_index: 0, links: [2, 3, 4]}
    ],
    properties: {"Node name for S&R": "ImageScale"},
    widgets_values: ["lanczos", resolution, resolution, "center"],
    title: `🔲 Resize to ${resolution}×${resolution}`
  });

  // === STAGE 2: SEQUENTIAL MULTI-PASS DETECTION ===
  // CRITICAL FIX: Sequential processing instead of parallel

  // Node 3: GroundingDINO Model Loader (Single Instance)
  nodes.push({
    id: 3,
    type: "GroundingDinoModelLoader",
    pos: [400, 100],
    size: [315, 98],
    flags: {},
    order: 2,
    mode: 0,
    inputs: [],
    outputs: [
      {name: "GROUNDING_DINO_MODEL", type: "GROUNDING_DINO_MODEL", slot_index: 0, links: [5, 8, 11, 14]}
    ],
    properties: {"Node name for S&R": "GroundingDinoModelLoader"},
    widgets_values: ["GroundingDINO_SwinT_OGC.py"],
    title: "🧠 GroundingDINO (Shared)"
  });

  // Node 4: Pass 1 - Structural Detection
  nodes.push({
    id: 4,
    type: "GroundingDinoSAMSegment",
    pos: [400, 250],
    size: [315, 180],
    flags: {},
    order: 3,
    mode: 0,
    inputs: [
      {name: "grounding_dino_model", type: "GROUNDING_DINO_MODEL", link: 5},
      {name: "sam_model", type: "SAM_MODEL", link: 17}, // SAM2 loaded once
      {name: "image", type: "IMAGE", link: 2}
    ],
    outputs: [
      {name: "BBOXES", type: "BBOXES", slot_index: 0, links: [6]},
      {name: "MASKS", type: "MASKS", slot_index: 1, links: [7]}
    ],
    properties: {"Node name for S&R": "GroundingDinoSAMSegment"},
    widgets_values: [
      "wall, floor, ceiling, door, window, arch, column, beam",
      "person, people, outdoor, sky, car, text, watermark",
      0.35, 0.25, 0.8, 50 // Reduced max_detections for memory
    ],
    title: "🏗️ Pass 1: Structural"
  });

  // Node 5: Pass 2 - Furniture Detection  
  nodes.push({
    id: 5,
    type: "GroundingDinoSAMSegment",
    pos: [400, 480],
    size: [315, 180],
    flags: {},
    order: 4,
    mode: 0,
    inputs: [
      {name: "grounding_dino_model", type: "GROUNDING_DINO_MODEL", link: 8},
      {name: "sam_model", type: "SAM_MODEL", link: 17},
      {name: "image", type: "IMAGE", link: 3}
    ],
    outputs: [
      {name: "BBOXES", type: "BBOXES", slot_index: 0, links: [9]},
      {name: "MASKS", type: "MASKS", slot_index: 1, links: [10]}
    ],
    properties: {"Node name for S&R": "GroundingDinoSAMSegment"},
    widgets_values: [
      "sofa, chair, table, bed, cabinet, shelf, wardrobe, desk",
      "person, people, outdoor, sky, car, text, watermark", 
      0.30, 0.25, 0.8, 75 // Moderate detection count
    ],
    title: "🪑 Pass 2: Furniture"
  });

  // Node 6: Pass 3 - Combined Secondary & Clutter Detection
  // OPTIMIZATION: Combined passes 3 & 4 to save memory
  nodes.push({
    id: 6,
    type: "GroundingDinoSAMSegment",
    pos: [400, 710],
    size: [315, 180],
    flags: {},
    order: 5,
    mode: 0,
    inputs: [
      {name: "grounding_dino_model", type: "GROUNDING_DINO_MODEL", link: 11],
      {name: "sam_model", type: "SAM_MODEL", link: 17},
      {name: "image", type: "IMAGE", link: 4}
    ],
    outputs: [
      {name: "BBOXES", type: "BBOXES", slot_index: 0, links: [12]},
      {name: "MASKS", type: "MASKS", slot_index: 1, links: [13]}
    ],
    properties: {"Node name for S&R": "GroundingDinoSAMSegment"},
    widgets_values: [
      "lamp, fan, curtain, rug, plant, television, decoration, clutter, utensils, appliances",
      "person, people, outdoor, sky, car, text, watermark",
      0.25, 0.20, 0.8, 100 // Combined secondary items
    ],
    title: "💡 Pass 3: Secondary + Clutter"
  });

  // === STAGE 3: SAM2 MODEL LOADING (Optimized) ===

  // Node 7: SAM2 Model Loader (Memory-Optimized)
  nodes.push({
    id: 7,
    type: "SAM2ModelLoader",
    pos: [800, 100],
    size: [315, 98],
    flags: {},
    order: 6,
    mode: 0,
    inputs: [],
    outputs: [
      {name: "SAM_MODEL", type: "SAM_MODEL", slot_index: 0, links: [17]}
    ],
    properties: {"Node name for S&R": "SAM2ModelLoader"},
    widgets_values: maxMemoryGB < 6 ? "sam2_base.pt" : "sam2_huge.pt", // Dynamic model selection
    title: `🎯 SAM2 (${maxMemoryGB < 6 ? 'Base' : 'Huge'})`
  });

  // === STAGE 4: SMART MASK CONSOLIDATION ===

  // Node 8: Intelligent Mask Consolidation
  nodes.push({
    id: 8,
    type: "SmartMaskConsolidate",
    pos: [800, 250],
    size: [315, 200],
    flags: {},
    order: 7,
    mode: 0,
    inputs: [
      {name: "masks_structural", type: "MASKS", link: 7},
      {name: "masks_furniture", type: "MASKS", link: 10},
      {name: "masks_secondary", type: "MASKS", link: 13},
      {name: "image", type: "IMAGE", link: 2}
    ],
    outputs: [
      {name: "CONSOLIDATED_MASKS", type: "MASKS", slot_index: 0, links: [18]},
      {name: "DETECTION_COUNT", type: "INT", slot_index: 1, links: [19]}
    ],
    properties: {"Node name for S&R": "SmartMaskConsolidate"},
    widgets_values: [
      0.5,    // IoU threshold
      0.3,    // confidence threshold
      maxMemoryGB < 6 ? 50 : 100 // Max detections based on memory
    ],
    title: "🔄 Smart Consolidation"
  });

  // === STAGE 5: EFFICIENT SEMANTIC CLASSIFICATION ===

  // Node 9: Streamlined Semantic Classification
  nodes.push({
    id: 9,
    type: "SemanticClassifier",
    pos: [800, 500],
    size: [315, 200],
    flags: {},
    order: 8,
    mode: 0,
    inputs: [
      {name: "masks", type: "MASKS", link: 18},
      {name: "detection_count", type: "INT", link: 19},
      {name: "image", type: "IMAGE", link: 2}
    ],
    outputs: [
      {name: "WALL_MASK", type: "MASK", slot_index: 0, links: [20]},
      {name: "FLOOR_MASK", type: "MASK", slot_index: 1, links: [21]},
      {name: "CEILING_MASK", type: "MASK", slot_index: 2, links: [22]},
      {name: "OBJECT_MASK", type: "MASK", slot_index: 3, links: [23]},
      {name: "EMPTY_SPACE_MASK", type: "MASK", slot_index: 4, links: [24]}
    ],
    properties: {"Node name for S&R": "SemanticClassifier"},
    widgets_values: [
      "wall,wall surface,wall texture",
      "floor,floor surface,floor tiles,marble,wooden floor,carpet", 
      "ceiling,ceiling surface,ceiling fan",
      "furniture,sofa,chair,table,bed,cabinet,decoration,plant,lamp",
      0.7
    ],
    title: "🏷️ Semantic Classification"
  });

  // === STAGE 6: LIGHTWEIGHT POST-PROCESSING ===

  // Node 10: Essential Mask Refinement (Simplified)
  nodes.push({
    id: 10,
    type: "EssentialMaskRefine",
    pos: [1200, 250],
    size: [315, 180],
    flags: {},
    order: 9,
    mode: 0,
    inputs: [
      {name: "wall_mask", type: "MASK", link: 20},
      {name: "floor_mask", type: "MASK", link: 21},
      {name: "object_mask", type: "MASK", link: 23}
    ],
    outputs: [
      {name: "REFINED_WALL_MASK", type: "MASK", slot_index: 0, links: [25]},
      {name: "REFINED_FLOOR_MASK", type: "MASK", slot_index: 1, links: [26]},
      {name: "REFINED_OBJECT_MASK", type: "MASK", slot_index: 2, links: [27]}
    ],
    properties: {"Node name for S&R": "EssentialMaskRefine"},
    widgets_values: [
      "hole_fill,edge_smooth", // Simplified operations
      3,                        // Smaller kernel for memory
      0.6                       // Moderate strength
    ],
    title: "🔧 Essential Refinement"
  });

  // === STAGE 7: DEPTH ESTIMATION (if enabled, optimized) ===

  if (enableDepth) {
    // Node 11: Depth Anything V2 (Memory-Optimized)
    nodes.push({
      id: 11,
      type: "DepthAnythingV2",
      pos: [1200, 480],
      size: [315, 150],
      flags: {},
      order: 10,
      mode: 0,
      inputs: [
        {name: "image", type: "IMAGE", link: 2},
        {name: "floor_mask", type: "MASK", link: 21} // Mask-guided depth
      ],
      outputs: [
        {name: "DEPTH_MAP", type: "IMAGE", slot_index: 0, links: [28]}
      ],
      properties: {"Node name for S&R": "DepthAnythingV2"},
      widgets_values: [
        maxMemoryGB < 6 ? "depth_anything_v2_vits14.pt" : "depth_anything_v2_vitl14.pt",
        "indoor",
        true // Enable mask guidance
      ],
      title: `📏 Depth V2 (${maxMemoryGB < 6 ? 'Small' : 'Large'})`
    });
  }

  // === STAGE 8: EFFICIENT OUTPUT EXPORT ===

  const outputStartY = enableDepth ? 700 : 480;
  
  // Node 12: Batch Export (Memory-Efficient)
  nodes.push({
    id: 12,
    type: "BatchSaveImage",
    pos: [1550, outputStartY],
    size: [280, 250],
    flags: {},
    order: enableDepth ? 11 : 10,
    mode: 0,
    inputs: [
      {name: "wall_mask", type: "MASK", link: 25},
      {name: "floor_mask", type: "MASK", link: 26},
      {name: "ceiling_mask", type: "MASK", link: 22},
      {name: "object_mask", type: "MASK", link: 27},
      {name: "empty_space_mask", type: "MASK", link: 24}
    ],
    outputs: [],
    properties: {"Node name for S&R": "BatchSaveImage"},
    widgets_values: [
      ["wall_mask", "floor_mask", "ceiling_mask", "object_mask", "empty_space_mask"],
      "png",           // Format
      true             // Sequential processing to save memory
    ],
    title: "💾 Batch Export"
  });

  // Node 13: Depth Export (if enabled)
  if (enableDepth) {
    nodes.push({
      id: 13,
      type: "SaveImage",
      pos: [1550, outputStartY + 300],
      size: [280, 110],
      flags: {},
      order: 12,
      mode: 0,
      inputs: [
        {name: "images", type: "IMAGE", link: 28}
      ],
      outputs: [],
      properties: {"Node name for S&R": "SaveImage"},
      widgets_values: ["depth_map"],
      title: "💾 Depth Map"
    });
  }

  return nodes;
}

/**
 * Build optimized workflow links
 */
function buildOptimizedWorkflowLinks(): number[][] {
  const links = [
    // Input connections
    [1, 1, 0, 2, 0, "IMAGE"],           // LoadImage -> ImageScale
    [2, 2, 0, 4, 2, "IMAGE"],           // ImageScale -> Pass 1
    [3, 2, 0, 5, 2, "IMAGE"],           // ImageScale -> Pass 2
    [4, 2, 0, 6, 2, "IMAGE"],           // ImageScale -> Pass 3
    
    // GroundingDINO model connections (shared)
    [5, 3, 0, 4, 0, "GROUNDING_DINO_MODEL"], // Model -> Pass 1
    [8, 3, 0, 5, 0, "GROUNDING_DINO_MODEL"], // Model -> Pass 2
    [11, 3, 0, 6, 0, "GROUNDING_DINO_MODEL"], // Model -> Pass 3
    
    // SAM2 model connections (shared)
    [17, 7, 0, 4, 1, "SAM_MODEL"],      // SAM2 -> Pass 1
    [17, 7, 0, 5, 1, "SAM_MODEL"],      // SAM2 -> Pass 2
    [17, 7, 0, 6, 1, "SAM_MODEL"],      // SAM2 -> Pass 3
    
    // Detection outputs to consolidation
    [7, 4, 1, 8, 0, "MASKS"],           // Pass 1 masks -> Consolidate
    [10, 5, 1, 8, 1, "MASKS"],          // Pass 2 masks -> Consolidate
    [13, 6, 1, 8, 2, "MASKS"],          // Pass 3 masks -> Consolidate
    
    // Consolidation to classification
    [18, 8, 0, 9, 0, "MASKS"],         // Consolidated masks -> Classifier
    [19, 8, 1, 9, 1, "INT"],           // Detection count -> Classifier
    
    // Classification outputs
    [20, 9, 0, 10, 0, "MASK"],         // Wall mask -> Refinement
    [21, 9, 1, 10, 1, "MASK"],         // Floor mask -> Refinement
    [22, 9, 2, 12, 2, "MASK"],         // Ceiling mask -> Export
    [23, 9, 3, 10, 2, "MASK"],         // Object mask -> Refinement
    [24, 9, 4, 12, 4, "MASK"],         // Empty space -> Export
    
    // Refinement to export
    [25, 10, 0, 12, 0, "MASK"],        // Refined wall -> Export
    [26, 10, 1, 12, 1, "MASK"],        // Refined floor -> Export
    [27, 10, 2, 12, 3, "MASK"],        // Refined object -> Export
  ];

  // Add depth links if enabled
  if (true) { // enableDepth
    links.push(
      [28, 11, 0, 13, 0, "IMAGE"]      // Depth -> Export
    );
  }

  return links;
}

/**
 * Build optimized workflow groups
 */
function buildOptimizedWorkflowGroups(): any[] {
  return [
    {
      title: "📥 INPUT & PREPROCESS",
      bounding: [10, 50, 380, 580],
      color: "#3f789e"
    },
    {
      title: "🔍 SEQUENTIAL DETECTION",
      bounding: [380, 50, 380, 900],
      color: "#8A2BE2"
    },
    {
      title: "🎯 SHARED MODELS",
      bounding: [780, 50, 380, 200],
      color: "#2a9d8f"
    },
    {
      title: "🏷️ SMART CLASSIFICATION",
      bounding: [780, 280, 380, 450],
      color: "#e76f51"
    },
    {
      title: "🔧 ESSENTIAL POST-PROCESSING",
      bounding: [1180, 200, 380, 450],
      color: "#264653"
    },
    {
      title: "💾 EFFICIENT EXPORT",
      bounding: [1530, 450, 320, 600],
      color: "#2a9d8f"
    }
  ];
}

export default createOptimizedSceneUnderstandingWorkflow;
