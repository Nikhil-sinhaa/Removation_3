/**
 * Resilient AI Queue Service for Object Removal
 * Manages GPU requests with intelligent queuing and self-healing capabilities
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const axios = require('axios');

class AIQueueService extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.isProcessing = false;
    this.comfyUIStatus = 'unknown';
    this.gpuStatus = null;
    this.wsConnection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // ComfyUI configuration
    this.comfyUIUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
    this.comfyWSUrl = this.comfyUIUrl.replace('http', 'ws') + '/ws';
    
    // Initialize
    this.init();
  }

  async init() {
    await this.checkComfyUIHealth();
    this.connectWebSocket();
    this.startHealthCheck();
  }

  /**
   * Check ComfyUI health status
   */
  async checkComfyUIHealth() {
    try {
      const response = await axios.get(`${this.comfyUIUrl}/system_stats`, {
        timeout: 5000
      });
      
      this.comfyUIStatus = 'online';
      this.gpuStatus = {
        is_busy: response.data.system.devices?.some(d => d.devices?.some(dev => dev.type === 'cuda' && dev.busy)) || false,
        vram_used: this.calculateVRAMUsage(response.data.system.devices),
        temperature: this.getGPUTemperature(response.data.system.devices)
      };
      
      console.log('✅ ComfyUI is online', this.gpuStatus);
      
    } catch (error) {
      this.comfyUIStatus = 'offline';
      this.gpuStatus = { is_busy: false, vram_used: 0, temperature: 0 };
      console.log('❌ ComfyUI is offline:', error.message);
    }
  }

  /**
   * Calculate VRAM usage from ComfyUI stats
   */
  calculateVRAMUsage(devices) {
    if (!devices) return 0;
    
    const cudaDevice = devices.find(d => d.devices?.some(dev => dev.type === 'cuda'));
    if (!cudaDevice) return 0;
    
    const gpu = cudaDevice.devices.find(dev => dev.type === 'cuda');
    if (!gpu || !gpu.vram_total) return 0;
    
    const used = gpu.vram_total - (gpu.vram_free || 0);
    return Math.round((used / 1024 / 1024 / 1024) * 100) / 100; // Convert to GB
  }

  /**
   * Get GPU temperature
   */
  getGPUTemperature(devices) {
    if (!devices) return 0;
    
    const cudaDevice = devices.find(d => d.devices?.some(dev => dev.type === 'cuda'));
    if (!cudaDevice) return 0;
    
    const gpu = cudaDevice.devices.find(dev => dev.type === 'cuda');
    return gpu?.temperature || 0;
  }

  /**
   * Connect to ComfyUI WebSocket for real-time progress
   */
  connectWebSocket() {
    try {
      this.wsConnection = new WebSocket(this.comfyWSUrl);
      
      this.wsConnection.on('open', () => {
        console.log('🔗 Connected to ComfyUI WebSocket');
        this.reconnectAttempts = 0;
        this.emit('websocket:connected');
      });

      this.wsConnection.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      });

      this.wsConnection.on('close', () => {
        console.log('🔌 WebSocket disconnected');
        this.emit('websocket:disconnected');
        this.attemptReconnect();
      });

      this.wsConnection.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.emit('websocket:error', error);
      });

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(message) {
    const { data, type } = message;
    
    if (type === 'status') {
      this.updateGPUStatus(data);
    } else if (type === 'progress') {
      this.updateProgress(data);
    } else if (type === 'execution_complete') {
      this.handleExecutionComplete(data);
    }
  }

  /**
   * Update GPU status from WebSocket
   */
  updateGPUStatus(data) {
    if (data.status && data.status.sid) {
      // Update processing status
      this.isProcessing = data.status.sid !== null;
    }
  }

  /**
   * Update progress from WebSocket
   */
  updateProgress(data) {
    const { node_id, value, max } = data;
    this.emit('progress', { nodeId: node_id, value, max });
  }

  /**
   * Handle execution completion
   */
  handleExecutionComplete(data) {
    this.isProcessing = false;
    this.emit('execution_complete', data);
    this.processQueue();
  }

  /**
   * Attempt to reconnect WebSocket
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      console.log(`🔄 Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('websocket:failed');
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthCheck() {
    setInterval(async () => {
      await this.checkComfyUIHealth();
      this.emit('health_check', this.gpuStatus);
    }, 5000); // Check every 5 seconds
  }

  /**
   * Queue a new AI request
   */
  async enqueue(request) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        id: Date.now() + Math.random(),
        request,
        resolve,
        reject,
        timestamp: Date.now(),
        progress: 0
      };

      this.queue.push(queueItem);
      console.log(`📝 Request queued: ${queueItem.id} (queue length: ${this.queue.length})`);
      
      this.emit('request_queued', queueItem);
      this.processQueue();
    });
  }

  /**
   * Process the queue
   */
  async processQueue() {
    if (this.queue.length === 0 || this.isProcessing || this.comfyUIStatus !== 'online') {
      return;
    }

    const queueItem = this.queue.shift();
    this.isProcessing = true;
    
    console.log(`🚀 Processing request: ${queueItem.id}`);
    this.emit('processing_started', queueItem);

    try {
      const result = await this.processRequest(queueItem);
      queueItem.resolve(result);
      this.emit('request_completed', queueItem, result);
    } catch (error) {
      console.error(`❌ Request failed: ${queueItem.id}`, error);
      queueItem.reject(error);
      this.emit('request_failed', queueItem, error);
    } finally {
      this.isProcessing = false;
      // Process next item in queue
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  /**
   * Process individual request
   */
  async processRequest(queueItem) {
    const { request } = queueItem;
    
    switch (request.type) {
      case 'object_removal':
        return await this.processObjectRemoval(request);
      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }

  /**
   * Process object removal request
   */
  async processObjectRemoval(request) {
    const { imageUrl, point, mask } = request;
    
    // Build ComfyUI workflow for object removal
    const workflow = this.buildObjectRemovalWorkflow(imageUrl, point, mask);
    
    // Submit to ComfyUI
    const response = await axios.post(`${this.comfyUIUrl}/prompt`, {
      prompt: workflow
    }, {
      timeout: 300000 // 5 minute timeout
    });

    if (!response.data || !response.data.prompt_id) {
      throw new Error('Failed to submit workflow to ComfyUI');
    }

    const promptId = response.data.prompt_id;
    
    // Wait for completion with progress updates
    return await this.waitForCompletion(promptId, queueItem);
  }

  /**
   * Build ComfyUI workflow for object removal with RTX 4060 optimizations
   */
  buildObjectRemovalWorkflow(imageUrl, point, mask) {
    return {
      "8": {
        "inputs": {
          "image": imageUrl,
          "upload": "image"
        },
        "class_type": "LoadImage"
      },
      "9": {
        "inputs": {
          "mask": mask,
          "upload": "mask"
        },
        "class_type": "LoadImageMask"
      },
      "10": {
        "inputs": {
          "pixels": ["8", 0],
          "vae": ["3", 2],
          "fp8_e4m3fn": true,
          "tiling": true,
          "tile_size": 512,
          "tile_overlap": 64
        },
        "class_type": "VAEEncodeTiled"
      },
      "12": {
        "inputs": {
          "pixels": ["10", 0],
          "mask": ["9", 0],
          "vae": ["3", 2],
          "fp8_e4m3fn": true
        },
        "class_type": "InpaintWithLama"
      },
      "13": {
        "inputs": {
          "filename_prefix": "object_removal",
          "images": ["12", 0]
        },
        "class_type": "SaveImage"
      },
      "14": {
        "inputs": {
          "enabled": true,
          "after_execution": true,
          "target_nodes": ["8", "9", "10", "12", "13"]
        },
        "class_type": "GarbageCollector"
      }
    };
  }

  /**
   * Wait for ComfyUI completion with progress tracking
   */
  async waitForCompletion(promptId, queueItem) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 300000); // 5 minute timeout

      const checkStatus = async () => {
        try {
          const response = await axios.get(`${this.comfyUIUrl}/history/${promptId}`);
          const history = response.data;
          
          if (history[promptId]) {
            const status = history[promptId];
            
            if (status.outputs) {
              clearTimeout(timeout);
              
              // Extract the generated image
              const images = status.outputs['4']?.images || [];
              if (images.length > 0) {
                const resultImageUrl = `${this.comfyUIUrl}/view?filename=${images[0].filename}`;
                resolve({
                  success: true,
                  resultImageUrl,
                  promptId
                });
              } else {
                reject(new Error('No output images generated'));
              }
            } else {
              // Still processing, check again
              setTimeout(checkStatus, 1000);
            }
          } else {
            setTimeout(checkStatus, 1000);
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      checkStatus();
    });
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      comfyUIStatus: this.comfyUIStatus,
      gpuStatus: this.gpuStatus,
      websocketConnected: this.wsConnection?.readyState === WebSocket.OPEN
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.emit('queue_cleared');
  }
}

// Singleton instance
const aiQueueService = new AIQueueService();

module.exports = aiQueueService;
