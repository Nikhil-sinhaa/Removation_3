'use client';

/**
 * useUltraProSocket — Socket.IO hook for Ultra-Pro pipeline progress.
 *
 * Connects to the ComfyBridge backend WebSocket server (port 3001)
 * and listens for `comfy:ultrapro:*` events.
 *
 * On `comfy:ultrapro:done`:
 *   1. Sets the result image in the editor store
 *   2. Auto-triggers Vastu analysis (Gap 2 fix)
 *   3. Auto-triggers cost estimation (Gap 3 fix)
 *
 * Usage: call useUltraProSocket() once in the main editor layout component.
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useEditorStore } from '@/stores/editor-store';

// ─── Types for Socket.IO events ──────────────────────────────────────

interface UltraProStageEvent {
  projectId: string;
  stage: number;
  name?: string;
  status: 'running' | 'done';
  ms?: number;
}

interface UltraProDoneEvent {
  projectId: string;
  imageUrl: string;
  filename: string;
  timings: Record<string, number>;
  totalMs: number;
}

interface UltraProErrorEvent {
  projectId: string;
  error: string;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useUltraProSocket() {
  const socketRef = useRef<Socket | null>(null);

  // Zustand actions — use store.getState() for stable references
  const store = useEditorStore;

  const handleStage = useCallback((data: UltraProStageEvent) => {
    console.log(`🔄 Ultra-Pro Stage ${data.stage}: ${data.status}`, data.name);

    // Map 5 pipeline stages → 0–100% progress
    const progressMap: Record<number, number> = {
      1: 15, 2: 35, 3: 55, 4: 75, 5: 90, 6: 100,
    };
    const pct = data.status === 'done'
      ? (progressMap[data.stage] ?? 50)
      : (progressMap[data.stage] ?? 50) - 10;

    const statusMsg = data.status === 'done'
      ? `Stage ${data.stage} complete${data.ms ? ` (${(data.ms / 1000).toFixed(1)}s)` : ''}`
      : `Stage ${data.stage}: ${data.name || 'Processing'}...`;

    store.getState().setGenerationProgress(pct, statusMsg);
    store.getState().setUltraProStage(data.stage);
  }, [store]);

  const handleDone = useCallback(async (data: UltraProDoneEvent) => {
    console.log('✅ Ultra-Pro complete:', data.imageUrl, `(${(data.totalMs / 1000).toFixed(1)}s)`);
    const state = store.getState();

    // 1. Set the final result image
    state.setProcessedImage({
      id: `ultrapro-${Date.now()}`,
      url: data.imageUrl,
      width: 2048,
      height: 2048,
      format: 'png',
      size: 0,
      createdAt: new Date(),
    });
    state.setGenerationProgress(100, '🎉 Ultra-Pro complete!');
    state.setUltraProRunning(false);
    state.setUltraProStage(0);

    // 2. GAP 2 FIX: Auto-trigger Vastu analysis
    try {
      await state.requestVastuAnalysis();
      state.openPanel('showVastuPanel');
      console.log('🕉️ Vastu analysis auto-triggered');
    } catch (e) {
      console.warn('⚠️ Auto Vastu failed:', e);
    }

    // 3. GAP 3 FIX: Auto-trigger cost estimation
    try {
      await state.requestCostEstimate();
      state.openPanel('showCostPanel');
      console.log('💰 Cost estimation auto-triggered');
    } catch (e) {
      console.warn('⚠️ Auto Cost failed:', e);
    }
  }, [store]);

  const handleError = useCallback((data: UltraProErrorEvent) => {
    console.error('❌ Ultra-Pro error:', data.error);
    const state = store.getState();
    state.setGenerationError(data.error);
    state.setUltraProRunning(false);
    state.setUltraProStage(0);
    state.setGenerationProgress(0);
  }, [store]);

  useEffect(() => {
    // Connect to the ComfyBridge backend WS server
    const wsUrl = process.env.NEXT_PUBLIC_COMFY_WS || 'http://localhost:3001';
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('🔗 Ultra-Pro Socket.IO connected');
    });

    // Ultra-Pro events
    socket.on('comfy:ultrapro:start', (data: { projectId: string; totalStages: number }) => {
      console.log('🚀 Ultra-Pro started:', data.totalStages, 'stages');
      const state = store.getState();
      state.setUltraProRunning(true);
      state.setGenerationProgress(5, 'Ultra-Pro pipeline starting...');
      state.setGenerationError(null);
    });

    socket.on('comfy:ultrapro:stage', handleStage);
    socket.on('comfy:ultrapro:done', handleDone);
    socket.on('comfy:ultrapro:error', handleError);

    socketRef.current = socket;

    return () => {
      socket.off('comfy:ultrapro:start');
      socket.off('comfy:ultrapro:stage');
      socket.off('comfy:ultrapro:done');
      socket.off('comfy:ultrapro:error');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [handleStage, handleDone, handleError, store]);

  return socketRef;
}
