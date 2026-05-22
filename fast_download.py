import os
import sys
import time
import shutil
import urllib.request

# Enable high-speed transfer
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"

try:
    from huggingface_hub import hf_hub_download
except ImportError:
    print("❌ huggingface_hub not found in this python environment.")
    sys.exit(1)

COMFYUI_MODELS_DIR = "/home/nikhil/Documents/Remo2/ComfyUI/models"
INPAINT_DIR = os.path.join(COMFYUI_MODELS_DIR, "inpaint")
CHECKPOINTS_DIR = os.path.join(COMFYUI_MODELS_DIR, "checkpoints")

os.makedirs(INPAINT_DIR, exist_ok=True)
os.makedirs(CHECKPOINTS_DIR, exist_ok=True)

def download_with_progress(url, filepath, description):
    print(f"📥 Downloading {description} from {url}...")
    start_time = time.time()
    
    def progress_callback(blocks_transferred, block_size, total_size):
        amount_transferred = blocks_transferred * block_size
        percent = min(100, int(amount_transferred * 100 / total_size)) if total_size > 0 else 0
        elapsed = time.time() - start_time
        speed = amount_transferred / (elapsed if elapsed > 0 else 1) / 1024 # KB/s
        
        # Format sizes nicely
        transferred_mb = amount_transferred / (1024 * 1024)
        total_mb = total_size / (1024 * 1024) if total_size > 0 else 0
        
        sys.stdout.write(
            f"\r   Progress: {percent}% | {transferred_mb:.1f}/{total_mb:.1f} MB | Speed: {speed:.1f} KB/s"
        )
        sys.stdout.flush()

    try:
        urllib.request.urlretrieve(url, filepath, reporthook=progress_callback)
        print(f"\n✨ Successfully downloaded {description} to {filepath}\n")
    except Exception as e:
        print(f"\n❌ Error downloading {description}: {e}\n")
        raise e

# --- 1. Download Fooocus Inpaint Head (52 KB) ---
print("--- 1/4: Fooocus Inpaint Head ---")
try:
    downloaded_path = hf_hub_download(
        repo_id="lllyasviel/fooocus_inpaint",
        filename="fooocus_inpaint_head.pth",
        local_dir=INPAINT_DIR
    )
    print(f"✅ Fooocus Inpaint Head is ready: {downloaded_path}\n")
except Exception as e:
    print(f"⚠️ Hugging Face Hub download failed, falling back to direct URL...")
    download_with_progress(
        "https://huggingface.co/lllyasviel/fooocus_inpaint/resolve/main/fooocus_inpaint_head.pth",
        os.path.join(INPAINT_DIR, "fooocus_inpaint_head.pth"),
        "fooocus_inpaint_head.pth"
    )

# --- 2. Download Fooocus Inpaint Patch (1.2 GB) ---
print("--- 2/4: Fooocus Inpaint Patch ---")
try:
    downloaded_path = hf_hub_download(
        repo_id="lllyasviel/fooocus_inpaint",
        filename="inpaint_v26.fooocus.patch",
        local_dir=INPAINT_DIR
    )
    print(f"✅ Fooocus Inpaint Patch is ready: {downloaded_path}\n")
except Exception as e:
    print(f"⚠️ Hugging Face Hub download failed, falling back to direct URL...")
    download_with_progress(
        "https://huggingface.co/lllyasviel/fooocus_inpaint/resolve/main/inpaint_v26.fooocus.patch",
        os.path.join(INPAINT_DIR, "inpaint_v26.fooocus.patch"),
        "inpaint_v26.fooocus.patch"
    )

# --- 3. Download MAT Model (260 MB) ---
print("--- 3/4: MAT Model (Places_512_FullData_G.pth) ---")
mat_path = os.path.join(INPAINT_DIR, "Places_512_FullData_G.pth")
if os.path.exists(mat_path) and os.path.getsize(mat_path) > 200 * 1024 * 1024:
    print(f"✅ MAT model already exists: {mat_path}\n")
else:
    try:
        download_with_progress(
            "https://github.com/Sanster/models/releases/download/add_mat/Places_512_FullData_G.pth",
            mat_path,
            "Places_512_FullData_G.pth"
        )
    except Exception:
        print("⚠️ GitHub download failed. Trying fallback Hugging Face repo...")
        try:
            downloaded_path = hf_hub_download(
                repo_id="uwg/modelz_base",
                filename="Extras/inpaint/Places_512_FullData_G.pth",
                local_dir=INPAINT_DIR
            )
            # Move from subfolder if needed
            subfolder_path = os.path.join(INPAINT_DIR, "Extras/inpaint/Places_512_FullData_G.pth")
            if os.path.exists(subfolder_path):
                shutil.move(subfolder_path, mat_path)
                shutil.rmtree(os.path.join(INPAINT_DIR, "Extras"), ignore_errors=True)
            print(f"✅ MAT model downloaded via HF fallback: {mat_path}\n")
        except Exception as e:
            print(f"❌ Failed to download MAT model from all sources: {e}\n")

# --- 4. Download Juggernaut-XL-v6 (7.11 GB) ---
print("--- 4/4: Juggernaut-XL-v6 Checkpoint ---")
juggernaut_path = os.path.join(CHECKPOINTS_DIR, "juggernautXL_version6Rundiffusion.safetensors")

# If it exists (even as a symlink) and has correct size, we are good!
if os.path.exists(juggernaut_path) and os.path.getsize(juggernaut_path) > 6 * 1024 * 1024 * 1024:
    print(f"✅ Juggernaut-XL-v6 is already fully downloaded: {juggernaut_path}\n")
else:
    print("📥 Starting Juggernaut-XL-v6 download (7.11 GB)...")
    temp_dir = os.path.join(CHECKPOINTS_DIR, "temp_download")
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        # Download safely to temporary directory
        temp_download_path = hf_hub_download(
            repo_id="RunDiffusion/Juggernaut-XL-v6",
            filename="juggernautXL_version6Rundiffusion.safetensors",
            local_dir=temp_dir
        )
        
        # Swapping symlink with actual file safely
        print("🔄 Swapping out instant symlink for high-quality Juggernaut model...")
        if os.path.islink(juggernaut_path) or os.path.exists(juggernaut_path):
            os.remove(juggernaut_path)
            
        shutil.move(temp_download_path, juggernaut_path)
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"✨ Juggernaut-XL-v6 is now fully installed and active at: {juggernaut_path}\n")
    except Exception as e:
        print(f"❌ Error downloading Juggernaut-XL-v6: {e}")
        print("ℹ️ Instant play symlink is still active. You can run workflows immediately using the base SDXL model.")

print("🎉 Process Complete!")
