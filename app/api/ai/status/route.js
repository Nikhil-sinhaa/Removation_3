/**
 * API Route for GPU Status
 * Handles GET /api/ai/status requests
 */

export async function GET(request) {
  try {
    // Fetch GPU stats from ComfyUI
    const response = await fetch('http://127.0.0.1:8188/system_stats', {
      timeout: 5000
    });
    
    if (!response.ok) {
      return Response.json({
        status: 'offline',
        error: 'GPU Offline',
        fix: 'Run: python3 main.py --listen'
      });
    }
    
    const data = await response.json();
    const device = data.devices?.[0];
    
    if (!device) {
      return Response.json({
        status: 'offline',
        error: 'No GPU devices found'
      });
    }
    
    // Check if GPU is busy by checking queue
    const queueResponse = await fetch('http://127.0.0.1:8188/queue');
    const queueData = await queueResponse.json();
    const queueLength = queueData.queue_pending?.length || 0;
    
    return Response.json({
      status: queueLength > 0 ? 'busy' : 'idle',
      gpuVram: {
        total: device.vram_total,
        free: device.vram_free,
        used: device.vram_total - device.vram_free
      },
      queueLength,
      device: device.name,
      system: {
        os: data.system.os,
        ramTotal: data.system.ram_total,
        ramFree: data.system.ram_free
      }
    });
    
  } catch (error) {
    return Response.json({
      status: 'offline',
      error: 'GPU Offline',
      fix: 'Run: python3 main.py --listen',
      details: error.message
    });
  }
}
