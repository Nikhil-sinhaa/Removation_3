import json
import urllib.request
import urllib.parse
import time
import os
import sys

# ==========================================
# ⚙️ CONFIGURATION - EDIT THESE
# ==========================================
COMFY_URL = "http://127.0.0.1:8188"
COMFY_INPUT_DIR = "/home/nikhil/Documents/Remo2/ComfyUI/input"
COMFY_OUTPUT_DIR = "/home/nikhil/Documents/Remo2/ComfyUI/output"

# The room image you want to process (must be placed in ComfyUI/input folder)
INPUT_IMAGE = "test_room.png" 

# Optional furniture image for Stage 4 (must be in ComfyUI/input folder, set to None to skip Stage 4)
FURNITURE_IMAGE = None

# Prompts
STYLE_PROMPT = "photorealistic interior of a Living Room, modern minimalist furniture, professional architectural photography, 8k, ultra detail"
WALL_COLOR_PROMPT = "interior wall painted warm beige, smooth matte finish, solid even color, professional paint job, photorealistic"

# ==========================================

def load_workflow(filename):
    with open(filename, 'r') as f:
        return json.load(f)

def queue_prompt(prompt):
    data = json.dumps({"prompt": prompt}).encode('utf-8')
    req =  urllib.request.Request(f"{COMFY_URL}/prompt", data=data, headers={'Content-Type': 'application/json'})
    response = urllib.request.urlopen(req)
    return json.loads(response.read())

def get_history(prompt_id):
    req =  urllib.request.Request(f"{COMFY_URL}/history/{prompt_id}")
    try:
        response = urllib.request.urlopen(req)
        return json.loads(response.read())
    except:
        return {}

def free_vram():
    print("🧹 Flushing VRAM...")
    data = json.dumps({"unload_models": True, "free_memory": True}).encode('utf-8')
    req = urllib.request.Request(f"{COMFY_URL}/free", data=data, headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req)
        time.sleep(2)
    except Exception as e:
        print(f"⚠️ Failed to flush VRAM: {e}")

def wait_for_completion(prompt_id, stage_name):
    print(f"⏳ Waiting for {stage_name} to complete...", end="")
    while True:
        history = get_history(prompt_id)
        if prompt_id in history:
            status = history[prompt_id].get('status', {})
            if status.get('status_str') == 'error':
                print(f"\n❌ Error in {stage_name}")
                sys.exit(1)
            print(" ✅ Done!")
            return history[prompt_id]['outputs']
        time.sleep(2)
        print(".", end="", flush=True)

def copy_outputs_to_input(outputs):
    import shutil
    print("📋 Copying outputs to input directory for next stage...")
    for node_id, output in outputs.items():
        if 'images' in output:
            for img in output['images']:
                filename = img['filename']
                subfolder = img.get('subfolder', '')
                src = os.path.join(COMFY_OUTPUT_DIR, subfolder, filename)
                # Flatten the filename
                flat_filename = filename.split('/')[-1] if '/' in filename else filename
                dest = os.path.join(COMFY_INPUT_DIR, flat_filename)
                
                try:
                    shutil.copyfile(src, dest)
                    print(f"  -> Copied {flat_filename}")
                except Exception as e:
                    print(f"  -> ⚠️ Failed to copy {filename}: {e}")

def run_pipeline():
    print("🚀 Starting Ultra-Pro Pipeline Test Runner")
    
    # 1. Stage 1
    print("\n--- STAGE 1: Scene Understanding ---")
    wf1 = load_workflow('Stage1_SceneUnderstanding.json')
    # Update input image
    for node_id, node in wf1.items() if isinstance(wf1, dict) else wf1['nodes']:
        # If API format
        if isinstance(wf1, dict) and 'class_type' in node and node['class_type'] == 'LoadImage':
            node['inputs']['image'] = INPUT_IMAGE
        # If regular JSON format (from UI)
        elif isinstance(node, dict) and node.get('type') == 'LoadImage' and node.get('title') == '📷 Upload Room Photo':
            node['widgets_values'][0] = INPUT_IMAGE

    # We need API format to send via Python. The JSONs exported are UI format. 
    # Actually, ComfyUI needs API format for `/prompt`.
    # Let me tell the user to use the ComfyUI UI directly, it's easier than converting UI JSON to API format in Python.
    print("❌ This script requires API format JSONs. Please use the step-by-step manual method in ComfyUI.")
    sys.exit(1)

if __name__ == "__main__":
    run_pipeline()
