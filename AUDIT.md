=== NODE SIGNATURES AUDIT ===

=== Canny ===
  REQUIRED: image = IMAGE
  REQUIRED: low_threshold = FLOAT
  REQUIRED: high_threshold = FLOAT

=== ControlNetLoader ===
  REQUIRED: control_net_name = ['Qwen-Image-InstantX-ControlNet-Union.safetensors', 'control_canny-fp16.safetensors', 'control_depth-fp16.safetensors', 'control_scribble-fp16.safetensors']

=== ControlNetApplyAdvanced ===
  REQUIRED: positive = CONDITIONING
  REQUIRED: negative = CONDITIONING
  REQUIRED: control_net = CONTROL_NET
  REQUIRED: image = IMAGE
  REQUIRED: strength = FLOAT
  REQUIRED: start_percent = FLOAT
  REQUIRED: end_percent = FLOAT
  OPTIONAL: vae = VAE

=== ArchAi3D_Qwen_Interior_View_Control ===
  REQUIRED: preset = COMBO
  REQUIRED: scene_context = STRING
  REQUIRED: target_description = STRING
  REQUIRED: preservation_preset = COMBO
  REQUIRED: custom_preservation = STRING
  REQUIRED: custom_angle = STRING
  REQUIRED: debug_mode = BOOLEAN

=== QwenImageDiffsynthControlnet ===
  REQUIRED: model = MODEL
  REQUIRED: model_patch = MODEL_PATCH
  REQUIRED: vae = VAE
  REQUIRED: image = IMAGE
  REQUIRED: strength = FLOAT
  OPTIONAL: mask = MASK

=== ArchAi3D_Metric3D_Depth ===
  REQUIRED: name = STRING
  REQUIRED: image = IMAGE
  REQUIRED: backbone = ['vit-small', 'vit-large', 'vit-giant2']
  REQUIRED: resolution = INT
  REQUIRED: use_cache = BOOLEAN
  OPTIONAL: fx = INT
  OPTIONAL: fy = INT

=== KSampler ===
  REQUIRED: model = MODEL
  REQUIRED: seed = INT
  REQUIRED: steps = INT
  REQUIRED: cfg = FLOAT
  REQUIRED: sampler_name = ['euler', 'euler_cfg_pp', 'euler_ancestral', 'euler_ancestral_cfg_pp', 'heun', 'heunpp2', 'exp_heun_2_x0', 'exp_heun_2_x0_sde', 'dpm_2', 'dpm_2_ancestral', 'lms', 'dpm_fast', 'dpm_adaptive', 'dpmpp_2s_ancestral', 'dpmpp_2s_ancestral_cfg_pp', 'dpmpp_sde', 'dpmpp_sde_gpu', 'dpmpp_2m', 'dpmpp_2m_cfg_pp', 'dpmpp_2m_sde', 'dpmpp_2m_sde_gpu', 'dpmpp_2m_sde_heun', 'dpmpp_2m_sde_heun_gpu', 'dpmpp_3m_sde', 'dpmpp_3m_sde_gpu', 'ddpm', 'lcm', 'ipndm', 'ipndm_v', 'deis', 'res_multistep', 'res_multistep_cfg_pp', 'res_multistep_ancestral', 'res_multistep_ancestral_cfg_pp', 'gradient_estimation', 'gradient_estimation_cfg_pp', 'er_sde', 'seeds_2', 'seeds_3', 'sa_solver', 'sa_solver_pece', 'ddim', 'uni_pc', 'uni_pc_bh2']
  REQUIRED: scheduler = ['simple', 'sgm_uniform', 'karras', 'exponential', 'ddim_uniform', 'beta', 'normal', 'linear_quadratic', 'kl_optimal']
  REQUIRED: positive = CONDITIONING
  REQUIRED: negative = CONDITIONING
  REQUIRED: latent_image = LATENT
  REQUIRED: denoise = FLOAT

=== VAEEncode ===
  REQUIRED: pixels = IMAGE
  REQUIRED: vae = VAE
