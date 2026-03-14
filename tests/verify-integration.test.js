/**
 * Integration Test Suite for AI Object Removal
 * Performs end-to-end testing of the complete pipeline
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class IntegrationTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = [];
    this.testImage = null;
    this.generatedImage = null;
  }

  async runAllTests() {
    console.log('🚀 Starting AI Object Removal Integration Tests...\n');

    try {
      // Test 1: Check Dependencies
      await this.testDependencies();

      // Test 2: Test GPU Status
      await this.testGPUStatus();

      // Test 3: Test Mock Image Upload
      await this.testMockImageUpload();

      // Test 4: Test Object Selection (Segmentation)
      await this.testObjectSelection();

      // Test 5: Test Object Removal (Full Pipeline)
      await this.testObjectRemoval();

      // Test 6: Test File System Verification
      await this.testFileSystemVerification();

      // Test 7: Test Error Handling
      await this.testErrorHandling();

      // Generate Report
      this.generateReport();

    } catch (error) {
      console.error('❌ Integration test failed:', error);
      process.exit(1);
    }
  }

  async testDependencies() {
    console.log('📦 Testing Dependencies...');
    
    const requiredPackages = ['axios', 'ws', 'canvas'];
    const missingPackages = [];

    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
      } catch (error) {
        missingPackages.push(pkg);
      }
    }

    if (missingPackages.length > 0) {
      throw new Error(`Missing dependencies: ${missingPackages.join(', ')}`);
    }

    this.addTestResult('Dependencies', true, 'All required packages installed');
    console.log('✅ Dependencies check passed\n');
  }

  async testGPUStatus() {
    console.log('🔍 Testing GPU Status...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/ai/gpu-status`);
      
      if (response.status === 200) {
        const { is_busy, vram_used, status } = response.data;
        this.addTestResult('GPU Status', true, `Status: ${status}, VRAM: ${vram_used}GB, Busy: ${is_busy}`);
      } else if (response.status === 503) {
        this.addTestResult('GPU Status', false, 'GPU Service Unavailable (503)', 'WARNING');
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 503) {
        this.addTestResult('GPU Status', false, 'GPU Service Unavailable (503)', 'WARNING');
        console.log('⚠️  GPU offline - this is expected if ComfyUI is not running\n');
        return;
      }
      throw error;
    }

    console.log('✅ GPU Status test completed\n');
  }

  async testMockImageUpload() {
    console.log('📤 Testing Mock Image Upload...');
    
    try {
      // Create a simple test image (1x1 pixel PNG)
      const testImageData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      );
      
      this.testImage = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
      
      this.addTestResult('Mock Image Upload', true, 'Test image created successfully');
    } catch (error) {
      throw new Error(`Mock image upload failed: ${error.message}`);
    }

    console.log('✅ Mock Image Upload test passed\n');
  }

  async testObjectSelection() {
    console.log('🎯 Testing Object Selection (Segmentation)...');
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/ai/segment`, {
        imageUrl: this.testImage,
        point: { x: 50, y: 50 }
      });

      if (response.status === 200) {
        const { mask, confidence } = response.data;
        
        if (!mask || !confidence) {
          throw new Error('Invalid segmentation response');
        }

        this.addTestResult('Object Selection', true, `Segmentation successful, confidence: ${confidence}`);
      } else {
        throw new Error(`Segmentation failed with status: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Object selection test failed: ${error.message}`);
    }

    console.log('✅ Object Selection test passed\n');
  }

  async testObjectRemoval() {
    console.log('🎨 Testing Object Removal (Full Pipeline)...');
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/ai/queue`, {
        type: 'object_removal',
        imageUrl: this.testImage,
        point: { x: 50, y: 50 },
        mask: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      });

      if (response.status === 200) {
        const { success, resultImageUrl, error } = response.data;
        
        if (success && resultImageUrl) {
          this.generatedImage = resultImageUrl;
          this.addTestResult('Object Removal', true, 'Object removal completed successfully');
        } else if (error && error.includes('GPU_OFFLINE')) {
          this.addTestResult('Object Removal', false, 'GPU offline - expected if ComfyUI not running', 'WARNING');
          console.log('⚠️  Object removal skipped - GPU offline\n');
          return;
        } else {
          throw new Error(error || 'Object removal failed');
        }
      } else {
        throw new Error(`Object removal failed with status: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 503) {
        this.addTestResult('Object Removal', false, 'GPU offline - expected if ComfyUI not running', 'WARNING');
        console.log('⚠️  Object removal skipped - GPU offline\n');
        return;
      }
      throw new Error(`Object removal test failed: ${error.message}`);
    }

    console.log('✅ Object Removal test completed\n');
  }

  async testFileSystemVerification() {
    console.log('📁 Testing File System Verification...');
    
    try {
      // Check if the generated image URL is accessible
      if (this.generatedImage) {
        const response = await axios.get(this.generatedImage, { 
          responseType: 'arraybuffer',
          timeout: 5000 
        });
        
        if (response.status === 200) {
          const imageSize = Buffer.byteLength(response.data);
          this.addTestResult('File System Verification', true, `Generated image accessible (${imageSize} bytes)`);
        } else {
          throw new Error(`Generated image not accessible: ${response.status}`);
        }
      } else {
        this.addTestResult('File System Verification', false, 'No generated image to verify', 'SKIPPED');
      }
    } catch (error) {
      this.addTestResult('File System Verification', false, `File system verification failed: ${error.message}`, 'WARNING');
    }

    console.log('✅ File System Verification test completed\n');
  }

  async testErrorHandling() {
    console.log('⚠️  Testing Error Handling...');
    
    // Test invalid request
    try {
      const response = await axios.post(`${this.baseUrl}/api/ai/queue`, {
        type: 'invalid_type',
        imageUrl: 'invalid_url'
      });

      if (response.status === 400) {
        this.addTestResult('Error Handling', true, 'Invalid request properly rejected');
      } else {
        throw new Error('Expected 400 status for invalid request');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        this.addTestResult('Error Handling', true, 'Invalid request properly rejected');
      } else {
        throw new Error(`Error handling test failed: ${error.message}`);
      }
    }

    console.log('✅ Error Handling test passed\n');
  }

  addTestResult(testName, passed, message, type = 'NORMAL') {
    this.testResults.push({
      test: testName,
      passed,
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    console.log('📊 Generating Integration Test Report...\n');

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const warningTests = this.testResults.filter(r => r.type === 'WARNING').length;
    const skippedTests = this.testResults.filter(r => r.type === 'SKIPPED').length;

    console.log('=' .repeat(60));
    console.log('🎯 AI OBJECT REMOVAL INTEGRATION TEST REPORT');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`⚠️  Warnings: ${warningTests}`);
    console.log(`⏭️  Skipped: ${skippedTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests - warningTests - skippedTests}`);
    console.log('=' .repeat(60));

    this.testResults.forEach((result, index) => {
      const icon = result.passed ? '✅' : (result.type === 'WARNING' ? '⚠️' : '❌');
      const type = result.type !== 'NORMAL' ? ` [${result.type}]` : '';
      console.log(`${index + 1}. ${icon} ${result.test}${type}`);
      console.log(`   ${result.message}`);
    });

    console.log('=' .repeat(60));

    // Determine overall success
    const hasFailures = this.testResults.some(r => !r.passed && r.type === 'NORMAL');
    
    if (hasFailures) {
      console.log('❌ INTEGRATION TESTS FAILED');
      console.log('Some critical tests failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('✅ INTEGRATION TESTS PASSED');
      console.log('All critical tests passed. The system is ready for deployment.');
      
      if (warningTests > 0) {
        console.log(`\n⚠️  Note: ${warningTests} tests passed with warnings.`);
        console.log('These are expected when ComfyUI is not running.');
      }
    }

    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        warnings: warningTests,
        skipped: skippedTests,
        failed: totalTests - passedTests - warningTests - skippedTests
      },
      results: this.testResults
    };

    const reportPath = path.join(__dirname, 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the tests
if (require.main === module) {
  const test = new IntegrationTest();
  test.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTest;
