import os
import json

SOURCE_DIR = "/home/nikhil/Documents/Remo2/Removation_3/src/workflows/ic_light/"
DEST_DIR = "/home/nikhil/Documents/Remo2/Removation_3/src/workflows/lighting/"

os.makedirs(DEST_DIR, exist_ok=True)

def apply_final_corrections(data, filename):
    nodes = data.get("nodes", [])
    links = data.get("links", [])
    
    # 1. Identify if FC workflow
    fc_files = [
        "01_ic_light_static_circle.json",
        "02_ic_light_static_gradient.json",
        "03_ic_light_animated_circle.json",
        "04_ic_light_animated_gradient.json",
        "05_ic_light_animated_multilight.json",
        "08_ic_light_simple_4dir.json"
    ]
    
    is_fc = filename in fc_files
    
    for node in nodes:
        if node["type"] == "ICLightConditioning":
            inputs = node.get("inputs", [])
            if len(inputs) > 4 and inputs[4]["name"] == "opt_background":
                inputs[4]["type"] = "LATENT"
                if is_fc:
                    link_to_remove = inputs[4].get("link")
                    inputs[4]["link"] = None
                    if link_to_remove is not None:
                        # Remove link from links array
                        data["links"] = [link for link in data["links"] if link[0] != link_to_remove]
                        # Remove link from any output node links list
                        for n in nodes:
                            for out in n.get("outputs", []):
                                out_links = out.get("links")
                                if out_links and link_to_remove in out_links:
                                    out["links"] = [l for l in out_links if l != link_to_remove]

    # 2. File 08 corrections (ImageBatchMulti count):
    if filename == "08_ic_light_simple_4dir.json":
        for node in nodes:
            if node["type"] == "ImageBatchMulti":
                node["widgets_values"] = [4]
                
    # 3. File 06, 07 corrections (replace deprecated resize nodes):
    if filename in ["06_ic_light_fbc_background.json", "07_ic_light_normals_4dir.json"]:
        for node in nodes:
            if node["type"] in ["[DEPR] KJNodes*", "ResizeImage (Deprecated)", "ResizeImage(Deprecated)"]:
                node["type"] = "ImageResizeKJ"

    # 4. SplineEditor corrections (coordinates widget at position 1):
    for node in nodes:
        if node["type"] == "SplineEditor":
            widgets = node.get("widgets_values", [])
            if len(widgets) > 1 and widgets[1] == "":
                widgets[1] = "[]"

def validate_workflow(data, filename):
    apply_final_corrections(data, filename)
    print(f"Validating {filename}...")
    nodes = data.get("nodes", [])
    links = data.get("links", [])
    
    # 1. No duplicate node IDs
    node_ids = [n["id"] for n in nodes]
    if len(node_ids) != len(set(node_ids)):
        raise ValueError(f"Duplicate node IDs in {filename}")
        
    # 2. No duplicate link IDs
    link_ids = [l[0] for l in links]
    if len(link_ids) != len(set(link_ids)):
        raise ValueError(f"Duplicate link IDs in {filename}")
        
    link_map = {l[0]: l for l in links}
    node_map = {n["id"]: n for n in nodes}
    
    # 3. Every link in the links array has valid from_node and to_node IDs
    for link in links:
        link_id, from_node, from_slot, to_node, to_slot, link_type = link
        if from_node not in node_map:
            raise ValueError(f"Link {link_id} references missing from_node {from_node} in {filename}")
        if to_node not in node_map:
            raise ValueError(f"Link {link_id} references missing to_node {to_node} in {filename}")
            
    # 4. Every input.link value has a matching entry in the links array
    for node in nodes:
        for inp in node.get("inputs", []):
            link_id = inp.get("link")
            if link_id is not None and link_id not in link_map:
                raise ValueError(f"Node {node['id']} ({node['type']}) input '{inp['name']}' has missing link {link_id} in {filename}")
                
    # 5. Every output.links[] value has a matching entry in the links array
    for node in nodes:
        for out in node.get("outputs", []):
            out_links = out.get("links")
            if out_links:
                for link_id in out_links:
                    if link_id not in link_map:
                        raise ValueError(f"Node {node['id']} ({node['type']}) output '{out['name']}' has missing link {link_id} in {filename}")
                        
    # 6. No node of type LoadAndApplyICLightUnet (must be LoadAndApplyICLight)
    for node in nodes:
        if node["type"] == "LoadAndApplyICLightUnet":
            raise ValueError(f"Node {node['id']} has type LoadAndApplyICLightUnet in {filename}")
            
    # 7. No ICLightConditioning opt_background input with type IMAGE (must be LATENT)
    for node in nodes:
        if node["type"] == "ICLightConditioning":
            for inp in node.get("inputs", []):
                if inp["name"] == "opt_background" and inp["type"] == "IMAGE":
                    raise ValueError(f"Node {node['id']} ICLightConditioning has opt_background with type IMAGE in {filename}")
                    
    # 8. No SplineEditor with fewer than 12 widgets_values entries
    for node in nodes:
        if node["type"] == "SplineEditor":
            widgets = node.get("widgets_values", [])
            if len(widgets) < 12:
                raise ValueError(f"SplineEditor node {node['id']} has only {len(widgets)} widgets (expected >= 12) in {filename}")
                
    # 9. No ImageResize+ with False as method widget value
    for node in nodes:
        if node["type"] == "ImageResize+":
            widgets = node.get("widgets_values", [])
            if len(widgets) > 3 and widgets[3] is False:
                raise ValueError(f"ImageResize+ node {node['id']} has method=False in {filename}")
                
    # 10. last_node_id = max node id in nodes array
    max_node_id = max(node_ids) if node_ids else 0
    if data.get("last_node_id", 0) != max_node_id:
        print(f"  Fixing last_node_id to {max_node_id}")
        data["last_node_id"] = max_node_id
        
    # 11. last_link_id = max link id in links array
    max_link_id = max(link_ids) if link_ids else 0
    if data.get("last_link_id", 0) != max_link_id:
        print(f"  Fixing last_link_id to {max_link_id}")
        data["last_link_id"] = max_link_id
        
    print(f"  {filename} passed all validations!")

def cleanup_node_types_and_paths(data):
    nodes = data.get("nodes", [])
    for node in nodes:
        # Standardize AnimateDiff nodes
        if node["type"] == "ADE_UseEvolvedSampling":
            node["type"] = "AnimateDiffUniformContextOptions"
        elif node["type"] in ["ADE_BatchedContextOptions", "ADE_AnimateDiffUniformContextOptions"]:
            node["type"] = "ContextOptions"
            
        # Standardize LoadAndApplyICLight
        if node["type"] == "LoadAndApplyICLightUnet":
            node["type"] = "LoadAndApplyICLight"
            
        # Fix LoadAndApplyICLight models
        if node["type"] == "LoadAndApplyICLight":
            model_path = node["widgets_values"][0]
            if model_path == "iclight_sd15_fc.safetensors":
                node["widgets_values"][0] = "IC-Light/iclight_sd15_fc.safetensors"
            elif model_path == "iclight_sd15_fbc.safetensors":
                node["widgets_values"][0] = "IC-Light/iclight_sd15_fbc.safetensors"

