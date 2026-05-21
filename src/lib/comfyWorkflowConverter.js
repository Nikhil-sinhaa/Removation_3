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
    'bbox_threshold', 'bbox_dilation', 'crop_factor', 'drop_size',
    'sub_threshold', 'sub_dilation', 'sub_bbox_expansion',
    'sam_mask_hint_threshold', 'post_dilation',
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
        inputs[inp.name] = linkMap[inp.link];
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
