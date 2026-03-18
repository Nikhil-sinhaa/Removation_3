# Removation.ai Implementation Plan

## Overview
Full end-to-end implementation of AI-powered interior design platform with ComfyUI backend.

## Features to Implement

### 1. ComfyUI Closed-Loop Bridge
- **File**: `src/services/comfyBridge.js`
- WebSocket connection to ComfyUI at `ws://127.0.0.1:8188/ws?clientId=removation_main`
- Event handling: progress, executing, executed, execution_error
- FIFO queue system for sequential job processing
- Error handling with 503 status when ComfyUI offline

### 2. Room Redesign (Structure-Preserving)
- **Files**: `src/workflows/redesign.json`, `src/controllers/redesign.js`
- Uses RealVisXL checkpoint with ControlNet Canny
- API endpoint: `POST /api/ai/redesign`
- Maintains room geometry while applying style changes

### 3. Object Removal
- **Files**: `src/workflows/object_removal.json`, `src/controllers/removal.js`
- GroundingDinoSAM2Segment for object detection
- MaskGrow + INPAINT for seamless removal
- API endpoint: `POST /api/ai/remove-object`

### 4. Color & Material Changer
- **File**: `src/controllers/colorChange.js`
- Targeted recoloring for walls, ceiling, floor, furniture
- SAM2 auto-masking + ControlNet Recolor
- API endpoint: `POST /api/ai/recolor`

### 5. Dashboard Sidebar (React)
- **File**: `src/client/components/AISidebar.jsx`
- Three tabs: Redesign, Remove Object, Recolor
- Real-time GPU status monitoring
- WebSocket-driven progress updates
- Before/After image slider

### 6. Mongoose Data Layer
- **File**: `src/models/Project.js`
- Project schema with status tracking
- AI configuration storage
- Image URL management

### 7. GPU Status Endpoint
- **Endpoint**: `GET /api/ai/status`
- ComfyUI system stats integration
- Queue length monitoring
- Offline detection

## Hardware Constraints
- GPU: NVIDIA RTX 4060 (8GB VRAM)
- VAE Decode (Tiled) for all workflows
- fp8_e4m3fn model loading
- Max image size: 1024x1024
- KSampler steps: 8 (Lightning)
- CFG Scale: 1.5-2.0

## Implementation Order
1. Setup dependencies and project structure
2. ComfyUI Bridge service
3. Mongoose models
4. AI workflows and controllers
5. GPU status endpoint
6. React sidebar component
7. Testing and validation

## Testing Strategy
- Unit tests for each feature
- Integration tests for WebSocket communication
- End-to-end workflow testing
- VRAM usage validation
