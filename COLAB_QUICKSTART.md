# Removation.ai — Colab Quick Start

## Every session (2-3 min after first run)
1. Open scripts/RemovationColab.ipynb in Google Colab
2. Runtime → Change runtime type → T4 GPU
3. Runtime → Run all
4. Wait for the URL box to appear in Cell 6
5. Copy the URL → Admin panel → Settings → GPU → Cloud URL
6. Set GPU Mode to: cloud → Save
7. Submit a room redesign to test

## First run only (~20 min)
Same steps — notebook downloads all models to Drive automatically.
After first run, every session starts in 2-3 min.

## One-time model uploads (for 2 features)
Upload to Google Drive at: My Drive/RemovationAI/models/

### Furniture Staging (Flux models)
- diffusion_models/flux1-dev-fp8.safetensors → huggingface.co/black-forest-labs/FLUX.1-dev
- vae/ae.safetensors → same repo
- style_models/flux1-redux-dev.safetensors → huggingface.co/black-forest-labs/FLUX.1-Redux-dev
- loras/flux_realism_lora.safetensors → huggingface.co/XLabs-AI/flux-RealismLora

### Material Changer (Qwen models — from your local machine)
- diffusion_models/qwen_image_edit_2509_fp8_e4m3fn.safetensors
- clip/qwen_2.5_vl_7b_fp8_scaled.safetensors
- vae/qwen_image_vae.safetensors
- loras/Qwen-Edit-2509-Multiple-angles.safetensors
- unet/qwen-image-edit-2509.Q4_K_M.gguf

## Features available without any uploads
- Room Redesign ✅
- Room Changer ✅
- Ceiling Changer ✅
- IC-Light Relighting ✅
- Furniture Removal ✅
- View Extend / Outpaint ✅
- Ultra-Pro Pipeline ✅

## Troubleshooting
- No tunnel URL: !cat /content/tunnel.log
- ComfyUI error: !cat /content/comfyui.log
- Job hangs: check GPU mode is set to cloud in admin panel
- Session expired: re-run all cells and paste new URL
