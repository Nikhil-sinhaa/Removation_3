/**
 * ComfyUI GUI → API format converter.
 *
 * ComfyUI's GUI (LiteGraph) format stores nodes and links separately.
 * The API /prompt endpoint expects a flat { nodeId: { class_type, inputs } } object.
 *
 * Conversion rules:
 *  - Connected inputs: resolved from the links array to [sourceNodeId, outputSlot]
 *  - Widget values: mapped to named inputs using WIDGET_NAMES per node type
 *
 * Only node types present in Stage1 and Stage3 workflows need entries in WIDGET_NAMES.
 * Nodes with no widgets (only connected inputs) don't need an entry.
 */

const WIDGET_NAMES = {
  LoadImage: ['image', 'upload_type'],
  SaveImage: ['filename_prefix'],
  CheckpointLoaderSimple: ['ckpt_name'],
  CLIPTextEncode: ['text'],
  KSampler: ['seed', 'control_after_generate', 'steps', 'cfg', 'sampler_name', 'scheduler', 'denoise'],
  ImageToMask: ['channel'],
  MaskComposite: ['x', 'y', 'operation'],
  SAMLoader: ['model_name', 'device_mode'],
  CLIPSegDetectorProvider: ['text', 'blur', 'threshold', 'dilation_factor'],
  ImpactSimpleDetectorSEGS: [
    'bbox_threshold',
    'bbox_dilation',
    'crop_factor',
    'drop_size',
    'sub_threshold',
    'sub_dilation',
    'sub_bbox_expansion',
    'sam_mask_hint_threshold',
    'post_dilation',
  ],
  DepthAnythingV2Preprocessor: ['ckpt_name', 'resolution'],
  'SAMModelLoader (segment anything)': ['model_name'],
  'GroundingDinoModelLoader (segment anything)': ['model_name'],
  'GroundingDinoSAMSegment (segment anything)': ['prompt', 'threshold'],
  GrowMask: ['expand', 'tapered_corners'],
  LamaRemover: ['mask_threshold', 'gaussblur_radius', 'invert_mask'],
  LamaRemoverIMG: ['mask_threshold', 'gaussblur_radius', 'invert_mask'],
  AILab_LamaRemover: ['removal_strength', 'edge_smoothness'],
  RMBG: [
    'model',
    'sensitivity',
    'process_res',
    'mask_blur',
    'mask_offset',
    'invert_output',
    'refine_foreground',
    'background',
    'background_color',
  ],
  MinimaxImageRemover: [
    'num_inference_steps',
    'mask_dilation_iterations',
    'seed',
    'control_after_generate',
  ],
  MinimaxModelLoader: [
    'scheduler',
    'torch_dtype',
    'device',
    'local_files_only',
  ],
  ImageScale: [
    'upscale_method',
    'width',
    'height',
    'crop',
  ],
  ImageSizeAdjuster: [
    'divisible_by',
    'adjustment_mode',
    'scale_by',
    'pad_color',
  ],
  SegsToCombinedMask: [],
  AILab_Preview: [],
  VAEDecode: [],
  VAEEncode: [],
  VAEEncodeForInpaint: ['grow_mask_by'],
  MaskToImage: [],
  ImageCompositeMasked: ['x', 'y', 'resize_source'],
  ImageScaleBy: ['upscale_method', 'scale_by'],
  ImageTransform: ['transform_type', 'angle', 'scale_x', 'scale_y', 'translate_x', 'translate_y'],
  // For spotlight workflow 01
  CreateShapeMask: ['shape', 'frames', 'location_x', 'location_y', 'grow', 'shape_width', 'shape_height'],
  GrowMaskWithBlur: ['expand', 'incremental_expandrate', 'tapered_corners', 'flip_input', 'blur_radius', 'lerp_alpha', 'decay_factor', 'fill_holes'],
  RemapMaskRange: ['min', 'max'],
  ICLightConditioning: ['multiplier'],
  LoadAndApplyICLight: ['model_path'],
  // For directional workflow 08
  LightSource: ['light_position', 'start_color', 'end_color', 'width', 'height'],
  FloatConstant: ['value'],
  VHS_VAEEncodeBatched: ['per_batch'],
  ImageBatchMulti: ['inputcount'],
  ImageAddMulti: ['inputcount', 'blending', 'blend_amount'],
  ImageConcatMulti: ['inputcount', 'direction', 'match_image_size'],
  ImageResizeKJ: ['width', 'height', 'upscale_method', 'keep_proportion', 'divisible_by', 'crop'],
  // For gradient workflow 02 (ImageResize+ from ComfyUI-Essentials)
  'ImageResize+': ['width', 'height', 'interpolation', 'method', 'condition', 'multiple_of'],
  // CreateGradientFromCoords (KJNodes) — widget_0/1 are frame_width/height
  CreateGradientFromCoords: ['frame_width', 'frame_height', 'start_color', 'end_color', 'multiplier'],
  // SplineEditor (KJNodes)
  SplineEditor: ['points_store', 'coordinates', 'mask_width', 'mask_height', 'points_to_sample', 'sampling_method', 'interpolation', 'tension', 'repeat_output', 'float_output_type', 'min_value', 'max_value'],
  // For animated workflows 03–05
  AlignYourStepsScheduler: ['model_type', 'steps', 'denoise'],
  VHS_VAEDecodeBatched: ['per_batch'],
  ContextOptions: ['context_length', 'context_stride', 'context_overlap', 'context_schedule', 'closed_loop'],
  KSamplerSelect: ['sampler_name'],
  LatentBatchSeedBehavior: ['seed_behavior'],
  AnimateDiffUniformContextOptions: ['beta_schedule'],
  CreateShapeMaskOnPath: ['shape', 'frame_width', 'frame_height', 'shape_width', 'shape_height'],
  CreateShapeImageOnPath: ['shape', 'frame_width', 'frame_height', 'shape_width', 'shape_height', 'color', 'bg_opacity', 'shape_opacity', 'blur'],
  PreviewAnimation: ['fps'],
  VHS_VideoCombine: ['frame_rate', 'loop_count', 'filename_prefix', 'format', 'pix_fmt', 'crf', 'save_metadata', 'pingpong', 'save_output'],
  SamplerCustom: ['add_noise', 'noise_seed', 'control_after_generate', 'cfg'],
  // For FBC workflows 06 & 07
  BRIAAI_Matting: ['version', 'background_color'],
  DetailTransfer: ['mode', 'blur_sigma', 'blend_factor'],
  CalculateNormalsFromImages: ['sensitivity'],
};

