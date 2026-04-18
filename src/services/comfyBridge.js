/**
 * ComfyUI Closed-Loop Bridge Service
 * Connects to ComfyUI WebSocket and manages FIFO queue processing
 */

import WebSocket from 'ws';
import { Server } from 'socket.io';
import http from 'http';
import Project from '../models/Project.js';

class ComfyBridgeService {
  constructor() {
    this.comfyUIWebSocket = null;
    this.frontendClients = new Map();
    this.comfyUIConnected = false;
    this.currentProcessing = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.queue = [];
    this.isProcessingQueue = false;
    
    // ComfyUI configuration
    this.comfyUIUrl = process.env.COMFY_WS_URL || 'ws://127.0.0.1:8188/ws?clientId=removation_main';
    this.comfyRestUrl = process.env.COMFY_URL || 'http://127.0.0.1:8188';
    this.backendPort = process.env.BACKEND_WS_PORT || 3001;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing ComfyUI Bridge Service...');
    this.connectToComfyUI();
    this.startBackendServer();
  }

  /**
   * Connect to ComfyUI WebSocket
   */
  connectToComfyUI() {
    try {
      console.log('🔗 Connecting to ComfyUI:', this.comfyUIUrl);
      
      this.comfyUIWebSocket = new WebSocket(this.comfyUIUrl);
      
      this.comfyUIWebSocket.on('open', () => {
        console.log('✅ Connected to ComfyUI WebSocket');
        this.comfyUIConnected = true;
        this.reconnectAttempts = 0;
        this.notifyFrontend('comfy:status', { status: 'connected' });
      });

      this.comfyUIWebSocket.on('message', (data) => {
        this.handleComfyUIMessage(JSON.parse(data.toString()));
      });

      this.comfyUIWebSocket.on('close', () => {
        console.log('🔌 Disconnected from ComfyUI');
        this.comfyUIConnected = false;
        this.currentProcessing = null;
        this.notifyFrontend('comfy:status', { status: 'disconnected' });
        this.attemptReconnect();
      });

      this.comfyUIWebSocket.on('error', (error) => {
        console.error('❌ ComfyUI WebSocket error:', error);
        this.comfyUIConnected = false;
        this.notifyFrontend('comfy:error', { message: 'ComfyUI connection error' });
      });

    } catch (error) {
      console.error('❌ Failed to connect to ComfyUI:', error);
      this.notifyFrontend('comfy:error', { message: 'Cannot connect to ComfyUI server' });
    }
  }

