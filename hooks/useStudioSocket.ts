'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useEditorStore } from '@/stores/editor-store';

/**
 * Socket.IO hook for Studio tab events + Ultra-Pro pipeline events.
 * Listens for: comfy:tab:start/done/error + comfy:ultrapro:start/stage/done/error
 */
export function useStudioSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_COMFY_WS || 'http://localhost:3001';
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    // ─── Tab events ─────────────────────────────────────────────
    socket.on('comfy:tab:start', (data: { projectId: string; tab: string; name: string }) => {
      useEditorStore.setState({
        isGenerating: true,
        generationProgress: 5,
        generationStatus: `${data.name}: Starting...`,
        generationError: null,
      });
    });

    socket.on('comfy:tab:done', (data: { projectId: string; tab: string; imageUrl: string; ms: number }) => {
      useEditorStore.setState({
        isGenerating: false,
        generationProgress: 100,
        generationStatus: `Complete (${(data.ms / 1000).toFixed(1)}s)`,
        processedImage: {
          id: `tab-${data.tab}-${Date.now()}`,
          url: data.imageUrl + '?t=' + Date.now(),
          width: 1024,
          height: 1024,
          format: 'png' as const,
          size: 0,
          createdAt: new Date(),
        },
      });
    });

    socket.on('comfy:tab:error', (data: { tab: string; error: string }) => {
      useEditorStore.setState({
        isGenerating: false,
        generationProgress: 0,
        generationError: data.error,
        generationStatus: `Error: ${data.error}`,
      });
    });

    // ─── Ultra-Pro events (reuse from existing) ─────────────────
    socket.on('comfy:ultrapro:start', (data: any) => {
      useEditorStore.setState({
        isUltraProRunning: true,
        ultraProStage: 0,
        isGenerating: true,
        generationProgress: 5,
        generationStatus: 'Ultra-Pro: Starting...',
      });
    });

    socket.on('comfy:ultrapro:stage', (data: any) => {
      const pctMap: Record<number, number> = { 1: 15, 2: 35, 3: 55, 4: 75, 5: 90, 6: 100 };
      const pct = data.status === 'done' ? (pctMap[data.stage] || 50) : (pctMap[data.stage] || 50) - 10;
      useEditorStore.setState({
        ultraProStage: data.stage,
        generationProgress: pct,
        generationStatus: data.status === 'done'
          ? `Stage ${data.stage} done${data.ms ? ` (${(data.ms / 1000).toFixed(1)}s)` : ''}`
          : `Stage ${data.stage}: ${data.name || 'Processing'}...`,
      });
    });

    socket.on('comfy:ultrapro:done', (data: any) => {
      useEditorStore.setState({
        isUltraProRunning: false,
        isGenerating: false,
        ultraProStage: 6,
        generationProgress: 100,
        generationStatus: `Complete (${(data.totalMs / 1000).toFixed(1)}s)`,
        processedImage: {
          id: `ultrapro-${Date.now()}`,
          url: data.imageUrl + '?t=' + Date.now(),
          width: 2048,
          height: 2048,
          format: 'png' as const,
          size: 0,
          createdAt: new Date(),
        },
      });

      // Auto-trigger Vastu + Cost analysis
      const state = useEditorStore.getState();
      state.requestVastuAnalysis?.().catch((e: any) => console.warn('⚠️ Auto Vastu failed:', e));
      state.requestCostEstimate?.().catch((e: any) => console.warn('⚠️ Auto Cost failed:', e));
    });

    socket.on('comfy:ultrapro:error', (data: any) => {
      useEditorStore.setState({
        isUltraProRunning: false,
        isGenerating: false,
        ultraProStage: 0,
        generationProgress: 0,
        generationError: data.error,
        generationStatus: `Error: ${data.error}`,
      });
    });

    // Connection status
    socket.on('comfy:status', (data: { status: string }) => {
      console.log(`🔗 ComfyUI: ${data.status}`);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, []);

  return socketRef;
}
