import { NextRequest, NextResponse } from 'next/server';

// Global WebSocket server instance
let io: any;
let serverInitialized = false;

// Initialize Socket.IO server only once
function initializeServer() {
  if (serverInitialized) return;
  
  if (typeof window === 'undefined') {
    const { Server } = require('socket.io');
    const http = require('http');
    
    const server = http.createServer();
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Start the bridge service
    const aiBridgeService = require('@/services/aiBridge');
    aiBridgeService.init();
    
    server.listen(3001, () => {
      console.log('🚀 AI Bridge WebSocket server running on port 3001');
    });
    
    serverInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  initializeServer();
  
  return NextResponse.json({ 
    message: 'AI Bridge WebSocket server is running',
    port: 3001,
    status: 'active'
  });
}

export async function POST(request: NextRequest) {
  try {
    initializeServer();
    
    const body = await request.json();
    const { type, data } = body;
    
    // Handle different types of requests
    switch (type) {
      case 'start_processing':
        // Forward to bridge service
        if (io) {
          io.emit('start_processing', data);
        }
        return NextResponse.json({ success: true, message: 'Processing started' });
        
      case 'get_status':
        const aiBridgeService = require('@/services/aiBridge');
        return NextResponse.json(aiBridgeService.getStatus());
        
      default:
        return NextResponse.json({ error: 'Unknown request type' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('AI Bridge API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
