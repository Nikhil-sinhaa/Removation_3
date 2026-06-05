#!/usr/bin/env python3
"""
IC-Light Preset Calibration Script
Runs systematic tests through ComfyUI API and reports results.
"""

import json
import requests
import time
import os
import sys

COMFY_URL = "http://localhost:8188"
INPUT_DIR = "/home/nikhil/Documents/Remo2/ComfyUI/input/"
OUTPUT_DIR = "/home/nikhil/Documents/Remo2/ComfyUI/output/"
FIXED_SEED = 42424242
STEPS = 20

# ─── find test image ─────────────────────────────────────────────────────────
def find_test_image():
    """Pick the best available room image for testing."""
    preferred = [
        "redesign_1776500991297_empty-with-blue-wall-room.jpg",
        "furnitureremover_1779349156717_contemporary-residential-living-room-background-wall-color-powder-blue-photo.png",
        "oldman.jpg",
    ]
    for p in preferred:
        if os.path.exists(os.path.join(INPUT_DIR, p)):
            print(f"[INFO] Using test image: {p}")
            return p
    # fallback: newest non-lighting file
    all_files = [f for f in os.listdir(INPUT_DIR)
                 if f.lower().endswith(('.jpg', '.jpeg', '.png'))
                 and not f.startswith('lighting_')]
    if all_files:
        all_files.sort(key=lambda x: os.path.getmtime(os.path.join(INPUT_DIR, x)), reverse=True)
        print(f"[INFO] Fallback test image: {all_files[0]}")
        return all_files[0]
    raise RuntimeError("No suitable test image found in ComfyUI/input/")

TEST_IMAGE = find_test_image()

# ─── build API prompt ────────────────────────────────────────────────────────
def build_prompt(params, filename_prefix):
    """Build a ComfyUI API-format prompt from params dict."""
    p = params
    return {
        "2": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "1_5photon_v1.safetensors"}
        },
        "37": {
            "class_type": "LoadAndApplyICLight",
            "inputs": {
                "model": ["2", 0],
                "model_path": "IC-Light/iclight_sd15_fc.safetensors"
            }
        },
        "9": {
            "class_type": "LoadImage",
            "inputs": {"image": TEST_IMAGE, "upload": "image"}
        },
        "46": {
            "class_type": "ImageResizeKJ",
            "inputs": {
                "image": ["9", 0],
                "width": 512,
                "height": 512,
                "upscale_method": "lanczos",
                "keep_proportion": False,
                "divisible_by": 8,
                "crop": "disabled"
            }
        },
        "22": {
            "class_type": "CreateShapeMask",
            "inputs": {
                "frame_width": ["46", 1],
                "frame_height": ["46", 2],
                "shape": p.get("shape", "circle"),
                "frames": p.get("frames", 1),
                "location_x": p.get("location_x", 256),
                "location_y": p.get("location_y", 256),
                "grow": 5,
                "shape_width": p.get("shape_width", 80),
                "shape_height": p.get("shape_height", 80),
            }
        },
        "43": {
            "class_type": "RemapMaskRange",
            "inputs": {
                "mask": ["22", 0],
                "min": 0.0,
                "max": p.get("intensity", 0.70)
            }
        },
        "42": {
            "class_type": "GrowMaskWithBlur",
            "inputs": {
                "mask": ["43", 0],
                "expand": 5,
                "incremental_expandrate": p.get("spread", 0.3),
                "tapered_corners": True,
                "flip_input": p.get("invert", False),
                "blur_radius": p.get("softness", 15.0),
                "lerp_alpha": 1.0,
                "decay_factor": 1.0,
                "fill_holes": True
            }
        },
        "35": {
            "class_type": "MaskToImage",
            "inputs": {"mask": ["42", 0]}
        },
        "45": {
            "class_type": "VAEEncode",
            "inputs": {"pixels": ["46", 0], "vae": ["2", 2]}
        },
        "20": {
            "class_type": "VAEEncode",
            "inputs": {"pixels": ["35", 0], "vae": ["2", 2]}
        },
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["2", 1],
                "text": p.get("prompt", "interior photography, soft light, realistic shadows")
            }
        },
        "5": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["2", 1],
                "text": "bad quality, blurry, overexposed, watermark, text"
            }
        },
        "44": {
            "class_type": "ICLightConditioning",
            "inputs": {
                "positive": ["4", 0],
                "negative": ["5", 0],
                "vae": ["2", 2],
                "foreground": ["45", 0],
                "multiplier": p.get("multiplier", 0.28)
            }
        },
        "19": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["37", 0],
                "positive": ["44", 0],
                "negative": ["44", 1],
                "latent_image": ["20", 0],
                "seed": FIXED_SEED,
                "control_after_generate": "fixed",
                "steps": STEPS,
                "cfg": p.get("cfg", 2.0),
                "sampler_name": "euler",
                "scheduler": "ddim_uniform",
                "denoise": p.get("denoise", 0.90)
            }
        },
        "7": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["19", 0], "vae": ["2", 2]}
        },
        "36": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["7", 0],
                "filename_prefix": filename_prefix
            }
        },
    }


