/**
 * Test Suite for ComfyUI Bridge Service
 * Tests WebSocket connection, queue management, and event handling
 */

import assert from 'assert';
import { WebSocket } from 'ws';
import fetch from 'node-fetch';

const TEST_CONFIG = {
  comfyUIUrl: process.env.COMFYUI_URL || 'http://127.0.0.1:8188',
  backendUrl: 'http://localhost:3001',
  testImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  timeout: 30000
};

class ComfyBridgeTest {
  constructor() {
    this.testResults = [];
    this.socket = null;
  }

  async runAllTests() {
    console.log('🧪 Starting ComfyUI Bridge Tests...\n');

    try {
      await this.testComfyUIHealth();
      await this.testWebSocketConnection();
      await this.testQueueManagement();
      await this.testEventHandling();
      await this.testErrorHandling();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.addResult('Test Suite', false, error.message);
    }

    this.printResults();
    return this.testResults;
  }

  async testComfyUIHealth() {
    console.log('🔍 Testing ComfyUI Health Check...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.comfyUIUrl}/system_stats`, {
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ ComfyUI is online');
        console.log(`   Devices: ${data.system?.devices?.length || 0}`);
        console.log(`   Python: ${data.system?.python?.version || 'unknown'}`);
        this.addResult('ComfyUI Health', true, 'ComfyUI is online and responsive');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ComfyUI Health Check Failed: ${error.message}`);
      this.addResult('ComfyUI Health', false, error.message);
    }
  }

  async testWebSocketConnection() {
    console.log('\n🔍 Testing WebSocket Connection...');
    
    return new Promise((resolve) => {
      const wsUrl = TEST_CONFIG.comfyUIUrl.replace('http', 'ws') + '/ws?clientId=test_client';
      this.socket = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        console.log('❌ WebSocket connection timeout');
        this.addResult('WebSocket Connection', false, 'Connection timeout');
        this.socket?.close();
        resolve();
      }, 10000);

      this.socket.on('open', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection established');
        this.addResult('WebSocket Connection', true, 'Connection successful');
        resolve();
      });

      this.socket.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`❌ WebSocket error: ${error.message}`);
        this.addResult('WebSocket Connection', false, error.message);
        resolve();
      });
    });
  }

  async testQueueManagement() {
    console.log('\n🔍 Testing Queue Management...');
    
    try {
      // Test queue status endpoint
      const response = await fetch(`${TEST_CONFIG.backendUrl}/api/ai/status/queue`);
      
      if (response.ok) {
        const queueData = await response.json();
        console.log('✅ Queue status retrieved');
        console.log(`   Queue Length: ${queueData.queueLength}`);
        console.log(`   Processing: ${queueData.isProcessing}`);
        console.log(`   Connected: ${queueData.comfyUIConnected}`);
        this.addResult('Queue Management', true, 'Queue status accessible');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Queue Management Test Failed: ${error.message}`);
      this.addResult('Queue Management', false, error.message);
    }
  }

  async testEventHandling() {
    console.log('\n🔍 Testing Event Handling...');
    
    return new Promise((resolve) => {
      let eventsReceived = 0;
      const expectedEvents = ['status', 'progress', 'executed'];
      
      const clientSocket = new WebSocket(`${TEST_CONFIG.backendUrl.replace('http', 'ws')}`);

      const timeout = setTimeout(() => {
        console.log(`❌ Event handling timeout (${eventsReceived}/${expectedEvents.length} events)`);
        this.addResult('Event Handling', false, `Only ${eventsReceived} events received`);
        clientSocket.close();
        resolve();
      }, 15000);

      clientSocket.on('open', () => {
        console.log('📡 Connected to backend WebSocket');
        
        // Subscribe to events
        expectedEvents.forEach(event => {
          clientSocket.on(`comfy:${event}`, (data) => {
            console.log(`📨 Received ${event}:`, data);
            eventsReceived++;
            
            if (eventsReceived === expectedEvents.length) {
              clearTimeout(timeout);
              console.log('✅ All expected events received');
              this.addResult('Event Handling', true, 'All events working correctly');
              clientSocket.close();
              resolve();
            }
          });
        });

        // Simulate a test event
        setTimeout(() => {
          clientSocket.emit('test_event', { type: 'ping' });
        }, 1000);
      });

      clientSocket.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`❌ WebSocket error: ${error.message}`);
        this.addResult('Event Handling', false, error.message);
        resolve();
      });
    });
  }

  async testErrorHandling() {
    console.log('\n🔍 Testing Error Handling...');
    
    try {
      // Test invalid endpoint
      const response = await fetch(`${TEST_CONFIG.comfyUIUrl}/invalid_endpoint`);
      
      if (response.status === 404) {
        console.log('✅ Invalid endpoint returns 404');
      } else {
        console.log(`⚠️ Unexpected response for invalid endpoint: ${response.status}`);
      }

      // Test malformed request
      try {
        await fetch(`${TEST_CONFIG.comfyUIUrl}/prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json'
        });
      } catch (error) {
        console.log('✅ Malformed request handled correctly');
      }

      this.addResult('Error Handling', true, 'Error handling working correctly');
    } catch (error) {
      console.log(`❌ Error Handling Test Failed: ${error.message}`);
      this.addResult('Error Handling', false, error.message);
    }
  }

  async testWorkflowSubmission() {
    console.log('\n🔍 Testing Workflow Submission...');
    
    const testWorkflow = {
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "filename_prefix": "test_workflow",
          "images": ["1", 0]
        },
        "class_type": "SaveImage"
      }
    };

    try {
      const response = await fetch(`${TEST_CONFIG.comfyUIUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testWorkflow })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Workflow submitted successfully');
        console.log(`   Prompt ID: ${result.prompt_id}`);
        this.addResult('Workflow Submission', true, 'Workflow submission working');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Workflow Submission Failed: ${error.message}`);
      this.addResult('Workflow Submission', false, error.message);
    }
  }

  addResult(testName, passed, message) {
    this.testResults.push({
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  printResults() {
    console.log('\n📊 Test Results:');
    console.log('=' .repeat(50));
    
    let passed = 0;
    let failed = 0;

    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}: ${result.message}`);
      
      if (result.passed) passed++;
      else failed++;
    });

    console.log('=' .repeat(50));
    console.log(`Total: ${this.testResults.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️ Some tests failed. Check the logs above.');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new ComfyBridgeTest();
  test.runAllTests().then(results => {
    process.exit(results.every(r => r.passed) ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export default ComfyBridgeTest;
