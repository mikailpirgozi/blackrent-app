/**
 * 🏃‍♂️ Test Runner
 * Comprehensive test execution and reporting system
 */

import { testFramework } from './test-framework';
import { logger } from './logger';

// Import all test suites
import { securityTests } from '../__tests__/security.test';
import { performanceTests } from '../__tests__/performance.test';
import { integrationTests } from '../__tests__/integration.test';

interface TestRunnerConfig {
  runSecurity: boolean;
  runPerformance: boolean;
  runIntegration: boolean;
  generateReport: boolean;
  reportFormat: 'json' | 'html' | 'junit';
  outputPath?: string;
  parallel: boolean;
  maxRetries: number;
  timeoutMultiplier: number;
}

interface TestSummary {
  totalSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: number;
  suiteResults: Array<{
    suiteName: string;
    passed: number;
    failed: number;
    duration: number;
  }>;
}

class TestRunner {
  private config: TestRunnerConfig;
  private isRunning = false;

  constructor(config: Partial<TestRunnerConfig> = {}) {
    this.config = {
      runSecurity: true,
      runPerformance: true,
      runIntegration: true,
      generateReport: true,
      reportFormat: 'html',
      parallel: false, // Sequential for better debugging
      maxRetries: 2,
      timeoutMultiplier: 1.0,
      ...config,
    };
  }