# ─── submit + wait ────────────────────────────────────────────────────────────
def submit_test(params, filename_prefix, timeout=180):
    """Submit one test to ComfyUI and wait for completion. Returns output filename."""
    prompt = build_prompt(params, filename_prefix)
    try:
        resp = requests.post(f"{COMFY_URL}/prompt", json={"prompt": prompt}, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            print(f"  [ERROR] API error: {data['error']}")
            return f"ERROR: {data['error']}"
        prompt_id = data["prompt_id"]
    except Exception as e:
        print(f"  [ERROR] Submit failed: {e}")
        return f"SUBMIT_FAILED: {e}"

    print(f"  → Queued prompt_id={prompt_id}, waiting...", end="", flush=True)
    max_polls = timeout // 3
    for i in range(max_polls):
        time.sleep(3)
        try:
            hist = requests.get(f"{COMFY_URL}/history/{prompt_id}", timeout=10).json()
            if prompt_id in hist:
                entry = hist[prompt_id]
                status = entry.get("status", {})
                if status.get("completed"):
                    print(" ✓ Done")
                    outputs = entry.get("outputs", {})
                    for node_output in outputs.values():
                        if "images" in node_output:
                            for img in node_output["images"]:
                                fn = img["filename"]
                                print(f"  → Output: {fn}")
                                return fn
                    return "COMPLETED_NO_IMAGE"
                if status.get("status_str") == "error":
                    msgs = [m.get("details", str(m)) for m in status.get("messages", [])]
                    print(f" ✗ Error")
                    return f"ERROR: {'; '.join(msgs)}"
            # still running
            if i % 5 == 4:
                print(".", end="", flush=True)
        except Exception as e:
            print(f"\n  [WARN] Poll error: {e}")
    print(" TIMEOUT")
    return "TIMEOUT"


def wait_for_queue_empty(timeout=30):
    """Wait until ComfyUI queue is empty before submitting next job."""
    for _ in range(timeout // 2):
        try:
            q = requests.get(f"{COMFY_URL}/queue", timeout=5).json()
            running = q.get("queue_running", [])
            pending = q.get("queue_pending", [])
            if not running and not pending:
                return
        except Exception:
            pass
        time.sleep(2)


# ─── SERIES 1: CFG × DENOISE GRID ────────────────────────────────────────────
def series_1():
    print("\n" + "═"*60)
    print("SERIES 1 — CFG × DENOISE GRID (9 tests)")
    print("═"*60)

    base = {
        "shape": "circle", "shape_width": 80, "shape_height": 80,
        "location_x": 256, "location_y": 256,
        "spread": 0.3, "softness": 15.0, "invert": False,
        "intensity": 0.70, "multiplier": 0.28,
        "prompt": "interior photography, soft light, realistic shadows",
        "frames": 1,
    }

    cfg_values = [2.0, 5.0, 9.0]
    denoise_values = [0.85, 0.90, 0.97]
    results = {}

    for cfg in cfg_values:
        for dn in denoise_values:
            key = f"cfg{cfg}_dn{dn}"
            prefix = f"cal_{key}"
            print(f"\n[Series 1] cfg={cfg} denoise={dn}")
            wait_for_queue_empty()
            params = {**base, "cfg": cfg, "denoise": dn}
            fname = submit_test(params, prefix)
            results[key] = {"cfg": cfg, "denoise": dn, "file": fname}

    print("\n── Series 1 Results ──────────────────────────────────")
    for k, v in results.items():
        print(f"  cfg={v['cfg']:4.1f}  denoise={v['denoise']}  →  {v['file']}")
    print()
    return results


# ─── SERIES 2: MULTIPLIER ────────────────────────────────────────────────────
def series_2(best_cfg=2.0, best_denoise=0.90):
    print("\n" + "═"*60)
    print(f"SERIES 2 — MULTIPLIER (using cfg={best_cfg}, denoise={best_denoise})")
    print("═"*60)

    base = {
        "shape": "circle", "shape_width": 80, "shape_height": 80,
        "location_x": 256, "location_y": 256,
        "spread": 0.3, "softness": 15.0, "invert": False,
        "intensity": 0.70, "cfg": best_cfg, "denoise": best_denoise,
        "prompt": "interior photography, soft light, realistic shadows",
        "frames": 1,
    }

    mult_values = [0.15, 0.22, 0.30, 0.38]
    results = {}

    for m in mult_values:
        prefix = f"cal_mult{m}"
        print(f"\n[Series 2] multiplier={m}")
        wait_for_queue_empty()
        fname = submit_test({**base, "multiplier": m}, prefix)
        results[m] = fname

    print("\n── Series 2 Results ──────────────────────────────────")
    for m, fn in results.items():
        print(f"  multiplier={m}  →  {fn}")
    return results


# ─── SERIES 3: SHAPE + POSITION ──────────────────────────────────────────────
def series_3(best_cfg=2.0, best_denoise=0.90, best_mult=0.28):
    print("\n" + "═"*60)
    print(f"SERIES 3 — SHAPE + POSITION (cfg={best_cfg}, dn={best_denoise}, mult={best_mult})")
    print("═"*60)

    common = {"cfg": best_cfg, "denoise": best_denoise, "multiplier": best_mult,
              "intensity": 0.70, "frames": 1}

    tests = {
        "cal_window": {
            **common,
            "shape": "rectangle", "shape_width": 80, "shape_height": 300,
            "location_x": 100, "location_y": 180,
            "spread": 0.4, "softness": 25.0, "invert": False,
            "prompt": "natural window light, soft daylight, interior"
        },
        "cal_overhead": {
            **common,
            "shape": "circle", "shape_width": 100, "shape_height": 100,
            "location_x": 256, "location_y": 80,
            "spread": 0.3, "softness": 20.0, "invert": False,
            "prompt": "overhead lamp, warm interior light"
        },
        "cal_fullroom": {
            **common,
            "shape": "rectangle", "shape_width": 200, "shape_height": 400,
            "location_x": 256, "location_y": 256,
            "spread": 0.8, "softness": 40.0, "invert": True,
            "prompt": "bright daylight flooding interior, architectural photography"
        },
        "cal_sidelamp": {
            **common,
            "shape": "circle", "shape_width": 70, "shape_height": 70,
            "location_x": 380, "location_y": 350,
            "spread": 0.25, "softness": 12.0, "invert": False,
            "prompt": "warm side lamp, cozy interior, evening light"
        },
    }

    results = {}
    labels = {
        "cal_window": "Window light (rect, upper-left)",
        "cal_overhead": "Overhead lamp (circle, top)",
        "cal_fullroom": "Full room bright (invert=True)",
        "cal_sidelamp": "Side lamp (circle, lower-right)",
    }

    for prefix, params in tests.items():
        print(f"\n[Series 3] {labels[prefix]}")
        wait_for_queue_empty()
        fname = submit_test(params, prefix)
        results[prefix] = fname

    print("\n── Series 3 Results ──────────────────────────────────")
    for k, fn in results.items():
        print(f"  {labels[k]:40s}  →  {fn}")
    return results


# ─── SERIES 4: PROMPTS ───────────────────────────────────────────────────────
def series_4(best_cfg=2.0, best_denoise=0.90, best_mult=0.28):
    print("\n" + "═"*60)
    print(f"SERIES 4 — PROMPT COMPARISON (cfg={best_cfg}, dn={best_denoise}, mult={best_mult})")
    print("═"*60)

    base = {
        "shape": "circle", "shape_width": 80, "shape_height": 80,
        "location_x": 256, "location_y": 256,
        "spread": 0.3, "softness": 15.0, "invert": False,
        "intensity": 0.70, "cfg": best_cfg, "denoise": best_denoise,
        "multiplier": best_mult, "frames": 1,
    }

    prompts = [
        ("P1", "interior photography, soft light, photorealistic, sharp"),
        ("P2", "cinematic interior lighting, realistic, detailed"),
        ("P3", "warm interior light, cozy atmosphere, realistic shadows, interior design photography"),
        ("P4", "architectural photography, natural lighting, high quality, sharp"),
        ("P5", "soft light, cinematic, masterpiece, best quality, photograph"),
    ]

    results = {}
    for label, prompt in prompts:
        prefix = f"cal_prompt_{label}"
        print(f"\n[Series 4] {label}: {prompt[:60]}...")
        wait_for_queue_empty()
        fname = submit_test({**base, "prompt": prompt}, prefix)
        results[label] = {"prompt": prompt, "file": fname}

    print("\n── Series 4 Results ──────────────────────────────────")
    for label, v in results.items():
        print(f"  {label}: {v['prompt'][:55]:55s}  →  {v['file']}")
    return results


# ─── MAIN ────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("IC-LIGHT PRESET CALIBRATION")
    print(f"ComfyUI: {COMFY_URL}")
    print(f"Test image: {TEST_IMAGE}")
    print(f"Fixed seed: {FIXED_SEED}  |  Steps: {STEPS}")
    print("=" * 60)

    # Verify ComfyUI is running
    try:
        r = requests.get(f"{COMFY_URL}/system_stats", timeout=5)
        info = r.json()
        print(f"[OK] ComfyUI v{info['system']['comfyui_version']} is running")
        devices = info.get("devices", [])
        if devices:
            d = devices[0]
            vram_gb = d['vram_total'] / 1024**3
            print(f"[OK] GPU: {d['name']} — {vram_gb:.1f}GB VRAM")
    except Exception as e:
        print(f"[ERROR] ComfyUI not reachable: {e}")
        sys.exit(1)

    # ── SERIES 1 ──
    s1_results = series_1()

    print("\n" + "─"*60)
    print(">>> PAUSE: Review Series 1 output images in:")
    print(f"    {OUTPUT_DIR}")
    print("    Files: cal_cfg*.png")
    print()

    # For automation, use conservative best: cfg=2.0, denoise=0.90
    # (user should update these after visual inspection)
    best_cfg = 2.0
    best_dn = 0.90
    print(f"[AUTO] Defaulting best cfg={best_cfg}, denoise={best_dn}")
    print("  (Update manually after reviewing Series 1 images)")

    # ── SERIES 2 ──
    s2_results = series_2(best_cfg, best_dn)

    print("\n" + "─"*60)
    print(">>> PAUSE: Review Series 2 output images in:")
    print(f"    {OUTPUT_DIR}")
    print("    Files: cal_mult*.png")
    print()

    best_mult = 0.28
    print(f"[AUTO] Defaulting best multiplier={best_mult}")
    print("  (Update manually after reviewing Series 2 images)")

    # ── SERIES 3 ──
    s3_results = series_3(best_cfg, best_dn, best_mult)

    # ── SERIES 4 ──
    s4_results = series_4(best_cfg, best_dn, best_mult)

    # ── FINAL SUMMARY ──────────────────────────────────────────────────────────
    print("\n" + "═"*60)
    print("CALIBRATION RUN COMPLETE — ALL OUTPUT FILES:")
    print("═"*60)

    print("\n[ Series 1 — CFG × DENOISE ]")
    print(f"  {'cfg':>6}  {'denoise':>8}  file")
    for k, v in s1_results.items():
        print(f"  {v['cfg']:>6.1f}  {v['denoise']:>8.2f}  {v['file']}")

    print("\n[ Series 2 — MULTIPLIER ]")
    for m, fn in s2_results.items():
        print(f"  multiplier={m}  →  {fn}")

    print("\n[ Series 3 — SHAPE + POSITION ]")
    labels = {
        "cal_window":   "Window (rect, upper-left)",
        "cal_overhead": "Overhead lamp (circle, top)",
        "cal_fullroom": "Full room bright (invert)",
        "cal_sidelamp": "Side lamp (circle, lower-right)",
    }
    for k, fn in s3_results.items():
        print(f"  {labels[k]:38s}  →  {fn}")

    print("\n[ Series 4 — PROMPTS ]")
    for label, v in s4_results.items():
        print(f"  {label}: {v['prompt'][:55]:55s}")
        print(f"       →  {v['file']}")

    print("\n" + "═"*60)
    print("NEXT STEPS:")
    print("  1. Open output folder:", OUTPUT_DIR)
    print("  2. Rate Series 1 images (A/B/C/D/E) → find best cfg/denoise")
    print("  3. Rate Series 2 images (LOW/GOOD/HIGH) → find best multiplier")
    print("  4. Rate Series 3 images (YES/NO for each)")
    print("  5. Rate Series 4 images (quality/lighting/room 1-5)")
    print("  6. Update LIGHTING_PRESETS in:")
    print("       src/services/lightingOrchestrator.js")
    print("       app/(app)/lighting/page.tsx")
    print("═"*60)


if __name__ == "__main__":
    main()