  /**
   * Handle messages from ComfyUI
   */
  handleComfyUIMessage(message) {
    const { type, data } = message;
    
    console.log('📨 ComfyUI message:', type, data);

    switch (type) {
      case 'progress':
        this.handleProgressMessage(data);
        break;
      case 'executing':
        this.handleExecutingMessage(data);
        break;
      case 'executed':
        this.handleExecutedMessage(data);
        break;
      case 'execution_error':
        this.handleExecutionError(data);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  /**
   * Handle 'executing' message from ComfyUI
   */
  handleExecutingMessage(data) {
    const { node_id, prompt_id } = data;
    
    if (this.currentProcessing && this.currentProcessing.promptId === prompt_id) {
      this.currentProcessing.nodeId = node_id;
      this.currentProcessing.stage = this.getNodeName(node_id);

      this.notifyFrontend('comfy:status', {
        stage: this.currentProcessing.stage,
        nodeId: node_id,
        promptId: prompt_id
      });
    }
  }

  /**
   * Handle 'progress' message from ComfyUI
   */
  handleProgressMessage(data) {
    const { node_id, value, max } = data;
    
    if (!this.currentProcessing) return;

    const progress = max > 0 ? (value / max) * 100 : 0;
    
    this.notifyFrontend('comfy:progress', {
      progress: Math.round(progress),
      nodeId: node_id,
      timestamp: Date.now()
    });
  }

  /**
   * Handle 'executed' message from ComfyUI
   */
  async handleExecutedMessage(data) {
    const { prompt_id } = data;
    
    console.log('🔍 Execution handler called with prompt_id:', prompt_id);
    console.log('🔍 Current processing:', this.currentProcessing);
    
    if (!this.currentProcessing || this.currentProcessing.promptId !== prompt_id) {
      console.log('❌ No matching current processing for prompt_id:', prompt_id);
      return;
    }

    console.log('✅ ComfyUI execution completed');

    try {
      // 1. Get filename from ComfyUI history
      const historyRes = await fetch(
        `http://127.0.0.1:8188/history/${prompt_id}` 
      )
      const history = await historyRes.json()
      const outputs = history[prompt_id]?.outputs
      if (!outputs) {
        throw new Error('No outputs in ComfyUI history')
      }
      const nodeId = Object.keys(outputs)[0]
      const filename = outputs[nodeId].images[0].filename

      // 2. Copy to public/renders
      const fs = await import('fs/promises')
      const src = `/home/nikhil/Documents/Remo2/ComfyUI/output/${filename}` 
      const dest = `/home/nikhil/Documents/Remo2/Removation_3/public/renders/${filename}` 
      await fs.mkdir(
        '/home/nikhil/Documents/Remo2/Removation_3/public/renders',
        { recursive: true }
      )
      await fs.copyFile(src, dest)

      // 3. Update MongoDB
      const imageUrl = `/renders/${filename}` 
      await Project.findByIdAndUpdate(this.currentProcessing.projectId, {
        resultImage: imageUrl,
        status: 'completed',
        processingCompletedAt: new Date()
      })

      // 4. Emit to frontend
      this.notifyFrontend('comfy:done', {
        projectId: this.currentProcessing.projectId,
        imageUrl,
        filename
      })
      console.log(`? Generation complete: ${filename}`)
        
    } catch (error) {
      console.error('❌ Failed to process executed message:', error);
      await this.updateProjectResult(this.currentProcessing.projectId, null, 'failed');
      this.notifyFrontend('comfy:error', { 
        message: `Generation failed: ${error.message}`,
        projectId: this.currentProcessing.projectId
      });
    } finally {
      this.currentProcessing = null;
      this.processQueue();
    }
  }

  /**
   * Poll ComfyUI history until job completes or fails (fallback for missed WS events)
   */
  async pollForCompletion() {
    if (!this.currentProcessing || !this.currentProcessing.promptId) return;

    const promptId = this.currentProcessing.promptId;
    const projectId = this.currentProcessing.projectId;
    const maxPolls = 60;  // 60 × 5s = 5 minutes max
    let polls = 0;

    const interval = setInterval(async () => {
      // Stop if another job took over or already resolved
      if (!this.currentProcessing || this.currentProcessing.promptId !== promptId) {
        clearInterval(interval);
        return;
      }

      polls++;
      if (polls > maxPolls) {
        console.warn(`⏰ Polling timeout for prompt ${promptId}`);
        clearInterval(interval);
        await Project.findByIdAndUpdate(projectId, {
          status: 'failed',
          errorMessage: 'Generation timed out after 5 minutes',
          processingCompletedAt: new Date()
        });
        this.currentProcessing = null;
        this.processQueue();
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:8188/history/${promptId}`);
        const history = await res.json();
        const entry = history[promptId];

        if (!entry) return; // not in history yet

        const outputs = entry.outputs || {};
        const status = entry.status || {};

        // Check for execution error first
        if (status.status_str === 'error' || (status.messages || []).some(m => m[0] === 'execution_error')) {
          console.error(`❌ ComfyUI execution error for prompt ${promptId}`);
          clearInterval(interval);
          await Project.findByIdAndUpdate(projectId, {
            status: 'failed',
            errorMessage: 'ComfyUI execution error — check VRAM or workflow',
            processingCompletedAt: new Date()
          });
          this.currentProcessing = null;
          this.processQueue();
          return;
        }

        // Check for successful outputs
        const nodeId = Object.keys(outputs)[0];
        if (nodeId && outputs[nodeId]?.images?.length > 0) {
          console.log('✅ Polling found completed execution for prompt:', promptId);
          clearInterval(interval);
          // Delegate to the existing handler
          await this.handleExecutedMessage({ prompt_id: promptId });
        }
      } catch (err) {
        console.error('⚠️ Polling error:', err.message);
      }
    }, 5000); // poll every 5 seconds
  }

  /**
   * Handle 'execution_error' message from ComfyUI
   */
  async handleExecutionError(data) {
    const { prompt_id, error } = data;
    
    console.error('❌ ComfyUI execution error:', error);
    
    if (this.currentProcessing && this.currentProcessing.promptId === prompt_id) {
      await this.updateProjectResult(this.currentProcessing.projectId, null, 'failed');
      this.notifyFrontend('comfy:error', { 
        message: `Execution error: ${error}`,
        projectId: this.currentProcessing.projectId
      });
      
      this.currentProcessing = null;
      this.processQueue();
    }
  }

  /**
   * Extract generated image from ComfyUI outputs
   */
  extractGeneratedImage(outputs) {
    // Look for any node with image outputs
    for (const nodeId in outputs) {
      if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
        return outputs[nodeId].images[0];
      }
    }
    return null;
  }

  /**
   * Get human-readable node name
   */
  getNodeName(nodeId) {
    const nodeMap = {
      '1': 'Loading Checkpoint',
      '2': 'Encoding Prompt',
      '3': 'Encoding Negative Prompt', 
      '4': 'Sampling',
      '5': 'Saving Image',
      '6': 'Loading Input Image',
      '7': 'VAE Encoding',
      '8': 'VAE Decoding',
      '9': 'ControlNet Processing',
      '10': 'Segmentation',
      '11': 'Inpainting',
      '12': 'Mask Processing'
    };
    
    return nodeMap[nodeId] || `Processing Node ${nodeId}`;
  }

  /**
   * Update project result in MongoDB
   */
  async updateProjectResult(projectId, imageUrl, status) {
    try {
      const project = await Project.findById(projectId);
      if (project) {
        project.resultImage = imageUrl;
        project.status = status;
        await project.save();
        console.log(`✅ Project ${projectId} updated with status: ${status}`);
      }
    } catch (error) {
      console.error('❌ Failed to update project:', error);
    }
  }

  /**
   * Trigger garbage collection in ComfyUI
   */
  triggerGarbageCollection() {
    if (this.comfyUIConnected && this.comfyUIWebSocket) {
      // Send garbage collection command
      this.comfyUIWebSocket.send(JSON.stringify({
        type: 'garbage_collect'
      }));
    }
  }

  /**
   * Start backend WebSocket server for frontend clients
   */
  startBackendServer() {
    const startServer = (port) => {
      // Kill existing server if it exists
      if (this.backendServer) {
        this.backendServer.close();
        this.backendServer = null;
      }

      const server = http.createServer();
      const io = new Server(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      io.on('connection', (socket) => {
        console.log('🔗 Frontend client connected:', socket.id);
        this.frontendClients.set(socket.id, socket);
        
        // Send initial connection status
        socket.emit('comfy:status', { 
          status: this.comfyUIConnected ? 'connected' : 'disconnected' 
        });
      });

      io.on('disconnect', (socket) => {
        console.log('🔌 Frontend client disconnected:', socket.id);
        this.frontendClients.delete(socket.id);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} in use, trying ${port + 1}`);
          startServer(port + 1);
        }
      });

      server.listen(port, () => {
        console.log(`Backend WS server on port ${port}`);
      });

      this.backendServer = server;
    };
    
    startServer(3001);
  }