# --- WORKFLOW 01 ---
def build_wf_01():
    with open(os.path.join(SOURCE_DIR, "ic_light_single_circle.json"), "r") as f:
        data = json.load(f)
    cleanup_node_types_and_paths(data)
    
    # Checkopt_background for Workflow 01 is allowed to remain as is or let's make sure it satisfies Rule 1.
    # Wait, Rule 1 says: "NEVER wire an IMAGE directly into opt_background. Always VAE-encode the light image first."
    # Wait, ic_light_single_circle.json already has VAEEncode (node 20) feeding opt_background?
    # Let's check: in ic_light_single_circle.json, node 35 (MaskToImage) output 0 (IMAGE) connects to node 44 (ICLightConditioning) input 4 (opt_background, IMAGE) via link 16.
    # But wait, node 20 (VAEEncode) encodes node 35 (MaskToImage) output 0 to LATENT, which feeds KSampler latent_image via link 18.
    # To obey Rule 1 completely, let's fix Workflow 01 too!
    # "Specifically: find the VAEEncode node that encodes the light image. Make that VAEEncode output ALSO connect to ICLightConditioning opt_background."
    # Let's do that for Workflow 01 as well to be fully robust and clean!
    # In Workflow 01:
    # Node 20 is VAEEncode (pixels input link 15 from MaskToImage node 35 output 0).
    # Its output is LATENT (link 18 to KSampler node 19 input 3).
    # ICLightConditioning is node 44. Input 4 is opt_background (currently type IMAGE, link 16 from node 35).
    # Let's change link 16 to go from node 20 output 0 instead of node 35!
    # Link 16 becomes: [16, 20, 0, 44, 4, "LATENT"]
    # Update node 35 outputs[0].links: remove 16 (so it becomes [14, 15])
    # Update node 20 outputs[0].links: add 16 (so it becomes [18, 16])
    # Update node 44 inputs[4]: change type to "LATENT".
    for node in data["nodes"]:
        if node["id"] == 44:
            for inp in node["inputs"]:
                if inp["name"] == "opt_background":
                    inp["type"] = "LATENT"
        if node["id"] == 35:
            node["outputs"][0]["links"] = [14, 15]
        if node["id"] == 20:
            node["outputs"][0]["links"] = [18, 16]
            
    for i, link in enumerate(data["links"]):
        if link[0] == 16:
            data["links"][i] = [16, 20, 0, 44, 4, "LATENT"]
            
    validate_workflow(data, "01_ic_light_static_circle.json")
    with open(os.path.join(DEST_DIR, "01_ic_light_static_circle.json"), "w") as f:
        json.dump(data, f, indent=2)

# --- WORKFLOW 02 ---
def build_wf_02():
    with open(os.path.join(SOURCE_DIR, "ic_light_single_gradient.json"), "r") as f:
        data = json.load(f)
    cleanup_node_types_and_paths(data)
    
    # FIX A: SplineEditor node (83) widgets_values
    for node in data["nodes"]:
        if node["id"] == 83:
            node["widgets_values"] = [
                '[{"points":[{"x":0,"y":0},{"x":512,"y":512}],"color":"#ff7b4b","name":"Spline 1"}]',
                '[{"x":0,"y":0},{"x":512,"y":512}]', 512, 512, 32, "path", "cardinal", 0.5, 1, "list", 0.0, 1.0
            ]
            # FIX B: outputs reference
            node["outputs"][0]["links"] = []
            node["outputs"][1]["links"] = [15]
            
        if node["id"] == 38: # ImageResize+
            node["widgets_values"][3] = "keep proportion"
            
        if node["id"] == 44: # ICLightConditioning
            for inp in node["inputs"]:
                if inp["name"] == "opt_background":
                    inp["type"] = "LATENT"
                    
        if node["id"] == 47: # CreateGradientFromCoords
            node["outputs"][0]["links"] = [16, 17] # remove 18
            
        if node["id"] == 20: # VAEEncode
            node["outputs"][0]["links"] = [24, 18] # add 18
            
    for i, link in enumerate(data["links"]):
        if link[0] == 18:
            data["links"][i] = [18, 20, 0, 44, 4, "LATENT"]
        elif link[0] == 15:
            data["links"][i] = [15, 83, 1, 47, 0, "STRING"]
            
    validate_workflow(data, "02_ic_light_static_gradient.json")
    with open(os.path.join(DEST_DIR, "02_ic_light_static_gradient.json"), "w") as f:
        json.dump(data, f, indent=2)

# --- WORKFLOW 03 ---
def build_wf_03():
    with open(os.path.join(SOURCE_DIR, "ic_light_animated_circle.json"), "r") as f:
        data = json.load(f)
    cleanup_node_types_and_paths(data)
    
    # FIX A: SplineEditor (83)
    for node in data["nodes"]:
        if node["id"] == 83:
            node["widgets_values"] = [
                '[{"points":[{"x":170,"y":119},{"x":512,"y":119},{"x":512,"y":393},{"x":170,"y":393}],"color":"#ff7b4b","name":"Spline 1"}]',
                "[]", 512, 512, 32, "path", "cardinal", 0.5, 1, "list", 0.0, 1.0
            ]
            node["outputs"][0]["links"] = []
            node["outputs"][1]["links"] = [15]
            
        if node["id"] == 38: # ImageResize+
            node["widgets_values"][3] = "keep proportion"
            
        if node["id"] == 44: # ICLightConditioning
            for inp in node["inputs"]:
                if inp["name"] == "opt_background":
                    inp["type"] = "LATENT"
                    
        if node["id"] == 86: # MaskToImage
            node["outputs"][0]["links"] = [19, 21] # remove 20
            
        if node["id"] == 53: # VHS_VAEEncodeBatched
            node["outputs"][0]["links"] = [24, 20] # add 20
            
    for i, link in enumerate(data["links"]):
        if link[0] == 20:
            data["links"][i] = [20, 53, 0, 44, 4, "LATENT"]
        elif link[0] == 15:
            data["links"][i] = [15, 83, 1, 85, 0, "STRING"]
            
    validate_workflow(data, "03_ic_light_animated_circle.json")
    with open(os.path.join(DEST_DIR, "03_ic_light_animated_circle.json"), "w") as f:
        json.dump(data, f, indent=2)

# --- WORKFLOW 04 ---
def build_wf_04():
    with open(os.path.join(SOURCE_DIR, "ic_light_animated_gradient.json"), "r") as f:
        data = json.load(f)
    cleanup_node_types_and_paths(data)
    
    # FIX A: SplineEditors (83 and 94)
    for node in data["nodes"]:
        if node["id"] == 83:
            node["widgets_values"] = [
                '[{"points":[{"x":170,"y":119},{"x":512,"y":119},{"x":512,"y":393},{"x":170,"y":393}],"color":"#ff7b4b","name":"Spline 1"}]',
                "[]", 512, 512, 32, "path", "cardinal", 0.5, 1, "list", 0.0, 1.0
            ]
            node["outputs"][0]["links"] = []
            node["outputs"][1]["links"] = [15, 16]
            
        if node["id"] == 94:
            node["widgets_values"] = [
                '[{"points":[{"x":0,"y":0.5},{"x":512,"y":1.0}],"color":"#74b9ff","name":"Spline 2"}]',
                "[]", 512, 512, 32, "path", "cardinal", 0.5, 1, "list", 0.0, 1.0
            ]
            node["outputs"][0]["links"] = []
            node["outputs"][2]["links"] = [17, 18]
            
        if node["id"] == 38: # ImageResize+
            node["widgets_values"][3] = "keep proportion"
            
        if node["id"] == 44: # ICLightConditioning
            for inp in node["inputs"]:
                if inp["name"] == "opt_background":
                    inp["type"] = "LATENT"
                    
        if node["id"] == 90: # ImageAddMask
            node["outputs"][0]["links"] = [25, 29] # remove 26
            
        if node["id"] == 53: # VHS_VAEEncodeBatched
            node["outputs"][0]["links"] = [37, 26] # replace 29 with 37, add 26
            
        if node["id"] == 58: # LatentBatchSeedBehavior
            node["inputs"][0]["link"] = 37
            
    # Re-wire links array
    for i, link in enumerate(data["links"]):
        if link[0] == 15:
            data["links"][i] = [15, 83, 1, 85, 0, "STRING"]
        elif link[0] == 16:
            data["links"][i] = [16, 83, 1, 89, 0, "STRING"]
        elif link[0] == 17:
            data["links"][i] = [17, 94, 2, 85, 1, "FLOAT"]
        elif link[0] == 18:
            data["links"][i] = [18, 94, 2, 89, 1, "FLOAT"]
        elif link[0] == 26:
            data["links"][i] = [26, 53, 0, 44, 4, "LATENT"]
            
    # Add link 37
    data["links"].append([37, 53, 0, 58, 0, "LATENT"])
    data["last_link_id"] = 37
    
    validate_workflow(data, "04_ic_light_animated_gradient.json")
    with open(os.path.join(DEST_DIR, "04_ic_light_animated_gradient.json"), "w") as f:
        json.dump(data, f, indent=2)

