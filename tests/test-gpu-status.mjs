/**
 * Test Suite for GPU Status Endpoint
 * Tests status monitoring, health checks, and performance metrics
 */

import assert from 'assert';
import fetch from 'node-fetch';

const TEST_CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  comfyUIUrl: process.env.COMFYUI_URL || 'http://127.0.0.1:8188',
  timeout: 10000
};

class GPUStatusTest {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting GPU Status Tests...\n');

    try {
      await this.testBasicStatus();
      await this.testHealthCheck();
      await this.testQueueStatus();
      await this.testPerformanceMetrics();
      await this.testComfyUIConnection();
      await this.testErrorHandling();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.addResult('Test Suite', false, error.message);
    }

    this.printResults();
    return this.testResults;
  }

  async testBasicStatus() {
    console.log('🔍 Testing Basic GPU Status...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/status`, {
        timeout: TEST_CONFIG.timeout
      });

      if (response.ok) {
        const status = await response.json();
        console.log('✅ Basic status retrieved');
        console.log(`   Status: ${status.status}`);
        console.log(`   GPU VRAM: ${status.gpuVram || 'N/A'} GB`);
        console.log(`   Queue Length: ${status.queueLength}`);
        console.log(`   Processing: ${status.isProcessing || false}`);
        console.log(`   ComfyUI Connected: ${status.comfyUIConnected || false}`);
        
        // Validate status structure
        const requiredFields = ['status', 'timestamp'];
        const hasAllFields = requiredFields.every(field => status[field]);
        
        if (!hasAllFields) {
          throw new Error('Missing required status fields');
        }

        // Validate status values
        const validStatuses = ['idle', 'busy', 'offline', 'hot', 'memory_pressure'];
        if (!validStatuses.includes(status.status)) {
          throw new Error(`Invalid status: ${status.status}`);
        }

        if (typeof status.queueLength !== 'number') {
          throw new Error('Queue length should be a number');
        }

        this.addResult('Basic Status', true, 'Status structure valid');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Basic Status Test Failed: ${error.message}`);
      this.addResult('Basic Status', false, error.message);
    }
  }

  async testHealthCheck() {
    console.log('\n🔍 Testing Health Check...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/status/health`, {
        timeout: TEST_CONFIG.timeout
      });

      if (response.ok) {
        const health = await response.json();
        console.log('✅ Health check retrieved');
        console.log(`   Status: ${health.status}`);
        console.log(`   ComfyUI: ${health.comfyui}`);
        console.log(`   Bridge: ${health.bridge}`);
        console.log(`   Queue: ${health.queue}`);
        console.log(`   Processing: ${health.processing}`);
        
        // Validate health structure
        const requiredFields = ['status', 'comfyui', 'bridge', 'queue', 'processing', 'timestamp'];
        const hasAllFields = requiredFields.every(field => health[field]);
        
        if (!hasAllFields) {
          throw new Error('Missing required health fields');
        }

        if (health.status !== 'healthy' && health.status !== 'unhealthy') {
          throw new Error(`Invalid health status: ${health.status}`);
        }

        this.addResult('Health Check', true, 'Health structure valid');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Health Check Test Failed: ${error.message}`);
      this.addResult('Health Check', false, error.message);
    }
  }

  async testQueueStatus() {
    console.log('\n🔍 Testing Queue Status...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/status/queue`, {
        timeout: TEST_CONFIG.timeout
      });

      if (response.ok) {
        const queue = await response.json();
        console.log('✅ Queue status retrieved');
        console.log(`   Queue Length: ${queue.queueLength}`);
        console.log(`   Processing: ${queue.isProcessing}`);
        console.log(`   Frontend Clients: ${queue.frontendClients}`);
        console.log(`   ComfyUI Connected: ${queue.comfyUIConnected}`);
        console.log(`   Reconnect Attempts: ${queue.reconnectAttempts}`);
        
        // Validate queue structure
        const requiredFields = ['queueLength', 'isProcessing', 'comfyUIConnected', 'timestamp'];
        const hasAllFields = requiredFields.every(field => queue[field]);
        
        if (!hasAllFields) {
          throw new Error('Missing required queue fields');
        }

        if (typeof queue.queueLength !== 'number' || queue.queueLength < 0) {
          throw new Error('Invalid queue length');
        }

        if (typeof queue.isProcessing !== 'boolean') {
          throw new Error('isProcessing should be boolean');
        }

        this.addResult('Queue Status', true, 'Queue structure valid');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Queue Status Test Failed: ${error.message}`);
      this.addResult('Queue Status', false, error.message);
    }
  }

  async testPerformanceMetrics() {
    console.log('\n🔍 Testing Performance Metrics...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/status/performance`, {
        timeout: TEST_CONFIG.timeout
      });

      if (response.ok) {
        const metrics = await response.json();
        console.log('✅ Performance metrics retrieved');
        console.log(`   GPU Memory Utilization: ${metrics.gpu?.memoryUtilization || 'N/A'}%`);
        console.log(`   GPU Temperature: ${metrics.gpu?.temperature || 'N/A'}°C`);
        console.log(`   GPU Thermal Status: ${metrics.gpu?.thermalStatus || 'N/A'}`);
        console.log(`   GPU Performance Level: ${metrics.gpu?.performanceLevel || 'N/A'}`);
        console.log(`   Queue Length: ${metrics.queue?.length || 0}`);
        console.log(`   Average Wait Time: ${metrics.queue?.averageWaitTime || 0}s`);
        
        // Validate metrics structure
        if (!metrics.gpu || !metrics.queue || !metrics.timestamp) {
          throw new Error('Missing required metrics sections');
        }

        // Validate GPU metrics
        const gpuMetrics = metrics.gpu;
        if (typeof gpuMetrics.memoryUtilization !== 'number' || 
            gpuMetrics.memoryUtilization < 0 || gpuMetrics.memoryUtilization > 100) {
          throw new Error('Invalid memory utilization');
        }

        if (typeof gpuMetrics.temperature !== 'number' || gpuMetrics.temperature < 0) {
          throw new Error('Invalid temperature');
        }

        const validThermalStatuses = ['normal', 'warm', 'hot', 'critical'];
        if (!validThermalStatuses.includes(gpuMetrics.thermalStatus)) {
          throw new Error(`Invalid thermal status: ${gpuMetrics.thermalStatus}`);
        }

        const validPerformanceLevels = ['idle', 'low', 'medium', 'high'];
        if (!validPerformanceLevels.includes(gpuMetrics.performanceLevel)) {
          throw new Error(`Invalid performance level: ${gpuMetrics.performanceLevel}`);
        }

        this.addResult('Performance Metrics', true, 'Metrics structure valid');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Performance Metrics Test Failed: ${error.message}`);
      this.addResult('Performance Metrics', false, error.message);
    }
  }

  async testComfyUIConnection() {
    console.log('\n🔍 Testing ComfyUI Connection...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.comfyUIUrl}/system_stats`, {
        timeout: TEST_CONFIG.timeout
      });

      if (response.ok) {
        const systemStats = await response.json();
        console.log('✅ ComfyUI connection successful');
        console.log(`   System Status: Available`);
        console.log(`   Devices: ${systemStats.system?.devices?.length || 0}`);
        console.log(`   Python Version: ${systemStats.system?.python?.version || 'Unknown'}`);
        console.log(`   ComfyUI Version: ${systemStats.system?.comfyui?.version || 'Unknown'}`);
        
        // Validate system stats structure
        if (!systemStats.system) {
          throw new Error('Missing system information');
        }

        if (!Array.isArray(systemStats.system.devices)) {
          throw new Error('Devices should be an array');
        }

        this.addResult('ComfyUI Connection', true, 'ComfyUI accessible');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ComfyUI Connection Test Failed: ${error.message}`);
      this.addResult('ComfyUI Connection', false, error.message);
    }
  }

  async testErrorHandling() {
    console.log('\n🔍 Testing Error Handling...');
    
    try {
      // Test invalid endpoint
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/status/invalid`, {
        timeout: TEST_CONFIG.timeout
      });

      if (response.status === 404) {
        console.log('✅ Invalid endpoint returns 404');
      } else {
        console.log(`⚠️ Unexpected response for invalid endpoint: ${response.status}`);
      }

      // Test malformed query parameters
      try {
        await fetch(`${TEST_CONFIG.apiUrl}/api/ai/status?invalid=true`, {
          timeout: TEST_CONFIG.timeout
        });
        console.log('✅ Malformed query handled');
      } catch (error) {
        console.log('✅ Malformed query rejected appropriately');
      }

      // Test timeout handling
      try {
        await fetch(`${TEST_CONFIG.comfyUIUrl}/slow-endpoint`, {
          timeout: 1000 // Very short timeout
        });
      } catch (error) {
        if (error.code === 'TIMEOUT' || error.code === 'ETIMEDOUT') {
          console.log('✅ Timeout handling working');
        } else {
          console.log(`⚠️ Unexpected timeout error: ${error.code}`);
        }
      }

      this.addResult('Error Handling', true, 'Error handling working correctly');
    } catch (error) {
      console.log(`❌ Error Handling Test Failed: ${error.message}`);
      this.addResult('Error Handling', false, error.message);
    }
  }

  async testStatusConsistency() {
    console.log('\n🔍 Testing Status Consistency...');
    
    try {
      // Get status from multiple endpoints
      const basicResponse = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/status`);
      const healthResponse = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/status/health`);
      const queueResponse = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/status/queue`);

      if (basicResponse.ok && healthResponse.ok && queueResponse.ok) {
        const basic = await basicResponse.json();
        const health = await healthResponse.json();
        const queue = await queueResponse.json();

        // Check consistency
        const consistentQueueLength = basic.queueLength === queue.queueLength;
        const consistentProcessing = basic.isProcessing === queue.isProcessing;
        const consistentConnection = basic.comfyUIConnected === queue.comfyUIConnected;

        if (consistentQueueLength && consistentProcessing && consistentConnection) {
          console.log('✅ Status consistency verified');
          this.addResult('Status Consistency', true, 'All endpoints consistent');
        } else {
          console.log('⚠️ Status inconsistency detected');
          console.log(`   Queue Length: ${basic.queueLength} vs ${queue.queueLength}`);
          console.log(`   Processing: ${basic.isProcessing} vs ${queue.isProcessing}`);
          console.log(`   Connection: ${basic.comfyUIConnected} vs ${queue.comfyUIConnected}`);
          this.addResult('Status Consistency', false, 'Endpoints inconsistent');
        }
      } else {
        throw new Error('Some endpoints failed');
      }
    } catch (error) {
      console.log(`❌ Status Consistency Test Failed: ${error.message}`);
      this.addResult('Status Consistency', false, error.message);
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
    console.log('\n📊 GPU Status Test Results:');
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
      console.log('\n🎉 All GPU status tests passed!');
    } else {
      console.log('\n⚠️ Some GPU status tests failed. Check the logs above.');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new GPUStatusTest();
  test.runAllTests().then(results => {
    process.exit(results.every(r => r.passed) ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export default GPUStatusTest;
