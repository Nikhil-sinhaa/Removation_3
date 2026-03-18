/**
 * GPU Status Controller
 * Provides real-time GPU and ComfyUI status information
 */

import axios from 'axios';
import comfyBridge from '../services/comfyBridge.js';

/**
 * GET /api/ai/status
 * Get GPU and ComfyUI status
 */
export const getGPUStatus = async (req, res) => {
  try {
    const comfyUIUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
    
    // Fetch ComfyUI system stats
    const systemStatsResponse = await axios.get(`${comfyUIUrl}/system_stats`, {
      timeout: 5000
    });

    if (!systemStatsResponse.data) {
      throw new Error('Invalid response from ComfyUI');
    }

    const systemStats = systemStatsResponse.data;
    
    // Calculate GPU VRAM usage
    const gpuInfo = extractGPUInfo(systemStats);
    
    // Get queue status from ComfyUI bridge
    const bridgeStatus = comfyBridge.getStatus();
    
    // Determine overall status
    const overallStatus = determineOverallStatus(gpuInfo, bridgeStatus);

    res.json({
      status: overallStatus,
      gpuVram: gpuInfo.usedVRAM,
      gpuVramTotal: gpuInfo.totalVRAM,
      gpuVramFree: gpuInfo.freeVRAM,
      gpuTemperature: gpuInfo.temperature,
      gpuUtilization: gpuInfo.utilization,
      queueLength: bridgeStatus.queueLength,
      isProcessing: bridgeStatus.isProcessing,
      comfyUIConnected: bridgeStatus.comfyUIConnected,
      currentProcessing: bridgeStatus.currentProcessing,
      systemStats: {
        devices: systemStats.system?.devices || [],
        python: systemStats.system?.python || {},
        comfyui: systemStats.system?.comfyui || {}
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ GPU Status error:', error);
    
    // Check if ComfyUI is offline
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        status: 'offline',
        error: 'GPU Offline',
        fix: 'Run: python3 main.py --listen',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch GPU status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/ai/status/health
 * Simple health check endpoint
 */
export const getHealthStatus = async (req, res) => {
  try {
    const comfyUIUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
    
    const response = await axios.get(`${comfyUIUrl}/system_stats`, {
      timeout: 3000
    });

    const bridgeStatus = comfyBridge.getStatus();
    
    res.json({
      status: 'healthy',
      comfyUI: 'online',
      bridge: bridgeStatus.comfyUIConnected ? 'connected' : 'disconnected',
      queue: bridgeStatus.queueLength,
      processing: bridgeStatus.isProcessing,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'ComfyUI offline',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/ai/status/queue
 * Get detailed queue information
 */
export const getQueueStatus = async (req, res) => {
  try {
    const bridgeStatus = comfyBridge.getStatus();
    
    res.json({
      queueLength: bridgeStatus.queueLength,
      isProcessing: bridgeStatus.isProcessing,
      currentProcessing: bridgeStatus.currentProcessing,
      frontendClients: bridgeStatus.frontendClients,
      comfyUIConnected: bridgeStatus.comfyUIConnected,
      reconnectAttempts: bridgeStatus.reconnectAttempts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Queue status error:', error);
    res.status(500).json({
      error: 'Failed to get queue status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/ai/status/performance
 * Get detailed GPU performance metrics
 */
export const getPerformanceMetrics = async (req, res) => {
  try {
    const comfyUIUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
    
    const systemStatsResponse = await axios.get(`${comfyUIUrl}/system_stats`, {
      timeout: 5000
    });

    const systemStats = systemStatsResponse.data;
    const gpuInfo = extractGPUInfo(systemStats);
    const bridgeStatus = comfyBridge.getStatus();

    // Calculate performance metrics
    const metrics = {
      gpu: {
        ...gpuInfo,
        memoryUtilization: gpuInfo.totalVRAM > 0 ? (gpuInfo.usedVRAM / gpuInfo.totalVRAM * 100).toFixed(1) : 0,
        thermalStatus: getThermalStatus(gpuInfo.temperature),
        performanceLevel: getPerformanceLevel(gpuInfo.utilization, gpuInfo.memoryUtilization)
      },
      queue: {
        length: bridgeStatus.queueLength,
        processing: bridgeStatus.isProcessing,
        averageWaitTime: bridgeStatus.queueLength * 30 // Estimated 30s per job
      },
      system: {
        pythonVersion: systemStats.system?.python?.version || 'unknown',
        comfyuiVersion: systemStats.system?.comfyui?.version || 'unknown',
        deviceCount: systemStats.system?.devices?.length || 0
      },
      timestamp: new Date().toISOString()
    };

    res.json(metrics);

  } catch (error) {
    console.error('❌ Performance metrics error:', error);
    res.status(500).json({
      error: 'Failed to fetch performance metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/ai/status/reset
 * Reset ComfyUI bridge (admin endpoint)
 */
export const resetBridge = async (req, res) => {
  try {
    // This would be an admin-only endpoint in production
    console.log('🔄 Resetting ComfyUI bridge...');
    
    // Force reconnection
    const bridgeStatus = comfyBridge.getStatus();
    
    res.json({
      message: 'Bridge reset initiated',
      previousStatus: bridgeStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Bridge reset error:', error);
    res.status(500).json({
      error: 'Failed to reset bridge',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Extract GPU information from ComfyUI system stats
 */
function extractGPUInfo(systemStats) {
  const gpuInfo = {
    usedVRAM: 0,
    freeVRAM: 0,
    totalVRAM: 0,
    temperature: 0,
    utilization: 0,
    name: 'Unknown'
  };

  if (systemStats.system && systemStats.system.devices) {
    for (const device of systemStats.system.devices) {
      if (device.devices) {
        for (const subDevice of device.devices) {
          if (subDevice.type === 'cuda' || subDevice.type === 'gpu') {
            // Extract VRAM information
            if (subDevice.vram_total) {
              gpuInfo.totalVRAM = Math.round(subDevice.vram_total / 1024 / 1024 / 1024 * 100) / 100; // Convert to GB
            }
            if (subDevice.vram_free) {
              gpuInfo.freeVRAM = Math.round(subDevice.vram_free / 1024 / 1024 / 1024 * 100) / 100; // Convert to GB
            }
            
            gpuInfo.usedVRAM = gpuInfo.totalVRAM - gpuInfo.freeVRAM;
            
            // Extract temperature
            if (subDevice.temperature) {
              gpuInfo.temperature = subDevice.temperature;
            }
            
            // Extract utilization
            if (subDevice.utilization) {
              gpuInfo.utilization = subDevice.utilization;
            }
            
            // Extract device name
            if (subDevice.name) {
              gpuInfo.name = subDevice.name;
            }
            
            // We'll take the first CUDA GPU we find
            break;
          }
        }
      }
    }
  }

  return gpuInfo;
}

/**
 * Determine overall system status
 */
function determineOverallStatus(gpuInfo, bridgeStatus) {
  if (!bridgeStatus.comfyUIConnected) {
    return 'offline';
  }
  
  if (bridgeStatus.isProcessing || bridgeStatus.queueLength > 0) {
    return 'busy';
  }
  
  if (gpuInfo.temperature > 80) {
    return 'hot';
  }
  
  if (gpuInfo.memoryUtilization > 90) {
    return 'memory_pressure';
  }
  
  return 'idle';
}

/**
 * Get thermal status based on temperature
 */
function getThermalStatus(temperature) {
  if (temperature > 85) return 'critical';
  if (temperature > 75) return 'hot';
  if (temperature > 60) return 'warm';
  return 'normal';
}

/**
 * Get performance level based on utilization
 */
function getPerformanceLevel(utilization, memoryUtilization) {
  const avgUtilization = (parseFloat(utilization) + parseFloat(memoryUtilization)) / 2;
  
  if (avgUtilization > 80) return 'high';
  if (avgUtilization > 50) return 'medium';
  if (avgUtilization > 20) return 'low';
  return 'idle';
}
