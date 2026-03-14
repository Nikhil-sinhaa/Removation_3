/**
 * Simple WebSocket Test Server
 */

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  
  // Simulate comfy_progress messages
  setTimeout(() => {
    socket.emit('comfy_progress', {
      stage: 'preparing_gpu',
      progress: 10,
      message: 'Preparing GPU...',
      timestamp: Date.now()
    });
  }, 1000);
  
  setTimeout(() => {
    socket.emit('comfy_progress', {
      stage: 'segmenting',
      progress: 40,
      message: 'AI Segmenting...',
      timestamp: Date.now()
    });
  }, 2000);
  
  setTimeout(() => {
    socket.emit('comfy_progress', {
      stage: 'inpainting',
      progress: 70,
      message: 'Object Inpainting...',
      timestamp: Date.now()
    });
  }, 3000);
  
  setTimeout(() => {
    socket.emit('comfy_executed', {
      filename: `removation_test_${Date.now()}.png`,
      timestamp: Date.now(),
      success: true,
      imageUrl: 'http://localhost:8188/view?filename=test.png'
    });
  }, 4000);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

server.listen(3002, () => {
  console.log('🚀 Test WebSocket server running on port 3002');
});