# --- WORKFLOW 05 ---
def build_wf_05():
    # Build 05 from corrected 04_ic_light_animated_gradient
    with open(os.path.join(DEST_DIR, "04_ic_light_animated_gradient.json"), "r") as f:
        data = json.load(f)
        
    # We want to remove node 89 (CreateShapeImageOnPath) and node 90 (ImageAddMask)
    nodes_to_keep = []
    for node in data["nodes"]:
        if node["id"] not in [89, 90]:
            nodes_to_keep.append(node)
    data["nodes"] = nodes_to_keep
    
    # We rewire MaskToImage (node 86) output 0 to:
    # - VHS_VAEEncodeBatched (node 53) pixels input (link 29)
    # - PreviewAnimation (node 87) images input (link 25)
    # So:
    # Link 29 goes from 86 to 53: [29, 86, 0, 53, 0, "IMAGE"]
    # Link 25 goes from 86 to 87: [25, 86, 0, 87, 0, "IMAGE"]
    # Wait, link 23 in original went from 86 to 90. Let's delete link 23, 20, 16, 18 completely from the links array.
    links_to_keep = []
    for link in data["links"]:
        link_id = link[0]
        if link_id not in [16, 18, 20, 23]:
            links_to_keep.append(link)
    data["links"] = links_to_keep
    
    # Update link 25 and 29 in the links array
    for i, link in enumerate(data["links"]):
        if link[0] == 25:
            data["links"][i] = [25, 86, 0, 87, 0, "IMAGE"]
        elif link[0] == 29:
            data["links"][i] = [29, 86, 0, 53, 0, "IMAGE"]
            
    # Update node outputs/inputs references:
    for node in data["nodes"]:
        if node["id"] == 86: # MaskToImage
            node["outputs"][0]["links"] = [25, 29]
        elif node["id"] == 53: # VHS_VAEEncodeBatched
            node["inputs"][0]["link"] = 29
            node["outputs"][0]["links"] = [37]
        elif node["id"] == 87: # PreviewAnimation
            node["inputs"][0]["link"] = 25
        elif node["id"] == 83: # SplineEditor A
            node["outputs"][0]["links"] = []
            node["outputs"][1]["links"] = [15]
        elif node["id"] == 94: # SplineEditor B
            node["outputs"][0]["links"] = []
            node["outputs"][2]["links"] = [17]
            
    validate_workflow(data, "05_ic_light_animated_multilight.json")
    with open(os.path.join(DEST_DIR, "05_ic_light_animated_multilight.json"), "w") as f:
        json.dump(data, f, indent=2)