  /**
   * Queue a new job for processing
   */
  async enqueueJob(projectId, workflow) {
    return new Promise((resolve, reject) => {
      const job = {
        id: Date.now() + Math.random(),
        projectId,
        workflow,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.queue.push(job);
      console.log(`📝 Job queued: ${job.id} (queue length: ${this.queue.length})`);
      
      this.processQueue();
    });
  }

  /**
   * Process the job queue
   */
  async processQueue() {
    if (this.queue.length === 0 || this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;
    const job = this.queue.shift();
    
    console.log(`🚀 Processing job: ${job.id}`);
    this.currentProcessing = {
      projectId: job.projectId,
      jobId: job.id,
      promptId: null,
      nodeId: null,
      stage: 'starting'
    };

    try {
      // Before submitting job check VRAM
      const statsRes = await fetch('http://127.0.0.1:8188/system_stats')
      const stats = await statsRes.json()
      const vramFreeMB = stats.devices[0].vram_free / 1024 / 1024
      console.log(`VRAM free before job: ${vramFreeMB.toFixed(0)}MB`)
      if (vramFreeMB < 500) {
        console.warn('Low VRAM warning - generation may fail')
      }

      // Unload previous model + free VRAM cache before new job
      try {
        await fetch(`${this.comfyRestUrl}/free`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unload_models: true, free_memory: true })
        });
        console.log('🧹 Models unloaded, VRAM freed before job');
        // Give GPU a moment to actually release memory
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.warn('⚠️ Could not flush VRAM:', e.message);
      }

      // Update project status to processing
      await this.updateProjectResult(job.projectId, null, 'processing');
      
      // Submit workflow to ComfyUI REST API directly
      // (Do NOT wait for WebSocket — polling handles completion)
      const response = await fetch(`${this.comfyRestUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: job.workflow
        })
      });

      if (!response.ok) {
        throw new Error(`ComfyUI HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.prompt_id) {
        throw new Error('No prompt_id returned from ComfyUI');
      }

      this.currentProcessing.promptId = result.prompt_id;
      console.log(`✅ Workflow submitted to ComfyUI, prompt_id: ${result.prompt_id}`);

      // Resolve immediately — continuous polling will mark it complete
      job.resolve({ promptId: result.prompt_id, projectId: job.projectId });
      
      // Start continuous polling as the primary completion mechanism
      this.pollForCompletion();
      
    } catch (error) {
      console.error(`❌ Job submission failed: ${job.id}`, error);
      await this.updateProjectResult(job.projectId, null, 'failed');
      job.reject(error);
      this.currentProcessing = null;
    } finally {
      this.isProcessingQueue = false;
      // Process next job after short delay
      setTimeout(() => this.processQueue(), 1000);
    }
  }


  /**
   * Notify all frontend clients
   */
  notifyFrontend(event, data) {
    console.log(`📤 Broadcasting to frontend: ${event}`, data);
    
    this.frontendClients.forEach((socket) => {
      socket.emit(event, data);
    });
  }

  /**
   * Attempt to reconnect to ComfyUI
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      console.log(`🔄 Reconnecting to ComfyUI in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectToComfyUI();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.notifyFrontend('comfy:error', { 
        message: 'Unable to connect to ComfyUI. Please check the server.' 
      });
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      comfyUIConnected: this.comfyUIConnected,
      frontendClients: this.frontendClients.size,
      queueLength: this.queue.length,
      isProcessing: this.isProcessingQueue,
      currentProcessing: this.currentProcessing,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Check if ComfyUI is reachable
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${process.env.COMFY_URL || 'http://127.0.0.1:8188'}/system_stats`, {
        timeout: 5000
      });
      
      if (response.ok) {
        return { status: 'online', data: await response.json() };
      } else {
        return { status: 'error', message: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { 
        status: 'offline', 
        error: 'GPU Offline', 
        fix: 'Run: python3 main.py --listen' 
      };
    }
  }
}

// Singleton instance
const comfyBridgeService = new ComfyBridgeService();

export default comfyBridgeService;
