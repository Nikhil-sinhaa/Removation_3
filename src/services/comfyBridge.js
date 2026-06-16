/**
 * ComfyUI Closed-Loop Bridge Service
 * Connects to ComfyUI WebSocket and manages FIFO queue processing
 *
 * GPU Mode Switch: Reads from lib/ai/gpu-mode-router to decide whether
 * to talk to local ComfyUI or a remote Cloud instance.
 */

import WebSocket from 'ws';
import { Server } from 'socket.io';
import http from 'http';
import AIRun from '../models/AIRun.js';

const LOCAL_HOST = '127.0.0.1';
const LOCAL_PORT = '8188';
const LOCAL_URL  = `http://${LOCAL_HOST}:${LOCAL_PORT}`;

let _gpuRouter = null;
async function getGPURouter() {
  if (_gpuRouter) return _gpuRouter;
  // Next.js resolves '@/' to the project root at bundle time.
  // If that fails (e.g. cold ESM start), fall back gracefully to local mock.
  try {
    _gpuRouter = await import('@/lib/ai/gpu-mode-router');
  } catch {
    _gpuRouter = {
      resolveComfyURL: async () => ({
        url: process.env.COMFY_URL || 'http://127.0.0.1:8188',
        source: 'local'
      }),
      isCloudMode: () => false,
      getActiveComfyWsUrl: () => process.env.COMFY_WS_URL || 'ws://127.0.0.1:8188/ws?clientId=removation_main',
      setGPUModeRuntime: (mode, opts) => {
        console.warn(`[GPU] Attempted to set GPU mode to ${mode} but router alias not resolved. Fallback to local.`);
      }
    };
  }
  return _gpuRouter;
}

// Detect if we are running in a Next.js compilation or dev worker phase
const isNextJS = typeof process !== 'undefined' && (process.env.NEXT_PHASE !== undefined || process.env.NEXT_RUNTIME !== undefined);
const isCompilation = isNextJS && (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NEXT_PRIVATE_WORKER === 'true');

// ── Startup: apply persisted settings from MongoDB to runtime ─────────────────
// Runs once on first load so the in-process router reflects the DB state.
async function _syncSettingsFromDB() {
  try {
    const { getSetting } = await import('../lib/appSettings.ts');
    const [mode, cloudUrl] = await Promise.all([
      getSetting('COMFYUI_MODE'),
      getSetting('COMFYUI_CLOUD_URL'),
    ]);
    if (mode && mode !== 'local') {
      const r = await getGPURouter();
      r.setGPUModeRuntime(mode, cloudUrl ? { comfyUrl: cloudUrl } : undefined);
      console.log(`[GPU] Restored persisted mode from DB: ${mode}${cloudUrl ? ` (${cloudUrl})` : ''}`);
    }
  } catch (e) {
    console.warn('[GPU] Could not sync settings from DB (non-fatal):', e.message);
  }
}

