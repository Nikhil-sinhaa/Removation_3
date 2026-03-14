// lib/ai/comfyui-test.ts
import { generateWithComfyUI } from './comfyui';

export async function testComfyUIIntegration() {
  console.log('🧪 Testing ComfyUI Integration...');
  
  try {
    // Test with a simple room design
    const result = await generateWithComfyUI({
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A', // Simple 1x1 black pixel
      prompt: 'modern living room with sofa and coffee table',
      negative_prompt: 'blurry, distorted, low quality',
      mode: 'redesign',
      style: 'modern',
      roomType: 'living_room',
      settings: {
        creativity: 50,
        preserveLayout: true,
        enhanceQuality: true,
        num_inference_steps: 20, // Reduced for testing
        guidance_scale: 7,
        strength: 0.6,
      },
      seed: 42,
    });

    console.log('✅ ComfyUI Test Success!');
    console.log('📸 Generated image:', result.output);
    console.log('⏱️ Processing time:', result.processingTime, 'ms');
    
    return true;
  } catch (error: any) {
    console.error('❌ ComfyUI Test Failed:', error.message);
    return false;
  }
}

export async function testComfyUIHealth() {
  console.log('🏥 Checking ComfyUI Health...');
  
  try {
    const response = await fetch('http://127.0.0.1:8188/system_stats');
    const stats = await response.json();
    
    console.log('✅ ComfyUI Server is running');
    console.log('🎯 GPU:', stats.devices?.[0]?.name || 'Not detected');
    console.log('💾 VRAM Available:', stats.devices?.[0]?.vram_free || 'Unknown');
    
    return true;
  } catch (error: any) {
    console.error('❌ ComfyUI Health Check Failed:', error.message);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    await testComfyUIHealth();
    await testComfyUIIntegration();
  })();
}
