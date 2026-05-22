import os
import sys
import time
import requests

INPAINT_DIR = "/home/nikhil/Documents/Remo2/ComfyUI/models/inpaint"
os.makedirs(INPAINT_DIR, exist_ok=True)

def download(url, filepath, name):
    print(f"📥 Starting download of {name}...")
    start_time = time.time()
    last_print = 0
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    try:
        response = requests.get(url, headers=headers, stream=True, allow_redirects=True)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))
        
        downloaded = 0
        with open(filepath, 'wb') as out_file:
            for chunk in response.iter_content(chunk_size=1024 * 1024): # 1MB chunks
                if chunk:
                    out_file.write(chunk)
                    downloaded += len(chunk)
                    
                    now = time.time()
                    if now - last_print >= 1.0 or downloaded == total_size:
                        last_print = now
                        percent = (downloaded / total_size) * 100 if total_size > 0 else 0
                        speed = downloaded / (now - start_time) / (1024 * 1024) if now - start_time > 0 else 0
                        sys.stdout.write(f"\r   {percent:.1f}% | {downloaded/(1024*1024):.1f}/{total_size/(1024*1024):.1f} MB | {speed:.2f} MB/s")
                        sys.stdout.flush()
                        
        print(f"\n✅ {name} downloaded successfully to {filepath}\n")
    except Exception as e:
        print(f"\n❌ Error downloading {name}: {e}\n")

# 1. Patch file
patch_url = "https://hf-mirror.com/lllyasviel/fooocus_inpaint/resolve/main/inpaint_v26.fooocus.patch"
patch_path = os.path.join(INPAINT_DIR, "inpaint_v26.fooocus.patch")
if not os.path.exists(patch_path) or os.path.getsize(patch_path) < 100 * 1024 * 1024:
    download(patch_url, patch_path, "Fooocus Inpaint Patch")
else:
    print(f"✅ Fooocus Inpaint Patch already exists at {patch_path}")

# 2. MAT model
mat_url = "https://hf-mirror.com/uwg/modelz_base/resolve/main/Extras/inpaint/Places_512_FullData_G.pth"
mat_path = os.path.join(INPAINT_DIR, "Places_512_FullData_G.pth")
if not os.path.exists(mat_path) or os.path.getsize(mat_path) < 100 * 1024 * 1024:
    download(mat_url, mat_path, "MAT Model")
else:
    print(f"✅ MAT Model already exists at {mat_path}")