# --- WORKFLOW 06 ---
def build_wf_06():
    # Build 06 from scratch!
    data = {
        "last_node_id": 22,
        "last_link_id": 26,
        "nodes": [
            {
                "id": 1,
                "type": "CheckpointLoaderSimple",
                "pos": [40, 100],
                "size": [280, 130],
                "flags": {},
                "order": 0,
                "mode": 0,
                "inputs": [],
                "outputs": [
                    {"name": "MODEL", "type": "MODEL", "links": [1]},
                    {"name": "CLIP", "type": "CLIP", "links": [2, 3]},
                    {"name": "VAE", "type": "VAE", "links": [4, 5, 6, 7]}
                ],
                "widgets_values": ["1_5photon_v1.safetensors"]
            },
            {
                "id": 2,
                "type": "LoadAndApplyICLight",
                "pos": [350, 100],
                "size": [280, 100],
                "flags": {},
                "order": 1,
                "mode": 0,
                "inputs": [{"name": "model", "type": "MODEL", "link": 1}],
                "outputs": [{"name": "MODEL", "type": "MODEL", "links": [8]}],
                "widgets_values": ["IC-Light/iclight_sd15_fbc.safetensors"]
            },
            {
                "id": 3,
                "type": "LoadImage",
                "pos": [40, 300],
                "size": [280, 314],
                "flags": {},
                "order": 2,
                "mode": 0,
                "inputs": [],
                "outputs": [
                    {"name": "IMAGE", "type": "IMAGE", "links": [9]},
                    {"name": "MASK", "type": "MASK", "links": None}
                ],
                "widgets_values": ["subject.jpg", "image"]
            },
            {
                "id": 4,
                "type": "ImageResizeKJ",
                "pos": [40, 680],
                "size": [280, 300],
                "flags": {},
                "order": 3,
                "mode": 0,
                "inputs": [{"name": "image", "type": "IMAGE", "link": 9}],
                "outputs": [
                    {"name": "IMAGE", "type": "IMAGE", "links": [10]},
                    {"name": "width", "type": "INT", "links": []},
                    {"name": "height", "type": "INT", "links": []}
                ],
                "widgets_values": [1024, 1024, "lanczos", True, 8, "disabled"]
            },
            {
                "id": 5,
                "type": "BRIAAI_Matting",
                "pos": [350, 680],
                "size": [280, 150],
                "flags": {},
                "order": 4,
                "mode": 0,
                "inputs": [{"name": "image", "type": "IMAGE", "link": 10}],
                "outputs": [
                    {"name": "image", "type": "IMAGE", "links": [11, 26]},
                    {"name": "mask", "type": "MASK", "links": []}
                ],
                "widgets_values": ["v1.4", "#7F7F7F"]
            },
            {
                "id": 6,
                "type": "ImageResizeKJ",
                "pos": [660, 680],
                "size": [280, 300],
                "flags": {},
                "order": 5,
                "mode": 0,
                "inputs": [{"name": "image", "type": "IMAGE", "link": 11}],
                "outputs": [
                    {"name": "IMAGE", "type": "IMAGE", "links": [12]},
                    {"name": "width", "type": "INT", "links": []},
                    {"name": "height", "type": "INT", "links": []}
                ],
                "widgets_values": [512, 768, "lanczos", True, 8, "disabled"]
            },
            {
                "id": 7,
                "type": "VAEEncode",
                "pos": [970, 680],
                "size": [210, 100],
                "flags": {},
                "order": 6,
                "mode": 0,
                "inputs": [
                    {"name": "pixels", "type": "IMAGE", "link": 12},
                    {"name": "vae", "type": "VAE", "link": 4}
                ],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [13]}],
                "widgets_values": []
            },
            {
                "id": 8,
                "type": "LoadImage",
                "pos": [40, 1020],
                "size": [280, 314],
                "flags": {},
                "order": 7,
                "mode": 0,
                "inputs": [],
                "outputs": [
                    {"name": "IMAGE", "type": "IMAGE", "links": [14]},
                    {"name": "MASK", "type": "MASK", "links": None}
                ],
                "widgets_values": ["cityscape.jpg", "image"]
            },
            {
                "id": 9,
                "type": "ImageResizeKJ",
                "pos": [350, 1020],
                "size": [280, 300],
                "flags": {},
                "order": 8,
                "mode": 0,
                "inputs": [{"name": "image", "type": "IMAGE", "link": 14}],
                "outputs": [
                    {"name": "IMAGE", "type": "IMAGE", "links": [15]},
                    {"name": "width", "type": "INT", "links": []},
                    {"name": "height", "type": "INT", "links": []}
                ],
                "widgets_values": [512, 768, "lanczos", True, 8, "disabled"]
            },
            {
                "id": 10,
                "type": "VAEEncode",
                "pos": [660, 1020],
                "size": [210, 100],
                "flags": {},
                "order": 9,
                "mode": 0,
                "inputs": [
                    {"name": "pixels", "type": "IMAGE", "link": 15},
                    {"name": "vae", "type": "VAE", "link": 5}
                ],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [16, 17]}],
                "widgets_values": []
            },
            {
                "id": 11,
                "type": "ICLightConditioning",
                "pos": [1210, 230],
                "size": [300, 220],
                "flags": {},
                "order": 10,
                "mode": 0,
                "inputs": [
                    {"name": "positive", "type": "CONDITIONING", "link": 18},
                    {"name": "negative", "type": "CONDITIONING", "link": 19},
                    {"name": "vae", "type": "VAE", "link": 6},
                    {"name": "foreground", "type": "LATENT", "link": 13},
                    {"name": "opt_background", "type": "LATENT", "link": 16}
                ],
                "outputs": [
                    {"name": "positive", "type": "CONDITIONING", "links": [20]},
                    {"name": "negative", "type": "CONDITIONING", "links": [21]},
                    {"name": "empty_latent", "type": "LATENT", "links": []}
                ],
                "widgets_values": [0.182]
            },
            {
                "id": 12,
                "type": "CLIPTextEncode",
                "pos": [660, 230],
                "size": [250, 150],
                "flags": {},
                "order": 11,
                "mode": 0,
                "inputs": [{"name": "clip", "type": "CLIP", "link": 2}],
                "outputs": [{"name": "CONDITIONING", "type": "CONDITIONING", "links": [18]}],
                "widgets_values": ["subtle statue, warm, masterpiece, best quality"]
            },
            {
                "id": 13,
                "type": "CLIPTextEncode",
                "pos": [940, 230],
                "size": [250, 150],
                "flags": {},
                "order": 12,
                "mode": 0,
                "inputs": [{"name": "clip", "type": "CLIP", "link": 3}],
                "outputs": [{"name": "CONDITIONING", "type": "CONDITIONING", "links": [19]}],
                "widgets_values": ["embedding/nembedding/stream, blurry"]
            },
            {
                "id": 14,
                "type": "KSampler",
                "pos": [1540, 100],
                "size": [300, 450],
                "flags": {},
                "order": 13,
                "mode": 0,
                "inputs": [
                    {"name": "model", "type": "MODEL", "link": 8},
                    {"name": "positive", "type": "CONDITIONING", "link": 20},
                    {"name": "negative", "type": "CONDITIONING", "link": 21},
                    {"name": "latent_image", "type": "LATENT", "link": 17}
                ],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [22]}],
                "widgets_values": [100361857014343, "fixed", 25, 3.6, "dpmpp_2m", "karras", 1.0]
            },
            {
                "id": 15,
                "type": "VAEDecode",
                "pos": [1870, 100],
                "size": [210, 100],
                "flags": {},
                "order": 14,
                "mode": 0,
                "inputs": [
                    {"name": "samples", "type": "LATENT", "link": 22},
                    {"name": "vae", "type": "VAE", "link": 7}
                ],
                "outputs": [{"name": "IMAGE", "type": "IMAGE", "links": [23]}],
                "widgets_values": []
            },
            {
                "id": 16,
                "type": "PreviewImage",
                "pos": [1870, 230],
                "size": [300, 300],
                "flags": {},
                "order": 15,
                "mode": 0,
                "inputs": [{"name": "images", "type": "IMAGE", "link": 23}],
                "outputs": [],
                "widgets_values": []
            },
            {
                "id": 17,
                "type": "DetailTransfer",
                "pos": [1870, 560],
                "size": [280, 120],
                "flags": {},
                "order": 16,
                "mode": 0,
                "inputs": [
                    {"name": "target", "type": "IMAGE", "link": 23},
                    {"name": "source", "type": "IMAGE", "link": 12}
                ],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [24]}],
                "widgets_values": ["add", 1.0, 0.8]
            },
            {
                "id": 18,
                "type": "SaveImage",
                "pos": [2180, 560],
                "size": [300, 300],
                "flags": {},
                "order": 17,
                "mode": 0,
                "inputs": [{"name": "images", "type": "IMAGE", "link": 24}],
                "outputs": [],
                "widgets_values": ["IC-Light"]
            },
            {
                "id": 19,
                "type": "CreateShapeMask",
                "pos": [970, 1020],
                "size": [280, 300],
                "flags": {},
                "order": 18,
                "mode": 0,
                "inputs": [],
                "outputs": [{"name": "mask", "type": "MASK", "links": [25]}],
                "widgets_values": ["circle", 1, 256, 256, 0, 512, 768]
            },
            {
                "id": 20,
                "type": "GrowMaskWithBlur",
                "pos": [1280, 1020],
                "size": [260, 260],
                "flags": {},
                "order": 19,
                "mode": 0,
                "inputs": [{"name": "mask", "type": "MASK", "link": 25}],
                "outputs": [{"name": "mask", "type": "MASK", "links": [111]}],
                "widgets_values": [0, 8.0, True, False, 28.1, 1.0, 1.0, False]
            },
            {
                "id": 21,
                "type": "MaskToImage",
                "pos": [1570, 1020],
                "size": [200, 80],
                "flags": {},
                "order": 20,
                "mode": 0,
                "inputs": [{"name": "mask", "type": "MASK", "link": 111}],
                "outputs": [{"name": "IMAGE", "type": "IMAGE", "links": [112]}],
                "widgets_values": []
            },
            {
                "id": 22,
                "type": "PreviewImage",
                "pos": [1800, 1020],
                "size": [300, 300],
                "flags": {},
                "order": 21,
                "mode": 0,
                "inputs": [{"name": "images", "type": "IMAGE", "link": 112}],
                "outputs": [],
                "widgets_values": []
            }
        ],
        "links": [
            [1, 1, 0, 2, 0, "MODEL"],
            [2, 1, 1, 12, 0, "CLIP"],
            [3, 1, 1, 13, 0, "CLIP"],
            [4, 1, 2, 7, 1, "VAE"],
            [5, 1, 2, 10, 1, "VAE"],
            [6, 1, 2, 11, 2, "VAE"],
            [7, 1, 2, 15, 1, "VAE"],
            [8, 2, 0, 14, 0, "MODEL"],
            [9, 3, 0, 4, 0, "IMAGE"],
            [10, 4, 0, 5, 0, "IMAGE"],
            [11, 5, 0, 6, 0, "IMAGE"],
            [12, 6, 0, 7, 0, "IMAGE"],
            [13, 7, 0, 11, 3, "LATENT"],
            [14, 8, 0, 9, 0, "IMAGE"],
            [15, 9, 0, 10, 0, "IMAGE"],
            [16, 10, 0, 11, 4, "LATENT"],
            [17, 10, 0, 14, 3, "LATENT"],
            [18, 12, 0, 11, 0, "CONDITIONING"],
            [19, 13, 0, 11, 1, "CONDITIONING"],
            [20, 11, 0, 14, 1, "CONDITIONING"],
            [21, 11, 1, 14, 2, "CONDITIONING"],
            [22, 14, 0, 15, 0, "LATENT"],
            [23, 15, 0, 16, 0, "IMAGE"],
            [24, 17, 0, 18, 0, "IMAGE"],
            [25, 19, 0, 20, 0, "MASK"],
            [26, 5, 0, 17, 1, "IMAGE"], # DetailTransfer source input from original foreground
            [111, 20, 0, 21, 0, "MASK"],
            [112, 21, 0, 22, 0, "IMAGE"]
        ],
        "groups": [],
        "config": {},
        "extra": {},
        "version": 0.4
    }
    validate_workflow(data, "06_ic_light_fbc_background.json")
    with open(os.path.join(DEST_DIR, "06_ic_light_fbc_background.json"), "w") as f:
        json.dump(data, f, indent=2)

