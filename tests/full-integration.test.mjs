/**
 * Full Integration Test for Removation.ai
 * Tests all features end-to-end
 */

import { io } from 'socket.io-client';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const COMFYUI_URL = 'http://127.0.0.1:8188';

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: ComfyUI Bridge Connection
async function testComfyUIBridge() {
  console.log('🧪 Test 1: ComfyUI Bridge Connection...');
  
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`);
    const data = await response.json();
    
    if (data.devices && data.devices.length > 0) {
      console.log('✅ ComfyUI Bridge: PASS - GPU detected');
      return true;
    } else {
      console.log('❌ ComfyUI Bridge: FAIL - No GPU devices');
      return false;
    }
  } catch (error) {
    console.log('❌ ComfyUI Bridge: FAIL -', error.message);
    return false;
  }
}

// Test 2: Redesign End-to-End
async function testRedesign() {
  console.log('🧪 Test 2: Redesign End-to-End...');
  
  try {
    // Create a test image (1x1 pixel PNG)
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const formData = new FormData();
    formData.append('image', new Blob([testImage], { type: 'image/png' }), 'test.png');
    formData.append('style', 'Modern');
    formData.append('roomType', 'Living Room');
    formData.append('colorPalette', 'Neutral');
    
    const response = await fetch(`${BASE_URL}/api/ai/redesign`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok && result.projectId && result.status === 'queued') {
      console.log('✅ Redesign API: PASS - Job queued');
      
      // Wait for completion (max 120 seconds)
      let completed = false;
      for (let i = 0; i < 120; i++) {
        await wait(1000);
        
        const checkResponse = await fetch(`${BASE_URL}/api/ai/redesign?projectId=${result.projectId}`);
        const project = await checkResponse.json();
        
        if (project.status === 'completed') {
          console.log('✅ Redesign Completion: PASS - Project completed');
          completed = true;
          
          // Check if result image exists
          if (project.resultImage) {
            console.log('✅ Redesign Result: PASS - Image generated');
            return true;
          } else {
            console.log('❌ Redesign Result: FAIL - No result image');
            return false;
          }
        } else if (project.status === 'failed') {
          console.log('❌ Redesign Completion: FAIL - Processing failed');
          return false;
        }
      }
      
      if (!completed) {
        console.log('❌ Redesign Completion: FAIL - Timeout');
        return false;
      }
    } else {
      console.log('❌ Redesign API: FAIL -', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Redesign Test: FAIL -', error.message);
    return false;
  }
}

// Test 3: Object Removal
async function testObjectRemoval() {
  console.log('🧪 Test 3: Object Removal...');
  
  try {
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const formData = new FormData();
    formData.append('image', new Blob([testImage], { type: 'image/png' }), 'test.png');
    formData.append('objectName', 'chair');
    
    const response = await fetch(`${BASE_URL}/api/ai/remove-object`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok && result.projectId && result.status === 'queued') {
      console.log('✅ Object Removal API: PASS - Job queued');
      return true;
    } else {
      console.log('❌ Object Removal API: FAIL -', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Object Removal Test: FAIL -', error.message);
    return false;
  }
}

// Test 4: Recolor
async function testRecolor() {
  console.log('🧪 Test 4: Recolor...');
  
  try {
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const formData = new FormData();
    formData.append('image', new Blob([testImage], { type: 'image/png' }), 'test.png');
    formData.append('target', 'walls');
    formData.append('color', 'blue');
    formData.append('material', 'matte paint');
    
    const response = await fetch(`${BASE_URL}/api/ai/recolor`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok && result.projectId && result.status === 'queued') {
      console.log('✅ Recolor API: PASS - Job queued');
      return true;
    } else {
      console.log('❌ Recolor API: FAIL -', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Recolor Test: FAIL -', error.message);
    return false;
  }
}

// Test 5: Frontend Socket Connection
async function testFrontendSocket() {
  console.log('🧪 Test 5: Frontend Socket Connection...');
  
  return new Promise((resolve) => {
    try {
      const socket = io('http://localhost:3001');
      
      let connected = false;
      let testCompleted = false;
      
      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        if (!testCompleted) {
          testCompleted = true;
          console.log('❌ Frontend Socket: FAIL - Timeout');
          socket.disconnect();
          resolve(false);
        }
      }, 10000);
      
      socket.on('connect', () => {
        connected = true;
        console.log('✅ Frontend Socket: PASS - Connected to backend');
        
        // Test comfy:done event
        socket.on('comfy:done', (data) => {
          if (!testCompleted && data.imageUrl) {
            testCompleted = true;
            clearTimeout(timeout);
            console.log('✅ Frontend Socket Event: PASS - Received comfy:done');
            socket.disconnect();
            resolve(true);
          }
        });
        
        // Simulate backend sending comfy:done
        setTimeout(() => {
          if (!testCompleted) {
            socket.emit('comfy:done', {
              projectId: 'test-project',
              imageUrl: '/renders/test.png'
            });
          }
        }, 1000);
      });
      
      socket.on('connect_error', (error) => {
        if (!testCompleted) {
          testCompleted = true;
          clearTimeout(timeout);
          console.log('❌ Frontend Socket: FAIL - Connection error:', error.message);
          resolve(false);
        }
      });
      
    } catch (error) {
      console.log('❌ Frontend Socket Test: FAIL -', error.message);
      resolve(false);
    }
  });
}

// Test 6: GPU Status Endpoint
async function testGPUStatus() {
  console.log('🧪 Test 6: GPU Status Endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/status`);
    const data = await response.json();
    
    if (response.ok && (data.status === 'idle' || data.status === 'busy' || data.status === 'offline')) {
      console.log('✅ GPU Status: PASS -', data.status);
      return true;
    } else {
      console.log('❌ GPU Status: FAIL - Invalid response');
      return false;
    }
  } catch (error) {
    console.log('❌ GPU Status Test: FAIL -', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Full Integration Tests...\n');
  
  const tests = [
    { name: 'ComfyUI Bridge', fn: testComfyUIBridge },
    { name: 'GPU Status', fn: testGPUStatus },
    { name: 'Redesign API', fn: testRedesign },
    { name: 'Object Removal', fn: testObjectRemoval },
    { name: 'Recolor', fn: testRecolor },
    { name: 'Frontend Socket', fn: testFrontendSocket }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
    console.log(''); // Add spacing
  }
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  let passedCount = 0;
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.passed) passedCount++;
  }
  
  console.log('\n========================');
  console.log(`Total: ${passedCount}/${tests.length} tests passed`);
  
  if (passedCount === tests.length) {
    console.log('🎉 ALL TESTS PASSED! Platform is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please check the logs above.');
  }
  
  return passedCount === tests.length;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };
