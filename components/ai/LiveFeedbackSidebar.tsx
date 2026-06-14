"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Upload,
  RefreshCw,
  Activity
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface LiveProgress {
  stage: 'preparing_gpu' | 'segmenting' | 'inpainting' | 'processing' | 'complete';
  progress: number;
  message: string;
  nodeId?: string;
  timestamp: number;
}

interface ExecutedEvent {
  filename: string;
  timestamp: number;
  success: boolean;
  imageUrl: string;
}

export function LiveFeedbackSidebar({ 
  projectId, 
  onImageUpdate, 
  onProcessStart,
  onProcessComplete 
}: {
  projectId: string;
  onImageUpdate: (newImageUrl: string) => void;
  onProcessStart: () => void;
  onProcessComplete: (result: ExecutedEvent) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<LiveProgress | null>(null);
  const [lastExecuted, setLastExecuted] = useState<ExecutedEvent | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize WebSocket connection
  useEffect(() => {
    const attemptReconnect = (sock: ReturnType<typeof io>) => {
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);

        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

        setTimeout(() => {
          sock.connect();
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached');
        setError('Unable to connect to backend. Please refresh the page.');
      }
    };

    const newSocket = io('http://localhost:3000', {
      transports: ['websocket'],
      upgrade: false,
      rememberUpgrade: false
    });

    newSocket.on('connect', () => {
      console.log('🔗 Connected to backend WebSocket');
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from backend WebSocket');
      setIsConnected(false);
      attemptReconnect(newSocket);
    });

    newSocket.on('comfy_progress', (data: LiveProgress) => {
      console.log('📊 Progress update:', data);
      setCurrentProgress(data);

      // Auto-update UI based on stage
      if (data.stage === 'complete') {
        setIsProcessing(false);
      }
    });

    newSocket.on('comfy:done', (data: ExecutedEvent) => {
      console.log('✅ Execution completed:', data);
      setLastExecuted(data);
      setCurrentProgress(null);
      setIsProcessing(false);
      setError(null);

      // Auto-update the image in the main editor
      if (data.success && data.imageUrl) {
        onImageUpdate(data.imageUrl);
        onProcessComplete(data);
      }
    });

    newSocket.on('error', (error: string) => {
      console.error('❌ WebSocket error:', error);
      setError(error);
      setIsProcessing(false);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ Connection error:', error);
      setError(`Connection failed: ${error.message || 'Unknown error'}`);
      attemptReconnect(newSocket);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [onImageUpdate, onProcessComplete]);

  const handleProcessStart = () => {
    if (!isConnected || isProcessing) return;
    
    console.log('🚀 Starting AI processing...');
    setIsProcessing(true);
    setError(null);
    setCurrentProgress({
      stage: 'preparing_gpu',
      progress: 0,
      message: 'Preparing GPU...',
      timestamp: Date.now()
    });
    
    onProcessStart();
  };

  const getStageIcon = () => {
    switch (currentProgress?.stage) {
      case 'preparing_gpu':
        return <Cpu className="w-4 h-4 animate-pulse" />;
      case 'segmenting':
        return <Zap className="w-4 h-4 animate-pulse" />;
      case 'inpainting':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'processing':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Loader2 className="w-4 h-4" />;
    }
  };

  const getStageColor = () => {
    switch (currentProgress?.stage) {
      case 'preparing_gpu':
        return 'bg-blue-500';
      case 'segmenting':
        return 'bg-yellow-500';
      case 'inpainting':
        return 'bg-orange-500';
      case 'processing':
        return 'bg-purple-500';
      case 'complete':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStageText = () => {
    switch (currentProgress?.stage) {
      case 'preparing_gpu':
        return 'Preparing GPU';
      case 'segmenting':
        return 'AI Segmenting';
      case 'inpainting':
        return 'Object Inpainting';
      case 'processing':
        return 'Processing Design';
      case 'complete':
        return 'Complete!';
      default:
        return 'Initializing...';
    }
  };

  return (
    <Card className="w-80 h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Live Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Backend Connection
            </span>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Current Progress */}
        {currentProgress && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${getStageColor()} flex items-center justify-center`}>
                {getStageIcon()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{getStageText()}</div>
                <div className="text-xs text-muted-foreground">{currentProgress.message}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(currentProgress.progress)}%</span>
              </div>
              <Progress value={currentProgress.progress} className="h-2" />
              
              {currentProgress.nodeId && (
                <div className="text-xs text-muted-foreground">
                  Processing Node: {currentProgress.nodeId}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Process Controls */}
        <div className="space-y-2">
          <Button
            onClick={handleProcessStart}
            disabled={!isConnected || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start AI Process
              </>
            )}
          </Button>

          {lastExecuted && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm">
                <div className="font-medium text-green-700 mb-1">✅ Last Process Complete</div>
                <div className="text-xs text-green-600">
                  File: {lastExecuted.filename}
                </div>
                <div className="text-xs text-green-600">
                  Time: {new Date(lastExecuted.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Project ID: {projectId}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