# --- WORKFLOW 07 ---
def build_wf_07():
    # Build 07 from scratch!
    data = {
        "last_node_id": 26,
        "last_link_id": 35,
        "nodes": [
            {
                "id": 1,
                "type": "CheckpointLoaderSimple",
                "pos": [40, 100],
                "size": [280, 130],
                "flags": {},
                "order": 0,
                "mode": 0,
                "inputs": [],
                "outputs": [
                    {"name": "MODEL", "type": "MODEL", "links": [1]},
                    {"name": "CLIP", "type": "CLIP", "links": [2, 3]},
                    {"name": "VAE", "type": "VAE", "links": [4, 5, 6]}
                ],
                "widgets_values": ["1_5photon_v1.safetensors"]
            },
            {
                "id": 2,
                "type": "LoadAndApplyICLight",
                "pos": [350, 100],
                "size": [280, 100],
                "flags": {},
                "order": 1,
                "mode": 0,
                "inputs": [{"name": "model", "type": "MODEL", "link": 1}],
                "outputs": [{"name": "MODEL", "type": "MODEL", "links": [7]}],
                "widgets_values": ["IC-Light/iclight_sd15_fbc.safetensors"]
            },
            {
                "id": 3,
                "type": "LoadImage",
                "pos": [40, 300],
                "size": [280, 314],
                "flags": {},
                "order": 2,
                "mode": 0,
                "inputs": [],
                "outputs": [
                    {"name": "IMAGE", "type": "IMAGE", "links": [8]},
                    {"name": "MASK", "type": "MASK", "links": None}
                ],
                "widgets_values": ["subject.jpg", "image"]
            },
            {
                "id": 4,
                "type": "ImageResizeKJ",
                "pos": [40, 680],
                "size": [280, 300],
                "flags": {},
                "order": 3,
                "mode": 0,
                "inputs": [{"name": "image", "type": "IMAGE", "link": 8}],
                "outputs": [
                    {"name": "IMAGE", "type": "IMAGE", "links": [9]},
                    {"name": "width", "type": "INT", "links": []},
                    {"name": "height", "type": "INT", "links": []}
                ],
                "widgets_values": [780, 1024, "lanczos", True, 8, "disabled"]
            },
            {
                "id": 5,
                "type": "BRIAAI_Matting",
                "pos": [350, 680],
                "size": [280, 150],
                "flags": {},
                "order": 4,
                "mode": 0,
                "inputs": [{"name": "image", "type": "IMAGE", "link": 9}],
                "outputs": [
                    {"name": "image", "type": "IMAGE", "links": [10]},
                    {"name": "mask", "type": "MASK", "links": [31]} # connect to CalculateNormalsFromImages mask
                ],
                "widgets_values": ["v1.4", "#7F7F7F"]
            },
            {
                "id": 6,
                "type": "VHS_VAEEncodeBatched",
                "pos": [660, 680],
                "size": [240, 100],
                "flags": {},
                "order": 5,
                "mode": 0,
                "inputs": [
                    {"name": "pixels", "type": "IMAGE", "link": 10},
                    {"name": "vae", "type": "VAE", "link": 4}
                ],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [11]}],
                "widgets_values": [4]
            },
            {
                "id": 7,
                "type": "ICLightConditioning",
                "pos": [1210, 230],
                "size": [300, 220],
                "flags": {},
                "order": 6,
                "mode": 0,
                "inputs": [
                    {"name": "positive", "type": "CONDITIONING", "link": 12},
                    {"name": "negative", "type": "CONDITIONING", "link": 13},
                    {"name": "vae", "type": "VAE", "link": 5},
                    {"name": "foreground", "type": "LATENT", "link": 11},
                    {"name": "opt_background", "type": "LATENT", "link": 14}
                ],
                "outputs": [
                    {"name": "positive", "type": "CONDITIONING", "links": [15]},
                    {"name": "negative", "type": "CONDITIONING", "links": [16]},
                    {"name": "empty_latent", "type": "LATENT", "links": []}
                ],
                "widgets_values": [0.182]
            },
            {
                "id": 8,
                "type": "CLIPTextEncode",
                "pos": [660, 230],
                "size": [250, 150],
                "flags": {},
                "order": 7,
                "mode": 0,
                "inputs": [{"name": "clip", "type": "CLIP", "link": 2}],
                "outputs": [{"name": "CONDITIONING", "type": "CONDITIONING", "links": [12]}],
                "widgets_values": ["hard light, photograph of a woman, cinematic, high contrast"]
            },
            {
                "id": 9,
                "type": "CLIPTextEncode",
                "pos": [940, 230],
                "size": [250, 150],
                "flags": {},
                "order": 8,
                "mode": 0,
                "inputs": [{"name": "clip", "type": "CLIP", "link": 3}],
                "outputs": [{"name": "CONDITIONING", "type": "CONDITIONING", "links": [13]}],
                "widgets_values": ["bad quality, bad picture"]
            },
            {
                "id": 10,
                "type": "FloatConstant",
                "pos": [40, 1020],
                "size": [220, 100],
                "flags": {},
                "order": 9,
                "mode": 0,
                "inputs": [],
                "outputs": [{"name": "value", "type": "FLOAT", "links": [17, 18, 19, 20]}],
                "widgets_values": [1.0]
            },
            {
                "id": 11,
                "type": "LightSource",
                "pos": [350, 1020],
                "size": [280, 150],
                "flags": {},
                "order": 10,
                "mode": 0,
                "inputs": [{"name": "multiplier", "type": "FLOAT", "link": 17}],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [21]}],
                "widgets_values": ["Left Light", "#FFFFFF", "#000000", 512, 1024]
            },
            {
                "id": 12,
                "type": "LightSource",
                "pos": [660, 1020],
                "size": [280, 150],
                "flags": {},
                "order": 11,
                "mode": 0,
                "inputs": [{"name": "multiplier", "type": "FLOAT", "link": 18}],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [22]}],
                "widgets_values": ["Right Light", "#FFFFFF", "#000000", 512, 1024]
            },
            {
                "id": 13,
                "type": "LightSource",
                "pos": [970, 1020],
                "size": [280, 150],
                "flags": {},
                "order": 12,
                "mode": 0,
                "inputs": [{"name": "multiplier", "type": "FLOAT", "link": 19}],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [23]}],
                "widgets_values": ["Bottom Light", "#FFFFFF", "#000000", 512, 1024]
            },
            {
                "id": 14,
                "type": "LightSource",
                "pos": [1280, 1020],
                "size": [280, 150],
                "flags": {},
                "order": 13,
                "mode": 0,
                "inputs": [{"name": "multiplier", "type": "FLOAT", "link": 20}],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [24]}],
                "widgets_values": ["Top Light", "#FFFFFF", "#000000", 512, 1024]
            },
            {
                "id": 15,
                "type": "ImageBatchMulti",
                "pos": [1590, 1020],
                "size": [220, 150],
                "flags": {},
                "order": 14,
                "mode": 0,
                "inputs": [
                    {"name": "image1", "type": "IMAGE", "link": 21},
                    {"name": "image2", "type": "IMAGE", "link": 22},
                    {"name": "image3", "type": "IMAGE", "link": 23},
                    {"name": "image4", "type": "IMAGE", "link": 24}
                ],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [25, 26, 27]}],
                "widgets_values": []
            },
            {
                "id": 16,
                "type": "PreviewImage",
                "pos": [1870, 1020],
                "size": [300, 300],
                "flags": {},
                "order": 15,
                "mode": 0,
                "inputs": [{"name": "images", "type": "IMAGE", "link": 25}],
                "outputs": [],
                "widgets_values": []
            },
            {
                "id": 17,
                "type": "VHS_VAEEncodeBatched",
                "pos": [1870, 840],
                "size": [240, 100],
                "flags": {},
                "order": 16,
                "mode": 0,
                "inputs": [
                    {"name": "pixels", "type": "IMAGE", "link": 26},
                    {"name": "vae", "type": "VAE", "link": 6}
                ],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [14, 28]}],
                "widgets_values": [4]
            },
            {
                "id": 18,
                "type": "LatentBatchSeedBehavior",
                "pos": [2150, 840],
                "size": [220, 100],
                "flags": {},
                "order": 17,
                "mode": 0,
                "inputs": [{"name": "samples", "type": "LATENT", "link": 28}],
                "outputs": [{"name": "samples", "type": "LATENT", "links": [29]}],
                "widgets_values": ["fixed"]
            },
            {
                "id": 19,
                "type": "SamplerCustom",
                "pos": [1540, 480],
                "size": [300, 220],
                "flags": {},
                "order": 18,
                "mode": 0,
                "inputs": [
                    {"name": "model", "type": "MODEL", "link": 7},
                    {"name": "positive", "type": "CONDITIONING", "link": 15},
                    {"name": "negative", "type": "CONDITIONING", "link": 16},
                    {"name": "sampler", "type": "SAMPLER", "link": 32},
                    {"name": "sigmas", "type": "SIGMAS", "link": 33},
                    {"name": "latent_image", "type": "LATENT", "link": 29}
                ],
                "outputs": [{"name": "output", "type": "LATENT", "links": [30]}],
                "widgets_values": [True, 123, "fixed", 7.0]
            },
            {
                "id": 20,
                "type": "KSamplerSelect",
                "pos": [1210, 480],
                "size": [220, 80],
                "flags": {},
                "order": 19,
                "mode": 0,
                "inputs": [],
                "outputs": [{"name": "SAMPLER", "type": "SAMPLER", "links": [32]}],
                "widgets_values": ["dpmpp_2m_sde"]
            },
            {
                "id": 21,
                "type": "AlignYourStepsScheduler",
                "pos": [1210, 580],
                "size": [220, 100],
                "flags": {},
                "order": 20,
                "mode": 0,
                "inputs": [],
                "outputs": [{"name": "SIGMAS", "type": "SIGMAS", "links": [33]}],
                "widgets_values": ["SD1.5", 16, 1.0]
            },
            {
                "id": 22,
                "type": "VHS_VAEDecodeBatched",
                "pos": [1870, 480],
                "size": [240, 100],
                "flags": {},
                "order": 21,
                "mode": 0,
                "inputs": [
                    {"name": "samples", "type": "LATENT", "link": 30},
                    {"name": "vae", "type": "VAE", "link": 6}
                ],
                "outputs": [{"name": "images", "type": "IMAGE", "links": [34]}],
                "widgets_values": [4]
            },
            {
                "id": 23,
                "type": "PreviewImage",
                "pos": [2150, 480],
                "size": [300, 300],
                "flags": {},
                "order": 22,
                "mode": 0,
                "inputs": [{"name": "images", "type": "IMAGE", "link": 34}],
                "outputs": [],
                "widgets_values": []
            },
            {
                "id": 24,
                "type": "ImageNormalize_Neg1_To_1",
                "pos": [1870, 1360],
                "size": [220, 100],
                "flags": {},
                "order": 23,
                "mode": 0,
                "inputs": [{"name": "image", "type": "IMAGE", "link": 27}],
                "outputs": [{"name": "IMAGE", "type": "IMAGE", "links": [35]}],
                "widgets_values": []
            },
            {
                "id": 25,
                "type": "CalculateNormalsFromImages",
                "pos": [2150, 1360],
                "size": [240, 120],
                "flags": {},
                "order": 24,
                "mode": 0,
                "inputs": [
                    {"name": "images", "type": "IMAGE", "link": 35},
                    {"name": "mask", "type": "MASK", "link": 31}
                ],
                "outputs": [{"name": "normals", "type": "IMAGE", "links": [121]}],
                "widgets_values": [2.0]
            },
            {
                "id": 26,
                "type": "PreviewImage",
                "pos": [2420, 1360],
                "size": [300, 300],
                "flags": {},
                "order": 25,
                "mode": 0,
                "inputs": [{"name": "images", "type": "IMAGE", "link": 121}],
                "outputs": [],
                "widgets_values": []
            }
        ],
        "links": [
            [1, 1, 0, 2, 0, "MODEL"],
            [2, 1, 1, 8, 0, "CLIP"],
            [3, 1, 1, 9, 0, "CLIP"],
            [4, 1, 2, 6, 1, "VAE"],
            [5, 1, 2, 7, 2, "VAE"],
            [6, 1, 2, 22, 1, "VAE"],
            [7, 2, 0, 19, 0, "MODEL"],
            [8, 3, 0, 4, 0, "IMAGE"],
            [9, 4, 0, 5, 0, "IMAGE"],
            [10, 5, 0, 6, 0, "IMAGE"],
            [11, 6, 0, 7, 3, "LATENT"],
            [12, 8, 0, 7, 0, "CONDITIONING"],
            [13, 9, 0, 7, 1, "CONDITIONING"],
            [14, 17, 0, 7, 4, "LATENT"],
            [15, 7, 0, 19, 1, "CONDITIONING"],
            [16, 7, 1, 19, 2, "CONDITIONING"],
            [17, 10, 0, 11, 0, "FLOAT"],
            [18, 10, 0, 12, 0, "FLOAT"],
            [19, 10, 0, 13, 0, "FLOAT"],
            [20, 10, 0, 14, 0, "FLOAT"],
            [21, 11, 0, 15, 0, "IMAGE"],
            [22, 12, 0, 15, 1, "IMAGE"],
            [23, 13, 0, 15, 2, "IMAGE"],
            [24, 14, 0, 15, 3, "IMAGE"],
            [25, 15, 0, 16, 0, "IMAGE"],
            [26, 15, 0, 17, 0, "IMAGE"],
            [27, 15, 0, 24, 0, "IMAGE"],
            [28, 17, 0, 18, 0, "LATENT"],
            [29, 18, 0, 19, 5, "LATENT"],
            [30, 19, 0, 22, 0, "LATENT"],
            [31, 5, 1, 25, 1, "MASK"],
            [32, 20, 0, 19, 3, "SAMPLER"],
            [33, 21, 0, 19, 4, "SIGMAS"],
            [34, 22, 0, 23, 0, "IMAGE"],
            [35, 24, 0, 25, 0, "IMAGE"],
            [121, 25, 0, 26, 0, "IMAGE"]
        ],
        "groups": [],
        "config": {},
        "extra": {},
        "version": 0.4
    }
    validate_workflow(data, "07_ic_light_normals_4dir.json")
    with open(os.path.join(DEST_DIR, "07_ic_light_normals_4dir.json"), "w") as f:
        json.dump(data, f, indent=2)

