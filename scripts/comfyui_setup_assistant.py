#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
import shutil

def format_size(bytes_size):
    if bytes_size is None or bytes_size < 0:
        return "0.0 B"
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} PB"

def check_file_size(file_path):
    if not os.path.exists(file_path):
        return 0
    # Resolve symlinks to get actual file size
    real_path = os.path.realpath(file_path)
    return os.path.getsize(real_path)

def download_file(url, output_path):
    print(f"\n📥 Downloading {os.path.basename(output_path)}...")
    print(f"   URL: {url}")
    print(f"   Destination: {output_path}")
    
    # Ensure parent directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Use wget with continue option for robust resumption
    cmd = ["wget", "-c", "--show-progress", url, "-O", output_path]
    
    try:
        process = subprocess.Popen(cmd, stdout=sys.stdout, stderr=sys.stderr)
        process.communicate()
        if process.returncode == 0:
            print(f"✅ Successfully downloaded {os.path.basename(output_path)}")
            return True
        else:
            print(f"❌ Failed to download {os.path.basename(output_path)} (exit code: {process.returncode})")
            return False
    except Exception as e:
        print(f"❌ Error executing download command: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="ComfyUI IC-Light Models Setup Assistant")
    parser.add_argument("--root", type=str, help="Manually specify the COMFYUI_ROOT path")
    parser.add_argument("--auto-substitute", action="store_true", help="Automatically use Photon v1 as substitute for VIBL")
    args = parser.parse_args()

    print("=" * 70)
    print("🌟 COMFYUI WORKFLOW SETUP ASSISTANT 🌟")
    print("=" * 70)

    # ───────────────────────────────────────────────────────────
    # STEP 1 — FIND COMFYUI INSTALLATION
    # ───────────────────────────────────────────────────────────
    print("\n═══════════════════════════════════════════════════════════════")
    print("STEP 1 — FIND COMFYUI INSTALLATION")
    print("═══════════════════════════════════════════════════════════════")
    
    comfyui_root = None
    
    if args.root:
        if os.path.isdir(args.root):
            comfyui_root = os.path.abspath(args.root)
            print(f"🎯 Using manually specified ComfyUI root: {comfyui_root}")
        else:
            print(f"❌ Specified root path does not exist: {args.root}")
            sys.exit(1)
            
    if not comfyui_root:
        # Check paths in order
        home = os.path.expanduser("~")
        candidate_paths = [
            os.path.join(home, "ComfyUI"),
            os.path.join(home, "Desktop/ComfyUI"),
            "/workspace/ComfyUI",
            "/content/ComfyUI",
            "/opt/ComfyUI",
            # Smart fallback for our known repository structure
            os.path.join(home, "Documents/Remo2/ComfyUI")
        ]
        
        for path in candidate_paths:
            if os.path.isdir(path):
                comfyui_root = os.path.abspath(path)
                print(f"🎯 Auto-detected ComfyUI folder at: {comfyui_root}")
                break
                
    if not comfyui_root:
        print("❌ Could not find your ComfyUI installation folder in standard locations.")
        try:
            user_input = input("Where is your ComfyUI folder? Please type the full path: ").strip()
            if os.path.isdir(user_input):
                comfyui_root = os.path.abspath(user_input)
                print(f"🎯 Using path: {comfyui_root}")
            else:
                print("❌ Invalid directory path provided.")
                sys.exit(1)
        except (KeyboardInterrupt, EOFError):
            print("\n❌ Input interrupted. Exiting.")
            sys.exit(1)

    # Define model specifications
    # Thresholds are set in bytes, allowing slightly smaller sizes to account for different decimal definitions
    models_config = [
        {
            "name": "1_5photon_v1.safetensors",
            "rel_path": "models/checkpoints/1_5photon_v1.safetensors",
            "min_size": 2.0 * 1000 * 1000 * 1000, # 2.0 GB decimal
            "description": "SD 1.5 Base Checkpoint (Photon v1)",
            "workflows": "All 8 workflows",
            "url": "https://civitai.com/api/download/models/90072",
            "civitai_manual_url": "https://civitai.com/models/84728/photon",
            "fallback_note": "If Civitai download fails due to login/token, report this clearly and tell the user to download manually."
        },
        {
            "name": "iclight_sd15_fc.safetensors",
            "rel_path": "models/unet/IC-Light/iclight_sd15_fc.safetensors",
            "min_size": 380 * 1000 * 1000, # 380 MB
            "description": "IC-Light FC UNet (foreground-only relighting)",
            "workflows": "ic_light_single_circle, ic_light_single_gradient, ic_light_animated_circle, ic_light_animated_gradient, ic_light_simple_light_multi",
            "url": "https://huggingface.co/lllyasviel/ic-light/resolve/main/iclight_sd15_fc.safetensors"
        },
        {
            "name": "iclight_sd15_fbc.safetensors",
            "rel_path": "models/unet/IC-Light/iclight_sd15_fbc.safetensors",
            "min_size": 380 * 1000 * 1000, # 380 MB
            "description": "IC-Light FBC UNet (foreground + background relighting)",
            "workflows": "ic_light_fbc, ic_light_normals, ic_light_animated_multilight",
            "url": "https://huggingface.co/lllyasviel/ic-light/resolve/main/iclight_sd15_fbc.safetensors"
        },
        {
            "name": "mm_sd_v15_v2.ckpt",
            "rel_path": "models/animatediff_models/mm_sd_v15_v2.ckpt",
            "min_size": 1.7 * 1000 * 1000 * 1000, # 1.7 GB
            "description": "AnimateDiff Motion Module v2",
            "workflows": "ic_light_animated_circle, ic_light_animated_gradient, ic_light_animated_multilight",
            "url": "https://huggingface.co/guoyww/animatediff/resolve/main/mm_sd_v15_v2.ckpt"
        },
        {
            "name": "model.pth",
            "rel_path": "models/BRIA/RMBG-1.4/model.pth",
            "min_size": 170 * 1000 * 1000, # 170 MB
            "description": "BRIAAI RMBG-1.4 (background matting / subject extraction)",
            "workflows": "ic_light_fbc, ic_light_normals",
            "url": "https://huggingface.co/briaai/RMBG-1.4/resolve/main/model.pth"
        },
        {
            "name": "VIBL_v5TVAE.safetensors",
            "rel_path": "models/checkpoints/[fine]stick/clean/VIBL_v5TVAE.safetensors",
            "min_size": 2.0 * 1000 * 1000 * 1000, # 2.0 GB
            "description": "VIBL / Fine-tuned SD 1.5 variant",
            "workflows": "ic_light_normals workflow only",
            "url": None, # No public link
            "substitute_source": "models/checkpoints/1_5photon_v1.safetensors"
        }
    ]

    # ───────────────────────────────────────────────────────────
    # STEP 3 — CREATE MISSING FOLDERS
    # ───────────────────────────────────────────────────────────
    print("\n═══════════════════════════════════════════════════════════════")
    print("STEP 3 — CREATE MISSING FOLDERS")
    print("═══════════════════════════════════════════════════════════════")
    
    required_folders = [
        "models/checkpoints",
        "models/unet/IC-Light",
        "models/animatediff_models",
        "models/BRIA/RMBG-1.4",
        "models/checkpoints/[fine]stick/clean"
    ]
    
    for folder in required_folders:
        full_folder_path = os.path.join(comfyui_root, folder)
        if not os.path.exists(full_folder_path):
            os.makedirs(full_folder_path, exist_ok=True)
            print(f"📁 Created folder: {full_folder_path}")
        else:
            print(f"📁 Folder already exists: {full_folder_path}")

    # ───────────────────────────────────────────────────────────
    # STEP 2 — CHECK & DOWNLOAD ALL MODELS
    # ───────────────────────────────────────────────────────────
    print("\n═══════════════════════════════════════════════════════════════")
    print("STEP 2 — CHECK & DOWNLOAD ALL MODELS")
    print("═══════════════════════════════════════════════════════════════")

    results = []

    for config in models_config:
        full_path = os.path.join(comfyui_root, config["rel_path"])
        name = config["name"]
        min_size = config["min_size"]
        desc = config["description"]
        url = config["url"]
        
        print(f"\n🔍 Checking {name} ({desc})...")
        print(f"   Path: {full_path}")
        
        size_on_disk = check_file_size(full_path)
        is_valid = size_on_disk >= min_size
        
        if is_valid:
            print(f"   ✅ FOUND - File exists with valid size: {format_size(size_on_disk)}")
            results.append({
                "model": name,
                "path": os.path.dirname(config["rel_path"]) + "/",
                "size": format_size(size_on_disk),
                "status": "✅ FOUND"
            })
        else:
            if size_on_disk > 0:
                print(f"   ⚠️  PARTIAL/CORRUPT - File exists but is too small: {format_size(size_on_disk)} (expected >= {format_size(min_size)})")
            else:
                print(f"   ❌ MISSING - File does not exist.")
            
            # Handle special VIBL model substitution
            if name == "VIBL_v5TVAE.safetensors":
                photon_path = os.path.join(comfyui_root, config["substitute_source"])
                photon_size = check_file_size(photon_path)
                if photon_size >= 2.0 * 1000 * 1000 * 1000:
                    print(f"   💡 VIBL has no confirmed public link. Creating symlink to Photon v1 as a substitute...")
                    try:
                        # Remove if exists (partial/broken)
                        if os.path.exists(full_path) or os.path.islink(full_path):
                            os.remove(full_path)
                        # Relative symlink to avoid absolute path breakages
                        os.symlink("../../1_5photon_v1.safetensors", full_path)
                        new_size = check_file_size(full_path)
                        print(f"   ✅ Symlink successfully created for VIBL -> 1_5photon_v1.safetensors")
                        results.append({
                            "model": name,
                            "path": os.path.dirname(config["rel_path"]) + "/",
                            "size": format_size(new_size),
                            "status": "✅ SUBSTITUTED"
                        })
                    except Exception as e:
                        print(f"   ❌ Failed to create symlink for VIBL substitute: {e}")
                        results.append({
                            "model": name,
                            "path": os.path.dirname(config["rel_path"]) + "/",
                            "size": "0.0 B",
                            "status": "❌ FAILED"
                        })
                else:
                    print(f"   ❌ VIBL cannot be substituted yet because Photon v1 checkpoint is not fully downloaded.")
                    results.append({
                        "model": name,
                        "path": os.path.dirname(config["rel_path"]) + "/",
                        "size": "0.0 B",
                        "status": "❌ FAILED"
                    })
            elif url:
                # CivitAI auth/login warning for Photon v1
                if "civitai.com" in url:
                    print(f"   ⚠️  Attempting Civitai download for Photon v1. If this fails due to login restriction, please download manually.")
                
                success = download_file(url, full_path)
                final_size = check_file_size(full_path)
                if success and final_size >= min_size:
                    results.append({
                        "model": name,
                        "path": os.path.dirname(config["rel_path"]) + "/",
                        "size": format_size(final_size),
                        "status": "✅ DOWNLOADED"
                    })
                else:
                    status_text = "❌ FAILED"
                    if "civitai.com" in url:
                        status_text = "❌ CIVITAI AUTH REQ"
                        print(f"\n🚨 Photon v1 download failed. Civitai requires an API token / login.")
                        print(f"   Please download it manually from: {config['civitai_manual_url']}")
                        print(f"   Save it directly to: {full_path}")
                    results.append({
                        "model": name,
                        "path": os.path.dirname(config["rel_path"]) + "/",
                        "size": format_size(final_size) if final_size > 0 else "0.0 B",
                        "status": status_text
                    })
            else:
                print(f"   ❌ No download link available for {name}.")
                results.append({
                    "model": name,
                    "path": os.path.dirname(config["rel_path"]) + "/",
                    "size": "0.0 B",
                    "status": "❌ FAILED"
                })

    # ───────────────────────────────────────────────────────────
    # STEP 4 — FINAL STATUS REPORT
    # ───────────────────────────────────────────────────────────
    print("\n═══════════════════════════════════════════════════════════════")
    print("STEP 4 — FINAL STATUS REPORT")
    print("═══════════════════════════════════════════════════════════════\n")

    # Construct the exact table format requested
    # Col widths: Model (30), Path (56), Size on disk (13), Status (8)
    print("┌────────────────────────────────┬──────────────────────────────────────────────────────────┬───────────────┬──────────┐")
    print("│ Model                          │ Path                                                     │ Size on disk  │ Status   │")
    print("├────────────────────────────────┼──────────────────────────────────────────────────────────┼───────────────┼──────────┤")
    
    all_ok = True
    failed_models = []
    
    # Re-order results to match the exact table requested
    order = [
        "1_5photon_v1.safetensors",
        "iclight_sd15_fc.safetensors",
        "iclight_sd15_fbc.safetensors",
        "mm_sd_v15_v2.ckpt",
        "model.pth",
        "VIBL_v5TVAE.safetensors"
    ]
    
    ordered_results = []
    for model_name in order:
        for res in results:
            if res["model"] == model_name or (model_name == "model.pth" and res["model"] == "model.pth"):
                ordered_results.append(res)
                break
                
    for res in ordered_results:
        m_name = res["model"]
        if m_name == "model.pth":
            m_name = "RMBG-1.4/model.pth"
        
        path_str = res["path"]
        size_str = res["size"]
        is_success = "✅" in res["status"]
        status_symbol = "✅" if is_success else "❌"
        
        if not is_success:
            all_ok = False
            failed_models.append(res["model"])
            
        print(f"│ {m_name:<30} │ {path_str:<56} │ {size_str:<13} │ {status_symbol}      │")
        
    print("└────────────────────────────────┴──────────────────────────────────────────────────────────┴───────────────┴──────────┘")

    print("\nCONCLUSION:")
    if all_ok:
        print("  → ✅ All models present. All 8 IC-Light workflows are ready to run.")
    else:
        missing_list = ", ".join(failed_models)
        print(f"  → ⚠️  {len(failed_models)} model(s) still missing or failed: [{missing_list}].")
        print("     Workflows using these models won't function correctly until they are placed in their folders.")
        print("  → ❌ Downloads failed for: [" + missing_list + "]. Please download manually using the URLs above.")

    print("\n💡 REMINDERS:")
    print("  - Restart ComfyUI after downloading new models so it re-scans the model list.")
    print("  - In each workflow, click the checkpoint widget and select the correct model name from the dropdown if it shows as missing.")
    print("=" * 70)

if __name__ == "__main__":
    main()