/**
 * Convert a ComfyUI GUI-format workflow JSON to API prompt format.
 *
 * @param {object} guiWorkflow - Parsed JSON from a ComfyUI editor export
 * @returns {object} API-format graph: { [nodeId]: { class_type, inputs } }
 */
export function guiToApiGraph(guiWorkflow) {
  const { nodes = [], links = [] } = guiWorkflow;

  // Build link lookup: link_id → [sourceNodeId (string), sourceOutputSlot]
  const linkMap = {};
  for (const link of links) {
    const [link_id, from_node, from_slot] = link;
    linkMap[link_id] = [String(from_node), from_slot];
  }

  const apiGraph = {};

  for (const node of nodes) {
    const { id, type, inputs: connectedInputs = [], widgets_values = [] } = node;
    const nodeId = String(id);
    const inputs = {};

    // Connected inputs (resolved via link map)
    for (const inp of connectedInputs) {
      if (inp.link != null && linkMap[inp.link]) {
        let name = inp.name;
        // Translate image1 -> image_1 for KJNodes multi-input nodes
        if ((type === 'ImageBatchMulti' || type === 'ImageAddMulti' || type === 'ImageConcatMulti') && /^image\d+$/.test(name)) {
          name = name.replace('image', 'image_');
        }
        inputs[name] = linkMap[inp.link];
      }
    }

    // Widget values (mapped to named inputs)
    const widgetNames = WIDGET_NAMES[type] || [];
    for (let i = 0; i < widgets_values.length; i++) {
      const name = widgetNames[i] || `widget_${i}`;
      inputs[name] = widgets_values[i];
    }

    apiGraph[nodeId] = { class_type: type, inputs };
  }

  return apiGraph;
}
