# ComfyUI Integration for Removation.ai

This document explains how ComfyUI has been integrated into your Removation.ai website to replace paid AI APIs with your local RTX 4060 setup.

## Architecture Overview

### Zero-Cost AI Generation
- **Before**: Used Replicate API at $0.05-0.20 per image
- **After**: Uses your local RTX 4060 via ComfyUI at $0 per image
- **Savings**: 100% cost reduction on AI generation

### Key Components

1. **ComfyUI Client** (`lib/ai/comfyui.ts`)
   - Handles communication with local ComfyUI server
   - Manages image uploads and workflow execution
   - Provides health checking and error handling

2. **Workflow System** (`lib/ai/comfyui-workflows.ts`)
   - Defines interior design workflows with ControlNet support
   - Includes style LoRAs for different design aesthetics
   - Handles room-specific prompts and settings

3. **Updated API Routes** (`app/api/generate/route.ts`)
   - Replaced Replicate calls with ComfyUI integration
   - Maintains same API contract for frontend compatibility

## Features Enabled

### 1. Structural Integrity with ControlNet
- **Canny Edge Detection**: Preserves wall and furniture outlines
- **Depth Maps**: Maintains spatial relationships
- **Scribble Control**: For sketch-to-render functionality
- **Result**: Room layouts stay intact while style changes

### 2. Style Swapping with LoRAs
Available styles with dedicated LoRA models:
- **Modern**: Clean lines, minimalist furniture
- **Industrial**: Exposed brick, metal elements
- **Bohemian**: Eclectic decor, plants, textiles
- **Minimalist**: Simple, uncluttered, neutral colors
- **Scandinavian**: Light wood, cozy, functional
- **Luxury**: High-end materials, elegant
- **Indian**: Traditional elements, vibrant colors

### 3. Advanced Processing Modes
- **Redesign**: Complete room transformation
- **Beautify**: Enhanced aesthetics and furniture placement
- **Creative**: Unique, artistic approaches
- **Furnish**: Adds furniture to empty spaces
- **Enhance**: Image upscaling and quality improvement
- **Sketch**: Converts hand drawings to renders

## Setup Instructions

### 1. Start ComfyUI Server
```bash
cd /home/nikhil/Documents/Remo2/ComfyUI
source venv/bin/activate
python main.py
```

### 2. Configure Environment
Add to your `.env.local`:
```
COMFYUI_URL=http://127.0.0.1:8188
```

### 3. Install Required Models
Make sure these models are in your ComfyUI `models` directory:
- `sd_xl_base_1.0.safetensors` (base model)
- `control_canny-fp16.safetensors` (ControlNet)
- `control_depth-fp16.safetensors` (ControlNet)
- `control_scribble-fp16.safetensors` (ControlNet)
- Style LoRAs in `models/loras/` directory

## API Integration

### Request Flow
1. Frontend sends generation request to `/api/generate`
2. Server validates user credits and permissions
3. Image is uploaded to ComfyUI server
4. Workflow is created based on mode, style, and settings
5. ComfyUI processes using your RTX 4060
6. Result is returned and saved to database

### Example Request
```json
{
  "imageUrl": "https://example.com/room.jpg",
  "mode": "redesign",
  "style": "modern",
  "roomType": "living_room",
  "settings": {
    "creativity": 75,
    "preserveLayout": true,
    "enhanceQuality": true
  },
  "numberOfVariations": 1
}
```

## Performance Benefits

### Cost Comparison
- **Replicate**: $0.05-0.20 per image × 1000 users = $50-200
- **ComfyUI**: $0 (electricity only)
- **Savings**: $50-200 per 1000 generations

### Speed Benefits
- **Local Processing**: No network latency to external APIs
- **GPU Optimization**: Direct RTX 4060 utilization
- **Parallel Processing**: Multiple generations simultaneously

### Quality Improvements
- **Consistent Results**: Same model, consistent quality
- **Custom Training**: Can fine-tune models for your specific needs
- **No Rate Limits**: Generate as many images as needed

## Troubleshooting

### Common Issues

1. **ComfyUI Not Running**
   - Error: "ComfyUI server is not running"
   - Solution: Start ComfyUI server with the commands above

2. **Missing Models**
   - Error: Model not found during workflow execution
   - Solution: Download required models to ComfyUI models directory

3. **GPU Memory Issues**
   - Error: CUDA out of memory
   - Solution: Reduce batch size or image resolution

### Health Check
```bash
curl http://127.0.0.1:8188/system_stats
```

### Queue Status
```bash
curl http://127.0.0.1:8188/queue
```

## Future Enhancements

### Planned Features
1. **Model Training**: Custom models trained on your design data
2. **Real-time Preview**: Live preview during generation
3. **Batch Processing**: Queue multiple room designs
4. **Advanced ControlNet**: More precise control over outputs
5. **Custom LoRAs**: Train style-specific models for clients

### Scaling Options
- **Multi-GPU**: Add more GPUs for parallel processing
- **Distributed Setup**: Multiple ComfyUI instances
- **Cloud Fallback**: Hybrid cloud/local setup for redundancy

## Database Integration

The system maintains full compatibility with your existing MongoDB/Mongoose setup:
- User credits are still tracked
- Render history is preserved
- Project management remains unchanged
- All existing frontend features work seamlessly

This integration provides a seamless transition from paid APIs to zero-cost local processing while maintaining all existing functionality and improving quality control.