  /**
   * Run all configured test suites
   */
  async runAllTests(): Promise<TestSummary> {
    if (this.isRunning) {
      throw new Error('Test runner is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('🏃‍♂️ Starting BlackRent Mobile Test Runner...');
      
      // Initialize test framework
      this.registerAllTestSuites();
      
      // Run tests
      const _testReport = await testFramework.runAllTests();
      
      // Generate summary
      const summary = this.generateTestSummary(testReport, startTime);
      
      // Generate and save report
      if (this.config.generateReport) {
        await this.generateAndSaveReport(testReport);
      }
      
      // Log results
      this.logTestResults(summary);
      
      return summary;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run specific test category
   */
  async runTestCategory(category: 'security' | 'performance' | 'integration'): Promise<TestSummary> {
    const originalConfig = { ...this.config };
    
    // Temporarily modify config to run only specified category
    this.config.runSecurity = category === 'security';
    this.config.runPerformance = category === 'performance';
    this.config.runIntegration = category === 'integration';
    
    try {
      const summary = await this.runAllTests();
      return summary;
    } finally {
      // Restore original config
      this.config = originalConfig;
    }
  }

  /**
   * Run tests with custom configuration
   */
  async runWithConfig(config: Partial<TestRunnerConfig>): Promise<TestSummary> {
    const originalConfig = { ...this.config };
    this.config = { ...this.config, ...config };
    
    try {
      const summary = await this.runAllTests();
      return summary;
    } finally {
      // Restore original config
      this.config = originalConfig;
    }
  }

  /**
   * Register all test suites based on configuration
   */
  private registerAllTestSuites(): void {
    // Clear existing test suites
    testFramework.clearResults();
    
    // Register test suites based on configuration
    if (this.config.runSecurity) {
      testFramework.registerSuite(securityTests);
      logger.debug('🔒 Security test suite registered');
    }
    
    if (this.config.runPerformance) {
      testFramework.registerSuite(performanceTests);
      logger.debug('🚀 Performance test suite registered');
    }
    
    if (this.config.runIntegration) {
      testFramework.registerSuite(integrationTests);
      logger.debug('🔗 Integration test suite registered');
    }
  }

  /**
   * Generate test summary from report
   */
  private generateTestSummary(testReport: any, startTime: number): TestSummary {
    const suiteResults = new Map<string, { passed: number; failed: number; duration: number }>();
    
    // Group results by suite
    testReport.results.forEach((result: any) => {
      const suiteName = this.getSuiteNameFromTestId(result.testId);
      
      if (!suiteResults.has(suiteName)) {
        suiteResults.set(suiteName, { passed: 0, failed: 0, duration: 0 });
      }
      
      const suiteResult = suiteResults.get(suiteName)!;
      
      if (result.result.passed) {
        suiteResult.passed++;
      } else {
        suiteResult.failed++;
      }
      
      suiteResult.duration += result.result.duration;
    });

    return {
      totalSuites: suiteResults.size,
      totalTests: testReport.totalTests,
      passedTests: testReport.passedTests,
      failedTests: testReport.failedTests,
      skippedTests: testReport.skippedTests,
      duration: Date.now() - startTime,
      suiteResults: Array.from(suiteResults.entries()).map(([suiteName, result]) => ({
        suiteName,
        ...result,
      })),
    };
  }

  /**
   * Get suite name from test ID (simplified)
   */
  private getSuiteNameFromTestId(testId: string): string {
    if (testId.includes('security') || testId.includes('Security')) {
      return 'Security & Compliance';
    }
    if (testId.includes('performance') || testId.includes('Performance')) {
      return 'Performance & Optimization';
    }
    if (testId.includes('integration') || testId.includes('Integration')) {
      return 'Integration & E2E';
    }
    return 'Unknown';
  }

  /**
   * Generate and save test report
   */
  private async generateAndSaveReport(testReport: any): Promise<void> {
    try {
      const report = testFramework.generateReport(this.config.reportFormat);
      
      if (this.config.outputPath) {
        // In a real implementation, save to file system
        logger.info(`📄 Test report generated: ${this.config.outputPath}`);
      } else {
        logger.info('📄 Test report generated in memory');
      }
      
      // Log report summary
      logger.debug(`Report format: ${this.config.reportFormat}`);
      logger.debug(`Report size: ${report.length} characters`);
    } catch (error) {
      logger.error('Failed to generate test report', error);
    }
  }

  /**
   * Log test results to console
   */
  private logTestResults(summary: TestSummary): void {
    const passRate = ((summary.passedTests / summary.totalTests) * 100).toFixed(1);
    const durationSeconds = (summary.duration / 1000).toFixed(2);
    
    logger.info('\n' + '='.repeat(60));
    logger.info('🧪 BLACKRENT MOBILE - TEST RESULTS');
    logger.info('='.repeat(60));
    
    logger.info(`📊 Test Summary:`);
    logger.info(`   Total Suites: ${summary.totalSuites}`);
    logger.info(`   Total Tests:  ${summary.totalTests}`);
    logger.info(`   Passed:       ${summary.passedTests} ✅`);
    logger.info(`   Failed:       ${summary.failedTests} ❌`);
    logger.info(`   Skipped:      ${summary.skippedTests} ⏭️`);
    logger.info(`   Pass Rate:    ${passRate}%`);
    logger.info(`   Duration:     ${durationSeconds}s`);
    
    if (summary.coverage) {
      logger.info(`   Coverage:     ${summary.coverage.toFixed(1)}%`);
    }
    
    logger.info('\n📋 Suite Results:');
    summary.suiteResults.forEach(suite => {
      const suitePassRate = suite.passed + suite.failed > 0 
        ? ((suite.passed / (suite.passed + suite.failed)) * 100).toFixed(1)
        : '0.0';
      const suiteDuration = (suite.duration / 1000).toFixed(2);
      
      logger.info(`   ${suite.suiteName}:`);
      logger.info(`     Passed: ${suite.passed}, Failed: ${suite.failed}`);
      logger.info(`     Pass Rate: ${suitePassRate}%, Duration: ${suiteDuration}s`);
    });
    
    logger.info('\n' + '='.repeat(60));
    
    if (summary.failedTests === 0) {
      logger.info('🎉 ALL TESTS PASSED! 🎉');
    } else {
      logger.warn(`⚠️  ${summary.failedTests} TEST(S) FAILED`);
    }
    
    logger.info('='.repeat(60) + '\n');
  }

  /**
   * Get test runner status
   */
  getStatus(): {
    isRunning: boolean;
    config: TestRunnerConfig;
    lastRun?: Date;
  } {
    return {
      isRunning: this.isRunning,
      config: { ...this.config },
    };
  }

  /**
   * Update test runner configuration
   */
  updateConfig(newConfig: Partial<TestRunnerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.debug('Test runner configuration updated', newConfig);
  }
}

// Global test runner instance
export const _testRunner = new TestRunner();

/**
 * Quick test functions for different scenarios
 */
export const quickTests = {
  /**
   * Run smoke tests (critical tests only)
   */
  async smoke(): Promise<TestSummary> {
    return testRunner.runWithConfig({
      runSecurity: true,
      runPerformance: false,
      runIntegration: false,
      generateReport: false,
      timeoutMultiplier: 0.5, // Faster timeouts
    });
  },

  /**
   * Run security-focused tests
   */
  async security(): Promise<TestSummary> {
    return testRunner.runTestCategory('security');
  },

  /**
   * Run performance-focused tests
   */
  async performance(): Promise<TestSummary> {
    return testRunner.runTestCategory('performance');
  },

  /**
   * Run integration tests
   */
  async integration(): Promise<TestSummary> {
    return testRunner.runTestCategory('integration');
  },

  /**
   * Run full test suite
   */
  async full(): Promise<TestSummary> {
    return testRunner.runAllTests();
  },

  /**
   * Run CI/CD pipeline tests
   */
  async ci(): Promise<TestSummary> {
    return testRunner.runWithConfig({
      runSecurity: true,
      runPerformance: true,
      runIntegration: true,
      generateReport: true,
      reportFormat: 'junit',
      parallel: false, // Sequential for CI stability
      maxRetries: 1,
    });
  },
};

/**
 * Test runner CLI interface
 */
export const testCLI = {
  /**
   * Parse command line arguments and run tests
   */
  async run(args: string[] = []): Promise<void> {
    const config: Partial<TestRunnerConfig> = {};
    
    // Parse arguments
    args.forEach(arg => {
      switch (arg) {
        case '--security':
          config.runSecurity = true;
          config.runPerformance = false;
          config.runIntegration = false;
          break;
        case '--performance':
          config.runSecurity = false;
          config.runPerformance = true;
          config.runIntegration = false;
          break;
        case '--integration':
          config.runSecurity = false;
          config.runPerformance = false;
          config.runIntegration = true;
          break;
        case '--no-report':
          config.generateReport = false;
          break;
        case '--json':
          config.reportFormat = 'json';
          break;
        case '--junit':
          config.reportFormat = 'junit';
          break;
        case '--parallel':
          config.parallel = true;
          break;
      }
    });
    
    try {
      const summary = await testRunner.runWithConfig(config);
      
      // Exit with appropriate code
      if (summary.failedTests > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (error) {
      logger.error('Test runner failed', error);
      process.exit(1);
    }
  },

  /**
   * Show help information
   */
  help(): void {
      },
};

// Export test runner for external use
export { TestRunner };
export type { TestRunnerConfig, TestSummary };
