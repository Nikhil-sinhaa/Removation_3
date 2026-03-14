// lib/ai/comfyui-monitoring.ts
import axios from 'axios';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  gpu: {
    name: string;
    vram_used: number;
    vram_total: number;
    utilization: number;
    temperature: number;
  };
  comfyui: {
    running: boolean;
    queue_size: number;
    active_generations: number;
  };
  errors: string[];
}

export class ComfyUIMonitor {
  private baseUrl: string;
  private healthThresholds = {
    max_vram_usage: 0.85, // 85%
    max_temperature: 80,  // 80°C
    max_queue_size: 10,
    min_vram_free: 1000, // 1GB
  };

  constructor() {
    this.baseUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
  }

  async getGPUStats(): Promise<SystemHealth['gpu']> {
    try {
      const response = await axios.get(`${this.baseUrl}/system_stats`, { timeout: 5000 });
      const device = response.data.devices?.[0];
      
      if (!device) {
        throw new Error('No GPU device found');
      }

      return {
        name: device.name || 'Unknown GPU',
        vram_used: (device.vram_total || 0) - (device.vram_free || 0),
        vram_total: device.vram_total || 0,
        utilization: 0, // ComfyUI doesn't provide this, we'll get it from nvidia-smi
        temperature: 0, // Same for temperature
      };
    } catch (error) {
      console.error('Failed to get GPU stats:', error);
      throw error;
    }
  }

  async getComfyUIStats(): Promise<SystemHealth['comfyui']> {
    try {
      const response = await axios.get(`${this.baseUrl}/queue`, { timeout: 5000 });
      const queue = response.data;
      
      return {
        running: true,
        queue_size: (queue.queue_pending?.length || 0) + (queue.queue_running?.length || 0),
        active_generations: queue.queue_running?.length || 0,
      };
    } catch (error) {
      console.error('Failed to get ComfyUI stats:', error);
      return {
        running: false,
        queue_size: 0,
        active_generations: 0,
      };
    }
  }

  async getNvidiaSMIStats(): Promise<{ utilization: number; temperature: number }> {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      const { stdout } = await execAsync('nvidia-smi --query-gpu=utilization.gpu,temperature.gpu --format=csv,noheader,nounits');
      const [utilization, temperature] = stdout.trim().split(', ').map(Number);
      
      return { utilization, temperature };
    } catch (error) {
      console.error('Failed to get nvidia-smi stats:', error);
      return { utilization: 0, temperature: 0 };
    }
  }

  async checkSystemHealth(): Promise<SystemHealth> {
    const errors: string[] = [];
    let status: SystemHealth['status'] = 'healthy';

    try {
      // Get ComfyUI stats
      const comfyui = await this.getComfyUIStats();
      
      if (!comfyui.running) {
        errors.push('ComfyUI server is not running');
        status = 'critical';
      }

      // Get GPU stats
      const gpu = await this.getGPUStats();
      
      // Get nvidia-smi stats
      const nvidiaStats = await this.getNvidiaSMIStats();
      gpu.utilization = nvidiaStats.utilization;
      gpu.temperature = nvidiaStats.temperature;

      // Check VRAM usage
      const vramUsagePercent = gpu.vram_used / gpu.vram_total;
      if (vramUsagePercent > this.healthThresholds.max_vram_usage) {
        errors.push(`VRAM usage too high: ${(vramUsagePercent * 100).toFixed(1)}%`);
        status = status === 'critical' ? 'critical' : 'degraded';
      }

      // Check temperature
      if (gpu.temperature > this.healthThresholds.max_temperature) {
        errors.push(`GPU temperature too high: ${gpu.temperature}°C`);
        status = status === 'critical' ? 'critical' : 'degraded';
      }

      // Check queue size
      if (comfyui.queue_size > this.healthThresholds.max_queue_size) {
        errors.push(`Queue too large: ${comfyui.queue_size} jobs`);
        status = status === 'critical' ? 'critical' : 'degraded';
      }

      return {
        status,
        gpu,
        comfyui,
        errors,
      };
    } catch (error) {
      return {
        status: 'critical',
        gpu: {
          name: 'Unknown',
          vram_used: 0,
          vram_total: 0,
          utilization: 0,
          temperature: 0,
        },
        comfyui: {
          running: false,
          queue_size: 0,
          active_generations: 0,
        },
        errors: [`System health check failed: ${(error as any).message}`],
      };
    }
  }

  async logHealthCheck(): Promise<void> {
    const health = await this.checkSystemHealth();
    
    console.log(`🏥 ComfyUI Health Check [${health.status.toUpperCase()}]`);
    console.log(`🎯 GPU: ${health.gpu.name}`);
    console.log(`💾 VRAM: ${health.gpu.vram_used}MB / ${health.gpu.vram_total}MB (${((health.gpu.vram_used / health.gpu.vram_total) * 100).toFixed(1)}%)`);
    console.log(`🌡️ Temp: ${health.gpu.temperature}°C`);
    console.log(`⚡ Util: ${health.gpu.utilization}%`);
    console.log(`🔄 Queue: ${health.comfyui.queue_size} jobs (${health.comfyui.active_generations} running)`);
    
    if (health.errors.length > 0) {
      console.log('❌ Errors:');
      health.errors.forEach(error => console.log(`   - ${error}`));
    }
  }

  async waitForHealthy(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const health = await this.checkSystemHealth();
      
      if (health.status === 'healthy') {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return false;
  }
}

export const comfyUIMonitor = new ComfyUIMonitor();