if (!isCompilation) {
  _syncSettingsFromDB();
} else {
  console.log('ℹ️ Next.js compilation context detected: skipping database settings sync');
}

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
    this._ultraProRunning = false;  // Gap 4: concurrent job guard
    this._reconnectTimer = null;    // Leak fix: cancellable reconnect timer
    this._queueTimer = null;        // Leak fix: cancellable queue timer

    // ── ComfyUI URLs — resolved dynamically from gpu-mode-router ─────────────
    // Always call this.getComfyRestUrl() / this.getComfyWsUrl() instead of
    // reading these fields directly — they may change when mode is toggled.
    this.backendPort = process.env.BACKEND_WS_PORT || 3001;

    if (!isCompilation) {
      this.init();
    } else {
      console.log('ℹ️ Next.js compilation context detected: skipping automatic ComfyBridge initialization');
    }
  }

  /**
   * Active ComfyUI HTTP base URL (respects GPU mode switch).
   * Uses resolveComfyURL() which performs a 3-second health-check in AUTO mode
   * to route to cloud if available, otherwise falls back to local.
   */
  async getComfyRestUrl() {
    try {
      const r = await getGPURouter();
      const { url, source } = await r.resolveComfyURL();
      console.log(`[GPU] Routing to ${source}: ${url}`);
      return url;
    } catch (err) {
      console.warn(`[GPU] resolveComfyURL failed, using local fallback: ${err.message}`);
      return process.env.COMFY_URL || LOCAL_URL;
    }
  }

  /** Active ComfyUI WebSocket URL (respects GPU mode switch). */
  async getComfyWsUrl() {
    try {
      const r = await getGPURouter();
      return r.getActiveComfyWsUrl();
    } catch {
      return process.env.COMFY_WS_URL || `ws://${LOCAL_HOST}:${LOCAL_PORT}/ws?clientId=removation_main`;
    }
  }

  /** True when cloud ComfyUI (Colab/RunPod) is active. */
  async _isCloud() {
    try {
      const r = await getGPURouter();
      return r.isCloudMode();
    } catch {
      return false;
    }
  }

  /** Lazy cloud-comfy adapter (only loaded when needed). */
  async _cloudAdapter() {
    return import('../../lib/ai/cloud-comfy-adapter');
  }

  async init() {
    if (this._initialized) {
      console.log('ℹ️ ComfyUI Bridge already initialized, skipping');
      return;
    }
    this._initialized = true;

    if (process.env.COMFYUI_ENABLED === 'false') {
      console.log('ℹ️ ComfyUI disabled (COMFYUI_ENABLED=false) — skipping WebSocket connection');
      return;
    }

    console.log('🚀 Initializing ComfyUI Bridge Service...');
    this.connectToComfyUI();
    this.startBackendServer();
  }

  /**
   * Connect to ComfyUI WebSocket
   */
  async connectToComfyUI() {
    try {
      // Prevent multiple parallel connection attempts or listener leaks
      if (this.comfyUIWebSocket) {
        console.log('🧹 Cleaning up previous ComfyUI WebSocket instance and listeners...');
        try {
          this.comfyUIWebSocket.removeAllListeners();
          this.comfyUIWebSocket.close();
        } catch (e) {
          console.warn('⚠️ WebSocket cleanup warning:', e.message);
        }
        this.comfyUIWebSocket = null;
      }

      const wsUrl = await this.getComfyWsUrl();
      const cloud = await this._isCloud();
      console.log(`🔗 Connecting to ComfyUI [${cloud ? 'CLOUD ☁️' : 'LOCAL 🖥️'}]: ${wsUrl}`);

      this.comfyUIWebSocket = new WebSocket(wsUrl, {
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      
      this.comfyUIWebSocket.on('open', () => {
        console.log('✅ Connected to ComfyUI WebSocket');
        this.comfyUIConnected = true;
        this.reconnectAttempts = 0;
        this.notifyFrontend('comfy:status', { status: 'connected' });
      });

      this.comfyUIWebSocket.on('message', (data) => {
        // ComfyUI sends binary preview frames (TAESD) — skip those
        if (Buffer.isBuffer(data) && data[0] === 0) return;
        try {
          this.handleComfyUIMessage(JSON.parse(data.toString()));
        } catch { /* binary or malformed message — ignore */ }
      });

      this.comfyUIWebSocket.on('close', () => {
        console.log('🔌 Disconnected from ComfyUI');
        this.comfyUIConnected = false;
        this.currentProcessing = null;
        this._activeProgressCallback = null; // Leak fix: clear stuck callback on disconnect
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

  handleProgressMessage(data) {
    const { node_id, value, max } = data;
    
    if (this._activeProgressCallback) {
      try {
        this._activeProgressCallback({ value, max });
      } catch (e) {
        console.warn('Error in progress callback:', e.message);
      }
    }

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
      const comfyUrl = await this.getComfyRestUrl();
      const historyRes = await fetch(
        `${comfyUrl}/history/${prompt_id}`,
        { headers: { 'bypass-tunnel-reminder': 'true' } }
      )
      const history = await historyRes.json()
      const outputs = history[prompt_id]?.outputs
      if (!outputs) {
        throw new Error('No outputs in ComfyUI history')
      }
      const nodeId = Object.keys(outputs)[0]
      const filename = outputs[nodeId].images[0].filename

      // 2. Copy to public/renders (local or cloud)
      const fs = await import('fs/promises');
      const publicRendersDir = process.env.RENDERS_DIR ||
        require('path').join(process.cwd(), 'public', 'renders');
      const dest = `${publicRendersDir}/${filename}`;
      await fs.mkdir(publicRendersDir, { recursive: true });

      const isCloud = await this._isCloud();
      if (isCloud) {
        // Download output from remote ComfyUI
        const adapter = await this._cloudAdapter();
        const imgBuffer = await adapter.downloadOutputFromRemoteComfy(filename, '', comfyUrl);
        await fs.writeFile(dest, imgBuffer);
      } else {
        const src = `${process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output'}/${filename}`;
        await fs.copyFile(src, dest);
      }

      // 3. Update MongoDB
      const imageUrl = `/renders/${filename}` 
      await AIRun.findByIdAndUpdate(this.currentProcessing.projectId, {
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
      await this._flushVRAM();
      if (global.gc) {
        global.gc();
        console.log('[ComfyBridge] GC triggered');
      }
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
        await AIRun.findByIdAndUpdate(projectId, {
          status: 'failed',
          errorMessage: 'Generation timed out after 5 minutes',
          processingCompletedAt: new Date()
        });
        this.currentProcessing = null;
        this.processQueue();
        return;
      }

      try {
        const res = await fetch(`${await this.getComfyRestUrl()}/history/${promptId}`, {
          headers: { 'bypass-tunnel-reminder': 'true' }
        });
        const history = await res.json();
        const entry = history[promptId];

        if (!entry) return; // not in history yet

        const outputs = entry.outputs || {};
        const status = entry.status || {};

        // Check for execution error first
        if (status.status_str === 'error' || (status.messages || []).some(m => m[0] === 'execution_error')) {
          console.error(`❌ ComfyUI execution error for prompt ${promptId}`);
          clearInterval(interval);
          await AIRun.findByIdAndUpdate(projectId, {
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

      await this._flushVRAM();
      if (global.gc) {
        global.gc();
        console.log('[ComfyBridge] GC triggered');
      }
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
   * Extract all generated image URLs from ComfyUI outputs.
   */
  getAllOutputUrls(outputs) {
    const list = [];
    for (const nodeId in outputs) {
      if (nodeId === '_promptId') continue;
      const images = outputs[nodeId]?.images;
      if (!images) continue;
      for (const img of images) {
        const filename = img._inputFilename || img.filename || img.name;
        if (filename) {
          const safeName = filename.replace(/\//g, '_');
          list.push(`/renders/${safeName}`);
        }
      }
    }
    return list;
  }

  /**
   * Copy all outputs to public renders and return their filenames and URLs.
   */
  async copyAllOutputsToPublic(outputs) {
    const fs = await import('fs/promises');
    const pathMod = await import('path');
    const publicRendersDir = process.env.RENDERS_DIR ||
      require('path').join(process.cwd(), 'public', 'renders');
    await fs.mkdir(publicRendersDir, { recursive: true });

    // Use the shared getGPURouter() helper (handles resolution failures gracefully)
    let comfyUrl = process.env.COMFY_URL || 'http://127.0.0.1:8188';
    let source = 'local';
    try {
      const r = await getGPURouter();
      if (r) {
        const resolved = await r.resolveComfyURL();
        comfyUrl = resolved.url;
        source = resolved.source;
      }
    } catch {
      // fallback to local already set above
    }

    const results = [];
    const COMFY_OUTPUT = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';

    for (const nodeId in outputs) {
      if (nodeId === '_promptId') continue;
      const images = outputs[nodeId]?.images;
      if (!images) continue;
      for (const img of images) {
        const filename = img.filename || img.name;
        if (!filename) continue;

        // Skip ComfyUI temp/preview outputs (PreviewImage node results)
        // ComfyUI marks PreviewImage outputs with type='temp' and ComfyUI_temp_* filenames
        const imgType = img.type || 'output';
        if (imgType === 'temp' || filename.startsWith('ComfyUI_temp_')) {
          console.log(`[comfyBridge] Skipping temp output: ${filename}`);
          continue;
        }

        const subfolder = img.subfolder || '';
        const safeName = filename.replace(/\//g, '_');
        const dest = pathMod.default.join(publicRendersDir, safeName);

        if (source === 'cloud') {
          try {
            const viewUrl = `${comfyUrl}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=output`;
            const res = await fetch(viewUrl, { headers: { 'bypass-tunnel-reminder': 'true' } });
            if (res.ok) {
              const buf = Buffer.from(await res.arrayBuffer());
              await fs.writeFile(dest, buf);
              console.log(`[comfyBridge] Downloaded cloud output: ${filename}`);
            }
          } catch (e) {
            console.warn(`[comfyBridge] Could not download cloud output:`, e.message);
          }
        } else {
          const candidates = [
            pathMod.default.join(COMFY_OUTPUT, subfolder, filename),
            pathMod.default.join(COMFY_OUTPUT, filename),
          ];
          let copied = false;
          for (const src of candidates) {
            try {
              await fs.access(src);
              await fs.copyFile(src, dest);
              copied = true;
              console.log(`[comfyBridge] Copied local output: ${src} -> ${dest}`);
              break;
            } catch { /* try next */ }
          }
          if (!copied) {
            console.warn(`[comfyBridge] Local output file not found for copying: ${filename}`);
          }
        }
        results.push({
          filename: safeName,
          url: `/renders/${safeName}`,
          type: imgType
        });
      }
    }
    console.log(`[comfyBridge] copyAllOutputsToPublic: ${results.length} actual SaveImage outputs copied`);
    return results;
  }

  async submitAndWait(workflow, onProgress) {
    this._activeProgressCallback = onProgress;
    try {
      const outputs = await this._submitStageAndWait(workflow);
      return outputs;
    } finally {
      this._activeProgressCallback = null;
    }
  }

  async getAllOutputUrls(outputs, saveFilename) {
    const copied = await this.copyAllOutputsToPublic(outputs);
    return copied
      .filter(r => !r.filename.startsWith('ComfyUI_temp_'))
      .map(r => r.url);
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
      const project = await AIRun.findById(projectId);
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
    // Guard: skip if we already have a listening server
    if (this.backendServer) {
      console.log('ℹ️ Backend WS server already running, skipping re-bind');
      return;
    }

    const port = Number(this.backendPort);
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

      // FIX: disconnect must be on the individual socket, not on io.
      // Previously on io scope → clients were never removed → memory leak.
      socket.on('disconnect', () => {
        console.log('🔌 Frontend client disconnected:', socket.id);
        this.frontendClients.delete(socket.id);
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is already in use — another instance owns it. Don't cascade.
        console.log(`ℹ️ Port ${port} already in use — reusing existing WS server`);
      }
    });

    server.listen(port, () => {
      console.log(`✅ Backend WS server on port ${port}`);
    });

    this.backendServer = server;
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

    // Gap 4: Block regular jobs while Ultra-Pro is running
    if (this._ultraProRunning) {
      console.log('⏸️ Queue paused — Ultra-Pro pipeline is running');
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
      const activeUrl = await this.getComfyRestUrl();
      try {
        const statsRes = await fetch(`${activeUrl}/system_stats`, {
          headers: { 'bypass-tunnel-reminder': 'true' }
        });
        const stats = await statsRes.json();
        const vramFreeMB = stats.devices[0].vram_free / 1024 / 1024;
        const cloud = await this._isCloud();
        console.log(`VRAM free before job [${cloud ? 'CLOUD ☁️' : 'LOCAL 🖥️'}]: ${vramFreeMB.toFixed(0)}MB`);
        if (vramFreeMB < 500) console.warn('Low VRAM warning - generation may fail');
      } catch (e) {
        console.warn('⚠️ Could not fetch VRAM stats:', e.message);
      }

      // Unload previous model + free VRAM cache before new job
      // (skipped in cloud mode — T4 has 15 GB, localtunnel POST /free times out)
      try {
        const cloud = await this._isCloud();
        if (!cloud) {
          await fetch(`${activeUrl}/free`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'bypass-tunnel-reminder': 'true'
            },
            body: JSON.stringify({ unload_models: true, free_memory: true })
          });
          console.log('🧹 Models unloaded, VRAM freed before job');
          // Give GPU a moment to actually release memory
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (e) {
        console.warn('⚠️ Could not flush VRAM:', e.message);
      }

      // Update project status to processing
      await this.updateProjectResult(job.projectId, null, 'processing');
      
      // Submit workflow to ComfyUI REST API directly
      // (Do NOT wait for WebSocket — polling handles completion)
      const response = await fetch(`${activeUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
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
      this._queueTimer = setTimeout(() => this.processQueue(), 1000);
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
    if (process.env.COMFYUI_ENABLED === 'false') return;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      console.log(`🔄 Reconnecting to ComfyUI in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this._reconnectTimer = setTimeout(() => {
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
   * Gracefully stop the bridge: cancel pending timers and clear callbacks.
   */
  stop() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this._queueTimer) {
      clearTimeout(this._queueTimer);
      this._queueTimer = null;
    }
    this._activeProgressCallback = null;
    console.log('[ComfyBridge] Stopped — timers cleared');
  }

  /**
   * Check if ComfyUI is reachable
   */
  static async checkHealth() {
    try {
      // Use the router's local URL (health check always targets local)
      const localUrl = process.env.COMFY_URL || LOCAL_URL;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${localUrl}/system_stats`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      
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

  // ─── Ultra-Pro Multi-Stage Pipeline ─────────────────────────────────

  /**
   * Execute the 6-stage Ultra-Pro pipeline sequentially.
   * Each stage is submitted as a separate ComfyUI prompt.
   * VRAM is flushed between stages via POST /free.
   *
   * @param {string} projectId - MongoDB project ID
   * @param {object} opts - Pipeline options
   * @param {string} opts.imageFilename - Input image in ComfyUI/input
   * @param {string} opts.roomType - Room type for prompts
   * @param {object} opts.masterSelector - Material/finish selections
   * @param {object} opts.masterToggles - Which elements to change
   * @param {string} [opts.furnitureImage] - BG-removed product image
   * @param {string} [opts.styleReference] - Moodboard/style image
   * @param {number[]} [opts.skipStages] - Stages to skip
   */
  async enqueueUltraProJob(projectId, opts) {
    // Reject if another job is in progress
    if (this.isProcessingQueue || this._ultraProRunning) {
      const msg = 'Another generation is already running. Please wait.';
      console.warn('⚠️', msg);
      this.notifyFrontend('comfy:ultrapro:error', { projectId, error: msg });
      return { success: false, error: msg };
    }

    this._ultraProRunning = true;  // Acquire mutex

    const {
      buildStage1, buildStableStage1, buildStage2, buildStage3,
      buildStage4, buildStage5, buildStage6,
    } = await import('../workflows/ultraProBuilder.js');

    const {
      imageFilename, roomType, masterSelector, masterToggles,
      furnitureImage, styleReference, skipStages = [],
      structuralLock = {},    // ProfessionalSelector structural lock params
      encoderV2 = {},         // ArchAi3D Encoder V2 (contextStrength, userTextStrength)
      useLegacyStage1 = false, // Set true to use CLIPSeg-based buildStage1
    } = opts;

    const skip = new Set(skipStages);
    const stageOutputs = {};      // { stage1: { wall_mask: 'wall_mask_00001_.png', ... } }
    const timings = {};
    // Count active stages: 1(scene) + 2(geom) + 3(inpaint) + optional 4(furniture) + optional 5(refine) + optional 6(upscale)
    const TOTAL_STAGES = [1,2,3,4,5,6].filter(s => !skip.has(s)).length;

    // Update project to processing
    await this.updateProjectResult(projectId, null, 'processing');
    this.notifyFrontend('comfy:ultrapro:start', { projectId, totalStages: TOTAL_STAGES });

    try {
      // ═══ STAGE 1: Scene Understanding ═══
      if (!skip.has(1)) {
        const t0 = Date.now();
        const stage1Name = useLegacyStage1 ? 'Scene Understanding (CLIPSeg+DINO)' : 'Scene Understanding (Stable DINO+SAM2)';
        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 1, name: stage1Name, status: 'running' });

        // Use stable (pure GroundingDINO+SAM2) by default, legacy CLIPSeg version via flag
        const workflow1 = useLegacyStage1
          ? buildStage1(imageFilename, { roomType })
          : buildStableStage1(imageFilename, { roomType });
        const outputs1 = await this._submitStageAndWait(workflow1);
        await this._copyOutputsToInput(outputs1);
        stageOutputs.stage1 = this._extractFilenames(outputs1, 'stage1/');
        timings.stage1 = Date.now() - t0;

        // Fix A.1.7: abort early if SAM2 produced an empty wall_mask
        await this._validateMaskNonBlack(stageOutputs.stage1.wall_mask);

        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 1, status: 'done', ms: timings.stage1 });
        await this._flushVRAM();
      }

      // ═══ STAGE 2: Geometry Locking ═══
      if (!skip.has(2)) {
        const t0 = Date.now();
        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 2, name: 'Geometry Locking', status: 'running' });

        const depthMap = stageOutputs.stage1?.depth_map || 'depth_map_00001_.png';
        // Pass structuralLock + encoderV2 so ProfessionalSelector settings reach the workflow
        const workflow2 = buildStage2(imageFilename, depthMap, { masterSelector, masterToggles, roomType, structuralLock, encoderV2 });
        const outputs2 = await this._submitStageAndWait(workflow2);
        await this._copyOutputsToInput(outputs2);
        stageOutputs.stage2 = this._extractFilenames(outputs2, 'stage2/');
        timings.stage2 = Date.now() - t0;

        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 2, status: 'done', ms: timings.stage2 });
        await this._flushVRAM();
      }

      // Build prompts once — used by Stage 3 (inpainting) AND Stage 4 (furniture placement)
      const wallColor = masterSelector.wallColor || 'neutral';
      const wallPrompt = masterToggles?.walls
        ? `interior wall painted ${wallColor}, smooth matte finish, solid even color, professional paint job, photorealistic`
        : 'original wall, clean surface, photorealistic';
      const furniturePrompt = masterToggles?.furniture
        ? `${masterSelector.furnitureStyle} furniture, high quality materials, professional interior design, detailed texture, photorealistic rendering, clean and organized`
        : 'original furniture, clean, organized';

      // ═══ STAGE 3: Regional Inpainting ═══
      if (!skip.has(3)) {
        const t0 = Date.now();
        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 3, name: 'Regional Inpainting', status: 'running' });

        const redesigned = stageOutputs.stage2?.redesigned || 'redesigned_00001_.png';
        const wallMask   = stageOutputs.stage1?.wall_mask || 'wall_mask_00001_.png';
        const objectMask = stageOutputs.stage1?.object_mask || 'object_mask_00001_.png';

        const workflow3 = buildStage3(redesigned, wallMask, objectMask, { wallPrompt, furniturePrompt, masterToggles });
        const outputs3 = await this._submitStageAndWait(workflow3);
        await this._copyOutputsToInput(outputs3);
        stageOutputs.stage3 = this._extractFilenames(outputs3, 'stage3/');
        timings.stage3 = Date.now() - t0;

        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 3, status: 'done', ms: timings.stage3 });
        await this._flushVRAM();
      }

      // ═══ STAGE 4: IPAdapter Furniture (optional) ═══
      let prevImage = stageOutputs.stage3?.regional_inpainted || 'regional_inpainted_00001_.png';

      if (!skip.has(4) && furnitureImage) {
        const t0 = Date.now();
        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 4, name: 'Furniture Placement', status: 'running' });

        const objectMask = stageOutputs.stage1?.object_mask || 'object_mask_00001_.png';
        const depthMap = stageOutputs.stage1?.depth_map || 'depth_map_00001_.png';
        const styleRef = styleReference || imageFilename;

        const workflow4 = buildStage4(prevImage, styleRef, furnitureImage, objectMask, depthMap, furniturePrompt);
        const outputs4 = await this._submitStageAndWait(workflow4);
        await this._copyOutputsToInput(outputs4);
        stageOutputs.stage4 = this._extractFilenames(outputs4, 'stage4/');
        prevImage = stageOutputs.stage4?.furniture_placed || 'furniture_placed_00001_.png';
        timings.stage4 = Date.now() - t0;

        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 4, status: 'done', ms: timings.stage4 });
        await this._flushVRAM();
      }

      // ═══ STAGE 5: Iterative Refinement ═══
      let refinedImage = prevImage;

      if (!skip.has(5)) {
        const t0 = Date.now();
        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 5, name: 'Detail Refinement', status: 'running' });

        const wallMask   = stageOutputs.stage1?.wall_mask || 'wall_mask_00001_.png';
        const objectMask = stageOutputs.stage1?.object_mask || 'object_mask_00001_.png';

        const workflow5 = buildStage5(prevImage, wallMask, objectMask);
        const outputs5 = await this._submitStageAndWait(workflow5);
        await this._copyOutputsToInput(outputs5);
        stageOutputs.stage5 = this._extractFilenames(outputs5, 'stage5/');
        refinedImage = stageOutputs.stage5?.refined || stageOutputs.stage5?._last || prevImage;
        timings.stage5 = Date.now() - t0;

        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 5, status: 'done', ms: timings.stage5 });
        await this._flushVRAM();
      }

      // ═══ STAGE 6: 4× Upscale + Sharpen ═══
      if (!skip.has(6)) {
        const t0 = Date.now();
        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 6, name: '4× Upscale', status: 'running' });

        const workflow6 = buildStage6(refinedImage);
        const outputs6 = await this._submitStageAndWait(workflow6);
        await this._copyOutputsToInput(outputs6);
        stageOutputs.stage6 = this._extractFilenames(outputs6, 'stage6_final/');
        timings.stage6 = Date.now() - t0;

        this.notifyFrontend('comfy:ultrapro:stage', { projectId, stage: 6, status: 'done', ms: timings.stage6 });
        await this._flushVRAM(); // Flush after final stage
      }

      // ═══ FINAL: Copy result to public/renders + update MongoDB ═══
      // Priority: stage6 upscale → stage5 refined → stage4/3 inpainted (whichever ran last)
      const finalFilename =
        stageOutputs.stage6?.ultra_hd_result
        || stageOutputs.stage6?._last
        || stageOutputs.stage5?.refined
        || stageOutputs.stage5?._last
        || refinedImage
        || prevImage;

      const fs = await import('fs/promises');
      const path = await import('path');
      const outputDir = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
      const inputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';

      // Try multiple locations: output subfolder, flat in output, or input dir
      let srcPath = null;
      const candidates = [
        path.join(outputDir, 'stage6_final', finalFilename),  // stage6_final/ultra_hd_result_00001_.png
        path.join(outputDir, finalFilename),                   // flat in output/
        path.join(inputDir, finalFilename),                    // copied to input/
      ];
      for (const candidate of candidates) {
        try {
          await fs.access(candidate);
          srcPath = candidate;
          break;
        } catch { /* try next */ }
      }

      const publicRendersDir = process.env.RENDERS_DIR ||
        require('path').join(process.cwd(), 'public', 'renders');
      const safeName = finalFilename.replace(/\//g, '_');
      const dest = require('path').join(publicRendersDir, safeName);
      await fs.mkdir(publicRendersDir, { recursive: true });

      try {
        if (srcPath) {
          await fs.copyFile(srcPath, dest);
          console.log(`📋 Final image copied from: ${srcPath}`);
        } else {
          console.warn(`⚠️ Final image not found in any location: ${finalFilename}`);
        }
      } catch (copyErr) {
        console.warn('⚠️ Could not copy final image:', copyErr.message);
      }

      const imageUrl = `/renders/${finalFilename.replace(/\//g, '_')}`;
      await AIRun.findByIdAndUpdate(projectId, {
        resultImage: imageUrl,
        status: 'completed',
        processingCompletedAt: new Date(),
      });

      this.notifyFrontend('comfy:ultrapro:done', {
        projectId,
        imageUrl,
        filename: finalFilename,
        timings,
        totalMs: Object.values(timings).reduce((a, b) => a + b, 0),
      });

      console.log(`🎉 Ultra-Pro pipeline complete: ${finalFilename}`);
      return { success: true, imageUrl, timings };

    } catch (error) {
      console.error('❌ Ultra-Pro pipeline failed:', error.message);
      await AIRun.findByIdAndUpdate(projectId, {
        status: 'failed',
        errorMessage: `Ultra-Pro pipeline error: ${error.message}`,
        processingCompletedAt: new Date(),
      });
      this.notifyFrontend('comfy:ultrapro:error', { projectId, error: error.message });
      return { success: false, error: error.message };
    } finally {
      await this._flushVRAM();
      if (global.gc) {
        global.gc();
        console.log('[ComfyBridge] GC triggered');
      }
      this._ultraProRunning = false;  // Release mutex
      // Resume regular queue if jobs are pending
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 2000);
      }
    }
  }

  // ─── Tab-Specific Single-Stage Job ──────────────────────────────────

  /**
   * Execute a single-tab workflow (Render / Edit / Furnish / Lighting / Post-process).
   * Unlike enqueueUltraProJob, this submits a single ComfyUI prompt and polls for completion.
   *
   * @param {string} projectId - MongoDB project ID
   * @param {'render'|'edit'|'furnish'|'lighting'|'postprocess'} tab - Which tab workflow
   * @param {object} opts - Tab-specific options passed to the workflow builder
   * @returns {Promise<{success: boolean, imageUrl?: string, error?: string}>}
   */
  async enqueueTabJob(projectId, tab, opts) {
    // If called from enqueueSmartTabJob, mutex is already held — skip re-acquisition
    if (!opts._skipMutex) {
      // Wait for mutex if another generation is running (max 5 min)
      const maxWait = 300_000; // 5 minutes
      const pollInterval = 3_000; // 3 seconds
      let waited = 0;
      while (this._ultraProRunning && waited < maxWait) {
        console.log(`⏳ Tab ${tab} waiting for mutex (${Math.round(waited/1000)}s)...`);
        await new Promise(r => setTimeout(r, pollInterval));
        waited += pollInterval;
      }
      if (this._ultraProRunning) {
        const msg = 'Pipeline busy for too long. Please try again.';
        this.notifyFrontend('comfy:tab:error', { projectId, tab, error: msg });
        return { success: false, error: msg };
      }

      this._ultraProRunning = true;  // Acquire mutex (shared with Ultra-Pro)
    }

    try {
      // Import all workflow builders
      const {
        buildRenderWorkflow, buildEditWorkflow, buildFurnishWorkflow,
        buildLightingWorkflow, buildPostProcessWorkflow,
        buildAutoEditWorkflow, buildEmptyRoomWorkflow, buildPointEditWorkflow,
        buildInteriorRenderWorkflow, buildExteriorRenderWorkflow, buildLandscapeWorkflow,
        buildStyleTransferWorkflow, buildCollageWorkflow,
        buildBackgroundWorkflow, buildViewExtenderWorkflow, buildLineartWorkflow,
      } = await import('../workflows/ultraProBuilder.js');

      // Build the workflow for the requested tab/tool
      let workflow;
      const tabName = {
        render: 'Render', edit: 'Edit', furnish: 'Furnish',
        lighting: 'Lighting', postprocess: 'Post-Process',
        'auto-edit': 'Auto Edit', 'empty-room': 'Empty Room', 'point-edit': 'Point & Edit',
        'interior-render': 'Interior Render', 'exterior-render': 'Exterior Render',
        landscape: 'Landscape', 'style-transfer': 'Style Transfer',
        collage: 'Collage', background: 'Background',
        'view-extend': 'View Extend', lineart: 'Lineart',
      }[tab] || tab;

      switch (tab) {
        case 'render':
          workflow = buildRenderWorkflow(opts.imageFilename, opts);
          break;
        case 'edit':
          workflow = buildEditWorkflow(opts.imageFilename, opts.maskFilename, opts);
          break;
        case 'furnish':
          workflow = buildFurnishWorkflow(
            opts.imageFilename, opts.furnitureImage,
            opts.emptyMask || null, opts.depthMap || null, opts
          );
          break;
        case 'lighting':
          workflow = buildLightingWorkflow(opts.imageFilename, opts);
          break;
        case 'postprocess':
          workflow = buildPostProcessWorkflow(opts.imageFilename, opts);
          break;
        // ─── New tools ──────────────────────────────────────────
        case 'auto-edit':
          workflow = buildAutoEditWorkflow(opts.imageFilename, opts);
          break;
        case 'empty-room':
          workflow = buildEmptyRoomWorkflow(opts.imageFilename, opts);
          break;
        case 'point-edit':
          workflow = buildPointEditWorkflow(opts.imageFilename, opts.maskFilename, opts);
          break;
        case 'interior-render':
          workflow = buildInteriorRenderWorkflow(opts.imageFilename, opts);
          break;
        case 'exterior-render':
          workflow = buildExteriorRenderWorkflow(opts.imageFilename, opts);
          break;
        case 'landscape':
          workflow = buildLandscapeWorkflow(opts.imageFilename, opts);
          break;
        case 'style-transfer':
          workflow = buildStyleTransferWorkflow(opts.imageFilename, opts.referenceImage, opts);
          break;
        case 'collage':
          workflow = buildCollageWorkflow(opts.imageFilename, opts.referenceImages || [], opts);
          break;
        case 'background':
          workflow = buildBackgroundWorkflow(opts.imageFilename, opts);
          break;
        case 'view-extend':
          workflow = buildViewExtenderWorkflow(opts.imageFilename, opts);
          break;
        case 'lineart':
          workflow = buildLineartWorkflow(opts.imageFilename, opts);
          break;
        default:
          throw new Error(`Unknown tab: ${tab}`);
      }

      // Update project status
      await this.updateProjectResult(projectId, null, 'processing');
      this.notifyFrontend('comfy:tab:start', { projectId, tab, name: tabName });

      // Flush VRAM + submit
      const t0 = Date.now();
      const outputs = await this._submitStageAndWait(workflow);
      const elapsed = Date.now() - t0;

      // Copy output to input (for chaining) + extract filenames
      // New tools use tool_<name>/result prefix; legacy tabs use tab_<name>/
      const prefix = tab.startsWith('auto-') || tab === 'empty-room' || tab === 'point-edit' ||
        tab === 'interior-render' || tab === 'exterior-render' || tab === 'landscape' ||
        tab === 'style-transfer' || tab === 'collage' || tab === 'background' ||
        tab === 'view-extend' || tab === 'lineart'
        ? `tool_${tab.replace(/-/g, '_')}/` : `tab_${tab}/`;
      await this._copyOutputsToInput(outputs);
      const filenames = this._extractFilenames(outputs, prefix);

      // Find the final output image
      const finalFilename = filenames.result || filenames._last;

      // Copy result to public/renders
      const fs = await import('fs/promises');
      const path = await import('path');
      const outputDir = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
      const inputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';

      let srcPath = null;
      const candidates = [
        path.join(outputDir, prefix, finalFilename),
        path.join(outputDir, `tab_${tab}`, finalFilename),
        path.join(outputDir, finalFilename),
        path.join(inputDir, finalFilename),
      ];
      for (const candidate of candidates) {
        try {
          await fs.access(candidate);
          srcPath = candidate;
          break;
        } catch { /* try next */ }
      }

      const publicRendersDir = process.env.RENDERS_DIR ||
        require('path').join(process.cwd(), 'public', 'renders');
      const safeName = (finalFilename || `${tab}_result_${Date.now()}.png`).replace(/\//g, '_');
      const dest = require('path').join(publicRendersDir, safeName);
      await fs.mkdir(publicRendersDir, { recursive: true });

      if (srcPath) {
        await fs.copyFile(srcPath, dest);
        console.log(`📋 Tab ${tab} result copied: ${srcPath}`);
      } else {
        console.warn(`⚠️ Tab ${tab} output not found: ${finalFilename}`);
      }

      const imageUrl = `/renders/${safeName}`;
      await AIRun.findByIdAndUpdate(projectId, {
        resultImage: imageUrl,
        status: 'completed',
        processingCompletedAt: new Date(),
      });

      this.notifyFrontend('comfy:tab:done', {
        projectId, tab, name: tabName,
        imageUrl, filename: finalFilename,
        ms: elapsed,
      });

      console.log(`🎉 Tab ${tab} complete: ${finalFilename} (${(elapsed / 1000).toFixed(1)}s)`);
      return { success: true, imageUrl, ms: elapsed };

    } catch (error) {
      console.error(`❌ Tab ${tab} failed:`, error.message);
      await AIRun.findByIdAndUpdate(projectId, {
        status: 'failed',
        errorMessage: `Tab ${tab} error: ${error.message}`,
        processingCompletedAt: new Date(),
      });
      this.notifyFrontend('comfy:tab:error', { projectId, tab, error: error.message });
      return { success: false, error: error.message };
    } finally {
      await this._flushVRAM();
      if (global.gc) {
        global.gc();
        console.log('[ComfyBridge] GC triggered');
      }
      this._ultraProRunning = false;  // Release mutex
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 2000);
      }
    }
  }

  // ─── Smart Tab Job: Stage 1 + Tab Workflow ───────────────────────────

  /**
   * Execute a tab workflow with automatic Stage 1 scene understanding.
   *
   * For tabs that benefit from masks (render, furnish, edit, empty-room, auto-edit),
   * this method first runs buildStableStage1() to produce:
   *   - wall_mask, floor_mask, ceiling_mask, object_mask, empty_mask, depth_map
   * Then feeds those masks into the tab workflow as opts.
   *
   * For tabs that don't need masks (lighting, postprocess, lineart, etc.),
   * this falls through to the standard enqueueTabJob.
   *
   * @param {string} projectId - MongoDB project ID
   * @param {string} tab - Tab type (render, edit, furnish, etc.)
   * @param {object} opts - Tab-specific options
   * @param {string} opts.imageFilename - Input image in ComfyUI/input/
   * @param {string} [opts.roomType] - Room type for GroundingDINO prompts
   * @param {boolean} [opts.skipSceneAnalysis=false] - Skip Stage 1 if masks already provided
   * @returns {Promise<{success: boolean, imageUrl?: string, sceneOutputs?: object, error?: string}>}
   */
  async enqueueSmartTabJob(projectId, tab, opts) {
    // Tabs that benefit from pre-computed masks
    const MASK_TABS = new Set(['render', 'furnish', 'edit', 'empty-room', 'auto-edit', 'interior-render']);

    // Skip scene analysis if:
    // 1. Tab doesn't need masks, OR
    // 2. User explicitly opted out, OR
    // 3. Masks are already provided in opts
    const hasMasks = opts.wallMask && opts.objectMask && opts.depthMap;
    if (!MASK_TABS.has(tab) || opts.skipSceneAnalysis || hasMasks) {
      // Standard single-shot tab job
      return this.enqueueTabJob(projectId, tab, opts);
    }

    // ── Phase 1: Run Stable Stage 1 ──────────────────────────────────
    // Acquire mutex early (shared with Ultra-Pro and standard tab jobs)
    const maxWait = 300_000;
    const pollInterval = 3_000;
    let waited = 0;
    while (this._ultraProRunning && waited < maxWait) {
      console.log(`⏳ SmartTab ${tab} waiting for mutex (${Math.round(waited/1000)}s)...`);
      await new Promise(r => setTimeout(r, pollInterval));
      waited += pollInterval;
    }
    if (this._ultraProRunning) {
      const msg = 'Pipeline busy for too long. Please try again.';
      this.notifyFrontend('comfy:tab:error', { projectId, tab, error: msg });
      return { success: false, error: msg };
    }

    this._ultraProRunning = true;

    try {
      const { buildStableStage1 } = await import('../workflows/ultraProBuilder.js');

      // ── Phase 1: Scene Understanding ─────────────────────────────
      this.notifyFrontend('comfy:tab:start', {
        projectId, tab,
        name: `Scene Analysis → ${tab.charAt(0).toUpperCase() + tab.slice(1)}`,
        phase: 'scene_understanding',
      });

      const t0 = Date.now();
      const sceneWorkflow = buildStableStage1(opts.imageFilename, { roomType: opts.roomType || 'general' });
      const sceneOutputs = await this._submitStageAndWait(sceneWorkflow);
      await this._copyOutputsToInput(sceneOutputs);
      const sceneMasks = this._extractFilenames(sceneOutputs, 'stage1/');
      const sceneMs = Date.now() - t0;

      console.log(`🔍 Scene analysis complete (${(sceneMs/1000).toFixed(1)}s):`, Object.keys(sceneMasks));
      this.notifyFrontend('comfy:tab:scene_done', {
        projectId, tab, ms: sceneMs,
        masks: Object.keys(sceneMasks),
      });

      // Flush VRAM between Stage 1 and tab workflow
      await this._flushVRAM();

      // ── Phase 2: Inject masks into tab opts ──────────────────────
      // Enrich opts with Stage 1 outputs so tab workflows can use them
      const enrichedOpts = {
        ...opts,
        // Mask filenames (flat, in ComfyUI/input/)
        wallMask: sceneMasks.wall_mask || null,
        floorMask: sceneMasks.floor_mask || null,
        ceilingMask: sceneMasks.ceiling_mask || null,
        objectMask: sceneMasks.object_mask || null,
        emptyMask: sceneMasks.empty_mask || null,
        depthMap: sceneMasks.depth_map || null,
        // Flag so tab builders know masks are pre-computed
        _hasSceneMasks: true,
        // Skip mutex re-acquisition — we already hold it from Phase 1
        _skipMutex: true,
      };

      // DO NOT release the mutex here — enqueueTabJob will release it in its finally block.
      // Releasing early would create a race window where another job could start.

      // ── Phase 2: Run tab workflow with enriched opts ──────────────
      const tabResult = await this.enqueueTabJob(projectId, tab, enrichedOpts);

      return {
        ...tabResult,
        sceneOutputs: sceneMasks,
        sceneMs,
      };

    } catch (error) {
      console.error(`❌ SmartTab ${tab} failed:`, error.message);
      await AIRun.findByIdAndUpdate(projectId, {
        status: 'failed',
        errorMessage: `SmartTab ${tab} error: ${error.message}`,
        processingCompletedAt: new Date(),
      });
      this.notifyFrontend('comfy:tab:error', { projectId, tab, error: error.message });
      return { success: false, error: error.message };
    } finally {
      this._ultraProRunning = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 2000);
      }
    }
  }

  // ─── Internal Helpers for Ultra-Pro ─────────────────────────────────

  /**
   * Submit a single stage workflow and poll until completion.
   * Returns the outputs object from ComfyUI history.
   */
  async _submitStageAndWait(workflow) {
    // Fix B.2: count SaveImage nodes up-front for strict output validation
    const saveImageNodeIds = Object.entries(workflow)
      .filter(([, node]) => node?.class_type === 'SaveImage')
      .map(([id]) => id);
    const expectedSaveCount = saveImageNodeIds.length;

    // Flush VRAM before submission
    await this._flushVRAM();

    const comfyUrl = await this.getComfyRestUrl();
    const res = await fetch(`${comfyUrl}/prompt`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true'
      },
      body: JSON.stringify({ prompt: workflow }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ComfyUI HTTP ${res.status}: ${text}`);
    }

    // Fix A.1.1/D.3: check for node_errors / top-level error before polling
    const submitResult = await res.json();
    if (submitResult.error) {
      throw new Error(`ComfyUI rejected prompt: ${JSON.stringify(submitResult.error)}`);
    }
    if (submitResult.node_errors && Object.keys(submitResult.node_errors).length > 0) {
      throw new Error(`ComfyUI node_errors: ${JSON.stringify(submitResult.node_errors)}`);
    }
    const prompt_id = submitResult.prompt_id;
    if (!prompt_id) throw new Error('ComfyUI did not return a prompt_id');
    console.log(`📤 Stage submitted: ${prompt_id}`);

    // Poll for completion (respect timeout env var, default 5 mins)
    const timeoutMs = process.env.COMFY_STAGE_TIMEOUT_MS
      ? parseInt(process.env.COMFY_STAGE_TIMEOUT_MS, 10)
      : 300_000;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const histRes = await fetch(`${comfyUrl}/history/${prompt_id}`, {
          headers: { 'bypass-tunnel-reminder': 'true' }
        });
        const history = await histRes.json();
        const entry = history[prompt_id];
        if (!entry) continue;

        // Check for error — surface the actual ComfyUI detail
        const execError = (entry.status?.messages || []).find(m => m[0] === 'execution_error');
        if (entry.status?.status_str === 'error' || execError) {
          const detail = execError ? JSON.stringify(execError[1]) : entry.status?.status_str;
          throw new Error(`ComfyUI execution error: ${detail}`);
        }

        // Fix B.2: strict SaveImage count check
        const outputs = entry.outputs || {};
        const presentNodeIds = Object.keys(outputs).filter(id => outputs[id]?.images?.length > 0);
        if (presentNodeIds.length > 0) {
          if (expectedSaveCount > 0 && presentNodeIds.length < expectedSaveCount) {
            const missing = saveImageNodeIds.filter(id => !presentNodeIds.includes(id));
            const err = new Error(
              `COMFY_PARTIAL_EXECUTION: expected ${expectedSaveCount} SaveImage outputs, got ${presentNodeIds.length}. ` +
              `Present: [${presentNodeIds.join(', ')}]. Missing: [${missing.join(', ')}].`
            );
            err.code = 'COMFY_PARTIAL_EXECUTION';
            err.presentNodes = presentNodeIds;
            err.missingNodes = missing;
            throw err;
          }
          console.log(`✅ Stage completed: ${prompt_id}`);
          outputs._promptId = prompt_id;
          return outputs;
        }
      } catch (err) {
        if (err.message.includes('execution error')) throw err;
        console.warn(`⚠️ Poll error: ${err.message}`);
      }
    }

    throw new Error('Stage timed out after 6 minutes');
  }

  /**
   * Flush GPU VRAM between stages via POST /free.
   * In cloud mode (Colab T4 = 15 GB) we skip the flush because:
   *  1. The T4 has enough VRAM for back-to-back SDXL stages.
   *  2. Localtunnel POST /free reliably times out, breaking the pipeline.
   */
  async _flushVRAM() {
    const isCloud = await this._isCloud();
    if (isCloud) {
      // Skip flush in cloud mode — T4 has ample VRAM
      await new Promise(r => setTimeout(r, 500)); // small courtesy delay
      return;
    }
    try {
      const comfyUrl = await this.getComfyRestUrl();
      await fetch(`${comfyUrl}/free`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ unload_models: true, free_memory: true }),
      });
      await new Promise(r => setTimeout(r, 2000));
      console.log('[ComfyBridge] VRAM flushed');
    } catch (e) {
      console.warn('⚠️ VRAM flush failed:', e.message);
    }
  }

  /**
   * Copy stage output images from ComfyUI/output/ to ComfyUI/input/
   * so that subsequent stages' LoadImage nodes can find them.
   * ComfyUI's LoadImage only searches the input/ directory.
   */
  async _copyOutputsToInput(outputs) {
    const isCloud = await this._isCloud();

    if (isCloud) {
      // Cloud mode: re-upload each output image back to the remote ComfyUI input dir
      const baseUrl = await this.getComfyRestUrl();
      const adapter = await this._cloudAdapter();
      await adapter.copyOutputsToRemoteInput(outputs, baseUrl);
      return;
    }

    // Local mode: copy files on disk
    const fs = await import('fs/promises');
    const path = await import('path');
    const outputDir = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
    const inputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';

    for (const nodeId in outputs) {
      const images = outputs[nodeId]?.images;
      if (!images) continue;
      for (const img of images) {
        const filename = img.filename || img.name;
        if (!filename) continue;
        const subfolder = img.subfolder || '';
        const src = path.join(outputDir, subfolder, filename);
        // Flatten subfolder paths: "stage1/wall_mask_00001_.png" → "wall_mask_00001_.png"
        const flatName = filename.includes('/') ? filename.split('/').pop() : filename;
        const dest = path.join(inputDir, flatName);
        try {
          await fs.copyFile(src, dest);
          console.log(`📋 Copied to input: ${filename} → ${flatName}`);
          // IMPORTANT: Update the img record so downstream stages reference
          // the flat filename (which is what LoadImage will find in input/)
          img._inputFilename = flatName;
        } catch (err) {
          console.warn(`⚠️ Could not copy ${filename} to input: ${err.message}`);
        }
      }
    }
  }

  /**
   * Fix A.1.7: Validate that a mask image is not all-black (empty SEGS).
   * Uses sharp to sum greyscale pixel values. Throws if sum < threshold.
   */
  async _validateMaskNonBlack(filename, threshold = 100) {
    if (!filename) return;
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const sharp = (await import('sharp')).default;
      const inputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
      const outputDir = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
      let filePath = path.join(inputDir, filename);
      try { await fs.access(filePath); } catch { filePath = path.join(outputDir, filename); }
      const { data } = await sharp(filePath).greyscale().raw().toBuffer({ resolveWithObject: true });
      const sum = data.reduce((s, v) => s + v, 0);
      if (sum < threshold) {
        throw new Error(
          `EMPTY_SEGS: wall_mask is all-black (pixel sum=${sum}). ` +
          `GroundingDINO/SAM2 found no walls — check confidence threshold or roomType prompt.`
        );
      }
      console.log(`✅ wall_mask valid (pixel sum=${sum})`);
    } catch (err) {
      if (err.message.startsWith('EMPTY_SEGS')) throw err;
      console.warn(`⚠️ Could not validate wall_mask (${filename}): ${err.message}`);
    }
  }

  /**
   * Extract output filenames from ComfyUI history outputs.
   * Maps "stage1/wall_mask_00001_.png" → { wall_mask: "wall_mask_00001_.png" }
   * Uses the flat input filename (copied by _copyOutputsToInput) so LoadImage
   * nodes in subsequent stages can actually find them.
   */
  _extractFilenames(outputs, prefix) {
    const result = {};
    for (const nodeId in outputs) {
      const images = outputs[nodeId]?.images;
      if (!images) continue;
      for (const img of images) {
        const origFilename = img.filename || img.name;
        if (!origFilename) continue;
        // Prefer the flat input filename (set by _copyOutputsToInput)
        // so LoadImage nodes in later stages can find it in ComfyUI/input/
        const usableFilename = img._inputFilename || origFilename;
        const key = origFilename
          .replace(prefix, '')
          .replace(/_\d+_?\.\w+$/, '')
          .trim();
        if (key) result[key] = usableFilename;
        result._last = usableFilename;
      }
    }
    return result;
  }
}

/**
 * Transfers a file from ComfyUI output to ComfyUI input.
 */
export async function transferComfyFile({
  sourceFilename,
  sourceSubfolder,
  destFilename,
  logPrefix = '[ComfyTransfer]',
}) {
  const r = await getGPURouter();
  const { url: comfyUrl, source } = await r.resolveComfyURL();
  const fs = await import('fs');
  const path = await import('path');

  if (source === 'local') {
    const COMFYUI_OUTPUT = process.env.COMFYUI_OUTPUT_DIR
      || process.env.COMFY_OUTPUT
      || '/home/nikhil/Documents/Remo2/ComfyUI/output';
    const COMFYUI_INPUT = process.env.COMFYUI_INPUT_DIR
      || process.env.COMFY_INPUT
      || '/home/nikhil/Documents/Remo2/ComfyUI/input';

    const srcPath = path.join(
      COMFYUI_OUTPUT, sourceSubfolder, sourceFilename
    );
    const dstPath = path.join(COMFYUI_INPUT, destFilename);

    if (!fs.existsSync(srcPath)) {
      throw new Error(
        `${logPrefix} Source file not found: ${srcPath}`
      );
    }

    fs.copyFileSync(srcPath, dstPath);
    console.log(`${logPrefix} Local copy: ${srcPath} → ${dstPath}`);

  } else {
    // Cloud: download from ComfyUI /view then upload to /upload/image
    const viewUrl = `${comfyUrl}/view`
      + `?filename=${encodeURIComponent(sourceFilename)}`
      + `&subfolder=${encodeURIComponent(sourceSubfolder)}`
      + `&type=output`;

    console.log(`${logPrefix} Downloading from cloud: ${viewUrl}`);

    const downloadRes = await fetch(viewUrl, {
      headers: { 'bypass-tunnel-reminder': 'true' },
    });

    if (!downloadRes.ok) {
      throw new Error(
        `${logPrefix} Download failed (${downloadRes.status}): ${viewUrl}`
      );
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    console.log(
      `${logPrefix} Downloaded ${imageBuffer.length} bytes`
    );

    // Upload to ComfyUI input using Node's global FormData/Blob
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', blob, destFilename);
    formData.append('type', 'input');
    formData.append('overwrite', 'true');

    const uploadRes = await fetch(`${comfyUrl}/upload/image`, {
      method: 'POST',
      headers: { 'bypass-tunnel-reminder': 'true' },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(
        `${logPrefix} Upload failed (${uploadRes.status}): ${errText}`
      );
    }

    console.log(`${logPrefix} Cloud transfer complete: ${destFilename}`);
  }

  return destFilename;
}

/**
 * Ensures that an input file exists in the active ComfyUI input directory.
 * If running on cloud, and the file is only available locally on the server
 * (e.g. in public/uploads/ or ComfyUI/input/), it uploads the file to the cloud instance.
 */
export async function ensureInputFile({
  filename,
  logPrefix = '[ComfyEnsureInput]',
}) {
  const r = await getGPURouter();
  const { url: comfyUrl, source } = await r.resolveComfyURL();
  const fs = await import('fs');
  const path = await import('path');

  if (source === 'local') {
    console.log(`${logPrefix} Local mode: assuming file exists in local input folder: ${filename}`);
    return filename;
  }

  // Cloud mode: check if it needs to be uploaded
  const localPaths = [
    path.join(process.cwd(), 'public', 'uploads', filename),
    path.join(process.cwd(), 'public', 'uploads', filename.replace(/\.png$/, '.jpg')),
    path.join(process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input', filename),
  ];

  let foundPath = null;
  for (const p of localPaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (!foundPath) {
    console.warn(`${logPrefix} Local source not found for ${filename}, cannot ensure upload to cloud`);
    return filename;
  }

  console.log(`${logPrefix} Uploading local source ${foundPath} to cloud ComfyUI`);
  const imageBuffer = fs.readFileSync(foundPath);
  
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('image', blob, filename);
  formData.append('type', 'input');
  formData.append('overwrite', 'true');

  const uploadRes = await fetch(`${comfyUrl}/upload/image`, {
    method: 'POST',
    headers: { 'bypass-tunnel-reminder': 'true' },
    body: formData,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(
      `${logPrefix} Upload failed (${uploadRes.status}): ${errText}`
    );
  }

  console.log(`${logPrefix} Cloud upload complete for: ${filename}`);
  return filename;
}

// Singleton instance — use Node.js `global` to survive Turbopack/HMR re-imports.
// `globalThis` may differ across Turbopack compilation contexts, but `global`
// is guaranteed to be the same object across all modules in the same process.
const comfyBridgeService =
  global.__comfyBridgeInstance ||
  (global.__comfyBridgeInstance = new ComfyBridgeService());

export default comfyBridgeService;