# --- WORKFLOW 08 ---
def build_wf_08():
    # Build 08 from scratch!
    data = {
        "last_node_id": 19,
        "last_link_id": 26,
        "nodes": [
            {
                "id": 1,
                "type": "CheckpointLoaderSimple",
                "pos": [40, 100],
                "size": [280, 130],
                "flags": {},
                "order": 0,
                "mode": 0,
                "inputs": [],
                "outputs": [
                    {"name": "MODEL", "type": "MODEL", "links": [1]},
                    {"name": "CLIP", "type": "CLIP", "links": [2, 3]},
                    {"name": "VAE", "type": "VAE", "links": [4, 5, 6]}
                ],
                "widgets_values": ["1_5photon_v1.safetensors"]
            },
            {
                "id": 2,
                "type": "LoadAndApplyICLight",
                "pos": [350, 100],
                "size": [280, 100],
                "flags": {},
                "order": 1,
                "mode": 0,
                "inputs": [{"name": "model", "type": "MODEL", "link": 1}],
                "outputs": [{"name": "MODEL", "type": "MODEL", "links": [7]}],
                "widgets_values": ["IC-Light/iclight_sd15_fc.safetensors"]
            },
            {
                "id": 3,
                "type": "LoadImage",
                "pos": [40, 300],
                "size": [280, 314],
                "flags": {},
                "order": 2,
                "mode": 0,
                "inputs": [],
                "outputs": [
                    {"name": "IMAGE", "type": "IMAGE", "links": [8]},
                    {"name": "MASK", "type": "MASK", "links": None}
                ],
                "widgets_values": ["oldman.jpg", "image"]
            },
            {
                "id": 4,
                "type": "ImageResizeKJ",
                "pos": [40, 680],
                "size": [280, 300],
                "flags": {},
                "order": 3,
                "mode": 0,
                "inputs": [{"name": "image", "type": "IMAGE", "link": 8}],
                "outputs": [
                    {"name": "IMAGE", "type": "IMAGE", "links": [9]},
                    {"name": "width", "type": "INT", "links": []},
                    {"name": "height", "type": "INT", "links": []}
                ],
                "widgets_values": [512, 512, "lanczos", True, 8, "disabled"]
            },
            {
                "id": 5,
                "type": "VHS_VAEEncodeBatched",
                "pos": [350, 680],
                "size": [240, 100],
                "flags": {},
                "order": 4,
                "mode": 0,
                "inputs": [
                    {"name": "pixels", "type": "IMAGE", "link": 9},
                    {"name": "vae", "type": "VAE", "link": 4}
                ],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [10]}],
                "widgets_values": [4]
            },
            {
                "id": 6,
                "type": "ICLightConditioning",
                "pos": [1210, 230],
                "size": [300, 220],
                "flags": {},
                "order": 5,
                "mode": 0,
                "inputs": [
                    {"name": "positive", "type": "CONDITIONING", "link": 11},
                    {"name": "negative", "type": "CONDITIONING", "link": 12},
                    {"name": "vae", "type": "VAE", "link": 5},
                    {"name": "foreground", "type": "LATENT", "link": 10},
                    {"name": "opt_background", "type": "LATENT", "link": 13}
                ],
                "outputs": [
                    {"name": "positive", "type": "CONDITIONING", "links": [14]},
                    {"name": "negative", "type": "CONDITIONING", "links": [15]},
                    {"name": "empty_latent", "type": "LATENT", "links": []}
                ],
                "widgets_values": [0.182]
            },
            {
                "id": 7,
                "type": "CLIPTextEncode",
                "pos": [660, 230],
                "size": [250, 150],
                "flags": {},
                "order": 6,
                "mode": 0,
                "inputs": [{"name": "clip", "type": "CLIP", "link": 2}],
                "outputs": [{"name": "CONDITIONING", "type": "CONDITIONING", "links": [11]}],
                "widgets_values": ["hazy light, old man, cinematic"]
            },
            {
                "id": 8,
                "type": "CLIPTextEncode",
                "pos": [940, 230],
                "size": [250, 150],
                "flags": {},
                "order": 7,
                "mode": 0,
                "inputs": [{"name": "clip", "type": "CLIP", "link": 3}],
                "outputs": [{"name": "CONDITIONING", "type": "CONDITIONING", "links": [12]}],
                "widgets_values": ["bad quality"]
            },
            {
                "id": 9,
                "type": "FloatConstant",
                "pos": [40, 1020],
                "size": [220, 100],
                "flags": {},
                "order": 8,
                "mode": 0,
                "inputs": [],
                "outputs": [{"name": "value", "type": "FLOAT", "links": [16, 17, 18, 19]}],
                "widgets_values": [0.6]
            },
            {
                "id": 10,
                "type": "LightSource",
                "pos": [350, 1020],
                "size": [280, 150],
                "flags": {},
                "order": 9,
                "mode": 0,
                "inputs": [{"name": "multiplier", "type": "FLOAT", "link": 16}],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [20]}],
                "widgets_values": ["Left Light", "#FFFFFF", "#000000", 512, 512]
            },
            {
                "id": 11,
                "type": "LightSource",
                "pos": [660, 1020],
                "size": [280, 150],
                "flags": {},
                "order": 10,
                "mode": 0,
                "inputs": [{"name": "multiplier", "type": "FLOAT", "link": 17}],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [21]}],
                "widgets_values": ["Right Light", "#FFFFFF", "#000000", 512, 512]
            },
            {
                "id": 12,
                "type": "LightSource",
                "pos": [970, 1020],
                "size": [280, 150],
                "flags": {},
                "order": 11,
                "mode": 0,
                "inputs": [{"name": "multiplier", "type": "FLOAT", "link": 18}],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [22]}],
                "widgets_values": ["Bottom Light", "#FFFFFF", "#000000", 512, 512]
            },
            {
                "id": 13,
                "type": "LightSource",
                "pos": [1280, 1020],
                "size": [280, 150],
                "flags": {},
                "order": 12,
                "mode": 0,
                "inputs": [{"name": "multiplier", "type": "FLOAT", "link": 19}],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [23]}],
                "widgets_values": ["Top Light", "#FFFFFF", "#000000", 512, 512]
            },
            {
                "id": 14,
                "type": "ImageBatchMulti",
                "pos": [1590, 1020],
                "size": [220, 150],
                "flags": {},
                "order": 13,
                "mode": 0,
                "inputs": [
                    {"name": "image1", "type": "IMAGE", "link": 20},
                    {"name": "image2", "type": "IMAGE", "link": 21},
                    {"name": "image3", "type": "IMAGE", "link": 22},
                    {"name": "image4", "type": "IMAGE", "link": 23}
                ],
                "outputs": [{"name": "image", "type": "IMAGE", "links": [24, 25]}],
                "widgets_values": []
            },
            {
                "id": 15,
                "type": "PreviewImage",
                "pos": [1870, 1020],
                "size": [300, 300],
                "flags": {},
                "order": 14,
                "mode": 0,
                "inputs": [{"name": "images", "type": "IMAGE", "link": 24}],
                "outputs": [],
                "widgets_values": []
            },
            {
                "id": 16,
                "type": "VHS_VAEEncodeBatched",
                "pos": [1870, 840],
                "size": [240, 100],
                "flags": {},
                "order": 15,
                "mode": 0,
                "inputs": [
                    {"name": "pixels", "type": "IMAGE", "link": 25},
                    {"name": "vae", "type": "VAE", "link": 6}
                ],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [13, 26]}],
                "widgets_values": [4]
            },
            {
                "id": 17,
                "type": "KSampler",
                "pos": [1540, 100],
                "size": [300, 450],
                "flags": {},
                "order": 16,
                "mode": 0,
                "inputs": [
                    {"name": "model", "type": "MODEL", "link": 7},
                    {"name": "positive", "type": "CONDITIONING", "link": 14},
                    {"name": "negative", "type": "CONDITIONING", "link": 15},
                    {"name": "latent_image", "type": "LATENT", "link": 26}
                ],
                "outputs": [{"name": "LATENT", "type": "LATENT", "links": [122]}],
                "widgets_values": [100361857014341, "fixed", 20, 2.0, "dpmpp_2m", "ddim_uniform", 0.9]
            },
            {
                "id": 18,
                "type": "VAEDecode",
                "pos": [1870, 100],
                "size": [210, 100],
                "flags": {},
                "order": 17,
                "mode": 0,
                "inputs": [
                    {"name": "samples", "type": "LATENT", "link": 122},
                    {"name": "vae", "type": "VAE", "link": 6}
                ],
                "outputs": [{"name": "IMAGE", "type": "IMAGE", "links": [123]}],
                "widgets_values": []
            },
            {
                "id": 19,
                "type": "PreviewImage",
                "pos": [1870, 230],
                "size": [300, 300],
                "flags": {},
                "order": 18,
                "mode": 0,
                "inputs": [{"name": "images", "type": "IMAGE", "link": 123}],
                "outputs": [],
                "widgets_values": []
            }
        ],
        "links": [
            [1, 1, 0, 2, 0, "MODEL"],
            [2, 1, 1, 7, 0, "CLIP"],
            [3, 1, 1, 8, 0, "CLIP"],
            [4, 1, 2, 5, 1, "VAE"],
            [5, 1, 2, 6, 2, "VAE"],
            [6, 1, 2, 16, 1, "VAE"],
            [7, 2, 0, 17, 0, "MODEL"],
            [8, 3, 0, 4, 0, "IMAGE"],
            [9, 4, 0, 5, 0, "IMAGE"],
            [10, 5, 0, 6, 3, "LATENT"],
            [11, 7, 0, 6, 0, "CONDITIONING"],
            [12, 8, 0, 6, 1, "CONDITIONING"],
            [13, 16, 0, 6, 4, "LATENT"],
            [14, 6, 0, 17, 1, "CONDITIONING"],
            [15, 6, 1, 17, 2, "CONDITIONING"],
            [16, 9, 0, 10, 0, "FLOAT"],
            [17, 9, 0, 11, 0, "FLOAT"],
            [18, 9, 0, 12, 0, "FLOAT"],
            [19, 9, 0, 13, 0, "FLOAT"],
            [20, 10, 0, 14, 0, "IMAGE"],
            [21, 11, 0, 14, 1, "IMAGE"],
            [22, 12, 0, 14, 2, "IMAGE"],
            [23, 13, 0, 14, 3, "IMAGE"],
            [24, 14, 0, 15, 0, "IMAGE"],
            [25, 14, 0, 16, 0, "IMAGE"],
            [26, 16, 0, 17, 3, "LATENT"],
            [122, 17, 0, 18, 0, "LATENT"],
            [123, 18, 0, 19, 0, "IMAGE"]
        ],
        "groups": [],
        "config": {},
        "extra": {},
        "version": 0.4
    }
    validate_workflow(data, "08_ic_light_simple_4dir.json")
    with open(os.path.join(DEST_DIR, "08_ic_light_simple_4dir.json"), "w") as f:
        json.dump(data, f, indent=2)

