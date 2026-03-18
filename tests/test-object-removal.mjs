/**
 * Test Suite for Object Removal Feature
 * Tests API endpoints, workflow generation, and processing
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

class ObjectRemovalTest {
  constructor() {
    this.testResults = [];
    this.createdProjects = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Object Removal Tests...\n');

    try {
      await this.setupTestEnvironment();
      await this.testObjectRemovalEndpoint();
      await this.testWorkflowGeneration();
      await this.testBatchRemoval();
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

  async testObjectRemovalEndpoint() {
    console.log('\n🔍 Testing Object Removal Endpoint...');
    
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(TEST_CONFIG.testImagePath));
      formData.append('objectName', 'lamp');

      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/remove-object`, {
        method: 'POST',
        body: formData,
        timeout: TEST_CONFIG.timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Object removal request submitted');
        console.log(`   Project ID: ${result.projectId}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Message: ${result.message}`);
        
        this.createdProjects.push(result.projectId);
        this.addResult('Object Removal Endpoint', true, 'Request submitted successfully');
      } else {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Object Removal Endpoint Test Failed: ${error.message}`);
      this.addResult('Object Removal Endpoint', false, error.message);
    }
  }

  async testWorkflowGeneration() {
    console.log('\n🔍 Testing Workflow Generation...');
    
    try {
      // Test the workflow JSON file exists and is valid
      const workflowPath = path.join(__dirname, '../src/workflows/object_removal.json');
      
      if (!fs.existsSync(workflowPath)) {
        throw new Error('Workflow file not found');
      }

      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      const workflow = JSON.parse(workflowContent);
      
      // Validate workflow structure
      const requiredNodes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      const hasAllNodes = requiredNodes.every(nodeId => workflow[nodeId]);
      
      if (!hasAllNodes) {
        throw new Error('Missing required workflow nodes');
      }

      // Check for required configurations
      const segmentationNode = workflow['4'];
      if (segmentationNode.class_type !== 'GroundingDinoSAM2Segment') {
        throw new Error('Invalid segmentation node');
      }

      const maskGrowNode = workflow['5'];
      if (maskGrowNode.class_type !== 'MaskGrow') {
        throw new Error('Invalid mask grow node');
      }

      const inpaintNode = workflow['9'];
      if (inpaintNode.class_type !== 'INPAINT_InpaintWithModel') {
        throw new Error('Invalid inpaint node');
      }

      if (inpaintNode.inputs.model_name !== 'big-lama.safetensors') {
        throw new Error('Should use big-lama.safetensors model');
      }

      const ksamplerNode = workflow['7'];
      if (ksamplerNode.inputs.steps !== 8) {
        throw new Error('KSampler steps should be 8');
      }

      if (!ksamplerNode.inputs.fp8_e4m3fn) {
        throw new Error('KSampler should use fp8 precision');
      }

      console.log('✅ Workflow validation passed');
      console.log(`   Nodes: ${Object.keys(workflow).length}`);
      console.log(`   Segmentation: ${segmentationNode.class_type}`);
      console.log(`   Inpaint Model: ${inpaintNode.inputs.model_name}`);
      console.log(`   KSampler Steps: ${ksamplerNode.inputs.steps}`);
      
      this.addResult('Workflow Generation', true, 'Workflow structure valid');
    } catch (error) {
      console.log(`❌ Workflow Generation Test Failed: ${error.message}`);
      this.addResult('Workflow Generation', false, error.message);
    }
  }

  async testBatchRemoval() {
    console.log('\n🔍 Testing Batch Object Removal...');
    
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(TEST_CONFIG.testImagePath));
      formData.append('objectNames', JSON.stringify(['lamp', 'chair', 'painting']));

      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/remove-object?batch=true`, {
        method: 'POST',
        body: formData,
        timeout: TEST_CONFIG.timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Batch removal request submitted');
        console.log(`   Batch ID: ${result.batchId}`);
        console.log(`   Projects: ${result.projects.length}`);
        console.log(`   Status: ${result.status}`);
        
        // Add all created projects to cleanup list
        result.projects.forEach(project => {
          this.createdProjects.push(project.projectId);
        });
        
        this.addResult('Batch Removal', true, 'Batch removal working');
      } else {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Batch Removal Test Failed: ${error.message}`);
      this.addResult('Batch Removal', false, error.message);
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
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/remove-object/${projectId}/status`);
      
      if (response.ok) {
        const status = await response.json();
        console.log('✅ Project status retrieved');
        console.log(`   Status: ${status.status}`);
        console.log(`   Original Image: ${status.originalImage ? 'Yes' : 'No'}`);
        console.log(`   Result Image: ${status.resultImage ? 'Yes' : 'No'}`);
        console.log(`   Processing Type: ${status.processingType}`);
        
        if (status.processingType !== 'object_removal') {
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
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/remove-object/${projectId}`);
      
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

        if (project.processingType !== 'object_removal') {
          throw new Error('Wrong processing type');
        }

        if (!project.aiConfig || !project.aiConfig.objectName) {
          throw new Error('Missing object name in AI config');
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
      const response = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/remove-object/${projectId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Project deleted successfully');
        console.log(`   Message: ${result.message}`);
        
        // Verify project is gone
        const verifyResponse = await fetch(`${TEST_CONFIG.apiUrl}/api/ai/remove-object/${projectId}`);
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
        await fetch(`${TEST_CONFIG.apiUrl}/api/ai/remove-object/${projectId}`, {
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
    console.log('\n📊 Object Removal Test Results:');
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
      console.log('\n🎉 All object removal tests passed!');
    } else {
      console.log('\n⚠️ Some object removal tests failed. Check the logs above.');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new ObjectRemovalTest();
  test.runAllTests().then(results => {
    process.exit(results.every(r => r.passed) ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export default ObjectRemovalTest;
