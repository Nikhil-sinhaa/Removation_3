/**
 * Master Test Suite
 * Runs all feature tests and provides comprehensive reporting
 */

import ComfyBridgeTest from './test-comfybridge.mjs';
import RedesignTest from './test-redesign.mjs';
import ObjectRemovalTest from './test-object-removal.mjs';
import RecolorTest from './test-recolor.mjs';
import GPUStatusTest from './test-gpu-status.mjs';

class MasterTestSuite {
  constructor() {
    this.testSuites = [
      { name: 'ComfyUI Bridge', class: ComfyBridgeTest, critical: true },
      { name: 'Room Redesign', class: RedesignTest, critical: true },
      { name: 'Object Removal', class: ObjectRemovalTest, critical: true },
      { name: 'Color & Material Change', class: RecolorTest, critical: true },
      { name: 'GPU Status', class: GPUStatusTest, critical: false }
    ];
    this.results = [];
  }

  async runAllTests() {
    console.log('🚀 Starting Master Test Suite');
    console.log('=====================================');
    console.log(`Running ${this.testSuites.length} test suites...\n`);

    const startTime = Date.now();

    for (const suite of this.testSuites) {
      console.log(`\n📋 Running ${suite.name} Tests`);
      console.log('-'.repeat(40));

      try {
        const testInstance = new suite.class();
        const suiteResults = await testInstance.runAllTests();
        
        const suiteSummary = {
          name: suite.name,
          critical: suite.critical,
          total: suiteResults.length,
          passed: suiteResults.filter(r => r.passed).length,
          failed: suiteResults.filter(r => !r.passed).length,
          successRate: Math.round((suiteResults.filter(r => r.passed).length / suiteResults.length) * 100),
          tests: suiteResults
        };

        this.results.push(suiteSummary);

        // Add spacing between test suites
        console.log('\n' + '='.repeat(50));

      } catch (error) {
        console.error(`❌ ${suite.name} test suite failed:`, error.message);
        
        const suiteSummary = {
          name: suite.name,
          critical: suite.critical,
          total: 0,
          passed: 0,
          failed: 1,
          successRate: 0,
          tests: [{ test: 'Suite Execution', passed: false, message: error.message }]
        };

        this.results.push(suiteSummary);
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    this.printMasterReport(duration);
    return this.results;
  }

  printMasterReport(duration) {
    console.log('\n🎯 MASTER TEST REPORT');
    console.log('====================');
    console.log(`Total Duration: ${duration}s`);
    console.log(`Test Suites: ${this.results.length}`);
    
    const totalTests = this.results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const overallSuccessRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Overall Success Rate: ${overallSuccessRate}%`);

    console.log('\n📊 Suite Breakdown:');
    console.log('-'.repeat(50));

    for (const result of this.results) {
      const status = result.successRate === 100 ? '✅' : 
                    result.successRate >= 80 ? '⚠️' : '❌';
      const critical = result.critical ? ' (Critical)' : '';
      
      console.log(`${status} ${result.name}${critical}: ${result.passed}/${result.total} (${result.successRate}%)`);
      
      if (result.failed > 0) {
        const failedTests = result.tests.filter(t => !t.passed);
        for (const failedTest of failedTests.slice(0, 3)) { // Show max 3 failures per suite
          console.log(`    ❌ ${failedTest.test}: ${failedTest.message}`);
        }
        if (failedTests.length > 3) {
          console.log(`    ... and ${failedTests.length - 3} more failures`);
        }
      }
    }

    console.log('\n🔍 Critical Failures:');
    const criticalFailures = this.results.filter(r => r.critical && r.successRate < 100);
    
    if (criticalFailures.length === 0) {
      console.log('✅ No critical test failures');
    } else {
      console.log(`❌ ${criticalFailures.length} critical suite(s) failed:`);
      for (const failure of criticalFailures) {
        console.log(`   - ${failure.name}: ${failure.failed} test(s) failed`);
      }
    }

    console.log('\n🎯 Recommendations:');
    if (overallSuccessRate === 100) {
      console.log('🎉 All tests passed! System is ready for production.');
    } else if (overallSuccessRate >= 80) {
      console.log('⚠️ Most tests passed. Review and fix remaining issues.');
    } else {
      console.log('🚨 Significant test failures. System needs attention before deployment.');
    }

    // Specific recommendations based on failed tests
    const failedSuites = this.results.filter(r => r.successRate < 100);
    for (const suite of failedSuites) {
      if (suite.name === 'ComfyUI Bridge') {
        console.log('   🔧 Check ComfyUI server status and WebSocket connectivity');
      } else if (suite.name === 'Room Redesign') {
        console.log('   🔧 Verify redesign workflow and API endpoints');
      } else if (suite.name === 'Object Removal') {
        console.log('   🔧 Check object removal workflow and segmentation');
      } else if (suite.name === 'Color & Material Change') {
        console.log('   🔧 Verify recolor presets and workflow generation');
      } else if (suite.name === 'GPU Status') {
        console.log('   🔧 Check GPU monitoring and status endpoints');
      }
    }

    console.log('\n' + '='.repeat(50));
    
    // Return exit code based on critical failures
    const hasCriticalFailures = criticalFailures.length > 0;
    if (hasCriticalFailures) {
      console.log('❌ CRITICAL FAILURES DETECTED - Exit code: 1');
    } else {
      console.log('✅ NO CRITICAL FAILURES - Exit code: 0');
    }
  }

  async runQuickTest() {
    console.log('⚡ Running Quick Health Check...');
    
    // Only run critical tests
    const criticalSuites = this.testSuites.filter(s => s.critical);
    const quickResults = [];

    for (const suite of criticalSuites) {
      console.log(`\n🔍 Quick check: ${suite.name}`);
      
      try {
        const testInstance = new suite.class();
        
        // For quick test, we'll just run the first few critical tests
        if (suite.name === 'ComfyUI Bridge') {
          await testInstance.testComfyUIHealth();
        } else if (suite.name === 'Room Redesign') {
          await testInstance.testWorkflowGeneration();
        } else if (suite.name === 'Object Removal') {
          await testInstance.testWorkflowGeneration();
        } else if (suite.name === 'Color & Material Change') {
          await testInstance.testPresetsEndpoint();
        }
        
        quickResults.push({ name: suite.name, status: 'PASS' });
        console.log(`✅ ${suite.name}: OK`);
        
      } catch (error) {
        quickResults.push({ name: suite.name, status: 'FAIL', error: error.message });
        console.log(`❌ ${suite.name}: ${error.message}`);
      }
    }

    const passed = quickResults.filter(r => r.status === 'PASS').length;
    const total = quickResults.length;
    
    console.log(`\n⚡ Quick Check Results: ${passed}/${total} suites OK`);
    
    return quickResults;
  }
}

// Command line interface
const args = process.argv.slice(2);
const isQuickTest = args.includes('--quick') || args.includes('-q');

const testSuite = new MasterTestSuite();

if (isQuickTest) {
  testSuite.runQuickTest().then(results => {
    const hasFailures = results.some(r => r.status === 'FAIL');
    process.exit(hasFailures ? 1 : 0);
  }).catch(error => {
    console.error('Quick test failed:', error);
    process.exit(1);
  });
} else {
  testSuite.runAllTests().then(results => {
    const criticalFailures = results.filter(r => r.critical && r.successRate < 100);
    process.exit(criticalFailures.length > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Master test suite failed:', error);
    process.exit(1);
  });
}

export default MasterTestSuite;
