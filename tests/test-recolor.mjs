/**
 * Test Suite for Color & Material Change Feature
 * Tests API endpoints, presets, workflow generation, and processing
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { FormData } from 'formdata-node';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  comfyUIUrl: process.env.COMFYUI_URL || 'http://127.0.0.1:8188',
  testImagePath: path.join(__dirname, 'test-images', 'test-room.jpg'),
  timeout: 30000
};

class RecolorTest {
  constructor() {
    this.testResults = [];
    this.createdProjects = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Color & Material Change Tests...\n');

    try {
      await this.setupTestEnvironment();
      await this.testPresetsEndpoint();
      await this.testRecolorEndpoint();
      await this.testWorkflowGeneration();
      await this.testTargetPrompts();
      await this.testProjectStatus();
      await this.testProjectRetrieval();
      await this.testProjectDeletion();
      await this.cleanupTestEnvironment();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.addResult('Test Suite', false, error.message);
    }

    this.printResults();
    return this.testResults;
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // Create test images directory
    const testImageDir = path.dirname(TEST_CONFIG.testImagePath);
    if (!fs.existsSync(testImageDir)) {
      fs.mkdirSync(testImageDir, { recursive: true });
    }

    // Create a simple test image (1x1 pixel)
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit, RGBA
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00, // Compressed data
      0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // CRC
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82 // CRC
    ]);

    fs.writeFileSync(TEST_CONFIG.testImagePath, testImageData);
    console.log('✅ Test environment setup complete');
    this.addResult('Environment Setup', true, 'Test image created');
  }

  async testPresetsEndpoint() {
    console.log('\n🔍 Testing Presets Endpoint...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/recolor/presets`);
      
      if (response.ok) {
        const presets = await response.json();
        console.log('✅ Presets retrieved successfully');
        console.log(`   Colors: ${presets.colors?.length || 0}`);
        console.log(`   Materials: ${presets.materials?.length || 0}`);
        console.log(`   Targets: ${presets.targets?.length || 0}`);
        
        // Validate presets structure
        if (!presets.colors || !Array.isArray(presets.colors)) {
          throw new Error('Invalid colors array');
        }
        
        if (!presets.materials || !Array.isArray(presets.materials)) {
          throw new Error('Invalid materials array');
        }
        
        if (!presets.targets || !Array.isArray(presets.targets)) {
          throw new Error('Invalid targets array');
        }

        // Check for required targets
        const requiredTargets = ['walls', 'ceiling', 'floor', 'furniture', 'all'];
        const hasAllTargets = requiredTargets.every(target => 
          presets.targets.some(t => t.value === target)
        );
        
        if (!hasAllTargets) {
          throw new Error('Missing required targets');
        }

        this.addResult('Presets Endpoint', true, 'Presets structure valid');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Presets Endpoint Test Failed: ${error.message}`);
      this.addResult('Presets Endpoint', false, error.message);
    }
  }

  async testRecolorEndpoint() {
    console.log('\n🔍 Testing Recolor Endpoint...');
    
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(TEST_CONFIG.testImagePath));
      formData.append('target', 'walls');
      formData.append('color', 'Blue');
      formData.append('material', 'Matte Paint');

      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/recolor`, {
        method: 'POST',
        body: formData,
        timeout: TEST_CONFIG.timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Recolor request submitted');
        console.log(`   Project ID: ${result.projectId}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Message: ${result.message}`);
        
        this.createdProjects.push(result.projectId);
        this.addResult('Recolor Endpoint', true, 'Request submitted successfully');
      } else {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Recolor Endpoint Test Failed: ${error.message}`);
      this.addResult('Recolor Endpoint', false, error.message);
    }
  }

  async testWorkflowGeneration() {
    console.log('\n🔍 Testing Workflow Generation...');
    
    try {
      // Import the workflow generation function
      const { buildRecolorWorkflow } = await import('../src/controllers/colorChange.js');
      
      // Test workflow generation with different parameters
      const testCases = [
        { target: 'walls', color: 'Blue', material: 'Matte Paint' },
        { target: 'ceiling', color: 'White', material: 'Textured' },
        { target: 'floor', color: 'Brown', material: 'Wood' },
        { target: 'furniture', color: 'Gray', material: 'Fabric' },
        { target: 'all', color: 'Beige', material: 'Default' }
      ];

      for (const testCase of testCases) {
        const workflow = buildRecolorWorkflow({
          inputImage: TEST_CONFIG.testImagePath,
          ...testCase,
          seed: 12345
        });

        // Validate workflow structure
        const requiredNodes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];
        const hasAllNodes = requiredNodes.every(nodeId => workflow[nodeId]);
        
        if (!hasAllNodes) {
          throw new Error(`Missing required workflow nodes for ${testCase.target}`);
        }

        // Check SAM2 segmentation node
        const segmentationNode = workflow['4'];
        if (segmentationNode.class_type !== 'GroundingDinoSAM2Segment') {
          throw new Error('Invalid segmentation node');
        }

        // Check ControlNet node
        const controlNetNode = workflow['11'];
        if (controlNetNode.class_type !== 'ControlNetLoader') {
          throw new Error('Invalid ControlNet node');
        }

        // Check VAE Decode Tiled
        const vaeDecodeNode = workflow['10'];
        if (vaeDecodeNode.class_type !== 'VAEDecodeTiled') {
          throw new Error('Should use VAEDecodeTiled');
        }

        // Check KSampler configuration
        const ksamplerNode = workflow['9'];
        if (ksamplerNode.inputs.steps !== 8) {
          throw new Error('KSampler steps should be 8');
        }

        if (!ksamplerNode.inputs.fp8_e4m3fn) {
          throw new Error('KSampler should use fp8 precision');
        }

        console.log(`✅ Workflow validation passed for ${testCase.target}`);
      }

      this.addResult('Workflow Generation', true, 'All workflow variations valid');
    } catch (error) {
      console.log(`❌ Workflow Generation Test Failed: ${error.message}`);
      this.addResult('Workflow Generation', false, error.message);
    }
  }

  async testTargetPrompts() {
    console.log('\n🔍 Testing Target Prompts...');
    
    try {
      // Import the prompt generation function
      const { buildTargetPrompt, getTargetPrompt } = await import('../src/controllers/colorChange.js');
      
      // Test different target prompts
      const testCases = [
        { target: 'walls', color: 'Blue', material: 'Matte Paint' },
        { target: 'ceiling', color: 'White', material: 'Textured' },
        { target: 'floor', color: 'Brown', material: 'Wood' },
        { target: 'furniture', color: 'Gray', material: 'Fabric' },
        { target: 'all', color: 'Beige', material: 'Default' }
      ];

      for (const testCase of testCases) {
        const prompt = buildTargetPrompt(testCase.target, testCase.color, testCase.material);
        const segmentationPrompt = getTargetPrompt(testCase.target);
        
        if (!prompt || prompt.length === 0) {
          throw new Error(`Empty prompt for ${testCase.target}`);
        }

        if (!segmentationPrompt || segmentationPrompt.length === 0) {
          throw new Error(`Empty segmentation prompt for ${testCase.target}`);
        }

        // Check if prompt contains expected elements
        const hasColor = prompt.toLowerCase().includes(testCase.color.toLowerCase());
        const hasMaterial = prompt.toLowerCase().includes(testCase.material.toLowerCase());
        
        if (!hasColor) {
          throw new Error(`Prompt missing color for ${testCase.target}`);
        }

        console.log(`✅ Prompt validation passed for ${testCase.target}`);
        console.log(`   Prompt: ${prompt.substring(0, 80)}...`);
      }

      this.addResult('Target Prompts', true, 'All target prompts valid');
    } catch (error) {
      console.log(`❌ Target Prompts Test Failed: ${error.message}`);
      this.addResult('Target Prompts', false, error.message);
    }
  }

  async testProjectStatus() {
    console.log('\n🔍 Testing Project Status...');
    
    if (this.createdProjects.length === 0) {
      console.log('⚠️ No projects to test status');
      this.addResult('Project Status', false, 'No projects available');
      return;
    }

    try {
      const projectId = this.createdProjects[0];
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/recolor/${projectId}/status`);
      
      if (response.ok) {
        const status = await response.json();
        console.log('✅ Project status retrieved');
        console.log(`   Status: ${status.status}`);
        console.log(`   Original Image: ${status.originalImage ? 'Yes' : 'No'}`);
        console.log(`   Result Image: ${status.resultImage ? 'Yes' : 'No'}`);
        console.log(`   Processing Type: ${status.processingType}`);
        
        if (status.processingType !== 'recolor') {
          throw new Error('Invalid processing type');
        }

        this.addResult('Project Status', true, 'Status retrieval working');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Project Status Test Failed: ${error.message}`);
      this.addResult('Project Status', false, error.message);
    }
  }

  async testProjectRetrieval() {
    console.log('\n🔍 Testing Project Retrieval...');
    
    if (this.createdProjects.length === 0) {
      console.log('⚠️ No projects to test retrieval');
      this.addResult('Project Retrieval', false, 'No projects available');
      return;
    }

    try {
      const projectId = this.createdProjects[0];
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/recolor/${projectId}`);
      
      if (response.ok) {
        const project = await response.json();
        console.log('✅ Project retrieved successfully');
        console.log(`   Name: ${project.name}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Created: ${project.createdAt}`);
        console.log(`   AI Config: ${project.aiConfig ? 'Present' : 'Missing'}`);
        
        // Validate project structure
        const requiredFields = ['name', 'userId', 'originalImage', 'processingType', 'status'];
        const hasAllFields = requiredFields.every(field => project[field]);
        
        if (!hasAllFields) {
          throw new Error('Missing required project fields');
        }

        if (project.processingType !== 'recolor') {
          throw new Error('Wrong processing type');
        }

        if (!project.aiConfig || !project.aiConfig.target || !project.aiConfig.color) {
          throw new Error('Missing target or color in AI config');
        }

        this.addResult('Project Retrieval', true, 'Project structure valid');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Project Retrieval Test Failed: ${error.message}`);
      this.addResult('Project Retrieval', false, error.message);
    }
  }

  async testProjectDeletion() {
    console.log('\n🔍 Testing Project Deletion...');
    
    if (this.createdProjects.length === 0) {
      console.log('⚠️ No projects to test deletion');
      this.addResult('Project Deletion', false, 'No projects available');
      return;
    }

    try {
      const projectId = this.createdProjects[0];
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/recolor/${projectId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Project deleted successfully');
        console.log(`   Message: ${result.message}`);
        
        // Verify project is gone
        const verifyResponse = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/recolor/${projectId}`);
        if (verifyResponse.status === 404) {
          console.log('✅ Project deletion verified');
          this.addResult('Project Deletion', true, 'Deletion working correctly');
        } else {
          console.log('⚠️ Project deletion not verified');
          this.addResult('Project Deletion', false, 'Deletion not verified');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Project Deletion Test Failed: ${error.message}`);
      this.addResult('Project Deletion', false, error.message);
    }
  }

  async cleanupTestEnvironment() {
    console.log('\n🧹 Cleaning up test environment...');
    
    // Clean up any remaining projects
    for (const projectId of this.createdProjects) {
      try {
        await fetch(`${TEST_CONFIG.apiUrl}/api/ai/recolor/${projectId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.log(`⚠️ Failed to cleanup project ${projectId}: ${error.message}`);
      }
    }

    // Remove test image
    try {
      if (fs.existsSync(TEST_CONFIG.testImagePath)) {
        fs.unlinkSync(TEST_CONFIG.testImagePath);
      }
      
      // Remove test directory if empty
      const testImageDir = path.dirname(TEST_CONFIG.testImagePath);
      if (fs.existsSync(testImageDir) && fs.readdirSync(testImageDir).length === 0) {
        fs.rmdirSync(testImageDir);
      }
    } catch (error) {
      console.log(`⚠️ Cleanup warning: ${error.message}`);
    }

    console.log('✅ Cleanup complete');
    this.addResult('Environment Cleanup', true, 'Cleanup successful');
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
    console.log('\n📊 Color & Material Change Test Results:');
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
      console.log('\n🎉 All recolor tests passed!');
    } else {
      console.log('\n⚠️ Some recolor tests failed. Check the logs above.');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new RecolorTest();
  test.runAllTests().then(results => {
    process.exit(results.every(r => r.passed) ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export default RecolorTest;