def main():
    print("Building and validating all 8 workflows...")
    build_wf_01()
    build_wf_02()
    build_wf_03()
    build_wf_04()
    build_wf_05()
    build_wf_06()
    build_wf_07()
    build_wf_08()
    print("All 8 workflows built and validated successfully!")
    
    # Delete old files if they exist
    print("Deleting old/broken workflow versions...")
    files_to_delete = [
        "ic_light_single_circle.json",
        "ic_light_single_gradient.json",
        "ic_light_animated_circle.json",
        "ic_light_animated_gradient.json",
        "workflow_simple.json",
        "workflow_rembg.json",
        "ic_light_master_workflow.json",
        "ic_light_single_gradient_fixed.json",
        "ic_light_animated_gradient_fixed.json"
    ]
    
    deleted_files = []
    
    # Also delete pattern based files
    # ic_light_animated_c*.json
    # ic_light_single_g*.json
    for filename in os.listdir(DEST_DIR):
        # check if it is in files_to_delete
        should_delete = False
        if filename in files_to_delete:
            should_delete = True
        elif filename.startswith("ic_light_animated_c") and filename.endswith(".json"):
            should_delete = True
        elif filename.startswith("ic_light_single_g") and filename.endswith(".json"):
            should_delete = True
        elif not filename.startswith(("01_", "02_", "03_", "04_", "05_", "06_", "07_", "08_")) and filename.endswith(".json"):
            # wait, the instruction says: "(any file not starting with 01_ through 08_)"
            # wait! But the folder contains other workflows like:
            # "MiniMax Image Object Remover.json"
            # "Stage1_SceneUnderstanding_SDXL_8GB.json"
            # etc. Should we delete them?
            # Wait, the instruction says: "After writing all 8, delete these old files if they exist:"
            # and lists them, ending with: "(any file not starting with 01_ through 08_)"
            # Wait, let's be careful! We should only delete files that are related to ic_light or specifically in the list.
            # Let's check the exact list:
            # - ic_light_single_circle.json
            # - ic_light_single_gradient.json
            # - ic_light_animated_circle.json
            # - ic_light_animated_gradient.json
            # - ic_light_animated_c*.json
            # - ic_light_single_g*.json
            # - workflow_simple.json
            # - workflow_rembg.json
            # - ic_light_master_workflow.json
            # - ic_light_single_gradient_fixed.json
            # - ic_light_animated_gradient_fixed.json
            # So let's delete exactly those files if they exist!
            # Let's print the ones deleted.
            pass
            
        if should_delete:
            file_path = os.path.join(DEST_DIR, filename)
            try:
                os.remove(file_path)
                deleted_files.append(filename)
                print(f"  Deleted: {filename}")
            except Exception as e:
                print(f"  Error deleting {filename}: {e}")
                
    # Also look at SOURCE_DIR and delete old files there just in case, but let's stick to DEST_DIR as requested.
    print(f"Cleanup finished. Deleted files: {deleted_files}")
    
    # Copy files to ComfyUI user workflows new lighting/ folder
    import shutil
    DEST_DIR_COMFY = "/home/nikhil/Documents/Remo2/ComfyUI/user/default/workflows/new lighting/"
    print(f"Copying workflows to ComfyUI directory: {DEST_DIR_COMFY}...")
    os.makedirs(DEST_DIR_COMFY, exist_ok=True)
    for filename in os.listdir(DEST_DIR):
        if filename.startswith(("01_", "02_", "03_", "04_", "05_", "06_", "07_", "08_")) and filename.endswith(".json"):
            shutil.copy(os.path.join(DEST_DIR, filename), os.path.join(DEST_DIR_COMFY, filename))
            print(f"  Copied to ComfyUI: {filename}")

if __name__ == "__main__":
    main()
