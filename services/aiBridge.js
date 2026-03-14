/**
 * Event-Driven AI Bridge for Closed-Loop System
 * Connects Frontend → Backend → ComfyUI with real-time WebSocket communication
 */

const WebSocket = require('ws');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Project = require('../lib/db/models/Project');

class AIBridgeService {
  constructor() {
    this.comfyUIWebSocket = null;
    this.frontendClients = new Map();
    this.comfyUIConnected = false;
    this.currentProcessing = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // ComfyUI configuration
    this.comfyUIUrl = process.env.COMFYUI_URL || 'ws://127.0.0.1:8188/ws';
    this.backendPort = process.env.BACKEND_WS_PORT || 3001;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing AI Bridge Service...');
    
    // Connect to MongoDB for project updates
    await this.connectToDatabase();
    
    // Connect to ComfyUI WebSocket
    this.connectToComfyUI();
    
    // Start backend WebSocket server for frontend
    this.startBackendServer();
  }

  /**
   * Connect to MongoDB for project updates
   */
  async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/removation');
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      // Continue without DB - will use in-memory storage
    }
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
        this.notifyFrontend('comfy_connection', { connected: true });
      });

      this.comfyUIWebSocket.on('message', (data) => {
        this.handleComfyUIMessage(JSON.parse(data.toString()));
      });

      this.comfyUIWebSocket.on('close', () => {
        console.log('🔌 Disconnected from ComfyUI');
        this.comfyUIConnected = false;
        this.currentProcessing = null;
        this.notifyFrontend('comfy_connection', { connected: false });
        this.attemptReconnect();
      });

      this.comfyUIWebSocket.on('error', (error) => {
        console.error('❌ ComfyUI WebSocket error:', error);
        this.comfyUIConnected = false;
        this.notifyFrontend('error', { message: 'ComfyUI connection error' });
      });

    } catch (error) {
      console.error('❌ Failed to connect to ComfyUI:', error);
      this.notifyFrontend('error', { message: 'Cannot connect to ComfyUI server' });
    }
  }

  /**
   * Handle messages from ComfyUI
   */
  handleComfyUIMessage(message) {
    const { type, data } = message;
    
    console.log('📨 ComfyUI message:', type, data);

    switch (type) {
      case 'executing':
        this.handleExecutingMessage(data);
        break;
      case 'progress':
        this.handleProgressMessage(data);
        break;
      case 'executed':
        this.handleExecutedMessage(data);
        break;
      case 'error':
        this.handleErrorMessage(data);
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
    
    this.currentProcessing = {
      nodeId: node_id,
      promptId: prompt_id,
      stage: this.determineStage(node_id),
      startTime: Date.now()
    };

    // Forward to frontend with progress info
    this.notifyFrontend('comfy_progress', {
      stage: this.currentProcessing.stage,
      progress: 0,
      message: `Processing ${this.currentProcessing.stage}...`,
      nodeId: node_id,
      timestamp: Date.now()
    });
  }

  /**
   * Handle 'progress' message from ComfyUI
   */
  handleProgressMessage(data) {
    const { node_id, value, max } = data;
    
    if (!this.currentProcessing || this.currentProcessing.nodeId !== node_id) {
      return; // Ignore progress for inactive nodes
    }

    const progress = max > 0 ? (value / max) * 100 : 0;
    
    // Update current processing state
    this.currentProcessing.progress = progress;
    
    // Forward detailed progress to frontend
    this.notifyFrontend('comfy_progress', {
      stage: this.currentProcessing.stage,
      progress,
      message: `${this.currentProcessing.stage}: ${Math.round(progress)}%`,
      nodeId: node_id,
      timestamp: Date.now()
    });
  }

  /**
   * Handle 'executed' message from ComfyUI
   */
  async handleExecutedMessage(data) {
    const { prompt_id, outputs } = data;
    
    if (!this.currentProcessing || this.currentProcessing.promptId !== prompt_id) {
      return; // Ignore execution for inactive prompts
    }

    console.log('✅ ComfyUI execution completed:', outputs);

    // Extract the generated image
    const generatedImages = this.extractGeneratedImages(outputs);
    
    if (generatedImages.length > 0) {
      const filename = generatedImages[0].filename;
      const imageUrl = `${process.env.COMFYUI_URL || 'http://127.0.0.1:8188'}/view?filename=${filename}`;
      
      const executedEvent = {
        filename,
        timestamp: Date.now(),
        success: true,
        imageUrl
      };

      // Update MongoDB project with new image
      await this.updateProjectWithNewImage(executedEvent);

      // Forward to frontend
      this.notifyFrontend('comfy_executed', executedEvent);
      
      this.currentProcessing = null;
    } else {
      // No output images - error case
      this.notifyFrontend('error', { 
        message: 'Generation completed but no output images found' 
      });
      this.currentProcessing = null;
    }
  }

  /**
   * Handle 'error' message from ComfyUI
   */
  handleErrorMessage(data) {
    const { error, node_id } = data;
    
    console.error('❌ ComfyUI error:', error);
    
    this.notifyFrontend('error', { 
      message: `Processing error: ${error}`,
      nodeId: node_id
    });
    
    this.currentProcessing = null;
  }

  /**
   * Determine processing stage based on node ID
   */
  determineStage(nodeId) {
    // Map node IDs to stages based on typical ComfyUI workflow
    const stageMap = {
      '8': 'preparing_gpu',      // LoadImage
      '9': 'segmenting',        // LoadImageMask  
      '10': 'processing',       // VAEEncodeTiled
      '12': 'inpainting',        // InpaintWithLama
      '13': 'complete'          // SaveImage
    };
    
    return stageMap[nodeId] || 'processing';
  }

  /**
   * Extract generated images from ComfyUI outputs
   */
  extractGeneratedImages(outputs) {
    const images = [];
    
    // Look for SaveImage node outputs (typically node 13)
    if (outputs['13'] && outputs['13'].images) {
      images.push(...outputs['13'].images);
    }
    
    return images;
  }

  /**
   * Update project in MongoDB with new generated image
   */
  async updateProjectWithNewImage(executedEvent) {
    try {
      // Find the most recent project (or create a new one)
      let project = await Project.findOne().sort({ createdAt: -1 });
      
      if (!project) {
        // Create a new project if none exists
        project = new Project({
          name: `AI Redesign ${new Date().toLocaleDateString()}`,
          userId: 'test-user-123', // Development user
          originalImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          generatedImages: [],
          createdAt: new Date()
        });
        await project.save();
      }

      // Add the new generated image to the project
      project.generatedImages.push({
        id: Date.now().toString(),
        url: executedEvent.imageUrl,
        style: 'ai-redesigned',
        roomType: 'living-room',
        mode: 'redesign',
        createdAt: new Date(),
        isFavorite: false
      });

      await project.save();
      
      console.log('✅ Project updated with new image:', executedEvent.filename);
      
    } catch (error) {
      console.error('❌ Failed to update project:', error);
      // Continue - frontend will still get the executed event
    }
  }

  /**
   * Start backend WebSocket server for frontend clients
   */
  startBackendServer() {
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
      socket.emit('comfy_connection', { 
        connected: this.comfyUIConnected 
      });
    });

    io.on('disconnect', (socket) => {
      console.log('🔌 Frontend client disconnected:', socket.id);
      this.frontendClients.delete(socket.id);
    });

    // Handle commands from frontend
    io.on('start_processing', async (data) => {
      console.log('🚀 Frontend requested processing:', data);
      await this.handleFrontendCommand(socket, data);
    });

    server.listen(this.backendPort, () => {
      console.log(`✅ Backend WebSocket server running on port ${this.backendPort}`);
    });
  }

  /**
   * Handle processing commands from frontend
   */
  async handleFrontendCommand(socket, data) {
    if (!this.comfyUIConnected) {
      socket.emit('error', { 
        message: 'ComfyUI is not connected' 
      });
      return;
    }

    try {
      // Build optimized workflow for RTX 4060
      const workflow = this.buildOptimizedWorkflow(data);
      
      // Send to ComfyUI
      this.comfyUIWebSocket.send(JSON.stringify({
        prompt: workflow
      }));
      
      console.log('📤 Sent workflow to ComfyUI');
      
    } catch (error) {
      console.error('❌ Failed to process command:', error);
      socket.emit('error', { 
        message: `Processing failed: ${error.message}` 
      });
    }
  }

  /**
   * Build optimized workflow for RTX 4060 with FP8 precision and VAE tiling
   */
  buildOptimizedWorkflow(data) {
    const { imageUrl, style, roomType } = data;
    
    return {
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "text": `high quality ${roomType} interior design, ${style} style`,
          "clip": ["1", 1],
          "text_g": "blurry, low quality, distorted, ugly, bad anatomy",
          "clip_g": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": {
        "inputs": {
          "text": "",
          "clip": ["1", 1],
          "text_g": "",
          "clip_g": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "width": 1024,
          "height": 1024,
          "batch_size": 1,
          "steps": 20,
          "cfg": 7.0,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 1.0,
          "model": ["1", 0],
          "positive": ["2", 0],
          "negative": ["3", 0],
          "vae_name": "sdxl_vae.safetensors",
          "fp8_e4m3fn": true,
          "fp8_e4m3fn_fast": true,
          "fp8_e5m2": false,
          "fp16": false,
          "bf16": false,
          "tf32": false
        },
        "class_type": "KSampler"
      },
      "5": {
        "inputs": {
          "filename_prefix": `removation_${Date.now()}`,
          "images": ["4", 0]
        },
        "class_type": "SaveImage"
      },
      "6": {
        "inputs": {
          "image": imageUrl,
          "upload": "image"
        },
        "class_type": "LoadImage"
      },
      "7": {
        "inputs": {
          "pixels": ["6", 0],
          "vae": ["1", 2],
          "fp8_e4m3fn": true,
          "tiling": {
            "enabled": true,
            "tile_size": 512,
            "tile_overlap": 64,
            "condition_on_size": ">=1024"
          }
        },
        "class_type": "VAEEncodeTiled"
      },
      "8": {
        "inputs": {
          "pixels": ["7", 0],
          "vae": ["1", 2],
          "fp8_e4m3fn": true
        },
        "class_type": "VAEDecode"
      },
      "9": {
        "inputs": {
          "enabled": true,
          "after_execution": true,
          "target_nodes": ["1", "2", "3", "4", "5", "6", "7", "8"]
        },
        "class_type": "GarbageCollector"
      }
    };
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
      this.notifyFrontend('error', { 
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
      currentProcessing: this.currentProcessing,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Singleton instance
const aiBridgeService = new AIBridgeService();

module.exports = aiBridgeService;
